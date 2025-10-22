import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { motion } from 'framer-motion';
import {
  Play,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Phone,
  MapPin,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Zap
} from 'lucide-react';
import axios from 'axios';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import StatusBadge from '../components/UI/StatusBadge';
import Modal from '../components/UI/Modal';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const OfficerDashboard = () => {
  const queryClient = useQueryClient();
  const [selectedGrievance, setSelectedGrievance] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [notes, setNotes] = useState('');

  // Fetch my assignments
  const { data, isLoading, error } = useQuery(
    'myAssignments',
    async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/grievances/my-assignments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    {
      refetchInterval: 15000, // Refetch every 15 seconds
    }
  );

  // Quick update mutation
  const updateMutation = useMutation(
    async ({ id, action, notes }) => {
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `${API_BASE_URL}/grievances/${id}/quick-update`,
        { action, notes },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('myAssignments');
        setShowDetailModal(false);
        setNotes('');
      },
    }
  );

  const handleQuickAction = (grievance, action) => {
    setSelectedGrievance(grievance);
    if (action === 'start') {
      // Start immediately without modal
      updateMutation.mutate({ id: grievance.id, action: 'start', notes: '' });
    } else {
      // Show modal for resolve/reject
      setShowDetailModal(true);
    }
  };

  const handleSubmitAction = (action) => {
    if (!selectedGrievance) return;
    updateMutation.mutate({
      id: selectedGrievance.id,
      action,
      notes,
    });
  };

  const grievances = data?.grievances || [];
  const stats = data?.stats || {};
  const officer = data?.officer || {};

  const severityColors = {
    low: 'border-green-500',
    medium: 'border-yellow-500',
    high: 'border-orange-500',
    critical: 'border-red-500',
  };

  const severityBadgeColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
  };

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
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">Error loading assignments</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Zap className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">
            Officer Dashboard
          </h1>
        </div>
        <p className="text-gray-600">
          Welcome, <strong>{officer.name}</strong> - Your assigned grievances
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm font-medium">Total Assigned</span>
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {stats.total_assigned || 0}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm font-medium">In Progress</span>
            <Clock className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-3xl font-bold text-yellow-600">
            {stats.in_progress || 0}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm font-medium">Resolved</span>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-600">
            {stats.resolved || 0}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm font-medium">Avg Time</span>
            <Calendar className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-purple-600">
            {stats.avg_resolution_hours
              ? Math.round(stats.avg_resolution_hours) + 'h'
              : 'N/A'}
          </p>
        </div>
      </div>

      {/* Grievances List */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          My Assignments ({grievances.length})
        </h2>

        {grievances.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <p className="text-gray-600 text-lg font-medium">
              No assignments right now!
            </p>
            <p className="text-gray-500 text-sm mt-2">
              You're all caught up. Great job! 🎉
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {grievances.map((grievance) => (
              <motion.div
                key={grievance.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`border-l-4 ${
                  severityColors[grievance.severity] || severityColors.medium
                } bg-gray-50 rounded-lg p-6 hover:shadow-md transition-all`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {grievance.summary}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          severityBadgeColors[grievance.severity] ||
                          severityBadgeColors.medium
                        }`}
                      >
                        {grievance.severity?.toUpperCase()}
                      </span>
                      <StatusBadge status={grievance.status} />
                    </div>

                    <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                      {grievance.description}
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <User className="w-4 h-4" />
                        <span>{grievance.citizen_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{grievance.citizen_phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{grievance.pincode || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>
                          {Math.round(grievance.hours_pending || 0)}h pending
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                  {grievance.status === 'ASSIGNED' && (
                    <button
                      onClick={() => handleQuickAction(grievance, 'start')}
                      disabled={updateMutation.isLoading}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Play className="w-4 h-4" />
                      Start Work
                    </button>
                  )}

                  {grievance.status === 'IN_PROGRESS' && (
                    <>
                      <button
                        onClick={() => {
                          setSelectedGrievance(grievance);
                          setShowDetailModal(true);
                        }}
                        disabled={updateMutation.isLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Mark Resolved
                      </button>
                      <button
                        onClick={() => {
                          setSelectedGrievance(grievance);
                          setShowDetailModal(true);
                        }}
                        disabled={updateMutation.isLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </>
                  )}

                  {grievance.status === 'RESOLVED' && (
                    <button
                      onClick={() => handleQuickAction(grievance, 'close')}
                      disabled={updateMutation.isLoading}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Close
                    </button>
                  )}

                  <span className="ml-auto text-sm text-gray-500">
                    Ticket: {grievance.ticket_id}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Action Modal */}
      {showDetailModal && selectedGrievance && (
        <Modal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setNotes('');
          }}
          title="Add Notes & Update Status"
          size="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grievance
              </label>
              <p className="text-gray-900 font-medium">
                {selectedGrievance.summary}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add any notes or comments about this grievance..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              {selectedGrievance.status === 'IN_PROGRESS' && (
                <>
                  <button
                    onClick={() => handleSubmitAction('resolve')}
                    disabled={updateMutation.isLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {updateMutation.isLoading ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Mark Resolved
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleSubmitAction('reject')}
                    disabled={updateMutation.isLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default OfficerDashboard;
