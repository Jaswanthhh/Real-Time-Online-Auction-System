import React from 'react';
import { Auction } from '../../types';

interface AuctionStatusBadgeProps {
  status: Auction['status'];
  className?: string;
}

const AuctionStatusBadge: React.FC<AuctionStatusBadgeProps> = ({ status, className = '' }) => {
  let badgeClasses = '';
  
  switch (status) {
    case 'active':
      badgeClasses = 'badge-success';
      break;
    case 'upcoming':
      badgeClasses = 'badge-primary';
      break;
    case 'ended':
      badgeClasses = 'badge-secondary';
      break;
  }
  
  return (
    <span className={`${badgeClasses} ${className}`}>
      {status === 'active' && 'Active'}
      {status === 'upcoming' && 'Upcoming'}
      {status === 'ended' && 'Ended'}
    </span>
  );
};

export default AuctionStatusBadge;