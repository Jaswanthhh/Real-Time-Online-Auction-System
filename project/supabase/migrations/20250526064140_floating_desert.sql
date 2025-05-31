/*
  # Initial Schema Setup for Real-Time Auction System

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `username` (text, unique)
      - `email` (text, unique)
      - `avatar_url` (text)
      - `created_at` (timestamp)
    
    - `auctions`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `image_url` (text)
      - `seller_id` (uuid, references users)
      - `starting_price` (numeric)
      - `current_price` (numeric)
      - `min_bid_increment` (numeric)
      - `start_time` (timestamp)
      - `end_time` (timestamp)
      - `status` (enum: upcoming, active, ended)
      - `category_id` (text)
      - `view_count` (integer)
      - `created_at` (timestamp)
    
    - `bids`
      - `id` (uuid, primary key)
      - `auction_id` (uuid, references auctions)
      - `user_id` (uuid, references users)
      - `amount` (numeric)
      - `status` (enum: pending, accepted, rejected)
      - `created_at` (timestamp)
    
    - `notifications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `title` (text)
      - `message` (text)
      - `type` (enum: outbid, won, ending_soon, new_bid, system)
      - `auction_id` (uuid, references auctions)
      - `read` (boolean)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create custom types
CREATE TYPE auction_status AS ENUM ('upcoming', 'active', 'ended');
CREATE TYPE bid_status AS ENUM ('pending', 'accepted', 'rejected');
CREATE TYPE notification_type AS ENUM ('outbid', 'won', 'ending_soon', 'new_bid', 'system');

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

-- Create auctions table
CREATE TABLE IF NOT EXISTS auctions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  image_url text NOT NULL,
  seller_id uuid REFERENCES users(id) NOT NULL,
  starting_price numeric NOT NULL CHECK (starting_price > 0),
  current_price numeric NOT NULL CHECK (current_price >= starting_price),
  min_bid_increment numeric NOT NULL CHECK (min_bid_increment > 0),
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL CHECK (end_time > start_time),
  status auction_status NOT NULL DEFAULT 'upcoming',
  category_id text NOT NULL,
  view_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create bids table
CREATE TABLE IF NOT EXISTS bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id uuid REFERENCES auctions(id) NOT NULL,
  user_id uuid REFERENCES users(id) NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  status bid_status NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type notification_type NOT NULL,
  auction_id uuid REFERENCES auctions(id),
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can read all users" 
  ON users FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Users can update their own profile" 
  ON users FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = id);

-- Create policies for auctions table
CREATE POLICY "Anyone can read auctions" 
  ON auctions FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Users can create auctions" 
  ON auctions FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update their auctions" 
  ON auctions FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = seller_id);

-- Create policies for bids table
CREATE POLICY "Anyone can read bids" 
  ON bids FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Users can create bids" 
  ON bids FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

-- Create policies for notifications table
CREATE POLICY "Users can read their own notifications" 
  ON notifications FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
  ON notifications FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX auctions_status_idx ON auctions(status);
CREATE INDEX auctions_category_id_idx ON auctions(category_id);
CREATE INDEX auctions_end_time_idx ON auctions(end_time);
CREATE INDEX bids_auction_id_idx ON bids(auction_id);
CREATE INDEX bids_user_id_idx ON bids(user_id);
CREATE INDEX notifications_user_id_idx ON notifications(user_id);
CREATE INDEX notifications_read_idx ON notifications(read);

-- Create function to update auction status
CREATE OR REPLACE FUNCTION update_auction_status()
RETURNS trigger AS $$
BEGIN
  IF NEW.start_time <= NOW() AND NEW.end_time > NOW() THEN
    NEW.status := 'active';
  ELSIF NEW.end_time <= NOW() THEN
    NEW.status := 'ended';
  ELSE
    NEW.status := 'upcoming';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update auction status
CREATE TRIGGER update_auction_status_trigger
  BEFORE INSERT OR UPDATE ON auctions
  FOR EACH ROW
  EXECUTE FUNCTION update_auction_status();

-- Create function to validate and process bids
CREATE OR REPLACE FUNCTION process_bid()
RETURNS trigger AS $$
DECLARE
  auction_record auctions%ROWTYPE;
BEGIN
  -- Get auction details
  SELECT * INTO auction_record FROM auctions WHERE id = NEW.auction_id;
  
  -- Check if auction exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Auction not found';
  END IF;
  
  -- Check if auction is active
  IF auction_record.status != 'active' THEN
    RAISE EXCEPTION 'Cannot bid on inactive auction';
  END IF;
  
  -- Check if bid amount is valid
  IF NEW.amount <= auction_record.current_price THEN
    RAISE EXCEPTION 'Bid must be higher than current price';
  END IF;
  
  IF NEW.amount < auction_record.current_price + auction_record.min_bid_increment THEN
    RAISE EXCEPTION 'Bid must meet minimum increment requirement';
  END IF;
  
  -- Update auction current price
  UPDATE auctions 
  SET current_price = NEW.amount 
  WHERE id = NEW.auction_id;
  
  -- Mark bid as accepted
  NEW.status := 'accepted';
  
  -- Create notification for previous highest bidder
  IF EXISTS (
    SELECT 1 FROM bids 
    WHERE auction_id = NEW.auction_id 
      AND status = 'accepted' 
      AND user_id != NEW.user_id
    ORDER BY amount DESC 
    LIMIT 1
  ) THEN
    INSERT INTO notifications (
      user_id,
      title,
      message,
      type,
      auction_id
    )
    SELECT 
      user_id,
      'You''ve been outbid!',
      'Someone has placed a higher bid on an item you''re bidding on.',
      'outbid',
      NEW.auction_id
    FROM bids 
    WHERE auction_id = NEW.auction_id 
      AND status = 'accepted' 
      AND user_id != NEW.user_id
    ORDER BY amount DESC 
    LIMIT 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for bid processing
CREATE TRIGGER process_bid_trigger
  BEFORE INSERT ON bids
  FOR EACH ROW
  EXECUTE FUNCTION process_bid();

-- Create function to handle auction ending
CREATE OR REPLACE FUNCTION handle_auction_end()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'ended' AND OLD.status = 'active' THEN
    -- Notify winner
    INSERT INTO notifications (
      user_id,
      title,
      message,
      type,
      auction_id
    )
    SELECT 
      user_id,
      'Congratulations! You''ve won the auction!',
      'You''ve won the auction for ' || NEW.title,
      'won',
      NEW.id
    FROM bids 
    WHERE auction_id = NEW.id 
      AND status = 'accepted'
    ORDER BY amount DESC 
    LIMIT 1;
    
    -- Notify seller
    INSERT INTO notifications (
      user_id,
      title,
      message,
      type,
      auction_id
    )
    VALUES (
      NEW.seller_id,
      'Your auction has ended',
      'Your auction for ' || NEW.title || ' has ended',
      'system',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auction ending
CREATE TRIGGER handle_auction_end_trigger
  AFTER UPDATE ON auctions
  FOR EACH ROW
  WHEN (NEW.status = 'ended' AND OLD.status = 'active')
  EXECUTE FUNCTION handle_auction_end();