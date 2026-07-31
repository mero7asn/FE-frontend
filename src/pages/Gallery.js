import React, { useState, useEffect } from 'react';
import { productAPI } from '../services/api';
import ProductCard from '../components/ProductCard';
import { useLanguage } from '../context/LanguageContext';
import './Gallery.css';

const Gallery = () => {
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await productAPI.getAll();
        const soldOut = data.filter(p => {
          if (p.isAvailable) return false;
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

  return (
    <div className="gallery-page">
      <div className="gallery-hero">
        <div className="container">
          <span className="gallery-kicker">{t('galleryKicker')}</span>
          <h1>{t('galleryTitle')}</h1>
          <p className="gallery-subtitle">{t('gallerySubtitle')}</p>
        </div>
      </div>

      <div className="gallery-body">
        <div className="container">
          {loading ? (
            <div className="loading">{t('loading')}</div>
          ) : products.length === 0 ? (
            <div className="gallery-empty">{t('galleryEmpty')}</div>
          ) : (
            <div className="grid grid-4">
              {products.map(product => (
                <ProductCard key={product._id} product={product} galleryMode />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Gallery;
