import React, { useState, useEffect } from 'react';
import { productAPI, analyticsAPI } from '../services/api';
import ProductCard from '../components/ProductCard';
import { useLanguage } from '../context/LanguageContext';
import './Shop.css';

const Shop = () => {
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [availableColors, setAvailableColors] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    sort: 'newest',
    size: '',
    color: '',
    category: ''
  });
  const [loading, setLoading] = useState(true);

  // Fetch unique categories and colors on mount
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const { data } = await productAPI.getAll();
        const colors = Array.from(new Set(data.flatMap(p => p.colors || [])));
        const categories = Array.from(new Set(data.map(p => p.category).filter(Boolean)));
        setAvailableColors(colors);
        setAvailableCategories(categories);
      } catch (err) {
        console.error('Error fetching filter options:', err);
      }
    };
    fetchFilterOptions();
    // Track page view (fire-and-forget)
    analyticsAPI.trackEvent({ type: 'page_view', page: 'shop' }).catch(() => {});
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const { data } = await productAPI.getAll(filters);
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      sort: 'newest',
      size: '',
      color: '',
      category: ''
    });
  };

  return (
    <div className="shop">
      <div className="container">
        <div className="shop-header">
          <h1>{t('shopCollection')}</h1>
          <div className="filters-container">
            <div className="search-bar">
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="search-input"
              />
            </div>
            <div className="filters-row">
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="filter-select"
              >
                <option value="">{t('allCategories')}</option>
                {availableCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <select
                value={filters.size}
                onChange={(e) => handleFilterChange('size', e.target.value)}
                className="filter-select"
              >
                <option value="">{t('allSizes')}</option>
                {['M', 'L', 'XL', 'XXL'].map(sz => (
                  <option key={sz} value={sz}>{sz}</option>
                ))}
              </select>

              <select
                value={filters.color}
                onChange={(e) => handleFilterChange('color', e.target.value)}
                className="filter-select"
              >
                <option value="">{t('allColors')}</option>
                {availableColors.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>

              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                className="sort-select"
              >
                <option value="newest">{t('newest')}</option>
                <option value="featured">{t('featuredSort')}</option>
                <option value="price-low">{t('priceLow')}</option>
                <option value="price-high">{t('priceHigh')}</option>
              </select>

              {(filters.category || filters.size || filters.color || filters.search) && (
                <button onClick={handleResetFilters} className="btn-reset">
                  {t('clearFilters')}
                </button>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading">{t('loadingProducts')}</div>
        ) : products.length === 0 ? (
          <div className="no-products">{t('noProducts')}</div>
        ) : (
          <div className="grid grid-4">
            {products.map(product => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Shop;
