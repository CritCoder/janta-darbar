import React from 'react';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Users,
  Building2,
  BarChart3
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { analyticsAPI } from '../services/api';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import StatusBadge from '../components/UI/StatusBadge';

const Dashboard = () => {
  const { t } = useLanguage();

  const { data: dashboardData, isLoading, error } = useQuery(
    'dashboard',
    () => analyticsAPI.getDashboard({ days: 30 }),
    {
      refetchInterval: 30000, // Refetch every 30 seconds
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
        <p className="text-gray-600">Error loading dashboard data</p>
      </div>
    );
  }

  const stats = dashboardData?.data?.overall_stats || {};
  const statusDistribution = dashboardData?.data?.status_distribution || [];
  const categoryDistribution = dashboardData?.data?.category_distribution || [];
  const departmentPerformance = dashboardData?.data?.department_performance || [];
  const dailyTrends = dashboardData?.data?.daily_trends || [];
  const slaBreaches = dashboardData?.data?.sla_breaches || [];

  const statCards = [
    {
      title: t('dashboard.totalGrievances'),
      value: stats.total_grievances || 0,
      icon: FileText,
      color: 'blue',
      change: '+12%'
    },
    {
      title: t('dashboard.resolvedGrievances'),
      value: stats.resolved_grievances || 0,
      icon: CheckCircle,
      color: 'green',
      change: '+8%'
    },
    {
      title: t('dashboard.pendingGrievances'),
      value: stats.in_progress_grievances || 0,
      icon: Clock,
      color: 'yellow',
      change: '-5%'
    },
    {
      title: t('dashboard.newGrievances'),
      value: stats.new_grievances || 0,
      icon: AlertCircle,
      color: 'red',
      change: '+15%'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 100
      }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('dashboard.title')}</h1>
          <p className="text-gray-600 mt-1">{t('dashboard.welcome')}</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm text-gray-500">Resolution Rate</p>
            <p className="text-2xl font-bold text-green-600">
              {stats.total_grievances > 0 
                ? Math.round((stats.resolved_grievances / stats.total_grievances) * 100)
                : 0}%
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const colorClasses = {
            blue: 'bg-blue-500 text-white',
            green: 'bg-green-500 text-white',
            yellow: 'bg-yellow-500 text-white',
            red: 'bg-red-500 text-white'
          };
          
          return (
            <motion.div
              key={stat.title}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  <p className="text-sm text-green-600 mt-1">{stat.change}</p>
                </div>
                <div className={`p-3 rounded-lg ${colorClasses[stat.color]}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Distribution</h3>
          <div className="space-y-3">
            {statusDistribution.map((item, index) => (
              <div key={item.status} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <StatusBadge status={item.status} />
                  <span className="text-sm text-gray-600">{item.count}</span>
                </div>
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full"
                    style={{ 
                      width: `${(item.count / statusDistribution.reduce((sum, s) => sum + s.count, 0)) * 100}%` 
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Category Distribution */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Distribution</h3>
          <div className="space-y-3">
            {categoryDistribution.slice(0, 5).map((item, index) => (
              <div key={item.category} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {t(`category.${item.category}`)}
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900">{item.count}</span>
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full"
                      style={{ 
                        width: `${(item.count / categoryDistribution.reduce((sum, c) => sum + c.count, 0)) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Department Performance */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Performance</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resolved
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Time
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {departmentPerformance.slice(0, 5).map((dept, index) => (
                <tr key={dept.department_name}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {dept.department_name_marathi || dept.department_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {dept.total_grievances}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {dept.resolved}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      dept.resolution_rate >= 80 
                        ? 'bg-green-100 text-green-800'
                        : dept.resolution_rate >= 60
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {dept.resolution_rate}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {dept.avg_resolution_hours 
                      ? `${Math.round(dept.avg_resolution_hours)}h`
                      : '-'
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* SLA Breaches */}
      {slaBreaches.length > 0 && (
        <motion.div
          variants={itemVariants}
          className="bg-red-50 border border-red-200 rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            SLA Breaches
          </h3>
          <div className="space-y-2">
            {slaBreaches.slice(0, 5).map((breach, index) => (
              <div key={breach.ticket_id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                <div>
                  <span className="font-medium text-gray-900">{breach.ticket_id}</span>
                  <span className="ml-2 text-sm text-gray-600">{breach.department_name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <StatusBadge severity={breach.severity} />
                  <span className="text-sm text-red-600">
                    {Math.round(breach.hours_pending)}h overdue
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Dashboard;
