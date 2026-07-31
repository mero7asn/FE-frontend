import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import './ProductCard.css';

const ProductCard = ({ product, galleryMode = false }) => {
  const [hovered, setHovered] = useState(false);
  const { t } = useLanguage();

  const primaryImage   = product.images?.find(img => img.isPrimary)   || product.images?.[0];
  const secondaryImage = product.images?.find(img => img.isSecondary) || product.images?.[1];

  const isSoldOut = !product.isAvailable || (
    product.sizes &&
    product.sizes.length > 0 &&
    product.sizes.every(s => typeof s === 'object' ? (!s.isAvailable || s.stock <= 0) : false)
  );

  const availableSizes = (product.sizes || [])
    .filter(s => typeof s === 'object' ? (s.isAvailable && s.stock > 0) : true)
    .map(s => (typeof s === 'object' ? s.size : s));

  const cardClass = `product-card ${isSoldOut ? 'sold-out' : ''} ${hovered ? 'is-hovered' : ''} ${galleryMode ? 'gallery-card' : ''}`;

  const inner = (
    <>
      <div className="pc-image-wrap">
        {primaryImage && (
          <img
            src={primaryImage.url}
            alt={primaryImage.alt || product.name}
            className="pc-img pc-img--primary"
          />
        )}
        {secondaryImage && (
          <img
            src={secondaryImage.url}
            alt={`${product.name} — back view`}
            className="pc-img pc-img--secondary"
          />
        )}
        <div className="pc-shimmer" />
        <div className="pc-badges">
          {product.isFeatured && !isSoldOut && (
            <span className="pc-badge pc-badge--featured">{t('featured')}</span>
          )}
          {product.isAudiencePick && !isSoldOut && (
            <span className="pc-badge pc-badge--audience">
              {t('audiencePick')} {product.audienceMenPercentage || 0}% / {product.audienceWomenPercentage || 0}%
            </span>
          )}
          {isSoldOut && (
            <span className="pc-badge pc-badge--sold-out">{t('soldOut')}</span>
          )}
        </div>
        {secondaryImage && (
          <div className="pc-back-hint">Back View</div>
        )}
        {availableSizes.length > 0 && !isSoldOut && (
          <div className="pc-sizes">
            {availableSizes.map(sz => (
              <span key={sz} className="pc-size">{sz}</span>
            ))}
          </div>
        )}
      </div>

      <div className="pc-info">
        <div className="pc-rule" />
        <div className="pc-info-inner">
          <div className="pc-text">
            <p className="pc-category">{product.category || 'T-Shirt'}</p>
            <h3 className="pc-name">{product.name}</h3>
          </div>
          <div className="pc-pricing">
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="pc-original-price">EGP {Number(product.originalPrice).toLocaleString('en-EG')}</span>
            )}
            <span className="pc-price">EGP {Number(product.price).toLocaleString('en-EG')}</span>
          </div>
        </div>
        <div className="pc-cta">
          {isSoldOut ? (
            <span className="pc-cta-sold">{t('soldOut')}</span>
          ) : (
            <button className="pc-order-btn">{t('orderNow')}</button>
          )}
        </div>
      </div>
    </>
  );

  if (galleryMode) {
    return (
      <div
        className={cardClass}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {inner}
      </div>
    );
  }

  return (
    <Link
      to={`/product/${product._id}`}
      className={cardClass}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {inner}
    </Link>
  );
};

export default ProductCard;
