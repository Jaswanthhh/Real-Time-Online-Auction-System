import React, { useState, useEffect } from 'react';
import { Auction } from '../../types';

interface AuctionCountdownProps {
  auction: Auction;
  onEnd?: () => void;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const AuctionCountdown: React.FC<AuctionCountdownProps> = ({ auction, onEnd }) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isEnding, setIsEnding] = useState<boolean>(false);
  
  // Calculate time left
  useEffect(() => {
    if (auction.status === 'ended') {
      setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      return;
    }

    const targetDate = new Date(auction.status === 'upcoming' ? auction.startTime : auction.endTime);
    
    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();
      
      // Check if auction has ended or started
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        if (auction.status === 'active' && onEnd) {
          onEnd();
        }
        return;
      }
      
      // Check if auction is ending soon (less than 5 minutes)
      setIsEnding(auction.status === 'active' && difference <= 5 * 60 * 1000);
      
      // Calculate time units
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);
      
      setTimeLeft({ days, hours, minutes, seconds });
    };
    
    // Initial calculation
    calculateTimeLeft();
    
    // Update countdown every second
    const interval = setInterval(calculateTimeLeft, 1000);
    
    return () => clearInterval(interval);
  }, [auction.status, auction.startTime, auction.endTime, onEnd]);
  
  // Helper for formatting
  const formatTimeUnit = (value: number) => value.toString().padStart(2, '0');
  
  if (auction.status === 'ended') {
    return <div className="text-gray-500">Auction has ended</div>;
  }
  
  return (
    <div className={`flex flex-col ${isEnding ? 'text-red-600' : ''}`}>
      <div className="text-sm font-medium">
        {auction.status === 'upcoming' ? 'Starts in:' : 'Ends in:'}
      </div>
      
      <div className="flex space-x-2 text-xl font-bold">
        {timeLeft.days > 0 && (
          <span>{timeLeft.days}d</span>
        )}
        <span>{formatTimeUnit(timeLeft.hours)}h</span>
        <span>{formatTimeUnit(timeLeft.minutes)}m</span>
        <span>{formatTimeUnit(timeLeft.seconds)}s</span>
      </div>
      
      {isEnding && (
        <div className="mt-1 animate-pulse text-sm font-medium text-red-600">
          Ending soon!
        </div>
      )}
    </div>
  );
};

export default AuctionCountdown;