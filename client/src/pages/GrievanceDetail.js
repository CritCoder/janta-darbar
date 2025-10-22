import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  User,
  Phone,
  Mail,
  Building2,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Edit,
  Send,
  Download,
  Image as ImageIcon,
  Video,
  File
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { grievancesAPI, officersAPI, whatsappAPI, lettersAPI } from '../services/api';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import StatusBadge from '../components/UI/StatusBadge';
import Button from '../components/UI/Button';
import Modal from '../components/UI/Modal';

const GrievanceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [selectedOfficer, setSelectedOfficer] = useState('');

  // Fetch grievance details
  const { data: grievanceData, isLoading: grievanceLoading } = useQuery(
    ['grievance', id],
    () => grievancesAPI.getById(id)
  );

  // Fetch timeline
  const { data: timelineData } = useQuery(
    ['grievance-timeline', id],
    () => grievancesAPI.getTimeline(id)
  );

  // Fetch media
  const { data: mediaData } = useQuery(
    ['grievance-media', id],
    () => grievancesAPI.getMedia(id)
  );

  // Fetch officers for assignment
  const { data: officersData } = useQuery(
    'officers',
    () => officersAPI.getAll({ active_only: true })
  );

  const grievance = grievanceData?.data?.grievance || {};
  const timeline = timelineData?.data?.timeline || [];
  const media = mediaData?.data?.media || [];
  const officers = officersData?.data?.officers || [];

  // Update status mutation
  const updateStatusMutation = useMutation(
    (data) => grievancesAPI.updateStatus(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['grievance', id]);
        queryClient.invalidateQueries(['grievance-timeline', id]);
        setShowStatusModal(false);
        setNewStatus('');
        setStatusNote('');
      }
    }
  );

  // Assign officer mutation
  const assignOfficerMutation = useMutation(
    (data) => grievancesAPI.assignOfficer(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['grievance', id]);
        queryClient.invalidateQueries(['grievance-timeline', id]);
        setShowAssignModal(false);
        setSelectedOfficer('');
      }
    }
  );

  // Send WhatsApp mutation
  const sendWhatsAppMutation = useMutation(
    (data) => whatsappAPI.sendStatusUpdate(data)
  );

  // Generate letter mutation
  const generateLetterMutation = useMutation(
    (data) => lettersAPI.create(data),
    {
      onSuccess: (response) => {
        const letterId = response.data.letter.id;
        lettersAPI.download(letterId).then((blob) => {
          const url = window.URL.createObjectURL(new Blob([blob.data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `letter-${grievance.ticket_id}.pdf`);
          document.body.appendChild(link);
          link.click();
          link.remove();
        });
      }
    }
  );

  const handleUpdateStatus = () => {
    updateStatusMutation.mutate({
      status: newStatus,
      note: statusNote
    });
  };

  const handleAssignOfficer = () => {
    assignOfficerMutation.mutate({
      officer_id: selectedOfficer
    });
  };

  const handleSendWhatsApp = () => {
    sendWhatsAppMutation.mutate({
      grievance_id: id,
      phone: grievance.citizen_phone,
      type: 'status_update'
    });
  };

  const handleGenerateLetter = () => {
    generateLetterMutation.mutate({
      grievance_id: id,
      type: 'official'
    });
  };

  if (grievanceLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const statusOptions = [
    'NEW', 'INTAKE', 'APPROVED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/grievances')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {grievance.ticket_id}
            </h1>
            <p className="text-gray-600 mt-1">{grievance.summary}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            icon={<Edit className="w-4 h-4" />}
            onClick={() => setShowStatusModal(true)}
          >
            Update Status
          </Button>
          <Button
            variant="secondary"
            icon={<User className="w-4 h-4" />}
            onClick={() => setShowAssignModal(true)}
          >
            Assign Officer
          </Button>
          <Button
            variant="secondary"
            icon={<Send className="w-4 h-4" />}
            onClick={handleSendWhatsApp}
            loading={sendWhatsAppMutation.isLoading}
          >
            Send WhatsApp
          </Button>
          <Button
            variant="secondary"
            icon={<Download className="w-4 h-4" />}
            onClick={handleGenerateLetter}
            loading={generateLetterMutation.isLoading}
          >
            Generate Letter
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Details Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Grievance Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Description</label>
                <p className="text-gray-900 mt-1">{grievance.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Category</label>
                  <p className="text-gray-900 mt-1">{t(`category.${grievance.category}`)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Severity</label>
                  <div className="mt-1">
                    <StatusBadge severity={grievance.severity} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">
                    <StatusBadge status={grievance.status} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Pincode</label>
                  <p className="text-gray-900 mt-1">{grievance.pincode}</p>
                </div>
              </div>

              {grievance.location && (
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    Location
                  </label>
                  <p className="text-gray-900 mt-1">{grievance.location}</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Media */}
          {media.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <ImageIcon className="w-5 h-5 mr-2" />
                Attachments
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {media.map((item, index) => (
                  <div key={index} className="relative group">
                    {item.type === 'image' ? (
                      <img
                        src={item.url}
                        alt={`Attachment ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    ) : item.type === 'video' ? (
                      <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Video className="w-8 h-8 text-gray-400" />
                      </div>
                    ) : (
                      <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                        <File className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white text-sm"
                      >
                        View
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Timeline
            </h2>
            <div className="space-y-4">
              {timeline.map((event, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    event.event_type === 'status_change' ? 'bg-blue-100' :
                    event.event_type === 'assignment' ? 'bg-green-100' :
                    'bg-gray-100'
                  }`}>
                    {event.event_type === 'status_change' ? (
                      <CheckCircle className="w-4 h-4 text-blue-600" />
                    ) : event.event_type === 'assignment' ? (
                      <User className="w-4 h-4 text-green-600" />
                    ) : (
                      <FileText className="w-4 h-4 text-gray-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{event.title}</p>
                    <p className="text-sm text-gray-600">{event.description}</p>
                    {event.note && (
                      <p className="text-sm text-gray-500 mt-1 italic">{event.note}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(event.created_at).toLocaleString('mr-IN')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Citizen Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Citizen Information
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Name</label>
                <p className="text-gray-900 mt-1">{grievance.citizen_name || 'N/A'}</p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center">
                    <Phone className="w-4 h-4 mr-1" />
                    Phone
                  </label>
                  <p className="text-gray-900 mt-1">{grievance.citizen_phone}</p>
                </div>
              </div>
              {grievance.citizen_email && (
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center">
                    <Mail className="w-4 h-4 mr-1" />
                    Email
                  </label>
                  <p className="text-gray-900 mt-1">{grievance.citizen_email}</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Department Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Building2 className="w-5 h-5 mr-2" />
              Department
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Name</label>
                <p className="text-gray-900 mt-1">
                  {grievance.department_name_marathi || grievance.department_name}
                </p>
              </div>
              {grievance.assigned_officer_name && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Assigned Officer</label>
                  <p className="text-gray-900 mt-1">{grievance.assigned_officer_name}</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Dates */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Dates
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Created</label>
                <p className="text-gray-900 mt-1">
                  {new Date(grievance.created_at).toLocaleDateString('mr-IN')}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Last Updated</label>
                <p className="text-gray-900 mt-1">
                  {new Date(grievance.updated_at).toLocaleDateString('mr-IN')}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Status Update Modal */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title="Update Status"
        onConfirm={handleUpdateStatus}
        confirmText="Update Status"
        confirmLoading={updateStatusMutation.isLoading}
        confirmDisabled={!newStatus}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Status
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select Status</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {t(`status.${status.toLowerCase()}`)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Note (Optional)
            </label>
            <textarea
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Add any notes about this status change..."
            />
          </div>
        </div>
      </Modal>

      {/* Assign Officer Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title="Assign Officer"
        onConfirm={handleAssignOfficer}
        confirmText="Assign Officer"
        confirmLoading={assignOfficerMutation.isLoading}
        confirmDisabled={!selectedOfficer}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Officer
            </label>
            <select
              value={selectedOfficer}
              onChange={(e) => setSelectedOfficer(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select an officer</option>
              {officers.map((officer) => (
                <option key={officer.id} value={officer.id}>
                  {officer.name} - {officer.role} ({officer.department_name})
                </option>
              ))}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default GrievanceDetail;
