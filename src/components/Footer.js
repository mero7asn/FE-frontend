import React from 'react';
import { Link } from 'react-router-dom';
import { FiInstagram, FiTwitter, FiFacebook } from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';
import './Footer.css';

const Footer = () => {
  const { t } = useLanguage();
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-brand">
            <Link to="/" className="footer-logo-link">
              <img src="/logo.png" alt="First Edition Logo" style={{ height: '50px', objectFit: 'contain', marginBottom: '0.5rem' }} />
            </Link>
            <p>&copy; {new Date().getFullYear()} First Edition</p>
          </div>
          
          <div className="footer-links">
            <Link to="/about">{t('footerAbout')}</Link>
            <Link to="/contact">{t('footerContact')}</Link>
            <Link to="/privacy">{t('footerPrivacy')}</Link>
            <Link to="/terms">{t('footerTerms')}</Link>
          </div>

          <div className="social-links">
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
              <FiInstagram />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
              <FiTwitter />
            </a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
              <FiFacebook />
            </a>
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.8rem', color: 'var(--text-light)' }}>
          {t('footerDevelopedBy')}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
