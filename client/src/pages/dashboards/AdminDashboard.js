import React from 'react';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Zap,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import StatusBadge from '../../components/UI/StatusBadge';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch all grievances for admin
  const { data, isLoading, error } = useQuery(
    'adminGrievances',
    async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/grievances`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 10, sort_by: 'created_at', sort_order: 'DESC' }
      });
      return response.data;
    },
    { refetchInterval: 30000 }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">Error loading dashboard data</p>
      </div>
    );
  }

  const grievances = data?.grievances || [];
  const total = grievances.length;
  const newCount = grievances.filter(g => g.status === 'NEW').length;
  const assignedCount = grievances.filter(g => g.status === 'ASSIGNED').length;
  const inProgressCount = grievances.filter(g => g.status === 'IN_PROGRESS').length;
  const resolvedCount = grievances.filter(g => g.status === 'RESOLVED' || g.status === 'CLOSED').length;

  const statCards = [
    {
      title: 'Total Grievances',
      value: total,
      icon: FileText,
      color: 'blue',
      bgColor: 'bg-blue-500'
    },
    {
      title: 'Resolved',
      value: resolvedCount,
      icon: CheckCircle,
      color: 'green',
      bgColor: 'bg-green-500'
    },
    {
      title: 'In Progress',
      value: inProgressCount,
      icon: Clock,
      color: 'yellow',
      bgColor: 'bg-yellow-500'
    },
    {
      title: 'New / Needs Assignment',
      value: newCount + assignedCount,
      icon: AlertCircle,
      color: 'red',
      bgColor: 'bg-red-500'
    }
  ];

  return (
    <div>
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.name}! 👋
        </h1>
        <p className="text-gray-600">
          Admin Dashboard - Manage all grievances and assignments
        </p>
      </div>

      {/* Quick Action Button */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <button
          onClick={() => navigate('/admin/quick-create')}
          className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 font-bold rounded-xl hover:from-yellow-500 hover:to-orange-600 shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
        >
          <div className="flex items-center gap-3">
            <Zap className="w-6 h-6" />
            <div className="text-left">
              <p className="text-lg">⚡ Quick Create & Assign</p>
              <p className="text-sm font-normal opacity-90">
                Upload complaint → AI processes → One-click assign
              </p>
            </div>
          </div>
          <ArrowRight className="w-6 h-6" />
        </button>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 ${stat.bgColor} bg-opacity-10 rounded-lg`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
              </div>
              <TrendingUp className="w-5 h-5 text-gray-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">
              {stat.title}
            </h3>
            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Recent Grievances */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            Recent Grievances
          </h2>
          <button
            onClick={() => navigate('/grievances')}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-2"
          >
            View All
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {grievances.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No grievances yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {grievances.slice(0, 5).map((grievance) => (
              <motion.div
                key={grievance.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => navigate(`/grievances/${grievance.id}`)}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-sm text-gray-500">
                      {grievance.ticket_id}
                    </span>
                    <StatusBadge status={grievance.status} />
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        grievance.severity === 'critical'
                          ? 'bg-red-100 text-red-800'
                          : grievance.severity === 'high'
                          ? 'bg-orange-100 text-orange-800'
                          : grievance.severity === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {grievance.severity?.toUpperCase()}
                    </span>
                  </div>
                  <p className="font-medium text-gray-900 mb-1">
                    {grievance.summary}
                  </p>
                  <p className="text-sm text-gray-600">
                    By: {grievance.citizen_name || 'Unknown'} •{' '}
                    {grievance.department_name || 'Not assigned'}
                    {grievance.officer_name && ` → ${grievance.officer_name}`}
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Action Needed Section */}
      {newCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 bg-orange-50 border-l-4 border-orange-500 p-6 rounded-lg"
        >
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="w-6 h-6 text-orange-600" />
            <h3 className="text-lg font-bold text-orange-900">
              Action Required
            </h3>
          </div>
          <p className="text-orange-800 mb-4">
            You have <strong>{newCount} new grievance(s)</strong> that need to
            be assigned to officers.
          </p>
          <button
            onClick={() => navigate('/grievances?status=NEW')}
            className="px-4 py-2 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors"
          >
            Assign Now
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default AdminDashboard;
