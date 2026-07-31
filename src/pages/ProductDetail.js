import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productAPI, analyticsAPI } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { toast } from 'react-toastify';
import vodafoneLogo from '../assets/vodafone.png';
import instapayLogo from '../assets/instapay.png';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const { t } = useLanguage();
  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [pauseTrigger, setPauseTrigger] = useState(0);
  const [recommendations, setRecommendations] = useState([]);
  const [hasUserSelectedSize, setHasUserSelectedSize] = useState(false);

  // Separate images by role
  const primaryImage   = product?.images?.find(img => img.isPrimary)   || product?.images?.[0];

  // Memoize thumbnails list to prevent slideshow effect from re-running
  const thumbnails = React.useMemo(() => {
    if (!product?.images) return [];
    const prim = product.images.find(img => img.isPrimary) || product.images[0];
    const sec = product.images.find(img => img.isSecondary) || null;
    const gal = product.images.filter(img => !img.isPrimary && !img.isSecondary);
    return [prim, sec, ...gal].filter(Boolean);
  }, [product?.images]);

  const loadProduct = async () => {
    try {
      const { data } = await productAPI.getOne(id);
      setProduct(data);

      const primary = data.images?.find(img => img.isPrimary) || data.images?.[0];
      setSelectedImage(primary || null);

      const normalizedSizes = (data.sizes || []).map(s =>
        typeof s === 'string' ? { size: s, stock: 1, isAvailable: true } : s
      );
      const firstAvailable = normalizedSizes.find(s => s.isAvailable && s.stock > 0);
      if (firstAvailable) {
        setSelectedSize(firstAvailable.size);
      } else if (normalizedSizes.length > 0) {
        setSelectedSize(normalizedSizes[0].size);
      }

      if (data.colors?.length > 0) setSelectedColor(data.colors[0]);
      setHasUserSelectedSize(false);
      setRecommendations([]);
    } catch (error) {
      console.error('Error loading product:', error);
      toast.error('Product not found');
    }
  };

  const handleSizeSelect = async (size) => {
    setSelectedSize(size);
    setHasUserSelectedSize(true);
  };

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!hasUserSelectedSize || !product) return;
      try {
        const { data } = await productAPI.getRecommendations({ productId: product._id, size: selectedSize });
        setRecommendations(data);
      } catch (error) {
        console.error('Error fetching recommendations:', error);
      }
    };
    fetchRecommendations();
  }, [hasUserSelectedSize, selectedSize, product]);

  useEffect(() => { 
    loadProduct(); 
    setIsPaused(false);
    setPauseTrigger(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Auto-swap effect: cycles images every 3 seconds if not paused
  useEffect(() => {
    if (!product || thumbnails.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setSelectedImage(prevImage => {
        if (!prevImage) return thumbnails[0];
        const currentIndex = thumbnails.findIndex(img => img.url === prevImage.url);
        if (currentIndex === -1) return thumbnails[0];
        const nextIndex = (currentIndex + 1) % thumbnails.length;
        return thumbnails[nextIndex];
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [product, thumbnails, isPaused]);

  // Pause timer: resumes auto-swapping after 2 minutes of no manual selection
  useEffect(() => {
    if (!isPaused) return;

    const timeout = setTimeout(() => {
      setIsPaused(false);
    }, 120000);

    return () => clearTimeout(timeout);
  }, [isPaused, pauseTrigger]);

  const handleSelectImage = (img) => {
    setSelectedImage(img);
    setIsPaused(true);
    setPauseTrigger(prev => prev + 1);
  };

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    e.currentTarget.style.setProperty('--zoom-x', `${x}%`);
    e.currentTarget.style.setProperty('--zoom-y', `${y}%`);
  };

  const normalizedSizes = product
    ? (product.sizes || []).map(s =>
        typeof s === 'string' ? { size: s, stock: 1, isAvailable: true } : s
      )
    : [];

  const selectedSizeObj    = normalizedSizes.find(s => s.size === selectedSize);
  const isSizeOutOfStock   = selectedSizeObj ? (!selectedSizeObj.isAvailable || selectedSizeObj.stock <= 0) : true;
  const isProductSoldOut   = !product?.isAvailable || normalizedSizes.every(s => !s.isAvailable || s.stock <= 0);

  const handleBuyOnWhatsApp = () => {
    if (!product) return;
    if (!selectedSize) { toast.warning(t('selectSize')); return; }
    if (product.colors?.length > 0 && !selectedColor) { toast.warning(t('selectColor')); return; }

    // Track the order click event (fire-and-forget)
    analyticsAPI.trackEvent({ type: 'order_click', productId: product._id, page: 'product' }).catch(() => {});

    const frontImageUrl = primaryImage?.url || selectedImage?.url || '';
    const productUrl = `${window.location.origin}/products/${product._id}`;
    const message =
`Hello First Edition team,

I would like to place an order with the details below:

*Product:* ${product.name}
*Color:* ${selectedColor || 'N/A'}
*Size:* ${selectedSize}
*Front image:* ${frontImageUrl}
*Product page:* ${productUrl}

Please confirm availability and the next steps.
Thank you.`;

    const whatsappNumber = product.whatsappNumber || '+1234567890';
    window.open(`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (!product) return <div className="loading">{t('loading')}</div>;

  return (
    <div className="product-detail">
      <div className="container">
        <div className="product-layout">

          {/* ── Image Panel ── */}
          <div className="product-images">

            {/* Main large image */}
            <div
              className="main-image"
              onMouseMove={handleMouseMove}
            >
              {selectedImage && (
                <img
                  src={selectedImage.url}
                  alt={selectedImage.alt || product.name}
                />
              )}

            </div>

            {/* Thumbnails row */}
            {thumbnails.length > 1 && (
              <div className="image-thumbnails">
                {thumbnails.map((img, index) => (
                  <div
                    key={index}
                    className={`thumbnail-wrap ${selectedImage?.url === img.url ? 'active' : ''}`}
                    onClick={() => handleSelectImage(img)}
                  >
                    <img src={img.url} alt={img.alt || `View ${index + 1}`} />

                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Info Panel ── */}
          <div className="product-details">
            <h1>{product.name}</h1>
            <div className="price-wrap">
              {product.originalPrice && product.originalPrice > product.price && (
                <p className="original-price">EGP {Number(product.originalPrice).toLocaleString('en-EG')}</p>
              )}
              <p className="price">
                EGP {Number(product.price).toLocaleString('en-EG')}
              </p>
            </div>

            {isProductSoldOut && <div className="unavailable-badge">{t('soldOut')}</div>}
            {!isProductSoldOut && !product.isAvailable && <div className="unavailable-badge">{t('currentlyUnavailable')}</div>}

            <p className="description">{product.description}</p>

             {normalizedSizes.length > 0 && (
               <div className="info-section">
                 <h3>{t('selectSize')}</h3>
                 <div className="selector-group">
                   {normalizedSizes.map(s => {
                     const isOutOfStock = !s.isAvailable || s.stock <= 0;
                     return (
                       <button
                         key={s.size}
                         type="button"
                         className={`selector-badge ${selectedSize === s.size ? 'active' : ''} ${isOutOfStock ? 'disabled' : ''}`}
                         onClick={() => !isOutOfStock && handleSizeSelect(s.size)}
                         disabled={isOutOfStock}
                       >
                         {s.size} {isOutOfStock ? `(${t('soldOut')})` : `(${s.stock} ${t('leftInStock')})`}
                       </button>
                     );
                   })}
                 </div>
               </div>
             )}

              <div className="size-chart-section">
                <h3 className="size-chart-title">Size Chart</h3>
                <div className="size-chart-wrapper">
                  <img src="/sizes.jpg" alt="Size Chart" className="size-chart-img" />
                </div>
              </div>

              {product.isAudiencePick && (
                <div className="audience-pick-section">
                  <h3 className="audience-pick-title">Audience Pick</h3>
                  <div className="audience-pick-bar">
                    <div className="audience-segment audience-men" style={{ width: `${product.audienceMenPercentage || 0}%` }}>
                      <span className="audience-label">Men {product.audienceMenPercentage || 0}%</span>
                    </div>
                    <div className="audience-segment audience-women" style={{ width: `${product.audienceWomenPercentage || 0}%` }}>
                      <span className="audience-label">Women {product.audienceWomenPercentage || 0}%</span>
                    </div>
                  </div>
                  {product.votingDescription && (
                    <p className="voting-description">{product.votingDescription}</p>
                  )}
                </div>
              )}

              {product.colors?.length > 0 && (
              <div className="info-section">
                <h3>{t('selectColor')}</h3>
                <div className="selector-group">
                  {product.colors.map(color => (
                    <button
                      key={color}
                      type="button"
                      className={`selector-badge ${selectedColor === color ? 'active' : ''}`}
                      onClick={() => setSelectedColor(color)}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="shipping-notice" style={{ marginTop: '1.5rem', marginBottom: '1.5rem', textAlign: 'center', backgroundColor: 'var(--surface, #f9f9f9)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border, #eee)' }}>
              <p style={{ margin: '0 0 10px 0', fontSize: '1rem', fontWeight: 'bold', color: 'var(--text-dark, #333)' }}>
                {t('shippingNotice')}
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', alignItems: 'center', flexWrap: 'wrap', marginTop: '10px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-mid, #666)' }}>{t('weAccept')}</span>
                
                {/* Vodafone Cash Logo */}
                <img src={vodafoneLogo} alt="Vodafone Cash" style={{ height: '35px', objectFit: 'contain' }} />

                {/* InstaPay Logo */}
                <img src={instapayLogo} alt="Instapay" style={{ height: '35px', objectFit: 'contain' }} />

              </div>
            </div>

            <button
              className="btn btn-primary whatsapp-btn"
              onClick={handleBuyOnWhatsApp}
              disabled={isProductSoldOut || isSizeOutOfStock}
            >
              {isProductSoldOut ? t('soldOut') : isSizeOutOfStock ? t('sizeOutOfStock') : t('orderNow')}
            </button>

            <div className="product-notice">
              <p className="notice-english">⚠️ Colors may differ slightly due to different screen qualities</p>
              <p className="notice-arabic">الألوان قد تختلف قليلاً بسبب جودة الشاشات المختلفة</p>
            </div>

            {hasUserSelectedSize && recommendations.length > 0 && (
              <div className="recommendations-section">
                <h3 className="recommendations-title">
                  {t('sizeRecommendations', selectedSize)}
                </h3>
                <div className="recommendations-grid">
                  {recommendations.map(rec => {
                    const recPrimary = rec.images?.find(img => img.isPrimary) || rec.images?.[0];
                    const recAvailableSizes = (rec.sizes || [])
                      .filter(s => typeof s === 'object' ? (s.isAvailable && s.stock > 0) : true)
                      .map(s => typeof s === 'object' ? s.size : s);
                    const recIsSoldOut = !rec.isAvailable || (rec.sizes && rec.sizes.length > 0 && rec.sizes.every(s => typeof s === 'object' ? (!s.isAvailable || s.stock <= 0) : false));
                    return (
                      <Link key={rec._id} to={`/product/${rec._id}`} className="rec-card">
                        <div className="rec-image-wrap">
                          {recPrimary && <img src={recPrimary.url} alt={rec.name} className="rec-img" />}
                          {recIsSoldOut && <span className="rec-badges">{t('soldOut')}</span>}
                        </div>
                        <div className="rec-info">
                          <h4 className="rec-name">{rec.name}</h4>
                          <p className="rec-price">
                            EGP {Number(rec.price).toLocaleString('en-EG')}
                          </p>
                          {recAvailableSizes.length > 0 && (
                            <div className="rec-sizes">
                              {recAvailableSizes.map(sz => (
                                <span key={sz} className={`rec-size ${selectedSize === sz ? 'active' : ''}`}>{sz}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
