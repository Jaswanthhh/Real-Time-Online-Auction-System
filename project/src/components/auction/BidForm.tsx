import React, { useState, useEffect } from 'react';
import { Auction } from '../../types';
import { useAuction } from '../../contexts/AuctionContext';
import { useAuth } from '../../contexts/AuthContext';
import { AlertCircle } from 'lucide-react';

interface BidFormProps {
  auction: Auction;
  onBidPlaced: () => void;
}

const BidForm: React.FC<BidFormProps> = ({ auction, onBidPlaced }) => {
  const { placeBid, error } = useAuction();
  const { isAuthenticated } = useAuth();
  const [bidAmount, setBidAmount] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Set initial bid amount suggestion
  useEffect(() => {
    const suggestedBid = auction.currentPrice + auction.minBidIncrement;
    setBidAmount(suggestedBid.toString());
  }, [auction.currentPrice, auction.minBidIncrement]);
  
  // Clear messages after a delay
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);
  
  const handleBidAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only numbers and decimal point
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setBidAmount(value);
    setFormError(null);
  };
  
  const validateBid = (): boolean => {
    const amount = parseFloat(bidAmount);
    
    if (isNaN(amount)) {
      setFormError('Please enter a valid bid amount');
      return false;
    }
    
    if (amount <= auction.currentPrice) {
      setFormError(`Bid must be higher than current price of $${auction.currentPrice}`);
      return false;
    }
    
    if (amount < auction.currentPrice + auction.minBidIncrement) {
      setFormError(`Minimum bid increment is $${auction.minBidIncrement}`);
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      setFormError('You must be logged in to place a bid');
      return;
    }
    
    if (auction.status !== 'active') {
      setFormError('Cannot bid on an auction that is not active');
      return;
    }
    
    if (!validateBid()) {
      return;
    }
    
    setSubmitting(true);
    setFormError(null);
    
    try {
      const success = await placeBid(auction.id, parseFloat(bidAmount));
      
      if (success) {
        setSuccessMessage('Your bid was placed successfully!');
        setBidAmount((auction.currentPrice + auction.minBidIncrement).toString());
        onBidPlaced();
      } else {
        setFormError(error || 'Failed to place bid. Please try again.');
      }
    } catch (err) {
      setFormError('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };
  
  const incrementBid = () => {
    const currentBid = parseFloat(bidAmount) || auction.currentPrice;
    setBidAmount((currentBid + auction.minBidIncrement).toFixed(2));
    setFormError(null);
  };
  
  if (auction.status === 'ended') {
    return (
      <div className="rounded-lg bg-gray-100 p-4 text-center text-gray-700">
        This auction has ended
      </div>
    );
  }
  
  if (auction.status === 'upcoming') {
    return (
      <div className="rounded-lg bg-blue-50 p-4 text-center text-blue-700">
        This auction hasn't started yet
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="bidAmount" className="block text-sm font-medium text-gray-700">
          Your Bid
        </label>
        <div className="relative mt-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <span className="text-gray-500">$</span>
          </div>
          <input
            type="text"
            id="bidAmount"
            value={bidAmount}
            onChange={handleBidAmountChange}
            className="block w-full rounded-md border-gray-300 pl-7 pr-12 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="0.00"
            disabled={submitting}
          />
          <div className="absolute inset-y-0 right-0 flex items-center">
            <button
              type="button"
              onClick={incrementBid}
              className="mr-1 rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600 hover:bg-gray-200"
            >
              +${auction.minBidIncrement}
            </button>
          </div>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Minimum bid: ${(auction.currentPrice + auction.minBidIncrement).toLocaleString()}
        </p>
      </div>
      
      {formError && (
        <div className="rounded-md bg-red-50 p-3">
          <div className="flex items-center">
            <AlertCircle className="mr-2 h-5 w-5 text-red-400" />
            <p className="text-sm text-red-700">{formError}</p>
          </div>
        </div>
      )}
      
      {successMessage && (
        <div className="rounded-md bg-green-50 p-3">
          <p className="text-sm text-green-700">{successMessage}</p>
        </div>
      )}
      
      <button
        type="submit"
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70"
        disabled={submitting || !isAuthenticated}
      >
        {submitting ? (
          <span className="flex items-center justify-center">
            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
            Processing...
          </span>
        ) : (
          'Place Bid'
        )}
      </button>
      
      {!isAuthenticated && (
        <p className="text-center text-sm text-gray-500">
          You must be logged in to place a bid
        </p>
      )}
    </form>
  );
};

export default BidForm;