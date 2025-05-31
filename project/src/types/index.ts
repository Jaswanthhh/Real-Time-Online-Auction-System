export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
}

export interface Bid {
  id: string;
  userId: string;
  username: string;
  amount: number;
  timestamp: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface Auction {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  seller: {
    id: string;
    username: string;
  };
  startingPrice: number;
  currentPrice: number;
  minBidIncrement: number;
  startTime: string;
  endTime: string;
  status: 'upcoming' | 'active' | 'ended';
  bids: Bid[];
  highestBidder?: {
    id: string;
    username: string;
  };
  viewCount: number;
  categoryId: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  iconName: string;
}

export interface UserNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'outbid' | 'won' | 'ending_soon' | 'new_bid' | 'system';
  auctionId?: string;
  timestamp: string;
  read: boolean;
}

export interface WebSocketMessage {
  type: 'new_bid' | 'bid_accepted' | 'bid_rejected' | 'auction_update' | 'notification';
  payload: any;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface AuctionFilters {
  category?: string;
  status?: 'upcoming' | 'active' | 'ended';
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}