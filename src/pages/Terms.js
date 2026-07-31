import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import './Policies.css';

const Terms = () => {
  const { t } = useLanguage();

  return (
    <div className="policy-page">
      <section className="policy-hero">
        <div className="container">
          <span className="policy-subtitle">{t('termsSubtitle')}</span>
          <h1>{t('termsTitle')}</h1>
          <p className="policy-intro">{t('termsIntro')}</p>
        </div>
      </section>

      <section className="policy-content">
        <div className="container">
          <div className="policy-block">
            <h2>{t('termsSection1Title')}</h2>
            <p>{t('termsSection1Text')}</p>
          </div>
          <div className="policy-block">
            <h2>{t('termsSection2Title')}</h2>
            <p>{t('termsSection2Text')}</p>
          </div>
          <div className="policy-block">
            <h2>{t('termsSection3Title')}</h2>
            <p>{t('termsSection3Text')}</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Terms;
