import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserNotification } from '../types';
import { useAuth } from './AuthContext';
import { useWebSocket } from './WebSocketContext';
import { v4 as uuidv4 } from 'uuid';

interface NotificationContextType {
  notifications: UserNotification[];
  unreadCount: number;
  addNotification: (notification: Omit<UserNotification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const { user } = useAuth();
  const { socket, connected } = useWebSocket();

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Handle WebSocket notifications
  useEffect(() => {
    if (!connected || !socket || !user) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'notification' && data.payload.userId === user.id) {
          const { title, message, type, auctionId } = data.payload;
          
          addNotification({
            userId: user.id,
            title,
            message,
            type,
            auctionId,
          });
        } else if (data.type === 'new_bid') {
          const { auctionId, bid } = data.payload;
          
          // If this is a bid from another user on an auction where the current user has bid
          if (bid.userId !== user.id) {
            // TODO: Check if user has bid on this auction before
            // For demo purposes, we'll just notify the user of all new bids
            addNotification({
              userId: user.id,
              title: 'New Bid Placed',
              message: `${bid.username} placed a bid of $${bid.amount} on an auction you're watching.`,
              type: 'new_bid',
              auctionId,
            });
          }
        }
      } catch (err) {
        console.error('Failed to parse WebSocket notification:', err);
      }
    };

    socket.addEventListener('message', handleMessage);
    
    return () => {
      socket.removeEventListener('message', handleMessage);
    };
  }, [connected, socket, user]);

  const addNotification = (notificationData: Omit<UserNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: UserNotification = {
      id: `notification-${uuidv4()}`,
      ...notificationData,
      timestamp: new Date().toISOString(),
      read: false,
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    
    // Optionally show a browser notification
    if (Notification.permission === 'granted') {
      new Notification(newNotification.title, {
        body: newNotification.message,
      });
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true } 
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const value = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};