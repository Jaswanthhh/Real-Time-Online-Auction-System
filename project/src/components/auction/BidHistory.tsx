import React from 'react';
import { ArrowUp, ArrowDown, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { Bid } from '../../types';
import { formatDistanceToNow } from 'date-fns';

interface BidHistoryProps {
  bids: Bid[];
  currentUserId?: string;
}

const BidHistory: React.FC<BidHistoryProps> = ({ bids, currentUserId }) => {
  if (bids.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-500">
        <Clock className="mb-2 h-8 w-8" />
        <p>No bids yet. Be the first to bid!</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      {bids.map((bid, index) => {
        const prevBid = bids[index + 1];
        const isIncrease = prevBid ? bid.amount > prevBid.amount : true;
        const isCurrentUser = bid.userId === currentUserId;
        
        return (
          <div 
            key={bid.id}
            className={`
              flex items-center justify-between rounded-lg p-3 
              ${isCurrentUser ? 'bg-blue-50' : 'bg-gray-50'}
              ${index === 0 ? 'animate-pulse-bid' : ''}
            `}
          >
            <div className="flex items-center space-x-3">
              <div 
                className={`
                  flex h-8 w-8 items-center justify-center rounded-full 
                  ${isIncrease ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}
                `}
              >
                {isIncrease ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {isCurrentUser ? 'You' : bid.username}
                  {index === 0 && ' (Highest Bid)'}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(bid.timestamp), { addSuffix: true })}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900">${bid.amount.toLocaleString()}</span>
              
              {bid.status === 'accepted' && (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
              
              {bid.status === 'rejected' && (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              
              {bid.status === 'pending' && (
                <Clock className="h-4 w-4 text-amber-500" />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BidHistory;