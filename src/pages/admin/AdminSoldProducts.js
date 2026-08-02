import React, { useState, useEffect, useRef } from 'react';
import { productAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import html2canvas from 'html2canvas';
import './AdminSoldProducts.css';

// Detects Arabic characters
const hasArabic = (str) => /[\u0600-\u06FF]/.test(str);

// Splits a product name into {en, ar} parts
// Handles formats: "English / Arabic", "English - Arabic", or plain
const parseProductName = (name = '') => {
  // Try common separators: " / ", " - ", " | "
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
  // No separator — if whole string is Arabic return as ar
  if (hasArabic(name)) return { en: '', ar: name };
  return { en: name, ar: '' };
};

const AdminSoldProducts = () => {
  const { isAdmin } = useAuth();
  const [soldProducts, setSoldProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState(null);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState('active'); // 'active' | 'deleted' | 'all'
  const cardRef = useRef(null);

  // Attach customer modal state
  const [attachItem, setAttachItem] = useState(null);
  const [attachName, setAttachName] = useState('');
  const [attachPhone, setAttachPhone] = useState('');
  const [attaching, setAttaching] = useState(false);

  useEffect(() => {
    loadSoldProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterTab, isAdmin]);

  const loadSoldProducts = async () => {
    try {
      setLoading(true);
      const params = isAdmin ? { includeDeleted: 'true' } : {};
      const { data } = await productAPI.getSoldProducts(params);
      setSoldProducts(data);
    } catch (error) {
      toast.error('Failed to load sold products');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSoldProduct = async (item) => {
    if (!window.confirm(`Are you sure you want to delete/revoke sold product (UOO: ${item.uooNumber})?\n\nThis will add 1 unit back to product stock.`)) return;
    try {
      await productAPI.deleteSoldProduct(item._id);
      toast.success(`Sold product record ${item.uooNumber} deleted and stock restored.`);
      loadSoldProducts();
    } catch (error) {
      toast.error(error.displayMessage || 'Failed to delete sold product');
    }
  };

  const handleRestoreSoldProduct = async (item) => {
    if (!window.confirm(`Are you sure you want to restore sold product (UOO: ${item.uooNumber})?\n\nThis will deduct 1 unit from stock if available.`)) return;
    try {
      await productAPI.restoreSoldProduct(item._id);
      toast.success(`Sold product record ${item.uooNumber} restored.`);
      loadSoldProducts();
    } catch (error) {
      toast.error(error.displayMessage || 'Failed to restore sold product');
    }
  };

  const handleViewCard = (item) => {
    setSelectedCard(item);
  };

  const openAttachModal = (item) => {
    setAttachItem(item);
    setAttachName(item.customerName || '');
    setAttachPhone(item.customerPhone || '');
  };

  const closeAttachModal = () => {
    setAttachItem(null);
    setAttachName('');
    setAttachPhone('');
  };

  const handleAttachCustomer = async () => {
    if (!attachItem) return;
    setAttaching(true);
    try {
      await productAPI.updateSoldProductCustomer(attachItem._id, {
        customerName: attachName.trim() || undefined,
        customerPhone: attachPhone.trim() || undefined
      });
      toast.success('Customer info attached to certificate');
      closeAttachModal();
      loadSoldProducts();
    } catch (error) {
      toast.error(error.displayMessage || 'Failed to attach customer info');
    } finally {
      setAttaching(false);
    }
  };

  const handlePrint = () => {
    window.__cardExportAllowed = true;
    window.print();
    window.__cardExportAllowed = false;
  };

  const handleDownloadImage = async (item) => {
    const cardEl = cardRef.current;
    if (!cardEl) return;

    window.__cardExportAllowed = true;

    let toastId;
    try {
      toastId = toast.loading('Generating premium authenticity card image...');

      const qrImg = cardEl.querySelector('.auth-qr-image-box img');
      if (qrImg && qrImg.src.startsWith('http')) {
        try {
          const response = await fetch(qrImg.src);
          const blob = await response.blob();
          const dataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          qrImg.src = dataUrl;
        } catch (qrError) {
          console.warn('Failed to fetch QR image for html2canvas:', qrError);
        }
      }

      const canvas = await html2canvas(cardEl, {
        useCORS: true,
        allowTaint: false,
        scale: 3,
        backgroundColor: '#14120f',
        logging: false
      });

      const link = document.createElement('a');
      link.download = `FirstEdition_Authenticity_${item.uooNumber}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast.update(toastId, {
        render: 'Card downloaded successfully!',
        type: 'success',
        isLoading: false,
        autoClose: 4000
      });
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate image. Try print or screenshot.');
    } finally {
      window.__cardExportAllowed = false;
    }
  };

  const filtered = soldProducts.filter(sp => {
    if (isAdmin) {
      if (filterTab === 'active' && sp.isDeleted) return false;
      if (filterTab === 'deleted' && !sp.isDeleted) return false;
    } else {
      if (sp.isDeleted) return false;
    }

    const q = search.toLowerCase();
    return (
      sp.productName?.toLowerCase().includes(q) ||
      sp.productNumber?.toLowerCase().includes(q) ||
      sp.uooNumber?.toLowerCase().includes(q) ||
      sp.size?.toLowerCase().includes(q) ||
      sp.customerName?.toLowerCase().includes(q) ||
      sp.customerPhone?.toLowerCase().includes(q)
    );
  });

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

  const formatCardDate = (date) =>
    new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'long', year: 'numeric'
    });

  return (
    <div className="sold-products-page">
      <div className="container">
        {/* Header */}
        <div className="sp-header">
          <div className="sp-title-group">
            <h1 className="sp-title">Sold Products</h1>
            <p className="sp-subtitle">Authenticity records for every sold item</p>
          </div>
          <div className="sp-badge">{filtered.length} Sales</div>
        </div>

        {/* Admin Filter Tabs & Search Bar */}
        {isAdmin && (
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`sp-card-btn ${filterTab === 'active' ? 'active' : ''}`}
              style={{ background: filterTab === 'active' ? 'var(--dark-charcoal)' : 'var(--surface)', color: filterTab === 'active' ? '#fff' : 'var(--text-dark)', padding: '0.5rem 1rem' }}
              onClick={() => setFilterTab('active')}
            >
              Active Sales
            </button>
            <button
              type="button"
              className={`sp-card-btn ${filterTab === 'deleted' ? 'active' : ''}`}
              style={{ background: filterTab === 'deleted' ? '#C62828' : 'var(--surface)', color: filterTab === 'deleted' ? '#fff' : '#C62828', border: '1px solid #EF5350', padding: '0.5rem 1rem' }}
              onClick={() => setFilterTab('deleted')}
            >
              🗑️ Deleted Sales
            </button>
            <button
              type="button"
              className={`sp-card-btn ${filterTab === 'all' ? 'active' : ''}`}
              style={{ background: filterTab === 'all' ? 'var(--dark-charcoal)' : 'var(--surface)', color: filterTab === 'all' ? '#fff' : 'var(--text-dark)', padding: '0.5rem 1rem' }}
              onClick={() => setFilterTab('all')}
            >
              All Records
            </button>
          </div>
        )}

        {/* Search bar */}
        <div className="sp-search-wrap">
          <span className="sp-search-icon">🔍</span>
          <input
            className="sp-search"
            type="text"
            placeholder="Search by name, product number, UOO, or size…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="sp-loading">
            <div className="sp-spinner" />
            <p>Loading records…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="sp-empty">
            <span className="sp-empty-icon">📦</span>
            <h3>{search ? 'No matches found' : 'No sales recorded yet'}</h3>
            <p>{search ? 'Try a different search term.' : 'Sold items will appear here after the first sale.'}</p>
          </div>
        ) : (
          <div className="sp-table-wrap">
            <table className="sp-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Product #</th>
                  <th>UOO Number</th>
                  <th>Size</th>
                  <th>Channel</th>
                  <th>Customer Info</th>
                  <th>Sold By</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <tr key={item._id} style={item.isDeleted ? { opacity: 0.75, background: 'rgba(255, 235, 238, 0.3)' } : {}}>
                    <td>
                      <div className="sp-product-cell">
                        {item.product?.images?.[0]?.url && (
                          <img
                            className="sp-thumb"
                            src={item.product.images[0].url}
                            alt={item.productName}
                          />
                        )}
                        <span className="sp-product-name">
                          {item.productName}
                          {item.isDeleted && (
                            <span style={{
                              display: 'inline-block',
                              padding: '0.15rem 0.4rem',
                              borderRadius: '4px',
                              fontSize: '0.65rem',
                              fontWeight: '700',
                              background: '#FFEBEE',
                              color: '#C62828',
                              marginLeft: '0.4rem'
                            }}>DELETED</span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="sp-product-num">{item.productNumber}</span>
                    </td>
                    <td>
                      <span className="sp-uoo" style={item.isDeleted ? { textDecoration: 'line-through', color: '#888' } : {}}>{item.uooNumber}</span>
                    </td>
                    <td>
                      <div className="sp-specs" style={{ display: 'flex', gap: '0.4rem', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <span className="sp-size-badge" style={{ minWidth: '32px', textAlign: 'center' }}>Size {item.size}</span>
                        {item.color && (
                          <span className="sp-color-badge" style={{
                            display: 'inline-block',
                            padding: '0.2rem 0.5rem',
                            background: '#F0EAE0',
                            color: '#5C4E38',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            textTransform: 'uppercase'
                          }}>{item.color}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.6rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        background: item.saleChannel === 'amazon' ? '#FFF3E0' : '#E8F5E9',
                        color: item.saleChannel === 'amazon' ? '#E65100' : '#2E7D32',
                        border: `1px solid ${item.saleChannel === 'amazon' ? '#FF9900' : '#4CAF50'}`
                      }}>
                        {item.saleChannel === 'amazon' ? '📦 Amazon' : '🌐 Website'}
                      </span>
                    </td>
                    <td>
                      <div className="sp-customer-cell" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <span style={{ fontWeight: '700', color: '#000000', fontSize: '0.85rem' }}>
                          {item.customerName || 'Direct Customer'}
                        </span>
                        {item.customerPhone ? (
                          <span style={{ fontSize: '0.75rem', color: '#000000', fontFamily: 'monospace', fontWeight: '700' }}>
                            📞 {item.customerPhone}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#888888', fontStyle: 'italic' }}>No phone recorded</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="sp-sold-by">{item.soldBy?.name || 'Admin'}</span>
                    </td>
                    <td>
                      <span className="sp-date">{formatDate(item.soldAt)}</span>
                    </td>
                    <td>
                      <button
                        className="sp-card-btn"
                        onClick={() => handleViewCard(item)}
                        title="View Authenticity Card"
                      >
                        🪹 View Card
                      </button>
                      {item.saleChannel === 'amazon' && !item.isDeleted && (
                        <button
                          className="sp-card-btn"
                          style={{ marginTop: '0.4rem', background: '#FFF3E0', color: '#E65100', border: '1px solid #FF9900' }}
                          onClick={() => openAttachModal(item)}
                          title="Attach buyer info to certificate"
                        >
                          👤 Attach Customer
                        </button>
                      )}
                      {isAdmin && (
                        item.isDeleted ? (
                          <button
                            className="sp-card-btn"
                            style={{ marginTop: '0.4rem', background: '#E8F5E9', color: '#2E7D32', border: '1px solid #4CAF50' }}
                            onClick={() => handleRestoreSoldProduct(item)}
                            title="Restore this deleted sale"
                          >
                            🔄 Restore
                          </button>
                        ) : (
                          <button
                            className="sp-card-btn"
                            style={{ marginTop: '0.4rem', background: '#FFEBEE', color: '#C62828', border: '1px solid #EF5350' }}
                            onClick={() => handleDeleteSoldProduct(item)}
                            title="Delete/revoke this sale"
                          >
                            🗑️ Delete
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Card Modal */}
      {selectedCard && (
        <div className="card-overlay" onClick={() => setSelectedCard(null)}>
          <div className="card-modal" onClick={e => e.stopPropagation()}>
            <button className="card-close" onClick={() => setSelectedCard(null)}>✕</button>

            {/* The printable card */}
            <div className="auth-card" ref={cardRef} id="printable-card">
              {/* Card background decorations */}
              <div className="auth-card-bg-circle auth-card-bg-circle--1" data-html2canvas-ignore="true" />
              <div className="auth-card-bg-circle auth-card-bg-circle--2" data-html2canvas-ignore="true" />

              {/* Logo / Brand */}
              <div className="auth-card-logo">
                <img src="/logo.png" alt="First Edition" className="auth-logo-img" onError={e => e.target.style.display='none'} />
                <span className="auth-brand">FIRST EDITION</span>
              </div>

              {/* Title */}
              <div className="auth-card-title-row">
                <div className="auth-divider" />
                <h2 className="auth-card-title">Certificate of Authenticity</h2>
                <div className="auth-divider" />
              </div>

              {/* Product info */}
              <div className="auth-product-info">
                {(() => {
                  const { en, ar } = parseProductName(selectedCard.productName);
                  return (
                    <>
                      {en && (
                        <p className="auth-product-name auth-product-name--en" dir="ltr">
                          {en}
                        </p>
                      )}
                      {ar && (
                        <p className="auth-product-name auth-product-name--ar" dir="rtl" lang="ar">
                          {ar}
                        </p>
                      )}
                      {!en && !ar && (
                        <p className="auth-product-name" dir="auto">
                          {selectedCard.productName}
                        </p>
                      )}
                    </>
                  );
                })()}
                <span className="auth-size-tag">Size {selectedCard.size}</span>
              </div>

              {/* Numbers grid */}
              <div className="auth-numbers-grid">
                <div className="auth-number-block auth-number-block--product">
                  <span className="auth-number-label">PRODUCT NUMBER</span>
                  <span className="auth-number-value">{selectedCard.productNumber}</span>
                </div>
                <div className="auth-number-block auth-number-block--uoo">
                  <span className="auth-number-label">UOO NUMBER</span>
                  <span className="auth-number-value auth-uoo-value">{selectedCard.uooNumber}</span>
                  <span className="auth-number-sub">Unique Original Order</span>
                </div>
              </div>

              {/* Customer Info Row if available */}
              {(selectedCard.customerName || selectedCard.customerPhone) && (
                <div className="auth-customer-row" style={{
                  background: '#FFFFFF',
                  padding: '0.6rem 0.8rem',
                  borderRadius: '6px',
                  border: '1px solid #C8A45D',
                  marginBottom: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ textAlign: 'left' }}>
                    <span style={{ display: 'block', fontSize: '0.6rem', color: '#C8A45D', fontWeight: '700', letterSpacing: '1px' }}>ISSUED TO CUSTOMER</span>
                    <span style={{ display: 'block', fontSize: '0.85rem', color: '#000000', fontWeight: '700' }}>{selectedCard.customerName || 'Direct Customer'}</span>
                  </div>
                  {selectedCard.customerPhone && (
                    <span style={{ fontSize: '0.85rem', color: '#000000', fontFamily: 'monospace', fontWeight: '700' }}>
                      {selectedCard.customerPhone}
                    </span>
                  )}
                </div>
              )}

              {/* Date & Sold by */}
              <div className="auth-footer-row">
                <div className="auth-footer-item">
                  <span className="auth-footer-label">DATE OF SALE</span>
                  <span className="auth-footer-value">{formatCardDate(selectedCard.soldAt)}</span>
                </div>
                <div className="auth-footer-sep" />
                <div className="auth-footer-item">
                  <span className="auth-footer-label">VERIFIED BY</span>
                  <span className="auth-footer-value">{selectedCard.soldBy?.name || 'First Edition Team'}</span>
                </div>
                </div>

              {/* Authenticity note */}
              <p className="auth-guarantee">
                This card certifies that the item bearing the UOO Number above is a genuine
                First Edition product. This number is unique and cannot be replicated.
              </p>

              {/* Bottom security row (Seal & QR Code) */}
              <div className="auth-security-row" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '1.25rem',
                gap: '1.5rem',
                borderTop: '1px dashed rgba(200,164,93,0.25)',
                paddingTop: '1.25rem'
              }}>
                {/* Gold seal */}
                <div className="auth-seal" style={{ margin: 0 }}>
                  <div className="auth-seal-inner">
                    <span className="auth-seal-icon">✦</span>
                    <span className="auth-seal-text">AUTHENTIC</span>
                  </div>
                </div>

                {/* QR Code */}
                <div className="auth-qrcode-wrap" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  background: '#FCFBF8',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '12px',
                  border: '1px solid rgba(200, 164, 93, 0.35)',
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.02)'
                }}>
                  <div className="auth-qr-image-box" style={{
                    width: '60px',
                    height: '60px',
                    background: '#fff',
                    padding: '2px',
                    border: '1px solid #E8E0D0',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
                        `${window.location.origin}/verify?productNumber=${selectedCard.productNumber}&uoo=${selectedCard.uooNumber}`
                      )}`}
                      alt="Verify QR"
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  </div>
                  <div className="auth-qr-text-box" style={{ textAlign: 'left' }}>
                    <span style={{
                      display: 'block',
                      fontSize: '0.65rem',
                      fontWeight: '700',
                      color: '#1A1612',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase'
                    }}>Scan to Verify</span>
                    <span style={{
                      display: 'block',
                      fontSize: '0.55rem',
                      color: '#7A6F5E',
                      marginTop: '0.1rem',
                      lineHeight: 1.2
                    }}>First Edition Security Registry</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="card-actions">
              <button className="card-action-btn card-action-btn--print" onClick={handlePrint}>
                🖨️ Print
              </button>
              <button className="card-action-btn card-action-btn--image" onClick={() => handleDownloadImage(selectedCard)}>
                📥 Download Image
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Attach Customer Modal (Amazon sales) */}
      {attachItem && (
        <div className="card-overlay" onClick={closeAttachModal}>
          <div className="card-modal" style={{ maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
            <button className="card-close" onClick={closeAttachModal}>✕</button>
            <h2 style={{ marginBottom: '0.25rem' }}>👤 Attach Customer Info</h2>
            <p style={{ fontSize: '0.85rem', color: '#7A6F5E', marginBottom: '1.25rem' }}>
              Amazon sale — UOO: <strong>{attachItem.uooNumber}</strong>
            </p>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem' }}>Customer Name</label>
              <input
                type="text"
                className="sell-select"
                placeholder="e.g. Ahmed Hassan"
                value={attachName}
                onChange={e => setAttachName(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem' }}>Customer Phone</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ padding: '0.8rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', fontWeight: '600', fontSize: '0.9rem' }}>🇪🇬 +20</span>
                <input
                  type="tel"
                  className="sell-select"
                  placeholder="e.g. 01012345678"
                  value={attachPhone}
                  onChange={e => setAttachPhone(e.target.value)}
                  style={{ flex: 1 }}
                />
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="btn-confirm-sell"
                style={{ background: '#FF9900', borderColor: '#FF9900' }}
                onClick={handleAttachCustomer}
                disabled={attaching || (!attachName.trim() && !attachPhone.trim())}
              >
                {attaching ? 'Saving...' : 'Save to Certificate'}
              </button>
              <button className="btn-cancel-sell" onClick={closeAttachModal} disabled={attaching}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSoldProducts;
