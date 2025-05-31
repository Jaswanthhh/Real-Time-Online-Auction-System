import React from 'react';
import { Package, Twitter, Facebook, Instagram, Mail, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
          {/* Logo and About */}
          <div>
            <div className="mb-4 flex items-center">
              <Package className="mr-2 h-6 w-6 text-blue-500" />
              <span className="text-xl font-bold text-white">BidStream</span>
            </div>
            <p className="mb-4 text-sm text-gray-400">
              The premier real-time auction platform where buyers and sellers connect instantly.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-blue-500">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-blue-500">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-blue-500">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-white">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="hover:text-blue-500">Home</Link>
              </li>
              <li>
                <Link to="/create" className="hover:text-blue-500">Sell an Item</Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-blue-500">Create Account</Link>
              </li>
              <li>
                <a href="#" className="hover:text-blue-500">How It Works</a>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-white">Categories</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="hover:text-blue-500">Electronics</a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-500">Collectibles</a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-500">Art & Antiques</a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-500">Vehicles</a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-500">Fashion</a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-white">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <Mail className="mr-2 h-5 w-5 text-blue-500" />
                <span>support@bidstream.com</span>
              </li>
              <li>
                <a 
                  href="#" 
                  className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Help Center
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-800 pt-6">
          <div className="flex flex-col justify-between sm:flex-row">
            <p className="text-sm">
              &copy; {new Date().getFullYear()} BidStream. All rights reserved.
            </p>
            <div className="mt-2 flex space-x-4 sm:mt-0">
              <a href="#" className="text-sm hover:text-blue-500">Privacy Policy</a>
              <a href="#" className="text-sm hover:text-blue-500">Terms of Service</a>
              <a href="#" className="text-sm hover:text-blue-500">Cookies</a>
            </div>
          </div>
          <div className="mt-4 text-center text-xs text-gray-500">
            <p className="flex items-center justify-center">
              Made with <Heart className="mx-1 h-3 w-3 text-red-500" /> for online auction enthusiasts
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;