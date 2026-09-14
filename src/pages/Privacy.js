import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import './Policies.css';

const Privacy = () => {
  const { t } = useLanguage();

  return (
    <div className="policy-page">
      <section className="policy-hero">
        <div className="container">
          <span className="policy-subtitle">{t('privacySubtitle')}</span>
          <h1>{t('privacyTitle')}</h1>
          <p className="policy-intro">{t('privacyIntro')}</p>
        </div>
      </section>

      <section className="policy-content">
        <div className="container">
          <div className="policy-block">
            <h2>{t('privacySection1Title')}</h2>
            <p>{t('privacySection1Text')}</p>
          </div>
          <div className="policy-block">
            <h2>{t('privacySection2Title')}</h2>
            <p>{t('privacySection2Text')}</p>
          </div>
          <div className="policy-block">
            <h2>{t('privacySection3Title')}</h2>
            <p>{t('privacySection3Text')}</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Privacy;
