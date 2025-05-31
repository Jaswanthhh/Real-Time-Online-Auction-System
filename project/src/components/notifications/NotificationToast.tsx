import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';
import { Notification } from '../../types';
import { Link } from 'react-router-dom';

interface NotificationToastProps {
  notification: Notification;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ notification }) => {
  const [isVisible, setIsVisible] = useState(true);
  const { markAsRead } = useNotification();
  
  useEffect(() => {
    // Automatically hide after 5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      markAsRead(notification.id);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [notification.id, markAsRead]);
  
  const handleClose = () => {
    setIsVisible(false);
    markAsRead(notification.id);
  };
  
  if (!isVisible) return null;
  
  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 animate-slide-up">
      <div className="rounded-lg bg-white p-4 shadow-lg ring-1 ring-black ring-opacity-5">
        <div className="flex items-start">
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900">{notification.title}</h3>
            <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
            
            {notification.auctionId && (
              <Link 
                to={`/auctions/${notification.auctionId}`}
                className="mt-2 inline-block text-xs font-medium text-blue-600 hover:text-blue-700"
                onClick={handleClose}
              >
                View Auction
              </Link>
            )}
          </div>
          
          <button 
            className="ml-4 text-gray-400 hover:text-gray-500"
            onClick={handleClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationToast;