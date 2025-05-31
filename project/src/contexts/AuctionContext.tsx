import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Auction, AuctionFilters, Bid } from '../types';
import { mockAuctions } from '../data/mockData';
import { useWebSocket } from './WebSocketContext';
import { v4 as uuidv4 } from 'uuid';
import messageQueueService from '../services/MessageQueueService';

interface AuctionContextType {
  auctions: Auction[];
  filteredAuctions: Auction[];
  loading: boolean;
  error: string | null;
  filters: AuctionFilters;
  getAuction: (id: string) => Auction | undefined;
  setFilters: (filters: AuctionFilters) => void;
  createAuction: (auction: Omit<Auction, 'id' | 'bids' | 'status' | 'viewCount'>) => Promise<Auction>;
  placeBid: (auctionId: string, amount: number) => Promise<boolean>;
}

const AuctionContext = createContext<AuctionContextType | undefined>(undefined);

export const useAuction = () => {
  const context = useContext(AuctionContext);
  if (context === undefined) {
    throw new Error('useAuction must be used within an AuctionProvider');
  }
  return context;
};

interface AuctionProviderProps {
  children: ReactNode;
}

export const AuctionProvider: React.FC<AuctionProviderProps> = ({ children }) => {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [filteredAuctions, setFilteredAuctions] = useState<Auction[]>([]);
  const [filters, setFilters] = useState<AuctionFilters>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { socket, connected } = useWebSocket();

  // Initial data fetch
  useEffect(() => {
    const fetchAuctions = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Update auction statuses based on time
        const now = new Date();
        const updatedAuctions = mockAuctions.map(auction => {
          const startTime = new Date(auction.startTime);
          const endTime = new Date(auction.endTime);
          
          let status = auction.status;
          if (now < startTime) {
            status = 'upcoming';
          } else if (now >= startTime && now < endTime) {
            status = 'active';
          } else {
            status = 'ended';
          }
          
          return { ...auction, status };
        });
        
        setAuctions(updatedAuctions);
      } catch (err) {
        setError('Failed to fetch auctions');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAuctions();
    
    // Set up interval to update auction statuses
    const statusInterval = setInterval(() => {
      setAuctions(prevAuctions => {
        const now = new Date();
        return prevAuctions.map(auction => {
          const startTime = new Date(auction.startTime);
          const endTime = new Date(auction.endTime);
          
          let status = auction.status;
          if (now < startTime) {
            status = 'upcoming';
          } else if (now >= startTime && now < endTime) {
            status = 'active';
          } else if (status !== 'ended') {
            status = 'ended';
          }
          
          return status !== auction.status ? { ...auction, status } : auction;
        });
      });
    }, 10000); // Check every 10 seconds
    
    return () => clearInterval(statusInterval);
  }, []);

  // Apply filters whenever auctions or filters change
  useEffect(() => {
    let result = [...auctions];
    
    if (filters.category) {
      result = result.filter(auction => auction.categoryId === filters.category);
    }
    
    if (filters.status) {
      result = result.filter(auction => auction.status === filters.status);
    }
    
    if (filters.minPrice !== undefined) {
      result = result.filter(auction => auction.currentPrice >= filters.minPrice!);
    }
    
    if (filters.maxPrice !== undefined) {
      result = result.filter(auction => auction.currentPrice <= filters.maxPrice!);
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        auction => 
          auction.title.toLowerCase().includes(searchLower) || 
          auction.description.toLowerCase().includes(searchLower)
      );
    }
    
    setFilteredAuctions(result);
  }, [auctions, filters]);

  // Handle WebSocket messages
  useEffect(() => {
    if (!connected || !socket) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'new_bid') {
          const { auctionId, bid } = data.payload;
          
          setAuctions(prevAuctions => 
            prevAuctions.map(auction => {
              if (auction.id === auctionId) {
                // Add the new bid to the auction
                const updatedBids = [bid, ...auction.bids];
                const currentPrice = bid.amount;
                const highestBidder = { id: bid.userId, username: bid.username };
                
                return {
                  ...auction,
                  bids: updatedBids,
                  currentPrice,
                  highestBidder,
                };
              }
              return auction;
            })
          );
        } else if (data.type === 'bid_accepted' || data.type === 'bid_rejected') {
          const { auctionId, bidId, status } = data.payload;
          
          setAuctions(prevAuctions => 
            prevAuctions.map(auction => {
              if (auction.id === auctionId) {
                // Update the status of the bid
                const updatedBids = auction.bids.map(bid => 
                  bid.id === bidId ? { ...bid, status } : bid
                );
                
                return { ...auction, bids: updatedBids };
              }
              return auction;
            })
          );
        } else if (data.type === 'auction_update') {
          const updatedAuction = data.payload;
          
          setAuctions(prevAuctions => 
            prevAuctions.map(auction => 
              auction.id === updatedAuction.id ? updatedAuction : auction
            )
          );
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };

    socket.addEventListener('message', handleMessage);
    
    return () => {
      socket.removeEventListener('message', handleMessage);
    };
  }, [connected, socket]);

  const getAuction = useCallback((id: string) => {
    return auctions.find(auction => auction.id === id);
  }, [auctions]);

  const createAuction = async (auctionData: Omit<Auction, 'id' | 'bids' | 'status' | 'viewCount'>) => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const now = new Date();
      const startTime = new Date(auctionData.startTime);
      
      let status: Auction['status'] = 'upcoming';
      if (now >= startTime && now < new Date(auctionData.endTime)) {
        status = 'active';
      } else if (now >= new Date(auctionData.endTime)) {
        status = 'ended';
      }
      
      const newAuction: Auction = {
        id: `auction-${uuidv4()}`,
        ...auctionData,
        currentPrice: auctionData.startingPrice,
        bids: [],
        status,
        viewCount: 0,
      };
      
      setAuctions(prevAuctions => [...prevAuctions, newAuction]);
      
      return newAuction;
    } catch (err) {
      setError('Failed to create auction');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const placeBid = async (auctionId: string, amount: number) => {
    setError(null);
    
    try {
      const auction = auctions.find(a => a.id === auctionId);
      
      if (!auction) {
        throw new Error('Auction not found');
      }
      
      if (auction.status !== 'active') {
        throw new Error('Cannot bid on an auction that is not active');
      }
      
      if (amount <= auction.currentPrice) {
        throw new Error(`Bid must be higher than current price of $${auction.currentPrice}`);
      }
      
      if (amount < auction.currentPrice + auction.minBidIncrement) {
        throw new Error(`Minimum bid increment is $${auction.minBidIncrement}`);
      }
      
      // Get user from localStorage (in a real app, this would come from the auth context)
      const storedUser = localStorage.getItem('auctionUser');
      if (!storedUser) {
        throw new Error('You must be logged in to place a bid');
      }
      
      const user = JSON.parse(storedUser);
      
      // Create new bid
      const newBid = {
        id: `bid-${uuidv4()}`,
        userId: user.id,
        username: user.username,
        amount,
        timestamp: new Date().toISOString(),
        status: 'pending',
      };
      
      // Add bid to message queue for processing
      await messageQueueService.addBid(auctionId, newBid);
      
      // Optimistically update UI
      setAuctions(prevAuctions => 
        prevAuctions.map(a => {
          if (a.id === auctionId) {
            return {
              ...a,
              bids: [newBid, ...a.bids],
              currentPrice: amount,
              highestBidder: { id: user.id, username: user.username },
            };
          }
          return a;
        })
      );
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place bid');
      console.error(err);
      return false;
    }
  };

  const value = {
    auctions,
    filteredAuctions,
    loading,
    error,
    filters,
    getAuction,
    setFilters,
    createAuction,
    placeBid,
  };

  return <AuctionContext.Provider value={value}>{children}</AuctionContext.Provider>;
};