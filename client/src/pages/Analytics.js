import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  MapPin,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { analyticsAPI } from '../services/api';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Button from '../components/UI/Button';
import StatusBadge from '../components/UI/StatusBadge';

const Analytics = () => {
  const { t } = useLanguage();
  const [period, setPeriod] = useState('30');
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch performance data
  const { data: performanceData, isLoading: performanceLoading } = useQuery(
    ['analytics-performance', period],
    () => analyticsAPI.getPerformance({ days: period })
  );

  // Fetch heatmap data
  const { data: heatmapData, isLoading: heatmapLoading } = useQuery(
    ['analytics-heatmap', period],
    () => analyticsAPI.getHeatmap({ days: period })
  );

  // Fetch impact stories
  const { data: impactData } = useQuery(
    'analytics-impact-stories',
    () => analyticsAPI.getImpactStories({ limit: 5 })
  );

  const metrics = performanceData?.data?.metrics || {};
  const heatmapLocations = heatmapData?.data?.heatmap_data || [];
  const impactStories = impactData?.data?.impact_stories || [];

  const handleExport = async (format = 'json') => {
    try {
      const response = await analyticsAPI.exportData({ format });

      if (format === 'csv') {
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `grievances-${new Date().toISOString()}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `grievances-${new Date().toISOString()}.json`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const tabs = [
    { id: 'overview', label: t('analytics.overview'), icon: BarChart3 },
    { id: 'performance', label: t('analytics.performance'), icon: TrendingUp },
    { id: 'heatmap', label: t('analytics.heatmap'), icon: MapPin },
    { id: 'impact', label: t('analytics.impactStories'), icon: FileText }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('analytics.title')}</h1>
          <p className="text-gray-600 mt-1">Comprehensive analytics and insights</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="7">{t('analytics.last7Days')}</option>
            <option value="30">{t('analytics.last30Days')}</option>
            <option value="90">{t('analytics.last90Days')}</option>
          </select>
          <Button
            variant="secondary"
            icon={<Download className="w-4 h-4" />}
            onClick={() => handleExport('csv')}
          >
            {t('analytics.exportData')}
          </Button>
        </div>
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
      {activeTab === 'overview' && (
        <OverviewTab metrics={metrics} loading={performanceLoading} period={period} />
      )}

      {activeTab === 'performance' && (
        <PerformanceTab metrics={metrics} loading={performanceLoading} period={period} />
      )}

      {activeTab === 'heatmap' && (
        <HeatmapTab locations={heatmapLocations} loading={heatmapLoading} period={period} />
      )}

      {activeTab === 'impact' && (
        <ImpactTab stories={impactStories} />
      )}
    </div>
  );
};

// Overview Tab
const OverviewTab = ({ metrics, loading, period }) => {
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Grievances',
      value: metrics.total_grievances || 0,
      icon: FileText,
      color: 'blue',
      description: `Last ${period} days`
    },
    {
      title: 'Resolved',
      value: metrics.resolved_grievances || 0,
      icon: CheckCircle,
      color: 'green',
      percentage: metrics.resolution_rate || 0
    },
    {
      title: 'Pending',
      value: metrics.in_progress_grievances || 0,
      icon: Clock,
      color: 'yellow',
      description: 'In progress'
    },
    {
      title: 'SLA Breaches',
      value: metrics.sla_breaches || 0,
      icon: AlertTriangle,
      color: 'red',
      percentage: metrics.sla_compliance || 100
    }
  ];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const colorClasses = {
            blue: 'bg-blue-500',
            green: 'bg-green-500',
            yellow: 'bg-yellow-500',
            red: 'bg-red-500'
          };

          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  {stat.percentage !== undefined && (
                    <p className="text-sm text-gray-500 mt-1">{stat.percentage}%</p>
                  )}
                  {stat.description && (
                    <p className="text-sm text-gray-500 mt-1">{stat.description}</p>
                  )}
                </div>
                <div className={`p-3 rounded-lg ${colorClasses[stat.color]} text-white`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Additional Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600">Resolution Rate</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {metrics.resolution_rate || 0}%
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{ width: `${metrics.resolution_rate || 0}%` }}
              />
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600">SLA Compliance</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {metrics.sla_compliance || 0}%
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${metrics.sla_compliance || 0}%` }}
              />
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600">Avg Resolution Time</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">
              {metrics.avg_resolution_hours ? Math.round(metrics.avg_resolution_hours) : 0}h
            </p>
            <p className="text-sm text-gray-500 mt-1">Average hours to resolve</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Performance Tab
const PerformanceTab = ({ metrics, loading, period }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-600">Total Grievances</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.total_grievances || 0}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-500" />
          </div>
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-green-900">{metrics.resolved_grievances || 0}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-yellow-900">{metrics.in_progress_grievances || 0}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-600">SLA Breaches</p>
              <p className="text-2xl font-bold text-red-900">{metrics.sla_breaches || 0}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Heatmap Tab
const HeatmapTab = ({ locations, loading, period }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <MapPin className="w-5 h-5 mr-2" />
          Grievance Distribution by Location
        </h3>
        {locations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pincode
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Grievances
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resolved
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Severity
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {locations.map((location, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {location.pincode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {location.grievance_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                        {location.resolved_count}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        location.avg_severity_score >= 3.5 ? 'bg-red-100 text-red-800' :
                        location.avg_severity_score >= 2.5 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {location.avg_severity_score?.toFixed(1) || '-'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No location data available</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

// Impact Tab
const ImpactTab = ({ stories }) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          {t('analytics.impactStories')}
        </h3>
        {stories.length > 0 ? (
          <div className="space-y-6">
            {stories.map((story, index) => (
              <motion.div
                key={story.ticket_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">{story.ticket_id}</h4>
                    <p className="text-sm text-gray-600 mt-1">{story.summary}</p>
                  </div>
                  <StatusBadge status="CLOSED" />
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Category</p>
                    <p className="text-gray-900 font-medium">{t(`category.${story.category}`)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Department</p>
                    <p className="text-gray-900 font-medium">
                      {story.department_name_marathi || story.department_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Resolution Time</p>
                    <p className="text-gray-900 font-medium">
                      {Math.round(story.resolution_hours)}h
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No impact stories available</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Analytics;
