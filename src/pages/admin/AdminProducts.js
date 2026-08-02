import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import './AdminProducts.css';

const AdminProducts = () => {
  const { hasPermission } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState(null);
  const [saleChannel, setSaleChannel] = useState('website');
  const [sellStep, setSellStep] = useState('channel'); // 'channel' | 'details'
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selling, setSelling] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const { data } = await productAPI.getAll();
      setProducts(data);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async (id) => {
    try {
      await productAPI.toggleAvailability(id);
      toast.success('Availability updated');
      loadProducts();
    } catch (error) {
      toast.error('Failed to update availability');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await productAPI.delete(id);
      toast.success('Product deleted');
      loadProducts();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const openSellModal = (product) => {
    setActiveProduct(product);
    setSellStep('channel');
    setSaleChannel('website');
    const availableSizes = (product.sizes || []).filter(s => s.stock > 0 && s.isAvailable);
    setSelectedSize(availableSizes.length > 0 ? availableSizes[0].size : '');
    setSelectedColor(product.colors && product.colors.length > 0 ? product.colors[0] : '');
    setCustomerName('');
    setCustomerPhone('');
    setIsSellModalOpen(true);
  };

  const closeSellModal = () => {
    setIsSellModalOpen(false);
    setActiveProduct(null);
    setSellStep('channel');
    setSaleChannel('website');
    setSelectedSize('');
    setSelectedColor('');
    setCustomerName('');
    setCustomerPhone('');
  };

  const handleConfirmSell = async () => {
    if (!activeProduct || !selectedSize || !saleChannel) return;

    setSelling(true);
    try {
      const { data } = await productAPI.sell(activeProduct._id, {
        size: selectedSize,
        color: selectedColor || undefined,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        saleChannel
      });
      const uoo = data.soldProduct?.uooNumber || '';
      toast.success(
        `✅ Sale registered for ${activeProduct.name} (${selectedSize}` +
        (selectedColor ? ` / ${selectedColor}` : '') + ')' +
        (uoo ? ` — UOO: ${uoo}` : '')
      );
      closeSellModal();
      loadProducts();
    } catch (error) {
      toast.error(error.displayMessage || 'Failed to register sale');
    } finally {
      setSelling(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="admin-products">
      <div className="container">
        <div className="admin-header">
          <h1>Manage Products</h1>
          {hasPermission('products_create') && (
            <Link to="/admin/products/new" className="btn btn-primary">
              Add New Product
            </Link>
          )}
        </div>

        <div className="products-table">
          <table>
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Original Price</th>
                <th>Discount</th>
                <th>Selling Price</th>
                <th>Status</th>
                <th>Featured</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product._id}>
                  <td>
                    <img 
                      src={product.images?.[0]?.url} 
                      alt={product.name}
                      className="product-thumb"
                    />
                  </td>
                <td>{product.name}</td>
                <td>{product.originalPrice ? `EGP ${Number(product.originalPrice).toLocaleString('en-EG')}` : '-'}</td>
                <td>{product.discountPercentage > 0 ? `${product.discountPercentage}%` : '-'}</td>
                <td>EGP {Number(product.price).toLocaleString('en-EG')}</td>
                <td>
                    <span className={`status-badge ${product.isAvailable ? 'available' : 'unavailable'}`}>
                      {product.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </td>
                  <td>
                    {product.isFeatured ? '⭐ Yes' : 'No'}
                  </td>
                  <td>
                    <div className="action-buttons">
                      {hasPermission('products_view') && (
                        <button 
                          onClick={() => openSellModal(product)}
                          className="btn-sell"
                        >
                          Sell
                        </button>
                      )}
                      {hasPermission('products_edit') && (
                        <Link to={`/admin/products/edit/${product._id}`} className="btn-edit">
                          Edit
                        </Link>
                      )}
                      {hasPermission('products_edit') && (
                        <button 
                          onClick={() => handleToggleAvailability(product._id)}
                          className="btn-toggle"
                        >
                          Toggle
                        </button>
                      )}
                      {hasPermission('products_delete') && (
                        <button 
                          onClick={() => handleDelete(product._id)}
                          className="btn-delete"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Sell Product Modal Popup */}
        {isSellModalOpen && activeProduct && (
          <div className="sell-modal-overlay" onClick={closeSellModal}>
            <div className="sell-modal" onClick={e => e.stopPropagation()}>
              <h2>Register Manual Sale</h2>
              <p className="product-title">{activeProduct.name}</p>

              {(() => {
                const availableSizes = (activeProduct.sizes || []).filter(s => s.stock > 0 && s.isAvailable);

                if (availableSizes.length === 0) {
                  return (
                    <div className="sell-no-stock">
                      <p className="warning-text">⚠️ This product is completely out of stock.</p>
                      <div className="modal-actions">
                        <button type="button" onClick={closeSellModal} className="btn-close">Close</button>
                      </div>
                    </div>
                  );
                }

                // Step 1: choose channel
                if (sellStep === 'channel') {
                  return (
                    <div className="sell-stock-form">
                      <p style={{ marginBottom: '1.25rem', color: '#5C4E38', fontSize: '0.95rem' }}>
                        Where is this sale coming from?
                      </p>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                          type="button"
                          className="btn-confirm-sell"
                          style={{ flex: 1, fontSize: '1rem', padding: '0.9rem' }}
                          onClick={() => { setSaleChannel('website'); setSellStep('details'); }}
                        >
                          🌐 This Website
                        </button>
                        <button
                          type="button"
                          className="btn-confirm-sell"
                          style={{ flex: 1, fontSize: '1rem', padding: '0.9rem', background: '#FF9900', borderColor: '#FF9900' }}
                          onClick={() => { setSaleChannel('amazon'); setSellStep('details'); }}
                        >
                          📦 Amazon
                        </button>
                      </div>
                      <div className="modal-actions" style={{ marginTop: '1rem' }}>
                        <button type="button" onClick={closeSellModal} className="btn-cancel-sell">Cancel</button>
                      </div>
                    </div>
                  );
                }

                // Step 2: fill details
                return (
                  <div className="sell-stock-form">
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem', padding: '0.3rem 0.75rem', borderRadius: '20px', background: saleChannel === 'amazon' ? '#FFF3E0' : '#E8F5E9', border: `1px solid ${saleChannel === 'amazon' ? '#FF9900' : '#4CAF50'}`, fontSize: '0.8rem', fontWeight: '700', color: saleChannel === 'amazon' ? '#E65100' : '#2E7D32' }}>
                      {saleChannel === 'amazon' ? '📦 Amazon Sale' : '🌐 Website Sale'}
                      <button type="button" onClick={() => setSellStep('channel')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', color: '#7A6F5E', marginLeft: '0.25rem' }}>✕ change</button>
                    </div>

                    <div className="form-group">
                      <label htmlFor="sellSizeSelect">Select Size:</label>
                      <select
                        id="sellSizeSelect"
                        value={selectedSize}
                        onChange={(e) => setSelectedSize(e.target.value)}
                        className="sell-select"
                      >
                        {availableSizes.map(s => (
                          <option key={s.size} value={s.size}>{s.size} ({s.stock} left)</option>
                        ))}
                      </select>
                    </div>

                    {activeProduct.colors && activeProduct.colors.length > 0 && (
                      <div className="form-group" style={{ marginTop: '1rem' }}>
                        <label htmlFor="sellColorSelect">Select Color:</label>
                        <select
                          id="sellColorSelect"
                          value={selectedColor}
                          onChange={(e) => setSelectedColor(e.target.value)}
                          className="sell-select"
                        >
                          {activeProduct.colors.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="form-group" style={{ marginTop: '1rem' }}>
                      <label htmlFor="customerNameInput">
                        Customer Name:{saleChannel === 'amazon' && <span style={{ color: '#FF9900', marginLeft: '0.3rem', fontSize: '0.75rem' }}>(optional — attach later)</span>}
                      </label>
                      <input
                        id="customerNameInput"
                        type="text"
                        placeholder="e.g. Ahmed Hassan"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="sell-select"
                      />
                    </div>

                    <div className="form-group" style={{ marginTop: '1rem' }}>
                      <label htmlFor="customerPhoneInput">
                        Customer Phone:{saleChannel === 'amazon' && <span style={{ color: '#FF9900', marginLeft: '0.3rem', fontSize: '0.75rem' }}>(optional — attach later)</span>}
                      </label>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span style={{ padding: '0.8rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-dark)' }}>🇪🇬 +20</span>
                        <input
                          id="customerPhoneInput"
                          type="tel"
                          placeholder="e.g. 01012345678"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          className="sell-select"
                          style={{ flex: 1 }}
                        />
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#7A6F5E', marginTop: '0.3rem', display: 'block' }}>Country key defaults to Egypt (+20).</span>
                    </div>

                    <div className="modal-actions">
                      <button
                        type="button"
                        onClick={handleConfirmSell}
                        className="btn-confirm-sell"
                        disabled={selling || !selectedSize}
                        style={saleChannel === 'amazon' ? { background: '#FF9900', borderColor: '#FF9900' } : {}}
                      >
                        {selling ? 'Processing...' : `Confirm ${saleChannel === 'amazon' ? 'Amazon ' : ''}Sell`}
                      </button>
                      <button type="button" onClick={closeSellModal} className="btn-cancel-sell" disabled={selling}>Cancel</button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProducts;
