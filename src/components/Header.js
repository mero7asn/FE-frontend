import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMenu, FiX, FiLogOut, FiGlobe } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import './Header.css';

const Header = () => {
  const { user, isAdmin, logout } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="header">
      <div className="container">
        <nav className="navbar">
          <Link to="/" className="logo">
            <img src="/logo.png" alt="First Edition Logo" style={{ height: '40px', objectFit: 'contain' }} />
          </Link>

          <div className={`nav-links ${mobileMenuOpen ? 'active' : ''}`}>
            <Link to="/" onClick={() => setMobileMenuOpen(false)}>{t('home')}</Link>
            <Link to="/shop" onClick={() => setMobileMenuOpen(false)}>{t('shop')}</Link>
            <Link to="/about" onClick={() => setMobileMenuOpen(false)}>{t('about')}</Link>
            <Link to="/contact" onClick={() => setMobileMenuOpen(false)}>{t('contact')}</Link>
            <Link to="/gallery" onClick={() => setMobileMenuOpen(false)}>{t('gallery')}</Link>
            <Link to="/verify" onClick={() => setMobileMenuOpen(false)}>{t('verify')}</Link>
          </div>

          <div className="nav-actions">
            <button onClick={toggleLanguage} className="btn-language" title="Toggle Language">
              <FiGlobe /> {language === 'en' ? 'AR' : 'EN'}
            </button>

            {isAdmin && (
              <Link to="/admin" className="btn-admin">{t('admin')}</Link>
            )}

            {!user && (
              <Link to="/login" className="btn-admin">{t('adminLogin')}</Link>
            )}

            {user && (
              <Link to="/account" className="btn-admin">{t('account')}</Link>
            )}

            {user && isAdmin && (
              <button onClick={handleLogout} className="btn-admin logout-btn">
                <FiLogOut /> {t('logout')}
              </button>
            )}

            <button 
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <FiX /> : <FiMenu />}
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
