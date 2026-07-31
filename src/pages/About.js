import React from 'react';
import './About.css';
import { useLanguage } from '../context/LanguageContext';

const About = () => {
  const { t } = useLanguage();
  return (
    <div className="about-page">
      <section className="about-hero">
        <div className="container">
          <span className="hero-subtitle">{t('aboutSubtitle')}</span>
          <h1>First Edition</h1>
          <p className="hero-tagline">{t('heroTagline')}</p>
        </div>
      </section>

      <section className="about-content">
        <div className="container">
          <div className="about-grid">
            <div className="story-block">
              <h2>{t('ourStory')}</h2>
              <p>{t('storyP1')}</p>
              <p>{t('storyP2')}</p>
            </div>
            <div className="values-block">
              <h2>{t('threePillars')}</h2>
              <div className="value-item">
                <span className="value-num">01</span>
                <div>
                  <h3>{t('pillar1Title')}</h3>
                  <p>{t('pillar1Desc')}</p>
                </div>
              </div>
              <div className="value-item">
                <span className="value-num">02</span>
                <div>
                  <h3>{t('pillar2Title')}</h3>
                  <p>{t('pillar2Desc')}</p>
                </div>
              </div>
              <div className="value-item">
                <span className="value-num">03</span>
                <div>
                  <h3>{t('pillar3Title')}</h3>
                  <p>{t('pillar3Desc')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
