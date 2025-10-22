import React from 'react';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  MapPin,
  Calendar,
  User
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import StatusBadge from '../../components/UI/StatusBadge';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const CitizenDashboard = () => {
  const { user } = useAuth();

  // Fetch only this citizen's grievances
  const { data, isLoading, error } = useQuery(
    ['citizenGrievances', user?.id],
    async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/grievances`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { citizen_id: user?.id }
      });
      return response.data;
    },
    {
      enabled: !!user?.id,
      refetchInterval: 30000
    }
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
        <p className="text-gray-600">Error loading your grievances</p>
      </div>
    );
  }

  const grievances = data?.grievances || [];

  const statusCounts = {
    new: grievances.filter(g => g.status === 'NEW').length,
    assigned: grievances.filter(g => g.status === 'ASSIGNED').length,
    inProgress: grievances.filter(g => g.status === 'IN_PROGRESS').length,
    resolved: grievances.filter(g => g.status === 'RESOLVED' || g.status === 'CLOSED').length
  };

  const statCards = [
    {
      title: 'Total Complaints',
      value: grievances.length,
      icon: FileText,
      color: 'blue',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'In Progress',
      value: statusCounts.inProgress + statusCounts.assigned,
      icon: Clock,
      color: 'yellow',
      bgColor: 'bg-yellow-100'
    },
    {
      title: 'Resolved',
      value: statusCounts.resolved,
      icon: CheckCircle,
      color: 'green',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Pending',
      value: statusCounts.new,
      icon: AlertCircle,
      color: 'orange',
      bgColor: 'bg-orange-100'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'NEW':
        return 'border-gray-400';
      case 'ASSIGNED':
        return 'border-blue-400';
      case 'IN_PROGRESS':
        return 'border-yellow-400';
      case 'RESOLVED':
      case 'CLOSED':
        return 'border-green-400';
      case 'REJECTED':
        return 'border-red-400';
      default:
        return 'border-gray-400';
    }
  };

  const getSeverityBadge = (severity) => {
    const colors = {
      critical: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    return colors[severity] || colors.medium;
  };

  return (
    <div>
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome, {user?.name}! 👋
        </h1>
        <p className="text-gray-600">
          Track your grievances and see their status
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`${stat.bgColor} rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow`}
          >
            <div className="flex items-center justify-between mb-4">
              <stat.icon className={`w-8 h-8 text-${stat.color}-600`} />
            </div>
            <h3 className="text-sm font-medium text-gray-700 mb-1">
              {stat.title}
            </h3>
            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* My Grievances */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            My Grievances ({grievances.length})
          </h2>
        </div>

        {grievances.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Complaints Yet
            </h3>
            <p className="text-gray-500 mb-6">
              You haven't filed any complaints. Contact your local admin office to file a complaint.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {grievances.map((grievance, index) => (
              <motion.div
                key={grievance.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`border-l-4 ${getStatusColor(
                  grievance.status
                )} bg-gray-50 rounded-lg p-6 hover:shadow-md transition-shadow`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-sm text-gray-500 font-medium">
                        {grievance.ticket_id}
                      </span>
                      <StatusBadge status={grievance.status} />
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${getSeverityBadge(
                          grievance.severity
                        )}`}
                      >
                        {grievance.severity?.toUpperCase()}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {grievance.summary}
                    </h3>
                    <p className="text-gray-700 mb-3">
                      {grievance.description}
                    </p>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-gray-500 text-xs">Filed on</p>
                      <p className="text-gray-900 font-medium">
                        {new Date(grievance.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-gray-500 text-xs">Location</p>
                      <p className="text-gray-900 font-medium">
                        {grievance.pincode || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-gray-500 text-xs">Department</p>
                      <p className="text-gray-900 font-medium">
                        {grievance.department_name_marathi ||
                          grievance.department_name ||
                          'Not assigned'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-gray-500 text-xs">Assigned to</p>
                      <p className="text-gray-900 font-medium">
                        {grievance.officer_name || 'Pending'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status Message */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  {grievance.status === 'NEW' && (
                    <p className="text-sm text-gray-600">
                      ⏳ Your complaint is being reviewed by the admin team.
                    </p>
                  )}
                  {grievance.status === 'ASSIGNED' && (
                    <p className="text-sm text-blue-600">
                      ✅ Assigned to {grievance.officer_name}. Work will begin
                      soon.
                    </p>
                  )}
                  {grievance.status === 'IN_PROGRESS' && (
                    <p className="text-sm text-yellow-600">
                      🔧 Officer is currently working on resolving your
                      complaint.
                    </p>
                  )}
                  {(grievance.status === 'RESOLVED' ||
                    grievance.status === 'CLOSED') && (
                    <p className="text-sm text-green-600">
                      ✅ Your complaint has been resolved! Thank you for your
                      patience.
                    </p>
                  )}
                  {grievance.status === 'REJECTED' && (
                    <p className="text-sm text-red-600">
                      ❌ This complaint could not be processed. Please contact
                      the admin office.
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Help Section */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-blue-900 mb-2">
          Need Help?
        </h3>
        <p className="text-blue-800 mb-4">
          To file a new complaint or get updates, please visit your local
          admin office. They will help you submit your grievance.
        </p>
        <div className="flex items-center gap-4 text-sm text-blue-700">
          <div>
            <span className="font-semibold">Phone:</span> {user?.phone}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitizenDashboard;
