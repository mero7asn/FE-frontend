import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productAPI } from '../services/api';
import './VerifyProduct.css';

// Detects Arabic characters
const hasArabic = (str) => /[\u0600-\u06FF]/.test(str);

// Splits a product name into {en, ar} parts
const parseProductName = (name = '') => {
  const separators = [' / ', ' - ', ' | ', '\n'];
  for (const sep of separators) {
    if (name.includes(sep)) {
      const parts = name.split(sep).map(p => p.trim());
      const ar = parts.find(p => hasArabic(p));
      const en = parts.find(p => !hasArabic(p));
      if (ar && en) return { en, ar };
      if (ar) return { en: '', ar: parts.join(' ') };
    }
  }
  if (hasArabic(name)) return { en: '', ar: name };
  return { en: name, ar: '' };
};

const VerifyProduct = () => {
  const [searchParams] = useSearchParams();

  const [productNumber, setProductNumber] = useState('');
  const [uooNumber, setUooNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifiedData, setVerifiedData] = useState(null);
  const [error, setError] = useState('');

  // Auto-verify if query params exist on mount
  useEffect(() => {
    const pNum = searchParams.get('productNumber') || '';
    const uoo = searchParams.get('uoo') || searchParams.get('uooNumber') || '';
    
    if (pNum && uoo) {
      setProductNumber(pNum);
      setUooNumber(uoo);
      performVerification(pNum, uoo);
    }
  }, [searchParams]);

  const performVerification = async (pNum, uoo) => {
    if (!pNum.trim() || !uoo.trim()) {
      setError('Please enter both Product Number and UOO Number.');
      return;
    }

    setLoading(true);
    setError('');
    setVerifiedData(null);

    try {
      const { data } = await productAPI.verifyUOO(pNum.trim(), uoo.trim());
      if (data && data.verified) {
        setVerifiedData(data.soldProduct);
      } else {
        setError('Verification failed. Invalid product code.');
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 
        'This combination of Product Number and UOO Number is not registered as an authentic purchase.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyClick = (e) => {
    e.preventDefault();
    performVerification(productNumber, uooNumber);
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'long', year: 'numeric'
    });

  return (
    <div className="verify-page">
      <div className="verify-container">
        
        {/* Brand Header */}
        <div className="verify-logo-wrap">
          <img src="/logo.png" alt="First Edition" className="verify-logo-img" />
          <h1 className="verify-brand-name">FIRST EDITION</h1>
          <p className="verify-tagline">Official Product Verification Service</p>
        </div>

        {/* Loading Spinner Overlay */}
        {loading && (
          <div className="verify-loading">
            <div className="verify-spinner" />
            <p>Scanning authenticity database...</p>
          </div>
        )}

        {!loading && !verifiedData && (
          <div className="verify-form-card">
            <h2 className="verify-card-title">Authenticity Check</h2>
            <p className="verify-card-desc">
              Enter the Product Number and UOO Number from your Authenticity Card to verify that your item is an original First Edition product.
            </p>

            <form onSubmit={handleVerifyClick} className="verify-form">
              <div className="form-group">
                <label htmlFor="pNumber">Product Number (e.g. FE-0001)</label>
                <input
                  id="pNumber"
                  type="text"
                  placeholder="FE-XXXX"
                  value={productNumber}
                  onChange={(e) => setProductNumber(e.target.value)}
                  className="verify-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="uooNumber">UOO Number (8-character code)</label>
                <input
                  id="uooNumber"
                  type="text"
                  placeholder="Enter 8-digit UOO code"
                  value={uooNumber}
                  onChange={(e) => setUooNumber(e.target.value)}
                  className="verify-input verify-input--uoo"
                  required
                />
              </div>

              {error && (
                <div className="verify-error-box animate-fade-in">
                  <span className="verify-error-icon">⚠️</span>
                  <p className="verify-error-text">{error}</p>
                </div>
              )}

              <button type="submit" className="verify-submit-btn">
                Verify Authenticity
              </button>
            </form>
          </div>
        )}

        {/* Verification Success Result */}
        {!loading && verifiedData && (
          <div className="verify-success-card animate-scale-up">
            
            {/* Authenticated Seal Header */}
            <div className="verify-success-header">
              <div className="verify-badge">
                <span className="verify-badge-icon">✦</span>
                <span className="verify-badge-text">VERIFIED ORIGINAL</span>
              </div>
            </div>

            {/* Product Details Display */}
            <div className="verify-result-details">
              <h2 className="verify-success-title">Official Authentic Product</h2>
              
              {/* Product Thumbnail if available */}
              {verifiedData.product?.images?.[0]?.url && (
                <div className="verify-product-img-wrap">
                  <img 
                    src={verifiedData.product.images[0].url} 
                    alt={verifiedData.productName} 
                    className="verify-product-img"
                  />
                </div>
              )}

              {/* Product Name (Bilingual Support) */}
              <div className="verify-product-name-row">
                {(() => {
                  const { en, ar } = parseProductName(verifiedData.productName);
                  return (
                    <>
                      {en && (
                        <p className="verify-product-en" dir="ltr">
                          {en}
                        </p>
                      )}
                      {ar && (
                        <p className="verify-product-ar" dir="rtl" lang="ar">
                          {ar}
                        </p>
                      )}
                      {!en && !ar && (
                        <p className="verify-product-fallback" dir="auto">
                          {verifiedData.productName}
                        </p>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* Specs Grid: Size and Color */}
              <div className="verify-specs-grid">
                <div className="verify-spec-item">
                  <span className="verify-spec-label">CHOSEN SIZE</span>
                  <span className="verify-spec-val">Size {verifiedData.size}</span>
                </div>
                <div className="verify-spec-item">
                  <span className="verify-spec-label">CHOSEN COLOR</span>
                  <span className="verify-spec-val">{verifiedData.color || 'Standard / Multi'}</span>
                </div>
              </div>

              {/* Unique UOO Display "In a unique way" */}
              <div className="verify-uoo-hero">
                <span className="verify-uoo-label">SECURITY UOO NUMBER</span>
                <div className="verify-uoo-code-box">
                  <span className="verify-uoo-glow-text">{verifiedData.uooNumber}</span>
                  <div className="verify-hologram-shimmer" />
                </div>
                <p className="verify-uoo-desc">Unique Original Order Code • Valid & Non-Replicable</p>
              </div>

              {/* Verification Info footer */}
              <div className="verify-record-info">
                <div className="verify-record-row">
                  <span>Product Design:</span>
                  <strong>{verifiedData.productNumber}</strong>
                </div>
                <div className="verify-record-row">
                  <span>Register Date:</span>
                  <strong>{formatDate(verifiedData.soldAt)}</strong>
                </div>
                <div className="verify-record-row">
                  <span>Verification Signature:</span>
                  <strong className="verify-sig-text">FE-SECURE-GENUINE</strong>
                </div>
              </div>

              <p className="verify-success-footer">
                Thank you for choosing First Edition. This certifies your item is an authentic product handcrafted with our premium quality standards.
              </p>

              <button 
                type="button" 
                onClick={() => {
                  setVerifiedData(null);
                }} 
                className="verify-reset-btn"
              >
                Verify Another Shirt
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default VerifyProduct;
