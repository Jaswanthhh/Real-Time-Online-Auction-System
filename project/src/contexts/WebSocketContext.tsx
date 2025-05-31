import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import messageQueueService from '../services/MessageQueueService';
import { WebSocketMessage } from '../types';

interface WebSocketContextType {
  socket: WebSocket | null;
  connected: boolean;
  connecting: boolean;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
  send: (message: any) => void;
  reconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
  children: ReactNode;
}

// In a real application, this would be your WebSocket server URL
const WS_URL = import.meta.env.VITE_WS_URL || 'wss://mock-socket-server.example.com';

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [connecting, setConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState<number>(0);
  const [messageQueue, setMessageQueue] = useState<WebSocketMessage[]>([]);
  const { isAuthenticated, user } = useAuth();

  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 1000; // Base delay in milliseconds

  const connect = useCallback(() => {
    if (socket || connecting || !isAuthenticated) return;
    
    setConnecting(true);
    setError(null);
    
    try {
      const ws = new WebSocket(WS_URL);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        setSocket(ws);
        setConnected(true);
        setConnecting(false);
        setReconnectAttempts(0);
        
        // Process any queued messages
        messageQueue.forEach(msg => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(msg));
          }
        });
        setMessageQueue([]);
      };
      
      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setConnected(false);
        setSocket(null);
        
        // Attempt to reconnect if not manually disconnected
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          const delay = RECONNECT_DELAY * Math.pow(2, reconnectAttempts);
          setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connect();
          }, delay);
        }
      };
      
      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError('WebSocket connection error');
        setConnected(false);
      };
      
      ws.onmessage = async (event) => {
        try {
          const message = JSON.parse(event.data);
          
          // Handle different message types
          switch (message.type) {
            case 'new_bid':
            case 'bid_accepted':
            case 'bid_rejected':
            case 'auction_update':
              // Add to message queue for persistence
              await messageQueueService.addNotification(message);
              break;
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };
      
    } catch (err) {
      setError('Failed to connect to WebSocket server');
      setConnecting(false);
    }
  }, [socket, connecting, isAuthenticated, reconnectAttempts, messageQueue]);

  const disconnect = useCallback(() => {
    if (socket) {
      socket.close();
      setSocket(null);
      setConnected(false);
    }
  }, [socket]);

  const send = useCallback((message: any) => {
    if (!socket || !connected) {
      // Queue message for later if not connected
      setMessageQueue(prev => [...prev, message]);
      setError('Cannot send message: not connected');
      return;
    }
    
    try {
      socket.send(typeof message === 'string' ? message : JSON.stringify(message));
    } catch (err) {
      setError('Failed to send message');
      console.error(err);
      
      // Queue message for retry
      setMessageQueue(prev => [...prev, message]);
    }
  }, [socket, connected]);

  const reconnect = useCallback(() => {
    disconnect();
    setReconnectAttempts(0);
    connect();
  }, [disconnect, connect]);

  // Connect when authenticated
  useEffect(() => {
    if (isAuthenticated && !socket && !connecting) {
      connect();
    }
  }, [isAuthenticated, socket, connecting, connect]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [socket]);

  const value = {
    socket,
    connected,
    connecting,
    error,
    connect,
    disconnect,
    send,
    reconnect,
  };

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};