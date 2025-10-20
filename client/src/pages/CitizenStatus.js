import React from 'react';
import { useParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const CitizenStatus = () => {
  const { ticketId } = useParams();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">{t('citizen.title')}</h1>
          <p className="text-gray-600 mb-4">Ticket ID: {ticketId}</p>
          <p>Citizen status page coming soon...</p>
        </div>
      </div>
    </div>
  );
};

export default CitizenStatus;
