import React from 'react';
import { Check, BellOff } from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';
import { Notification } from '../../types';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

const NotificationDropdown: React.FC = () => {
  const { 
    notifications, 
    markAsRead, 
    markAllAsRead, 
    clearNotifications 
  } = useNotification();

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'outbid':
        return '🔴';
      case 'won':
        return '🏆';
      case 'ending_soon':
        return '⏰';
      case 'new_bid':
        return '💰';
      case 'system':
        return '🔔';
      default:
        return '🔔';
    }
  };
  
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  return (
    <div className="absolute right-0 mt-2 w-80 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2">
        <h3 className="text-sm font-semibold">Notifications</h3>
        <div className="flex space-x-2">
          <button 
            onClick={markAllAsRead}
            className="rounded-md p-1 text-xs text-gray-500 hover:bg-gray-100"
            title="Mark all as read"
          >
            <Check className="h-4 w-4" />
          </button>
          <button 
            onClick={clearNotifications}
            className="rounded-md p-1 text-xs text-gray-500 hover:bg-gray-100"
            title="Clear all notifications"
          >
            <BellOff className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      <div className="max-h-80 overflow-y-auto">
        {notifications.length > 0 ? (
          <div>
            {notifications.map((notification) => (
              <div 
                key={notification.id}
                className={`border-b border-gray-100 px-4 py-3 hover:bg-gray-50 ${
                  !notification.read ? 'bg-blue-50' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                {notification.auctionId ? (
                  <Link to={`/auctions/${notification.auctionId}`}>
                    <div className="flex items-start">
                      <div className="mr-3 text-lg">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{notification.title}</p>
                        <p className="text-xs text-gray-600">{notification.message}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div className="flex items-start">
                    <div className="mr-3 text-lg">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{notification.title}</p>
                      <p className="text-xs text-gray-600">{notification.message}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6">
            <BellOff className="mb-2 h-8 w-8 text-gray-400" />
            <p className="text-sm text-gray-500">No notifications yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;