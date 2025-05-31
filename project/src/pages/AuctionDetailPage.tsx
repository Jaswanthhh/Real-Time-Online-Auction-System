import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, Clock, Info, User, DollarSign, Tag } from 'lucide-react';
import { useAuction } from '../contexts/AuctionContext';
import { useAuth } from '../contexts/AuthContext';
import AuctionCountdown from '../components/auction/AuctionCountdown';
import BidForm from '../components/auction/BidForm';
import BidHistory from '../components/auction/BidHistory';
import AuctionStatusBadge from '../components/auction/AuctionStatusBadge';
import { formatDistanceToNow, format } from 'date-fns';

const AuctionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getAuction } = useAuction();
  const { user } = useAuth();
  const [auction, setAuction] = useState(id ? getAuction(id) : undefined);
  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');
  
  useEffect(() => {
    if (id) {
      const auctionData = getAuction(id);
      if (auctionData) {
        setAuction(auctionData);
      } else {
        // Auction not found, redirect to 404
        navigate('/not-found', { replace: true });
      }
    }
  }, [id, getAuction, navigate]);
  
  if (!auction) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }
  
  const handleBidPlaced = () => {
    // Refresh auction data after bid is placed
    if (id) {
      const updatedAuction = getAuction(id);
      if (updatedAuction) {
        setAuction(updatedAuction);
      }
    }
  };
  
  const handleAuctionEnd = () => {
    // Refresh auction data when countdown ends
    if (id) {
      const updatedAuction = getAuction(id);
      if (updatedAuction) {
        setAuction(updatedAuction);
      }
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back button */}
      <div className="mb-6">
        <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Auctions
        </Link>
      </div>
      
      <div className="grid gap-8 md:grid-cols-3">
        {/* Image Column */}
        <div className="md:col-span-2">
          <div className="relative overflow-hidden rounded-lg bg-white shadow-md">
            <img 
              src={auction.imageUrl} 
              alt={auction.title} 
              className="h-auto w-full object-cover"
            />
            <div className="absolute left-4 top-4">
              <AuctionStatusBadge status={auction.status} className="text-sm" />
            </div>
          </div>
        </div>
        
        {/* Details Column */}
        <div className="flex flex-col space-y-6">
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h1 className="mb-2 text-2xl font-bold text-gray-900">{auction.title}</h1>
            <div className="mb-4 flex items-center space-x-2 text-sm text-gray-500">
              <Eye className="h-4 w-4" />
              <span>{auction.viewCount} views</span>
              <span>•</span>
              <span>ID: {auction.id.split('-')[1]}</span>
            </div>
            
            <div className="mb-6">
              <AuctionCountdown auction={auction} onEnd={handleAuctionEnd} />
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-500">Current Bid</p>
              <p className="text-3xl font-bold text-blue-600">
                ${auction.currentPrice.toLocaleString()}
              </p>
              {auction.bids.length > 0 && (
                <p className="text-sm text-gray-500">
                  {auction.bids.length} {auction.bids.length === 1 ? 'bid' : 'bids'}
                </p>
              )}
            </div>
            
            <BidForm auction={auction} onBidPlaced={handleBidPlaced} />
          </div>
          
          {/* Seller Info */}
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h3 className="mb-4 font-semibold text-gray-900">Seller Information</h3>
            <div className="flex items-center">
              <img 
                src={`https://api.dicebear.com/6.x/initials/svg?seed=${auction.seller.username}`} 
                alt={auction.seller.username}
                className="mr-3 h-10 w-10 rounded-full"
              />
              <div>
                <p className="font-medium">{auction.seller.username}</p>
                <p className="text-sm text-gray-500">Seller ID: {auction.seller.id.split('-')[1]}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs for Details and Bid History */}
      <div className="mt-8">
        <div className="mb-4 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('details')}
              className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium ${
                activeTab === 'details'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              Item Details
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              Bid History ({auction.bids.length})
            </button>
          </nav>
        </div>
        
        {activeTab === 'details' ? (
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 md:pr-8">
              <h2 className="mb-4 text-xl font-semibold">Description</h2>
              <p className="mb-6 whitespace-pre-line text-gray-700">{auction.description}</p>
              
              <h2 className="mb-4 text-xl font-semibold">Auction Details</h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <Clock className="mr-3 mt-1 h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">Auction Timing</p>
                    <p className="text-gray-600">
                      Started {formatDistanceToNow(new Date(auction.startTime), { addSuffix: true })}
                    </p>
                    <p className="text-gray-600">
                      {auction.status === 'ended' 
                        ? `Ended ${formatDistanceToNow(new Date(auction.endTime), { addSuffix: true })}` 
                        : `Ends ${format(new Date(auction.endTime), 'PPP')} at ${format(new Date(auction.endTime), 'p')}`}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <DollarSign className="mr-3 mt-1 h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">Pricing Information</p>
                    <p className="text-gray-600">Starting price: ${auction.startingPrice.toLocaleString()}</p>
                    <p className="text-gray-600">Minimum bid increment: ${auction.minBidIncrement}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Tag className="mr-3 mt-1 h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">Category</p>
                    <p className="text-gray-600">
                      {auction.categoryId.split('-')[1]}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="rounded-lg bg-gray-50 p-6">
              <h2 className="mb-4 text-lg font-semibold">Auction Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <AuctionStatusBadge status={auction.status} />
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Price:</span>
                  <span className="font-semibold">${auction.currentPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Bids:</span>
                  <span>{auction.bids.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Highest Bidder:</span>
                  <span>{auction.highestBidder?.username || 'No bids yet'}</span>
                </div>
                {auction.status === 'ended' && auction.highestBidder && (
                  <div className="mt-4 rounded-md bg-green-50 p-3 text-center text-green-800">
                    <p className="font-medium">Auction has ended</p>
                    <p>Won by {auction.highestBidder.username} with a bid of ${auction.currentPrice.toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-xl font-semibold">Bid History</h2>
            <BidHistory bids={auction.bids} currentUserId={user?.id} />
          </div>
        )}
      </div>
    </div>
  );
};

export default AuctionDetailPage;