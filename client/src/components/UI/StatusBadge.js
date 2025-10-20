import React from 'react';
import { motion } from 'framer-motion';

const StatusBadge = ({ status, severity, className = '' }) => {
  const getStatusConfig = (status) => {
    const configs = {
      'NEW': { 
        label: 'नवीन', 
        className: 'bg-blue-100 text-blue-800 border-blue-200',
        labelEn: 'New'
      },
      'INTAKE': { 
        label: 'चौकशी', 
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        labelEn: 'Intake'
      },
      'APPROVAL_PENDING': { 
        label: 'मंजुरी प्रलंबित', 
        className: 'bg-orange-100 text-orange-800 border-orange-200',
        labelEn: 'Approval Pending'
      },
      'APPROVED': { 
        label: 'मंजूर', 
        className: 'bg-green-100 text-green-800 border-green-200',
        labelEn: 'Approved'
      },
      'DISPATCHED': { 
        label: 'पाठवले', 
        className: 'bg-purple-100 text-purple-800 border-purple-200',
        labelEn: 'Dispatched'
      },
      'ACKNOWLEDGED': { 
        label: 'स्वीकारले', 
        className: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        labelEn: 'Acknowledged'
      },
      'IN_PROGRESS': { 
        label: 'प्रगतीत', 
        className: 'bg-amber-100 text-amber-800 border-amber-200',
        labelEn: 'In Progress'
      },
      'RESOLVED': { 
        label: 'सोडवले', 
        className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        labelEn: 'Resolved'
      },
      'CITIZEN_CONFIRMED': { 
        label: 'नागरिक पुष्टी', 
        className: 'bg-teal-100 text-teal-800 border-teal-200',
        labelEn: 'Citizen Confirmed'
      },
      'CLOSED': { 
        label: 'बंद', 
        className: 'bg-gray-100 text-gray-800 border-gray-200',
        labelEn: 'Closed'
      },
      'REOPENED': { 
        label: 'पुन्हा उघडले', 
        className: 'bg-cyan-100 text-cyan-800 border-cyan-200',
        labelEn: 'Reopened'
      },
      'REJECTED': { 
        label: 'नाकारले', 
        className: 'bg-red-100 text-red-800 border-red-200',
        labelEn: 'Rejected'
      }
    };
    return configs[status] || { 
      label: status, 
      className: 'bg-gray-100 text-gray-800 border-gray-200',
      labelEn: status
    };
  };

  const getSeverityConfig = (severity) => {
    const configs = {
      'critical': { 
        label: 'गंभीर', 
        className: 'bg-red-100 text-red-800 border-red-200',
        labelEn: 'Critical'
      },
      'high': { 
        label: 'उच्च', 
        className: 'bg-orange-100 text-orange-800 border-orange-200',
        labelEn: 'High'
      },
      'medium': { 
        label: 'मध्यम', 
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        labelEn: 'Medium'
      },
      'low': { 
        label: 'कमी', 
        className: 'bg-green-100 text-green-800 border-green-200',
        labelEn: 'Low'
      }
    };
    return configs[severity] || { 
      label: severity, 
      className: 'bg-gray-100 text-gray-800 border-gray-200',
      labelEn: severity
    };
  };

  if (status) {
    const config = getStatusConfig(status);
    return (
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className} ${className}`}
        title={config.labelEn}
      >
        {config.label}
      </motion.span>
    );
  }

  if (severity) {
    const config = getSeverityConfig(severity);
    return (
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className} ${className}`}
        title={config.labelEn}
      >
        {config.label}
      </motion.span>
    );
  }

  return null;
};

export default StatusBadge;
