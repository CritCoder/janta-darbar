import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import AdminDashboard from './dashboards/AdminDashboard';
import CitizenDashboard from './dashboards/CitizenDashboard';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const Dashboard = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Route based on user role
  switch (user.role) {
    case 'admin':
      return <AdminDashboard />;

    case 'officer':
      // Officers go directly to their assignments
      return <Navigate to="/officer/assignments" replace />;

    case 'citizen':
      return <CitizenDashboard />;

    default:
      return <CitizenDashboard />;
  }
};

export default Dashboard;
