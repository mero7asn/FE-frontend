import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productAPI, dropAPI, cmsAPI, analyticsAPI } from '../services/api';
import ProductCard from '../components/ProductCard';
import { useLanguage } from '../context/LanguageContext';
import './Home.css';

const Home = () => {
  const { t, language } = useLanguage();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [activeDrop, setActiveDrop] = useState(null);
  const [upcomingDrop, setUpcomingDrop] = useState(null);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [heroImage, setHeroImage] = useState({ imageUrl: null, mobileImageUrl: null });
  const [announcement, setAnnouncement] = useState({
    textEn: 'Colors may differ slightly due to different screen qualities',
    textAr: 'الألوان قد تختلف قليلاً بسبب جودة الشاشات المختلفة'
  });

  useEffect(() => {
    loadHomeData();
    // Track page view (fire-and-forget)
    analyticsAPI.trackEvent({ type: 'page_view', page: 'home' }).catch(() => {});
  }, []);

  const loadHomeData = async () => {
    try {
      const [productsRes, liveDropsRes, upcomingDropsRes, bannersRes, announcementRes, heroImageRes] = await Promise.all([
        productAPI.getFeatured(),
        dropAPI.getAll({ status: 'live' }),
        dropAPI.getAll({ status: 'upcoming' }),
        cmsAPI.getActiveBanners(),
        cmsAPI.getAnnouncement(),
        cmsAPI.getHeroImage()
      ]);
      
      setFeaturedProducts(productsRes.data);
      setActiveDrop(liveDropsRes.data[0]);
      
      if (upcomingDropsRes.data && upcomingDropsRes.data.length > 0) {
        const sortedUpcoming = upcomingDropsRes.data.sort((a, b) => new Date(a.launchDate) - new Date(b.launchDate));
        setUpcomingDrop(sortedUpcoming[0]);
      } else {
        setUpcomingDrop(null);
      }
      
      setBanners(bannersRes.data);
      if (announcementRes.data?.value) {
        setAnnouncement(announcementRes.data.value);
      }
      if (heroImageRes.data?.value) {
        setHeroImage(heroImageRes.data.value);
      }
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!upcomingDrop) return;

    const timer = setInterval(() => {
      const difference = +new Date(upcomingDrop.launchDate) - +new Date();
      if (difference <= 0) {
        clearInterval(timer);
        setUpcomingDrop(null);
        loadHomeData();
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [upcomingDrop]);

  const heroBanner = banners.find(b => b.position === 'hero');
  const heroTitle = language === 'ar' ? t('heroTitle') : (heroBanner?.title || t('heroTitle'));
  const heroSubtitle = language === 'ar' ? t('heroSubtitle') : (heroBanner?.subtitle || t('heroSubtitle'));

  if (loading) return <div className="loading">{t('loading')}</div>;

  const announcementText = language === 'ar' 
    ? `${announcement.textAr} | ${announcement.textEn}` 
    : `${announcement.textEn} | ${announcement.textAr}`;

  return (
    <div className="home">
      {announcementText && (
        <div className="announcement-bar-moving">
          <div className="announcement-bar-track">
            {[0, 1].map((group) => (
              <React.Fragment key={group}>
                {Array(5).fill(announcementText).map((text, idx) => (
                  <span key={`${group}-${idx}`} className="announcement-text-item">{text}</span>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
      <section className={`hero${heroImage?.imageUrl || heroImage?.mobileImageUrl ? ' has-hero-image' : ''}`}>
        {heroImage?.imageUrl && (
          <img src={heroImage.imageUrl} alt="Hero" className="hero-image hero-image-desktop" />
        )}
        {heroImage?.mobileImageUrl && (
          <img src={heroImage.mobileImageUrl} alt="Hero Mobile" className="hero-image hero-image-mobile" />
        )}
        <div className="hero-content">
            <h1>{heroTitle}</h1>
          <p>{heroSubtitle}</p>
          <p className="hero-phrase">{t('heroPhrase')}</p>
          <Link to="/shop" className="btn btn-primary">
            {heroBanner?.ctaText || t('shopNow')}
          </Link>
        </div>
      </section>

      {upcomingDrop && (
        <section className="section upcoming-drop-countdown">
          <div className="container">
            <div className="countdown-card">
              <span className="countdown-label">{t('nextDrop')}</span>
              <h2>{upcomingDrop.title}</h2>
              {upcomingDrop.description && <p className="drop-desc">{upcomingDrop.description}</p>}
              <div className="timer-grid">
                <div className="timer-unit">
                  <span className="timer-number">{timeLeft.days}</span>
                  <span className="timer-label">{t('days')}</span>
                </div>
                <div className="timer-unit">
                  <span className="timer-number">{timeLeft.hours}</span>
                  <span className="timer-label">{t('hours')}</span>
                </div>
                <div className="timer-unit">
                  <span className="timer-number">{timeLeft.minutes}</span>
                  <span className="timer-label">{t('mins')}</span>
                </div>
                <div className="timer-unit">
                  <span className="timer-number">{timeLeft.seconds}</span>
                  <span className="timer-label">{t('secs')}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {activeDrop && (
        <section className="section active-drop">
          <div className="container">
            <div className="drop-header">
              <h2>{t('latestDrop')}: {activeDrop.title}</h2>
              <Link to="/shop" className="btn btn-outline">
                {t('viewCollection')}
              </Link>
            </div>
          </div>
        </section>
      )}

      <section className="section featured-products">
        <div className="container">
          <h2 className="section-title">{t('featuredCollection')}</h2>
          <div className="featured-grid">
            {featuredProducts.map(product => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
          <div className="section-cta">
            <Link to="/shop" className="btn btn-outline">{t('viewAll')}</Link>
          </div>
        </div>
      </section>

      <section className="section brand-story">
        <div className="container">
          <div className="story-content">
            <h2>{t('brandTitle')}</h2>
            <p>{t('brandDesc')}</p>
            <Link to="/about" className="btn btn-outline">{t('learnMore')}</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
