import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Clock, TrendingUp } from 'lucide-react';
import AuctionCard from '../components/auction/AuctionCard';
import AuctionFilters from '../components/auction/AuctionFilters';
import { useAuction } from '../contexts/AuctionContext';
import { AuctionFilters as FilterType } from '../types';

const HomePage: React.FC = () => {
  const { filteredAuctions, loading, setFilters, filters } = useAuction();
  const [searchParams, setSearchParams] = useSearchParams();
  const [featuredAuctions, setFeaturedAuctions] = useState<typeof filteredAuctions>([]);
  const [endingSoonAuctions, setEndingSoonAuctions] = useState<typeof filteredAuctions>([]);
  
  // Initialize filters from URL params
  useEffect(() => {
    const urlFilters: FilterType = {};
    
    if (searchParams.has('search')) {
      urlFilters.search = searchParams.get('search') || undefined;
    }
    
    if (searchParams.has('category')) {
      urlFilters.category = searchParams.get('category') || undefined;
    }
    
    if (searchParams.has('status')) {
      urlFilters.status = searchParams.get('status') as FilterType['status'] || undefined;
    }
    
    if (searchParams.has('minPrice')) {
      urlFilters.minPrice = parseInt(searchParams.get('minPrice') || '0', 10) || undefined;
    }
    
    if (searchParams.has('maxPrice')) {
      urlFilters.maxPrice = parseInt(searchParams.get('maxPrice') || '0', 10) || undefined;
    }
    
    if (Object.keys(urlFilters).length > 0) {
      setFilters(urlFilters);
    }
  }, [searchParams, setFilters]);
  
  // Update URL when filters change
  useEffect(() => {
    const newSearchParams = new URLSearchParams();
    
    if (filters.search) {
      newSearchParams.set('search', filters.search);
    }
    
    if (filters.category) {
      newSearchParams.set('category', filters.category);
    }
    
    if (filters.status) {
      newSearchParams.set('status', filters.status);
    }
    
    if (filters.minPrice !== undefined) {
      newSearchParams.set('minPrice', filters.minPrice.toString());
    }
    
    if (filters.maxPrice !== undefined) {
      newSearchParams.set('maxPrice', filters.maxPrice.toString());
    }
    
    setSearchParams(newSearchParams, { replace: true });
  }, [filters, setSearchParams]);
  
  // Prepare special auction sections
  useEffect(() => {
    if (filteredAuctions.length > 0) {
      // Get ending soon auctions (active auctions ending in less than 24 hours)
      const now = new Date();
      const twentyFourHoursLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      
      const endingSoon = filteredAuctions
        .filter(auction => 
          auction.status === 'active' && 
          new Date(auction.endTime) <= twentyFourHoursLater
        )
        .sort((a, b) => new Date(a.endTime).getTime() - new Date(b.endTime).getTime())
        .slice(0, 4);
      
      setEndingSoonAuctions(endingSoon);
      
      // Featured auctions: active auctions with the most bids
      const featured = filteredAuctions
        .filter(auction => auction.status === 'active')
        .sort((a, b) => b.bids.length - a.bids.length)
        .slice(0, 4);
      
      setFeaturedAuctions(featured);
    }
  }, [filteredAuctions]);
  
  // Handle filters
  const handleApplyFilters = (newFilters: FilterType) => {
    setFilters(newFilters);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="mb-12 rounded-xl bg-gradient-to-r from-blue-600 to-blue-800 py-12 px-6 text-white shadow-lg md:px-12">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-4 text-4xl font-bold md:text-5xl">
            Discover, Bid, Win. In Real-Time.
          </h1>
          <p className="mb-6 text-lg text-blue-100 md:text-xl">
            Participate in live auctions with real-time bidding and instant notifications.
          </p>
          <div className="flex flex-col justify-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
            <a 
              href="#active-auctions" 
              className="rounded-md bg-white px-8 py-3 text-center font-semibold text-blue-700 transition-colors hover:bg-blue-50"
            >
              Browse Auctions
            </a>
            <a 
              href="#ending-soon" 
              className="rounded-md border border-white bg-transparent px-8 py-3 text-center font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Ending Soon
            </a>
          </div>
        </div>
      </div>
      
      {/* Ending Soon Section */}
      <section id="ending-soon" className="mb-16">
        <div className="mb-6 flex items-center">
          <Clock className="mr-2 h-6 w-6 text-red-500" />
          <h2 className="text-2xl font-bold">Ending Soon</h2>
        </div>
        
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-lg bg-gray-200"></div>
            ))}
          </div>
        ) : endingSoonAuctions.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {endingSoonAuctions.map(auction => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>
        ) : (
          <p className="rounded-lg bg-gray-100 p-8 text-center text-gray-500">
            No auctions ending soon. Check back later!
          </p>
        )}
      </section>
      
      {/* Featured Auctions Section */}
      <section id="featured" className="mb-16">
        <div className="mb-6 flex items-center">
          <TrendingUp className="mr-2 h-6 w-6 text-blue-500" />
          <h2 className="text-2xl font-bold">Featured Auctions</h2>
        </div>
        
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-lg bg-gray-200"></div>
            ))}
          </div>
        ) : featuredAuctions.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featuredAuctions.map(auction => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>
        ) : (
          <p className="rounded-lg bg-gray-100 p-8 text-center text-gray-500">
            No featured auctions available right now.
          </p>
        )}
      </section>
      
      {/* All Auctions Section */}
      <section id="active-auctions">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">All Auctions</h2>
          <span className="text-sm text-gray-500">
            {filteredAuctions.length} {filteredAuctions.length === 1 ? 'item' : 'items'}
          </span>
        </div>
        
        <AuctionFilters filters={filters} onApplyFilters={handleApplyFilters} />
        
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-lg bg-gray-200"></div>
            ))}
          </div>
        ) : filteredAuctions.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredAuctions.map(auction => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
            <h3 className="mb-2 text-lg font-medium">No auctions found</h3>
            <p className="text-gray-500">
              Try adjusting your filters or search criteria.
            </p>
          </div>
        )}
      </section>
      
      {/* Information Sections */}
      <section className="mt-24 grid gap-8 md:grid-cols-3">
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h3 className="mb-4 text-xl font-semibold text-gray-900">How it Works</h3>
          <ol className="ml-5 list-decimal space-y-2 text-gray-700">
            <li>Browse and find items you're interested in</li>
            <li>Register an account to place bids</li>
            <li>Set your maximum bid amount</li>
            <li>Receive real-time notifications</li>
            <li>Win the auction and complete payment</li>
          </ol>
        </div>
        
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h3 className="mb-4 text-xl font-semibold text-gray-900">Seller Benefits</h3>
          <ul className="ml-5 list-disc space-y-2 text-gray-700">
            <li>Reach thousands of potential buyers</li>
            <li>Competitive bidding increases final prices</li>
            <li>Real-time analytics on auction performance</li>
            <li>Secure payment processing</li>
            <li>Simple listing creation process</li>
          </ul>
        </div>
        
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h3 className="mb-4 text-xl font-semibold text-gray-900">Buyer Protection</h3>
          <ul className="ml-5 list-disc space-y-2 text-gray-700">
            <li>Verified seller ratings and reviews</li>
            <li>Secure payment processing</li>
            <li>Item authenticity guarantee</li>
            <li>Transparent bidding history</li>
            <li>Customer support for disputes</li>
          </ul>
        </div>
      </section>
    </div>
  );
};

export default HomePage;