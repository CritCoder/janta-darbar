import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { motion } from 'framer-motion';
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { departmentsAPI } from '../services/api';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Button from '../components/UI/Button';
import Modal from '../components/UI/Modal';

const Departments = () => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    name_marathi: '',
    name_hindi: '',
    district: '',
    contact_whatsapp: '',
    contact_email: '',
    escalation_contact: '',
    active: true
  });

  // Fetch departments
  const { data, isLoading } = useQuery(
    'departments',
    () => departmentsAPI.getAll({ active_only: false })
  );

  const departments = data?.data?.departments || [];

  // Create mutation
  const createMutation = useMutation(
    (data) => departmentsAPI.create(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('departments');
        setShowModal(false);
        resetForm();
      }
    }
  );

  // Update mutation
  const updateMutation = useMutation(
    ({ id, data }) => departmentsAPI.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('departments');
        setShowModal(false);
        resetForm();
      }
    }
  );

  // Delete mutation
  const deleteMutation = useMutation(
    (id) => departmentsAPI.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('departments');
        setShowDeleteModal(false);
        setDepartmentToDelete(null);
      }
    }
  );

  const resetForm = () => {
    setFormData({
      name: '',
      name_marathi: '',
      name_hindi: '',
      district: '',
      contact_whatsapp: '',
      contact_email: '',
      escalation_contact: '',
      active: true
    });
    setEditingDepartment(null);
  };

  const handleOpenModal = (department = null) => {
    if (department) {
      setEditingDepartment(department);
      setFormData({
        name: department.name || '',
        name_marathi: department.name_marathi || '',
        name_hindi: department.name_hindi || '',
        district: department.district || '',
        contact_whatsapp: department.contact_whatsapp || '',
        contact_email: department.contact_email || '',
        escalation_contact: department.escalation_contact || '',
        active: department.active ?? true
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (editingDepartment) {
      updateMutation.mutate({
        id: editingDepartment.id,
        data: formData
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (department) => {
    setDepartmentToDelete(department);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (departmentToDelete) {
      deleteMutation.mutate(departmentToDelete.id);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const isFormValid = formData.name && formData.name_marathi && formData.district;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('departments.title')}</h1>
          <p className="text-gray-600 mt-1">Manage government departments and their contacts</p>
        </div>
        <Button
          icon={<Plus className="w-4 h-4" />}
          onClick={() => handleOpenModal()}
        >
          {t('departments.addDepartment')}
        </Button>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((department, index) => (
          <motion.div
            key={department.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${
              !department.active ? 'opacity-60' : ''
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {department.name_marathi}
                  </h3>
                  <p className="text-sm text-gray-500">{department.name}</p>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => handleOpenModal(department)}
                  className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(department)}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                {department.district}
              </div>

              {department.contact_whatsapp && (
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="w-4 h-4 mr-2 text-gray-400" />
                  {department.contact_whatsapp}
                </div>
              )}

              {department.contact_email && (
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="w-4 h-4 mr-2 text-gray-400" />
                  {department.contact_email}
                </div>
              )}

              <div className="pt-3 border-t border-gray-200 mt-3">
                <DepartmentStats departmentId={department.id} />
              </div>

              {!department.active && (
                <div className="flex items-center text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Inactive
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {departments.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No departments found</p>
          <Button
            className="mt-4"
            onClick={() => handleOpenModal()}
          >
            Add First Department
          </Button>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingDepartment ? 'Edit Department' : t('departments.addDepartment')}
        onConfirm={handleSubmit}
        confirmText={editingDepartment ? 'Update' : 'Create'}
        confirmLoading={createMutation.isLoading || updateMutation.isLoading}
        confirmDisabled={!isFormValid}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                English Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="e.g., Public Works Department"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                मराठी नाव *
              </label>
              <input
                type="text"
                value={formData.name_marathi}
                onChange={(e) => handleChange('name_marathi', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="उदा., सार्वजनिक बांधकाम विभाग"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                हिंदी नाम
              </label>
              <input
                type="text"
                value={formData.name_hindi}
                onChange={(e) => handleChange('name_hindi', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="उदा., लोक निर्माण विभाग"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                District *
              </label>
              <input
                type="text"
                value={formData.district}
                onChange={(e) => handleChange('district', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="e.g., Mumbai, Pune, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                WhatsApp Contact
              </label>
              <input
                type="tel"
                value={formData.contact_whatsapp}
                onChange={(e) => handleChange('contact_whatsapp', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="+91XXXXXXXXXX"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Contact
              </label>
              <input
                type="email"
                value={formData.contact_email}
                onChange={(e) => handleChange('contact_email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="dept@example.com"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Escalation Contact
              </label>
              <input
                type="tel"
                value={formData.escalation_contact}
                onChange={(e) => handleChange('escalation_contact', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="+91XXXXXXXXXX"
              />
            </div>

            {editingDepartment && (
              <div className="md:col-span-2">
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
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDepartmentToDelete(null);
        }}
        title="Deactivate Department"
        onConfirm={confirmDelete}
        confirmText="Deactivate"
        confirmLoading={deleteMutation.isLoading}
        confirmVariant="danger"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to deactivate{' '}
            <strong>{departmentToDelete?.name_marathi}</strong>?
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              Note: The department will be marked as inactive and will not be deleted permanently.
              You can reactivate it later.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// Department Stats Component
const DepartmentStats = ({ departmentId }) => {
  const { data, isLoading } = useQuery(
    ['department-stats', departmentId],
    () => departmentsAPI.getStats(departmentId, { days: 30 }),
    {
      enabled: !!departmentId
    }
  );

  if (isLoading) {
    return <div className="text-xs text-gray-400">Loading stats...</div>;
  }

  const stats = data?.data?.stats || {};
  const resolutionRate = stats.total_grievances > 0
    ? Math.round((stats.resolved_grievances / stats.total_grievances) * 100)
    : 0;

  return (
    <div className="grid grid-cols-3 gap-2 text-center">
      <div>
        <div className="text-lg font-semibold text-gray-900">
          {stats.total_grievances || 0}
        </div>
        <div className="text-xs text-gray-500">Total</div>
      </div>
      <div>
        <div className="text-lg font-semibold text-green-600 flex items-center justify-center">
          <CheckCircle className="w-4 h-4 mr-1" />
          {resolutionRate}%
        </div>
        <div className="text-xs text-gray-500">Resolved</div>
      </div>
      <div>
        <div className="text-lg font-semibold text-blue-600">
          {stats.avg_resolution_hours ? Math.round(stats.avg_resolution_hours) : '-'}h
        </div>
        <div className="text-xs text-gray-500">Avg Time</div>
      </div>
    </div>
  );
};

export default Departments;
