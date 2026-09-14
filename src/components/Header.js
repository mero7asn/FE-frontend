import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMenu, FiX, FiLogOut, FiGlobe, FiShoppingBag, FiUser } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useStore } from '../context/StoreContext';
import { useCart } from '../context/CartContext';
import './Header.css';

const Header = () => {
  const { user, isAdmin, logout } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const { isCardModel } = useStore();
  const { getCartCount, openCart } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const cartCount = getCartCount();

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
            {user && (
              <Link to="/account" onClick={() => setMobileMenuOpen(false)} className="mobile-only-link">
                {t('account')}
              </Link>
            )}
            {isAdmin && (
              <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="mobile-only-link">
                {t('admin')}
              </Link>
            )}
          </div>

          <div className="nav-actions">
            <button onClick={toggleLanguage} className="btn-language" title="Toggle Language">
              <FiGlobe /> {language === 'en' ? 'AR' : 'EN'}
            </button>

            {/* Shopping Cart Button (Shown when Card Model is active or cart has items) */}
            {(isCardModel || cartCount > 0) && (
              <button 
                onClick={openCart} 
                className="btn-header-cart" 
                title={t('shoppingCart')}
                aria-label="Shopping Cart"
              >
                <FiShoppingBag />
                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </button>
            )}

            {/* User Account / Login */}
            {!user ? (
              <div className="auth-header-links">
                <Link to="/login" className="btn-admin btn-login-link">
                  <FiUser className="user-icon" />
                  <span>{t('login') || 'Sign In'}</span>
                </Link>
              </div>
            ) : (
              <div className="user-header-group">
                <Link to="/account" className="btn-admin btn-account-link" title={user.name}>
                  <FiUser className="user-icon" />
                  <span>{user.name?.split(' ')[0] || t('account')}</span>
                </Link>

                {isAdmin && (
                  <Link to="/admin" className="btn-admin btn-admin-tag">{t('admin')}</Link>
                )}

                <button onClick={handleLogout} className="btn-admin logout-btn" title={t('logout')}>
                  <FiLogOut />
                </button>
              </div>
            )}

            <button 
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation Menu"
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
