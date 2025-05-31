import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, ArrowUp } from 'lucide-react';
import { Auction } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import AuctionStatusBadge from './AuctionStatusBadge';

interface AuctionCardProps {
  auction: Auction;
}

const AuctionCard: React.FC<AuctionCardProps> = ({ auction }) => {
  const {
    id,
    title,
    imageUrl,
    currentPrice,
    endTime,
    status,
    bids,
    highestBidder,
  } = auction;

  const timeRemaining = formatDistanceToNow(new Date(endTime), { addSuffix: false });
  const bidCount = bids.length;

  return (
    <Link 
      to={`/auctions/${id}`}
      className="group block transition-transform hover:-translate-y-1"
    >
      <div className="h-full overflow-hidden rounded-lg bg-white shadow-md transition-shadow group-hover:shadow-lg">
        <div className="relative h-48 overflow-hidden">
          <img 
            src={imageUrl} 
            alt={title} 
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute left-3 top-3 z-10">
            <AuctionStatusBadge status={status} />
          </div>
        </div>
        
        <div className="p-4">
          <h3 className="mb-2 text-lg font-semibold text-gray-900 line-clamp-1">{title}</h3>
          
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Current Bid</p>
              <p className="text-lg font-bold text-blue-600">${currentPrice.toLocaleString()}</p>
            </div>
            
            <div className="text-right">
              <div className="flex items-center space-x-1 text-sm text-gray-500">
                <ArrowUp className="h-4 w-4" />
                <span>{bidCount} {bidCount === 1 ? 'bid' : 'bids'}</span>
              </div>
              {highestBidder && (
                <p className="text-xs text-gray-500">
                  by {highestBidder.username}
                </p>
              )}
            </div>
          </div>
          
          {status !== 'ended' && (
            <div className="flex items-center space-x-1 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>
                {status === 'upcoming' ? 'Starts in ' : ''}
                {status === 'active' ? 'Ends in ' : ''}
                {timeRemaining}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default AuctionCard;