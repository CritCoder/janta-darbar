import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { motion } from 'framer-motion';
import {
  User,
  Globe,
  Bell,
  Shield,
  Database,
  Save,
  CheckCircle
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Button from '../components/UI/Button';

const Settings = () => {
  const { t, language, changeLanguage } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: t('settings.profile'), icon: User },
    { id: 'language', label: t('settings.language'), icon: Globe },
    { id: 'notifications', label: t('settings.notifications'), icon: Bell },
    { id: 'security', label: t('settings.security'), icon: Shield },
    { id: 'about', label: t('settings.about'), icon: Database }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('settings.title')}</h1>
        <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
        <div className="flex space-x-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'profile' && <ProfileTab user={user} />}
      {activeTab === 'language' && <LanguageTab currentLanguage={language} changeLanguage={changeLanguage} />}
      {activeTab === 'notifications' && <NotificationsTab />}
      {activeTab === 'security' && <SecurityTab />}
      {activeTab === 'about' && <AboutTab />}
    </div>
  );
};

// Profile Tab
const ProfileTab = ({ user }) => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    role: user?.role || 'citizen'
  });
  const [showSuccess, setShowSuccess] = useState(false);

  const updateProfileMutation = useMutation(
    (data) => authAPI.updateProfile(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('profile');
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    }
  );

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>

      {showSuccess && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center text-green-800">
          <CheckCircle className="w-5 h-5 mr-2" />
          Profile updated successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            disabled
          />
          <p className="text-xs text-gray-500 mt-1">Phone number cannot be changed</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email (Optional)
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Role
          </label>
          <input
            type="text"
            value={formData.role}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
            disabled
          />
        </div>

        <Button
          type="submit"
          icon={<Save className="w-4 h-4" />}
          loading={updateProfileMutation.isLoading}
        >
          {t('common.save')}
        </Button>
      </form>
    </motion.div>
  );
};

// Language Tab
const LanguageTab = ({ currentLanguage, changeLanguage }) => {
  const { t } = useLanguage();
  const [showSuccess, setShowSuccess] = useState(false);

  const languages = [
    { code: 'mr', name: 'मराठी', englishName: 'Marathi' },
    { code: 'hi', name: 'हिंदी', englishName: 'Hindi' },
    { code: 'en', name: 'English', englishName: 'English' }
  ];

  const handleLanguageChange = (langCode) => {
    changeLanguage(langCode);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Language Preferences</h3>

      {showSuccess && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center text-green-800">
          <CheckCircle className="w-5 h-5 mr-2" />
          Language changed successfully!
        </div>
      )}

      <div className="space-y-3">
        {languages.map((lang) => (
          <div
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              currentLanguage === lang.code
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">{lang.name}</p>
                <p className="text-sm text-gray-500">{lang.englishName}</p>
              </div>
              {currentLanguage === lang.code && (
                <CheckCircle className="w-5 h-5 text-primary-600" />
              )}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// Notifications Tab
const NotificationsTab = () => {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    whatsappNotifications: true,
    statusUpdates: true,
    newAssignments: true,
    slaBreaches: true
  });

  const handleToggle = (key) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Settings</h3>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium text-gray-900">Email Notifications</p>
            <p className="text-sm text-gray-500">Receive updates via email</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={notifications.emailNotifications}
              onChange={() => handleToggle('emailNotifications')}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium text-gray-900">WhatsApp Notifications</p>
            <p className="text-sm text-gray-500">Receive updates via WhatsApp</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={notifications.whatsappNotifications}
              onChange={() => handleToggle('whatsappNotifications')}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium text-gray-900">Status Updates</p>
            <p className="text-sm text-gray-500">Notify on grievance status changes</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={notifications.statusUpdates}
              onChange={() => handleToggle('statusUpdates')}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium text-gray-900">New Assignments</p>
            <p className="text-sm text-gray-500">Notify when grievances are assigned</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={notifications.newAssignments}
              onChange={() => handleToggle('newAssignments')}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium text-gray-900">SLA Breach Alerts</p>
            <p className="text-sm text-gray-500">Alert on service level violations</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={notifications.slaBreaches}
              onChange={() => handleToggle('slaBreaches')}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>
      </div>

      <div className="mt-6">
        <Button icon={<Save className="w-4 h-4" />}>
          {t('common.save')} Preferences
        </Button>
      </div>
    </motion.div>
  );
};

// Security Tab
const SecurityTab = () => {
  const { t } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h3>

      <div className="space-y-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="font-medium text-gray-900 mb-2">Two-Factor Authentication</p>
          <p className="text-sm text-gray-600 mb-3">Add an extra layer of security to your account</p>
          <Button variant="secondary">Enable 2FA</Button>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="font-medium text-gray-900 mb-2">Active Sessions</p>
          <p className="text-sm text-gray-600 mb-3">Manage your active login sessions</p>
          <Button variant="secondary">View Sessions</Button>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="font-medium text-gray-900 mb-2">Change Password</p>
          <p className="text-sm text-gray-600 mb-3">Update your account password</p>
          <Button variant="secondary">Change Password</Button>
        </div>
      </div>
    </motion.div>
  );
};

// About Tab
const AboutTab = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-4">About Janta Darbar</h3>

      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600">Version</p>
          <p className="text-lg font-semibold text-gray-900">1.0.0</p>
        </div>

        <div>
          <p className="text-sm text-gray-600">Project Lead</p>
          <p className="text-lg font-semibold text-gray-900">Shambhuraje Desai</p>
        </div>

        <div>
          <p className="text-sm text-gray-600">Description</p>
          <p className="text-gray-900">
            जनता दरबार is a comprehensive grievance management system for Maharashtra State,
            empowering citizens through technology and ensuring efficient resolution of complaints.
          </p>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-2">Technology Stack</p>
          <div className="flex flex-wrap gap-2">
            {['React', 'Node.js', 'PostgreSQL', 'Express', 'Tailwind CSS'].map((tech) => (
              <span
                key={tech}
                className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm font-medium"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-2">Support</p>
          <p className="text-gray-900">support@jantadarbar.gov.in</p>
        </div>
      </div>
    </motion.div>
  );
};

export default Settings;
