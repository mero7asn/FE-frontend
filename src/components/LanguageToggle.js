import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import './LanguageToggle.css';

const LanguageToggle = () => {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button 
      className="language-toggle-btn" 
      onClick={toggleLanguage}
      aria-label="Toggle Language"
    >
      {language === 'en' ? 'عربي' : 'EN'}
    </button>
  );
};

export default LanguageToggle;
