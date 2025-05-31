import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import NotificationToast from '../notifications/NotificationToast';
import { useNotification } from '../../contexts/NotificationContext';

const Layout: React.FC = () => {
  const { notifications } = useNotification();
  
  // Only show the most recent unread notification
  const recentNotification = notifications.find(n => !n.read);
  
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-gray-50">
        <Outlet />
      </main>
      <Footer />
      {recentNotification && (
        <NotificationToast notification={recentNotification} />
      )}
    </div>
  );
};

export default Layout;