import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  FileText,
  Building2,
  Users,
  BarChart3,
  Settings,
  LogOut,
  User,
  Zap,
  Target
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

const Sidebar = ({ onClose }) => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  // Base navigation for all users
  const baseNavigation = [
    { name: t('nav.dashboard'), href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'officer', 'citizen'] },
  ];

  // Admin-specific navigation
  const adminNavigation = [
    { name: '⚡ Quick Create', href: '/admin/quick-create', icon: Zap, roles: ['admin'], badge: 'NEW' },
    { name: t('nav.grievances'), href: '/grievances', icon: FileText, roles: ['admin', 'officer'] },
    { name: t('nav.departments'), href: '/departments', icon: Building2, roles: ['admin'] },
    { name: t('nav.officers'), href: '/officers', icon: Users, roles: ['admin'] },
    { name: t('nav.analytics'), href: '/analytics', icon: BarChart3, roles: ['admin'] },
  ];

  // Officer-specific navigation
  const officerNavigation = [
    { name: '📋 My Assignments', href: '/officer/assignments', icon: Target, roles: ['officer'] },
  ];

  // Common navigation
  const commonNavigation = [
    { name: t('nav.settings'), href: '/settings', icon: Settings, roles: ['admin', 'officer', 'citizen'] },
  ];

  // Combine navigation based on user role
  const userRole = user?.role || 'citizen';
  const allNavigation = [
    ...baseNavigation,
    ...(userRole === 'admin' ? adminNavigation : []),
    ...(userRole === 'officer' ? [...officerNavigation, ...adminNavigation.filter(n => n.roles.includes('officer'))] : []),
    ...commonNavigation
  ];

  // Filter navigation based on user role
  const navigation = allNavigation.filter(item => item.roles.includes(userRole));

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Logo Section with Enhanced Design */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-transparent"></div>
        <div className="relative flex items-center justify-center h-20 px-6">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="text-white font-bold text-2xl tracking-wide"
          >
            जनता दरबार
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400"></div>
      </div>

      {/* Enhanced User Info Section */}
      <div className="p-6 bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center space-x-4"
        >
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg">
              <User className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {user?.name || 'User'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.phone || ''}
            </p>
            {user?.role && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4 }}
                className={`inline-block mt-2 px-3 py-1 text-xs font-semibold rounded-full shadow-sm ${
                  user.role === 'admin' ? 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border border-purple-300' :
                  user.role === 'officer' ? 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300' :
                  'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300'
                }`}
              >
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </motion.span>
            )}
          </div>
        </motion.div>
      </div>

      {/* Enhanced Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-3 overflow-y-auto">
        {navigation.map((item, index) => {
          const Icon = item.icon;
          
          return (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
            >
              <NavLink
                to={item.href}
                onClick={onClose}
                className={({ isActive }) =>
                  `group relative flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25 transform scale-105'
                      : 'text-gray-700 hover:bg-white/80 hover:text-gray-900 hover:shadow-md hover:scale-105'
                  }`
                }
              >
                <div className="flex items-center">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <Icon className={`mr-4 w-5 h-5 flex-shrink-0 ${
                      navigation.find(n => n.href === item.href)?.isActive ? 'text-white' : 'text-gray-600 group-hover:text-primary-600'
                    }`} />
                  </motion.div>
                  <span className="font-medium">{item.name}</span>
                </div>
                {item.badge && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="px-2 py-1 text-xs font-bold bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 rounded-full shadow-sm"
                  >
                    {item.badge}
                  </motion.span>
                )}
                {/* Active indicator */}
                <motion.div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: navigation.find(n => n.href === item.href)?.isActive ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                />
              </NavLink>
            </motion.div>
          );
        })}
      </nav>

      {/* Enhanced Logout Section */}
      <div className="p-4 bg-white/60 backdrop-blur-sm border-t border-gray-200/50">
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          className="group flex items-center w-full px-4 py-3 text-sm font-medium text-gray-700 rounded-xl hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 hover:text-red-700 transition-all duration-300 hover:shadow-md"
        >
          <motion.div
            whileHover={{ rotate: 15 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <LogOut className="mr-4 w-5 h-5 flex-shrink-0 text-gray-500 group-hover:text-red-600" />
          </motion.div>
          <span className="font-medium">{t('nav.logout')}</span>
        </motion.button>
      </div>
    </div>
  );
};

export default Sidebar;
