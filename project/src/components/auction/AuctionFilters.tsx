import React, { useState, useEffect } from 'react';
import { AuctionFilters as FilterType } from '../../types';
import { Filter, X } from 'lucide-react';
import { mockCategories } from '../../data/mockData';

interface AuctionFiltersProps {
  filters: FilterType;
  onApplyFilters: (filters: FilterType) => void;
}

const AuctionFilters: React.FC<AuctionFiltersProps> = ({ 
  filters,
  onApplyFilters,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<FilterType>(filters);
  
  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'minPrice' || name === 'maxPrice') {
      setLocalFilters({
        ...localFilters,
        [name]: value ? parseInt(value) : undefined,
      });
    } else {
      setLocalFilters({
        ...localFilters,
        [name]: value || undefined,
      });
    }
  };
  
  const applyFilters = () => {
    onApplyFilters(localFilters);
    setIsOpen(false);
  };
  
  const clearFilters = () => {
    const emptyFilters: FilterType = {};
    setLocalFilters(emptyFilters);
    onApplyFilters(emptyFilters);
  };
  
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50"
        >
          <Filter className="h-4 w-4" />
          <span>Filters</span>
        </button>
        
        {Object.keys(filters).length > 0 && (
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Clear filters
          </button>
        )}
      </div>
      
      {isOpen && (
        <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-medium">Filter Auctions</h3>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={localFilters.category || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              >
                <option value="">All Categories</option>
                {mockCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={localFilters.status || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="upcoming">Upcoming</option>
                <option value="ended">Ended</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="minPrice" className="block text-sm font-medium text-gray-700">
                Min Price
              </label>
              <div className="relative mt-1 rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  name="minPrice"
                  id="minPrice"
                  value={localFilters.minPrice || ''}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border border-gray-300 pl-7 pr-3 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="maxPrice" className="block text-sm font-medium text-gray-700">
                Max Price
              </label>
              <div className="relative mt-1 rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  name="maxPrice"
                  id="maxPrice"
                  value={localFilters.maxPrice || ''}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border border-gray-300 pl-7 pr-3 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="No limit"
                  min="0"
                />
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={applyFilters}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
      
      {/* Active filters */}
      {Object.keys(filters).length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {filters.category && (
            <div className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
              Category: {mockCategories.find(c => c.id === filters.category)?.name}
              <button 
                onClick={() => {
                  onApplyFilters({ ...filters, category: undefined });
                }}
                className="ml-1 text-blue-500 hover:text-blue-700"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          
          {filters.status && (
            <div className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
              Status: {filters.status.charAt(0).toUpperCase() + filters.status.slice(1)}
              <button 
                onClick={() => {
                  onApplyFilters({ ...filters, status: undefined });
                }}
                className="ml-1 text-blue-500 hover:text-blue-700"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          
          {filters.minPrice !== undefined && (
            <div className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
              Min Price: ${filters.minPrice}
              <button 
                onClick={() => {
                  onApplyFilters({ ...filters, minPrice: undefined });
                }}
                className="ml-1 text-blue-500 hover:text-blue-700"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          
          {filters.maxPrice !== undefined && (
            <div className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
              Max Price: ${filters.maxPrice}
              <button 
                onClick={() => {
                  onApplyFilters({ ...filters, maxPrice: undefined });
                }}
                className="ml-1 text-blue-500 hover:text-blue-700"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          
          {filters.search && (
            <div className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
              Search: {filters.search}
              <button 
                onClick={() => {
                  onApplyFilters({ ...filters, search: undefined });
                }}
                className="ml-1 text-blue-500 hover:text-blue-700"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AuctionFilters;