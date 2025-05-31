import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CalendarClock, Info, Clock, DollarSign, ImageIcon, 
  Plus, Minus, AlertTriangle 
} from 'lucide-react';
import { useAuction } from '../contexts/AuctionContext';
import { useAuth } from '../contexts/AuthContext';
import { mockCategories } from '../data/mockData';
import { addDays, format, addHours } from 'date-fns';

const CreateAuctionPage: React.FC = () => {
  const navigate = useNavigate();
  const { createAuction, error } = useAuction();
  const { user } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Set default end time to 7 days from now
  const defaultEndDate = addDays(new Date(), 7);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: 'https://images.pexels.com/photos/3943723/pexels-photo-3943723.jpeg',
    categoryId: '',
    startingPrice: 100,
    minBidIncrement: 10,
    startOption: 'now', // 'now' or 'scheduled'
    startDate: format(new Date(), 'yyyy-MM-dd'),
    startTime: format(new Date(), 'HH:mm'),
    endDate: format(defaultEndDate, 'yyyy-MM-dd'),
    endTime: format(defaultEndDate, 'HH:mm'),
  });
  
  // Sample image URLs
  const sampleImages = [
    'https://images.pexels.com/photos/3943723/pexels-photo-3943723.jpeg',
    'https://images.pexels.com/photos/4386158/pexels-photo-4386158.jpeg',
    'https://images.pexels.com/photos/3802666/pexels-photo-3802666.jpeg',
    'https://images.pexels.com/photos/3028283/pexels-photo-3028283.jpeg',
    'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg',
    'https://images.pexels.com/photos/2387532/pexels-photo-2387532.jpeg',
  ];
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setFormError(null);
  };
  
  const handleImageSelect = (url: string) => {
    setFormData({ ...formData, imageUrl: url });
  };
  
  const handlePriceChange = (field: 'startingPrice' | 'minBidIncrement', operation: 'increment' | 'decrement') => {
    const step = field === 'minBidIncrement' ? 5 : 50;
    const minValue = field === 'minBidIncrement' ? 5 : 50;
    
    setFormData(prev => {
      let newValue = prev[field];
      
      if (operation === 'increment') {
        newValue += step;
      } else {
        newValue = Math.max(minValue, newValue - step);
      }
      
      return { ...prev, [field]: newValue };
    });
  };
  
  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      setFormError('Please enter a title for your auction');
      return false;
    }
    
    if (formData.title.length < 10) {
      setFormError('Title should be at least 10 characters long');
      return false;
    }
    
    if (!formData.description.trim()) {
      setFormError('Please enter a description for your auction');
      return false;
    }
    
    if (formData.description.length < 30) {
      setFormError('Description should be at least 30 characters long');
      return false;
    }
    
    if (!formData.categoryId) {
      setFormError('Please select a category');
      return false;
    }
    
    if (formData.startingPrice < 1) {
      setFormError('Starting price must be at least $1');
      return false;
    }
    
    if (formData.minBidIncrement < 1) {
      setFormError('Minimum bid increment must be at least $1');
      return false;
    }
    
    // Validate dates
    const now = new Date();
    const startDateTime = formData.startOption === 'now'
      ? now
      : new Date(`${formData.startDate}T${formData.startTime}`);
    
    const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);
    
    if (isNaN(startDateTime.getTime())) {
      setFormError('Invalid start date or time');
      return false;
    }
    
    if (isNaN(endDateTime.getTime())) {
      setFormError('Invalid end date or time');
      return false;
    }
    
    if (formData.startOption === 'scheduled' && startDateTime < now) {
      setFormError('Start time cannot be in the past');
      return false;
    }
    
    if (endDateTime <= startDateTime) {
      setFormError('End time must be after start time');
      return false;
    }
    
    const minDuration = 1 * 60 * 60 * 1000; // 1 hour in milliseconds
    if (endDateTime.getTime() - startDateTime.getTime() < minDuration) {
      setFormError('Auction duration must be at least 1 hour');
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Calculate start and end times
      const startDateTime = formData.startOption === 'now'
        ? new Date()
        : new Date(`${formData.startDate}T${formData.startTime}`);
      
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);
      
      const auctionData = {
        title: formData.title,
        description: formData.description,
        imageUrl: formData.imageUrl,
        categoryId: formData.categoryId,
        startingPrice: formData.startingPrice,
        minBidIncrement: formData.minBidIncrement,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        seller: {
          id: user!.id,
          username: user!.username,
        },
      };
      
      const newAuction = await createAuction(auctionData);
      
      // Redirect to the newly created auction
      navigate(`/auctions/${newAuction.id}`);
    } catch (err) {
      setFormError('Failed to create auction. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create New Auction</h1>
        <p className="text-gray-600">List your item and start receiving bids</p>
      </div>
      
      <div className="grid gap-8 md:grid-cols-3">
        {/* Form Column */}
        <div className="md:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="rounded-lg bg-white p-6 shadow-md">
              <div className="mb-4 flex items-center">
                <Info className="mr-2 h-5 w-5 text-blue-500" />
                <h2 className="text-xl font-semibold">Basic Information</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Auction Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    placeholder="e.g., Vintage Mechanical Watch - Excellent Condition"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Be specific and include key details about your item (min. 10 characters)
                  </p>
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={5}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    placeholder="Describe your item in detail. Include condition, features, history, etc."
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Detailed descriptions attract more bidders (min. 30 characters)
                  </p>
                </div>
                
                <div>
                  <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="categoryId"
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    required
                  >
                    <option value="" disabled>Select a category</option>
                    {mockCategories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            {/* Images */}
            <div className="rounded-lg bg-white p-6 shadow-md">
              <div className="mb-4 flex items-center">
                <ImageIcon className="mr-2 h-5 w-5 text-blue-500" />
                <h2 className="text-xl font-semibold">Item Image</h2>
              </div>
              
              <p className="mb-4 text-sm text-gray-600">
                Select a sample image for your auction:
              </p>
              
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {sampleImages.map((url, index) => (
                  <div 
                    key={index} 
                    className={`relative aspect-square cursor-pointer overflow-hidden rounded-lg border-2 ${
                      formData.imageUrl === url ? 'border-blue-500' : 'border-transparent'
                    }`}
                    onClick={() => handleImageSelect(url)}
                  >
                    <img 
                      src={url} 
                      alt={`Sample ${index + 1}`} 
                      className="h-full w-full object-cover"
                    />
                    {formData.imageUrl === url && (
                      <div className="absolute inset-0 bg-blue-500 bg-opacity-20"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Pricing */}
            <div className="rounded-lg bg-white p-6 shadow-md">
              <div className="mb-4 flex items-center">
                <DollarSign className="mr-2 h-5 w-5 text-blue-500" />
                <h2 className="text-xl font-semibold">Pricing</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Starting Price <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 flex items-center">
                    <button 
                      type="button"
                      onClick={() => handlePriceChange('startingPrice', 'decrement')}
                      className="rounded-l-md border border-gray-300 bg-gray-50 p-2 hover:bg-gray-100"
                    >
                      <Minus className="h-5 w-5 text-gray-600" />
                    </button>
                    <div className="relative flex-1">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
                      <input
                        type="number"
                        name="startingPrice"
                        value={formData.startingPrice}
                        onChange={handleInputChange}
                        className="block w-full border-y border-gray-300 py-2 pl-8 pr-3 text-center focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        min="1"
                        step="1"
                        required
                      />
                    </div>
                    <button 
                      type="button"
                      onClick={() => handlePriceChange('startingPrice', 'increment')}
                      className="rounded-r-md border border-gray-300 bg-gray-50 p-2 hover:bg-gray-100"
                    >
                      <Plus className="h-5 w-5 text-gray-600" />
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    The minimum amount bidders can start at
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Minimum Bid Increment <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 flex items-center">
                    <button 
                      type="button"
                      onClick={() => handlePriceChange('minBidIncrement', 'decrement')}
                      className="rounded-l-md border border-gray-300 bg-gray-50 p-2 hover:bg-gray-100"
                    >
                      <Minus className="h-5 w-5 text-gray-600" />
                    </button>
                    <div className="relative flex-1">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
                      <input
                        type="number"
                        name="minBidIncrement"
                        value={formData.minBidIncrement}
                        onChange={handleInputChange}
                        className="block w-full border-y border-gray-300 py-2 pl-8 pr-3 text-center focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        min="1"
                        step="1"
                        required
                      />
                    </div>
                    <button 
                      type="button"
                      onClick={() => handlePriceChange('minBidIncrement', 'increment')}
                      className="rounded-r-md border border-gray-300 bg-gray-50 p-2 hover:bg-gray-100"
                    >
                      <Plus className="h-5 w-5 text-gray-600" />
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    The minimum amount a bid must increase by
                  </p>
                </div>
              </div>
            </div>
            
            {/* Timing */}
            <div className="rounded-lg bg-white p-6 shadow-md">
              <div className="mb-4 flex items-center">
                <Clock className="mr-2 h-5 w-5 text-blue-500" />
                <h2 className="text-xl font-semibold">Auction Timing</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Start Time <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-2 space-y-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="startNow"
                        name="startOption"
                        value="now"
                        checked={formData.startOption === 'now'}
                        onChange={handleInputChange}
                        className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="startNow" className="text-sm text-gray-700">
                        Start immediately after creation
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="startScheduled"
                        name="startOption"
                        value="scheduled"
                        checked={formData.startOption === 'scheduled'}
                        onChange={handleInputChange}
                        className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="startScheduled" className="text-sm text-gray-700">
                        Schedule for later
                      </label>
                    </div>
                    
                    {formData.startOption === 'scheduled' && (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                            Start Date
                          </label>
                          <input
                            type="date"
                            id="startDate"
                            name="startDate"
                            value={formData.startDate}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                            min={format(new Date(), 'yyyy-MM-dd')}
                          />
                        </div>
                        <div>
                          <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                            Start Time
                          </label>
                          <input
                            type="time"
                            id="startTime"
                            name="startTime"
                            value={formData.startTime}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    End Time <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-2 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                        End Date
                      </label>
                      <input
                        type="date"
                        id="endDate"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        min={format(new Date(), 'yyyy-MM-dd')}
                      />
                    </div>
                    <div>
                      <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
                        End Time
                      </label>
                      <input
                        type="time"
                        id="endTime"
                        name="endTime"
                        value={formData.endTime}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Recommended auction duration: 3-7 days
                  </p>
                </div>
              </div>
            </div>
            
            {/* Error message */}
            {(formError || error) && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex items-start">
                  <AlertTriangle className="mr-3 h-5 w-5 text-red-400" />
                  <div>
                    <h3 className="text-sm font-medium text-red-800">
                      Error creating auction
                    </h3>
                    <p className="mt-1 text-sm text-red-700">
                      {formError || error}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Submit button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="rounded-md border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70"
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                    Creating...
                  </span>
                ) : (
                  'Create Auction'
                )}
              </button>
            </div>
          </form>
        </div>
        
        {/* Sidebar */}
        <div className="md:col-span-1">
          <div className="sticky top-24 space-y-6">
            {/* Preview Card */}
            <div className="overflow-hidden rounded-lg bg-white shadow-md">
              <div className="p-4">
                <h3 className="text-lg font-semibold">Auction Preview</h3>
              </div>
              <div className="h-40 overflow-hidden bg-gray-200">
                {formData.imageUrl && (
                  <img 
                    src={formData.imageUrl} 
                    alt="Preview" 
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="p-4">
                <h4 className="line-clamp-1 font-medium">
                  {formData.title || 'Auction Title'}
                </h4>
                <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                  {formData.description || 'Your auction description will appear here.'}
                </p>
                <div className="mt-2 text-lg font-bold text-blue-600">
                  ${formData.startingPrice.toLocaleString()}
                </div>
              </div>
            </div>
            
            {/* Tips */}
            <div className="rounded-lg bg-blue-50 p-6">
              <h3 className="mb-3 text-lg font-semibold text-blue-800">Tips for a Successful Auction</h3>
              <ul className="ml-5 list-disc space-y-2 text-sm text-blue-700">
                <li>Use a clear, descriptive title</li>
                <li>Include detailed information about condition</li>
                <li>Set a reasonable starting price</li>
                <li>Allow enough time for bidding (3-7 days recommended)</li>
                <li>Respond promptly to questions from potential bidders</li>
              </ul>
            </div>
            
            {/* Auction Fees */}
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h3 className="mb-3 text-lg font-semibold">Auction Fees</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Listing Fee:</span>
                  <span className="font-medium">Free</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Success Fee:</span>
                  <span className="font-medium">5% of final price</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Processing:</span>
                  <span className="font-medium">2.9% + $0.30</span>
                </div>
                <div className="mt-4 text-xs text-gray-500">
                  Fees are only charged when your item sells
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateAuctionPage;