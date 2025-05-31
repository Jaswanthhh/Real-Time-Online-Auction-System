import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAuction } from '../contexts/AuctionContext';
import { Auction } from '../types';
import { Table as Tabs, List as TabsList, User, Tag, Clock, Package, PanelLeft, PanelRight } from 'lucide-react';
import AuctionCard from '../components/auction/AuctionCard';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { auctions } = useAuction();
  const [activeTab, setActiveTab] = useState<'bids' | 'selling' | 'won' | 'watching'>('bids');
  const [userAuctions, setUserAuctions] = useState<{
    bids: Auction[];
    selling: Auction[];
    won: Auction[];
    watching: Auction[];
  }>({
    bids: [],
    selling: [],
    won: [],
    watching: [],
  });
  
  // Simulated watching list - in a real app, this would be saved in the database
  const [watchingIds] = useState<string[]>(['auction-1', 'auction-5']);
  
  // Get user's auctions
  useEffect(() => {
    if (user && auctions.length > 0) {
      // Auctions user has bid on
      const userBids = auctions.filter(auction => 
        auction.bids.some(bid => bid.userId === user.id)
      );
      
      // Auctions user has created
      const userSelling = auctions.filter(auction => 
        auction.seller.id === user.id
      );
      
      // Auctions user has won
      const userWon = auctions.filter(auction => 
        auction.status === 'ended' && 
        auction.highestBidder?.id === user.id
      );
      
      // Auctions user is watching
      const userWatching = auctions.filter(auction => 
        watchingIds.includes(auction.id)
      );
      
      setUserAuctions({
        bids: userBids,
        selling: userSelling,
        won: userWon,
        watching: userWatching,
      });
    }
  }, [user, auctions, watchingIds]);
  
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="mb-8 rounded-lg bg-white p-6 shadow-md md:p-8">
        <div className="flex flex-col items-center space-y-4 md:flex-row md:space-x-6 md:space-y-0">
          <div className="h-24 w-24 overflow-hidden rounded-full md:h-32 md:w-32">
            <img 
              src={user.avatar} 
              alt={user.username} 
              className="h-full w-full object-cover"
            />
          </div>
          
          <div className="text-center md:text-left">
            <h1 className="text-2xl font-bold md:text-3xl">{user.username}</h1>
            <p className="text-gray-600">{user.email}</p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-3 md:justify-start">
              <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                <User className="mr-1 h-3 w-3" />
                Member since 2025
              </span>
              <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                <Tag className="mr-1 h-3 w-3" />
                Verified Seller
              </span>
              <span className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-800">
                <Clock className="mr-1 h-3 w-3" />
                Quick Shipper
              </span>
            </div>
          </div>
          
          <div className="mt-4 flex-1 md:mt-0 md:text-right">
            <button className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Edit Profile
            </button>
          </div>
        </div>
        
        {/* Stats Row */}
        <div className="mt-8 grid grid-cols-2 gap-4 border-t border-gray-200 pt-6 md:grid-cols-4">
          <div className="rounded-lg bg-gray-50 p-4 text-center">
            <p className="text-xl font-bold text-blue-600">{userAuctions.bids.length}</p>
            <p className="text-sm text-gray-600">Active Bids</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 text-center">
            <p className="text-xl font-bold text-blue-600">{userAuctions.selling.length}</p>
            <p className="text-sm text-gray-600">Selling</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 text-center">
            <p className="text-xl font-bold text-blue-600">{userAuctions.won.length}</p>
            <p className="text-sm text-gray-600">Won Auctions</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 text-center">
            <p className="text-xl font-bold text-blue-600">{userAuctions.watching.length}</p>
            <p className="text-sm text-gray-600">Watching</p>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab('bids')}
              className={`flex whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium ${
                activeTab === 'bids'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              <PanelRight className="mr-2 h-5 w-5" />
              My Bids ({userAuctions.bids.length})
            </button>
            <button
              onClick={() => setActiveTab('selling')}
              className={`flex whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium ${
                activeTab === 'selling'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              <Package className="mr-2 h-5 w-5" />
              Selling ({userAuctions.selling.length})
            </button>
            <button
              onClick={() => setActiveTab('won')}
              className={`flex whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium ${
                activeTab === 'won'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              <Tag className="mr-2 h-5 w-5" />
              Won Auctions ({userAuctions.won.length})
            </button>
            <button
              onClick={() => setActiveTab('watching')}
              className={`flex whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium ${
                activeTab === 'watching'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              <PanelLeft className="mr-2 h-5 w-5" />
              Watching ({userAuctions.watching.length})
            </button>
          </nav>
        </div>
      </div>
      
      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'bids' && (
          <div>
            <h2 className="mb-4 text-xl font-semibold">Auctions You've Bid On</h2>
            {userAuctions.bids.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {userAuctions.bids.map(auction => (
                  <AuctionCard key={auction.id} auction={auction} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg bg-gray-50 p-8 text-center">
                <p className="text-gray-500">You haven't placed any bids yet.</p>
                <a 
                  href="/"
                  className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Browse Auctions
                </a>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'selling' && (
          <div>
            <h2 className="mb-4 text-xl font-semibold">Your Listed Items</h2>
            {userAuctions.selling.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {userAuctions.selling.map(auction => (
                  <AuctionCard key={auction.id} auction={auction} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg bg-gray-50 p-8 text-center">
                <p className="text-gray-500">You don't have any active listings.</p>
                <a 
                  href="/create"
                  className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Create Auction
                </a>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'won' && (
          <div>
            <h2 className="mb-4 text-xl font-semibold">Auctions You've Won</h2>
            {userAuctions.won.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {userAuctions.won.map(auction => (
                  <AuctionCard key={auction.id} auction={auction} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg bg-gray-50 p-8 text-center">
                <p className="text-gray-500">You haven't won any auctions yet.</p>
                <a 
                  href="/"
                  className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Browse Auctions
                </a>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'watching' && (
          <div>
            <h2 className="mb-4 text-xl font-semibold">Auctions You're Watching</h2>
            {userAuctions.watching.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {userAuctions.watching.map(auction => (
                  <AuctionCard key={auction.id} auction={auction} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg bg-gray-50 p-8 text-center">
                <p className="text-gray-500">You're not watching any auctions.</p>
                <a 
                  href="/"
                  className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Browse Auctions
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;