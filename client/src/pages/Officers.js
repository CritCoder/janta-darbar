import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const Officers = () => {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">{t('officers.title')}</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <p>Officers page coming soon...</p>
      </div>
    </div>
  );
};

export default Officers;
