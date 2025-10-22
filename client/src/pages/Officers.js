import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { motion } from 'framer-motion';
import {
  User,
  Plus,
  Edit,
  Trash2,
  Phone,
  Mail,
  Building2,
  CheckCircle,
  Clock,
  AlertCircle,
  Search
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { officersAPI, departmentsAPI } from '../services/api';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Button from '../components/UI/Button';
import Modal from '../components/UI/Modal';

const Officers = () => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [editingOfficer, setEditingOfficer] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [officerToDelete, setOfficerToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    department_id: '',
    whatsapp: '',
    email: '',
    active: true
  });

  // Fetch officers
  const { data: officersData, isLoading: officersLoading } = useQuery(
    ['officers', departmentFilter],
    () => officersAPI.getAll({
      department_id: departmentFilter || undefined,
      active_only: false
    })
  );

  // Fetch departments for dropdown
  const { data: departmentsData } = useQuery(
    'departments',
    () => departmentsAPI.getAll({ active_only: true })
  );

  const officers = officersData?.data?.officers || [];
  const departments = departmentsData?.data?.departments || [];

  // Filter officers based on search
  const filteredOfficers = officers.filter(officer =>
    officer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    officer.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    officer.department_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Create mutation
  const createMutation = useMutation(
    (data) => officersAPI.create(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('officers');
        setShowModal(false);
        resetForm();
      }
    }
  );

  // Update mutation
  const updateMutation = useMutation(
    ({ id, data }) => officersAPI.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('officers');
        setShowModal(false);
        resetForm();
      }
    }
  );

  // Delete mutation
  const deleteMutation = useMutation(
    (id) => officersAPI.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('officers');
        setShowDeleteModal(false);
        setOfficerToDelete(null);
      }
    }
  );

  const resetForm = () => {
    setFormData({
      name: '',
      role: '',
      department_id: '',
      whatsapp: '',
      email: '',
      active: true
    });
    setEditingOfficer(null);
  };

  const handleOpenModal = (officer = null) => {
    if (officer) {
      setEditingOfficer(officer);
      setFormData({
        name: officer.name || '',
        role: officer.role || '',
        department_id: officer.department_id || '',
        whatsapp: officer.whatsapp || '',
        email: officer.email || '',
        active: officer.active ?? true
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (editingOfficer) {
      updateMutation.mutate({
        id: editingOfficer.id,
        data: formData
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (officer) => {
    setOfficerToDelete(officer);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (officerToDelete) {
      deleteMutation.mutate(officerToDelete.id);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (officersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const isFormValid = formData.name && formData.department_id;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('officers.title')}</h1>
          <p className="text-gray-600 mt-1">Manage department officers and their assignments</p>
        </div>
        <Button
          icon={<Plus className="w-4 h-4" />}
          onClick={() => handleOpenModal()}
        >
          {t('officers.addOfficer')}
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search officers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Department Filter */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name_marathi || dept.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Officers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOfficers.map((officer, index) => (
          <motion.div
            key={officer.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${
              !officer.active ? 'opacity-60' : ''
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {officer.name}
                  </h3>
                  <p className="text-sm text-gray-500">{officer.role || 'Officer'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => handleOpenModal(officer)}
                  className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(officer)}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center text-sm text-gray-600">
                <Building2 className="w-4 h-4 mr-2 text-gray-400" />
                {officer.department_name_marathi || officer.department_name}
              </div>

              {officer.whatsapp && (
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="w-4 h-4 mr-2 text-gray-400" />
                  {officer.whatsapp}
                </div>
              )}

              {officer.email && (
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="w-4 h-4 mr-2 text-gray-400" />
                  {officer.email}
                </div>
              )}

              <div className="pt-3 border-t border-gray-200 mt-3">
                <OfficerStats officerId={officer.id} />
              </div>

              {!officer.active && (
                <div className="flex items-center text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Inactive
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {filteredOfficers.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            {searchTerm || departmentFilter ? 'No officers found matching your filters' : 'No officers found'}
          </p>
          {!searchTerm && !departmentFilter && (
            <Button
              className="mt-4"
              onClick={() => handleOpenModal()}
            >
              Add First Officer
            </Button>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingOfficer ? 'Edit Officer' : t('officers.addOfficer')}
        onConfirm={handleSubmit}
        confirmText={editingOfficer ? 'Update' : 'Create'}
        confirmLoading={createMutation.isLoading || updateMutation.isLoading}
        confirmDisabled={!isFormValid}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Officer full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role/Designation
            </label>
            <input
              type="text"
              value={formData.role}
              onChange={(e) => handleChange('role', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="e.g., Assistant Engineer, Clerk, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department *
            </label>
            <select
              value={formData.department_id}
              onChange={(e) => handleChange('department_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select Department</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name_marathi} ({dept.name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              WhatsApp Number
            </label>
            <input
              type="tel"
              value={formData.whatsapp}
              onChange={(e) => handleChange('whatsapp', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="+91XXXXXXXXXX"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="officer@example.com"
            />
          </div>

          {editingOfficer && (
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => handleChange('active', e.target.checked)}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">Active</span>
              </label>
            </div>
          )}
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setOfficerToDelete(null);
        }}
        title="Deactivate Officer"
        onConfirm={confirmDelete}
        confirmText="Deactivate"
        confirmLoading={deleteMutation.isLoading}
        confirmVariant="danger"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to deactivate{' '}
            <strong>{officerToDelete?.name}</strong>?
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              Note: The officer will be marked as inactive and will not be deleted permanently.
              You can reactivate them later.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// Officer Stats Component
const OfficerStats = ({ officerId }) => {
  const { data, isLoading } = useQuery(
    ['officer-stats', officerId],
    () => officersAPI.getStats(officerId, { days: 30 }),
    {
      enabled: !!officerId
    }
  );

  if (isLoading) {
    return <div className="text-xs text-gray-400">Loading stats...</div>;
  }

  const stats = data?.data?.stats || {};

  return (
    <div className="grid grid-cols-3 gap-2 text-center">
      <div>
        <div className="text-lg font-semibold text-gray-900">
          {stats.total_assigned || 0}
        </div>
        <div className="text-xs text-gray-500">Assigned</div>
      </div>
      <div>
        <div className="text-lg font-semibold text-green-600 flex items-center justify-center">
          <CheckCircle className="w-4 h-4 mr-1" />
          {stats.resolved || 0}
        </div>
        <div className="text-xs text-gray-500">Resolved</div>
      </div>
      <div>
        <div className="text-lg font-semibold text-yellow-600 flex items-center justify-center">
          <Clock className="w-4 h-4 mr-1" />
          {stats.in_progress || 0}
        </div>
        <div className="text-xs text-gray-500">Pending</div>
      </div>
    </div>
  );
};

export default Officers;
