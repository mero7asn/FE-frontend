import React, { useState, useEffect } from 'react';
import { productAPI } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import './Gallery.css';

const Gallery = () => {
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await productAPI.getAll();
        const soldOut = data.filter(p => {
          if (!p.isAvailable) return true;
          if (!p.sizes || p.sizes.length === 0) return true;
          return p.sizes.every(s =>
            typeof s === 'object' ? (!s.isAvailable || s.stock <= 0) : false
          );
        });
        setProducts(soldOut);
      } catch (err) {
        console.error('Error loading gallery:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const getPrimaryImage = (product) =>
    product.images?.find(img => img.isPrimary) || product.images?.[0];

  const getSecondaryImage = (product) =>
    product.images?.find(img => img.isSecondary) || product.images?.[1];

  const closeLightbox = () => setLightbox(null);

  // Close lightbox on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') closeLightbox(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="gallery-page">

      {/* ── Cinematic Hero ── */}
      <section className="gal-hero">
        <div className="gal-hero-bg" />
        <div className="gal-hero-content">
          <span className="gal-kicker">{t('galleryKicker')}</span>
          <h1 className="gal-title">{t('galleryTitle')}</h1>
          <div className="gal-title-rule" />
          <p className="gal-subtitle">{t('gallerySubtitle')}</p>
          <div className="gal-stats">
            <div className="gal-stat">
              <span className="gal-stat-num">{products.length}</span>
              <span className="gal-stat-label">Editions Archived</span>
            </div>
            <div className="gal-stat-divider" />
            <div className="gal-stat">
              <span className="gal-stat-num">∞</span>
              <span className="gal-stat-label">Never Returning</span>
            </div>
          </div>
        </div>
        <div className="gal-scroll-hint">
          <span>Scroll to explore</span>
          <div className="gal-scroll-line" />
        </div>
      </section>

      {/* ── Gallery Grid ── */}
      <section className="gal-showcase">
        {loading ? (
          <div className="gal-loading">
            <div className="gal-loading-spinner" />
            <span>Loading archive…</span>
          </div>
        ) : products.length === 0 ? (
          <div className="gal-empty">
            <div className="gal-empty-icon">◇</div>
            <p>{t('galleryEmpty')}</p>
          </div>
        ) : (
          <div className="gal-grid">
            {products.map((product, index) => {
              const primary = getPrimaryImage(product);
              const secondary = getSecondaryImage(product);
              return (
                <article
                  key={product._id}
                  className="gal-card"
                  style={{ '--delay': `${index * 0.08}s` }}
                  onClick={() => setLightbox(product)}
                >
                  <div className="gal-card-image">
                    {primary && (
                      <img
                        src={primary.url}
                        alt={primary.alt || product.name}
                        className="gal-card-img gal-card-img--front"
                        loading="lazy"
                      />
                    )}
                    {secondary && (
                      <img
                        src={secondary.url}
                        alt={`${product.name} — back`}
                        className="gal-card-img gal-card-img--back"
                        loading="lazy"
                      />
                    )}
                    <div className="gal-card-overlay" />
                    <div className="gal-card-stamp">SOLD OUT</div>
                  </div>

                  <div className="gal-card-info">
                    <span className="gal-card-edition">
                      {product.productNumber || `Edition #${String(index + 1).padStart(3, '0')}`}
                    </span>
                    <h3 className="gal-card-name">{product.name}</h3>
                    <span className="gal-card-price">
                      EGP {Number(product.price).toLocaleString('en-EG')}
                    </span>
                  </div>

                  <div className="gal-card-hover-info">
                    <p className="gal-card-desc">
                      {product.description?.length > 100
                        ? product.description.slice(0, 100) + '…'
                        : product.description}
                    </p>
                    <span className="gal-card-view">View Details ↗</span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Lightbox ── */}
      {lightbox && (
        <div className="gal-lightbox" onClick={closeLightbox}>
          <div className="gal-lightbox-inner" onClick={e => e.stopPropagation()}>
            <button className="gal-lightbox-close" onClick={closeLightbox}>✕</button>

            <div className="gal-lightbox-images">
              {getPrimaryImage(lightbox) && (
                <img src={getPrimaryImage(lightbox).url} alt={lightbox.name} />
              )}
              {getSecondaryImage(lightbox) && (
                <img src={getSecondaryImage(lightbox).url} alt={`${lightbox.name} back`} />
              )}
            </div>

            <div className="gal-lightbox-details">
              <span className="gal-lightbox-edition">
                {lightbox.productNumber || 'Limited Edition'}
              </span>
              <h2>{lightbox.name}</h2>
              <div className="gal-lightbox-rule" />
              <p className="gal-lightbox-desc">{lightbox.description}</p>
              <div className="gal-lightbox-meta">
                <div className="gal-lightbox-price">
                  EGP {Number(lightbox.price).toLocaleString('en-EG')}
                </div>
                <div className="gal-lightbox-stamp">SOLD OUT</div>
              </div>
              {lightbox.colors?.length > 0 && (
                <div className="gal-lightbox-colors">
                  <span>Colors:</span> {lightbox.colors.join(', ')}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;
