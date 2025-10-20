import React from 'react';
import { useParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const GrievanceDetail = () => {
  const { id } = useParams();
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Grievance Detail</h1>
      <p className="text-gray-600">Grievance ID: {id}</p>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <p>Grievance detail page coming soon...</p>
      </div>
    </div>
  );
};

export default GrievanceDetail;
