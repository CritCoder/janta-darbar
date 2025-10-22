import React from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '../UI/sidebar';
import AppSidebar from '../AppSidebar';
import Header from './Header';
import { useLanguage } from '../../contexts/LanguageContext';

const Layout = () => {
  const { t } = useLanguage();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Header */}
        <Header />
        
        {/* Page content */}
        <main className="px-4 py-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-7xl mx-auto"
          >
            <Outlet />
          </motion.div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Layout;