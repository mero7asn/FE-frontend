import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { productAPI, uploadAPI } from '../../services/api';
import sanitizeInput from '../../utils/sanitize';
import { toast } from 'react-toastify';
import { detectHumanInImage } from '../../utils/detection';
import './ProductForm.css';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const UploadZone = ({ role, label, description, image, uploading, scanning, onUpload, onRemove, multiple }) => {
  const inputRef = useRef();
  return (
    <div className={`image-zone image-zone--${role}`}>
      <div className="image-zone-header">
        <span className={`image-zone-badge badge--${role}`}>{label}</span>
        <p className="image-zone-desc">{description}</p>
      </div>
      {image ? (
        <div className="image-zone-preview">
          <img src={image.url} alt={label} />
          <button type="button" className="image-zone-remove" onClick={() => onRemove(image.url)}>✕ Remove</button>
        </div>
      ) : (
        <div
          className={`upload-zone-label ${uploading[role] || scanning[role] ? 'uploading' : ''}`}
          onClick={() => inputRef.current.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple={multiple}
            onChange={e => onUpload(Array.from(e.target.files), role)}
            style={{ display: 'none' }}
          />
          <div className="upload-zone-inner">
            <span className="upload-zone-icon">{role === 'primary' ? '🖼️' : role === 'secondary' ? '🔄' : '📷'}</span>
            <span>{scanning[role] ? 'Scanning…' : uploading[role] ? 'Uploading…' : `Upload ${label}`}</span>
          </div>
        </div>
      )}
    </div>
  );
};

const GalleryUploadZone = ({ uploading, onUpload }) => {
  const inputRef = useRef();
  return (
    <div
      className={`upload-zone-label ${uploading.others ? 'uploading' : ''}`}
      onClick={() => inputRef.current.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={e => onUpload(Array.from(e.target.files), 'others')}
        style={{ display: 'none' }}
      />
      <div className="upload-zone-inner">
        <span className="upload-zone-icon">📷</span>
        <span>{uploading.others ? 'Uploading…' : '+ Add Gallery Images'}</span>
      </div>
    </div>
  );
};

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState({ primary: false, secondary: false, others: false });
  const [scanning, setScanning] = useState({ primary: false, secondary: false, others: false });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    discountPercentage: '',
    images: [],
    sizes: SIZES.map(size => ({ size, stock: size === 'M' || size === 'L' || size === 'XL' || size === 'XXL' ? 2 : 0, isAvailable: size !== 'XS' && size !== 'S' })),
    colors: [],
    isAvailable: true,
    isFeatured: false,
    whatsappNumber: '',
    isAudiencePick: false,
    audienceMenPercentage: '',
    audienceWomenPercentage: '',
    votingDescription: ''
  });

  const loadProduct = async () => {
    try {
      const { data } = await productAPI.getOne(id);
      setFormData({
        ...data,
        sizes: (data.sizes || []).map(s =>
          typeof s === 'string' ? { size: s, stock: 10, isAvailable: true } : s
        )
      });
    } catch {
      toast.error('Failed to load product');
    }
  };

  useEffect(() => { 
    if (id) loadProduct(); 
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Derived views of images by role
  const primaryImage   = formData.images.find(img => img.isPrimary);
  const secondaryImage = formData.images.find(img => img.isSecondary);
  const otherImages    = formData.images.filter(img => !img.isPrimary && !img.isSecondary);

  const handleUpload = async (files, role) => {
    if (!files.length) return;

    setScanning(prev => ({ ...prev, [role]: true }));
    try {
      for (const file of files) {
        try {
          const { predictions } = await detectHumanInImage(file);
          const detected = predictions.filter(
            p => p.class === 'person' && p.score >= 0.5
          );
          if (detected.length > 0) {
            console.warn(`Detection warning for "${file.name}":`, detected);
          }
        } catch (err) {
          console.warn('Face/body detection failed, skipping scanning step:', err);
        }
      }
    } finally {
      setScanning(prev => ({ ...prev, [role]: false }));
    }

    setUploading(prev => ({ ...prev, [role]: true }));
    try {
      const { data } = await uploadAPI.uploadImages(files);
      const newImgs = data.map(img => ({
        ...img,
        isPrimary:   role === 'primary',
        isSecondary: role === 'secondary'
      }));

      setFormData(prev => {
        let images = [...prev.images];

        if (role === 'primary') {
          images = images.filter(i => !i.isPrimary);
          images = [newImgs[0], ...images];
        } else if (role === 'secondary') {
          images = images.filter(i => !i.isSecondary);
          images = [images[0] || null, newImgs[0], ...images.slice(1)].filter(Boolean);
        } else {
          images = [...images, ...newImgs];
        }
        return { ...prev, images };
      });

      toast.success(`${role.charAt(0).toUpperCase() + role.slice(1)} image uploaded`);
    } catch {
      toast.error('Image upload failed');
    } finally {
      setUploading(prev => ({ ...prev, [role]: false }));
    }
  };

  const removeImage = (url) => {
    setFormData(prev => ({ ...prev, images: prev.images.filter(i => i.url !== url) }));
  };

  const handleSizeToggle = (size) => {
    const exists = formData.sizes.some(s => s.size === size);
    setFormData(prev => ({
      ...prev,
      sizes: exists
        ? prev.sizes.filter(s => s.size !== size)
        : [...prev.sizes, { size, stock: 2, isAvailable: true }]
    }));
  };

  const updateSize = (size, field, value) => {
    setFormData(prev => ({
      ...prev,
      sizes: prev.sizes.map(s => s.size === size ? { ...s, [field]: value } : s)
    }));
  };

  const calculateDiscountPercentage = (origPrice, finalPrice) => {
    const op = parseFloat(origPrice);
    const fp = parseFloat(finalPrice);
    if (op && fp && fp < op) {
      return Math.round(((op - fp) / op) * 100);
    }
    return 0;
  };

  const handleOriginalPriceChange = (e) => {
    const originalPrice = e.target.value;
    setFormData(prev => {
      const discountPercentage = calculateDiscountPercentage(originalPrice, prev.price);
      return { ...prev, originalPrice, discountPercentage };
    });
  };

  const handlePriceChange = (e) => {
    const price = e.target.value;
    setFormData(prev => {
      const discountPercentage = calculateDiscountPercentage(prev.originalPrice, price);
      return { ...prev, price, discountPercentage };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!primaryImage) return toast.error('Please upload a primary (front) image');
    setLoading(true);
    try {
      if (id) {
        await productAPI.update(id, formData);
        toast.success('Product updated');
      } else {
        await productAPI.create(formData);
        toast.success('Product created');
      }
      navigate('/admin/products');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="product-form-page">
      <div className="container">
        <h1>{id ? 'Edit Product' : 'Add New Product'}</h1>

        <form onSubmit={handleSubmit} className="product-form">

          {/* Basic Info */}
          <div className="form-section">
            <h3>Basic Info</h3>
            <div className="form-group">
              <label>Product Name *</label>
              <input type="text" value={formData.name}
                onChange={e => setFormData({ ...formData, name: sanitizeInput(e.target.value) })} required />
            </div>
            <div className="form-group">
              <label>Description *</label>
              <textarea value={formData.description} rows="4"
                onChange={e => setFormData({ ...formData, description: sanitizeInput(e.target.value) })} required />
            </div>
            <div className="form-group">
              <label>Original Price (EGP)</label>
              <input type="number" step="0.01" min="0" value={formData.originalPrice}
                onChange={handleOriginalPriceChange} placeholder="e.g. 1200" />
            </div>
            <div className="form-group">
              <label>Price After Discount (EGP) *</label>
              <input type="number" step="0.01" min="0" value={formData.price}
                onChange={handlePriceChange} placeholder="e.g. 1000" required />
              {formData.originalPrice && formData.price && Number(formData.price) < Number(formData.originalPrice) && (
                <small style={{ color: 'var(--main-gold, #c8a25d)', display: 'block', marginTop: '0.3rem' }}>
                  Calculated discount: {formData.discountPercentage}%
                </small>
              )}
            </div>
          </div>

          {/* Images — 3 zones */}
          <div className="form-section">
            <h3>Product Images</h3>
            <div className="image-zones-grid">
              <UploadZone
                role="primary"
                label="Primary — Front"
                description="Shown on product card by default"
                image={primaryImage}
                uploading={uploading}
                scanning={scanning}
                onUpload={handleUpload}
                onRemove={removeImage}
              />
              <UploadZone
                role="secondary"
                label="Secondary — Back"
                description="Shown when hovering the product card"
                image={secondaryImage}
                uploading={uploading}
                scanning={scanning}
                onUpload={handleUpload}
                onRemove={removeImage}
              />
            </div>

            {/* Others */}
            <div className="image-zone image-zone--others">
              <div className="image-zone-header">
                <span className="image-zone-badge badge--others">Gallery Images</span>
                <p className="image-zone-desc">Additional images shown only on the product detail page</p>
              </div>
              <GalleryUploadZone uploading={uploading} onUpload={handleUpload} />
              {otherImages.length > 0 && (
                <div className="image-previews">
                  {otherImages.map((img, i) => (
                    <div key={i} className="image-preview">
                      <img src={img.url} alt={`Gallery ${i + 1}`} />
                      <div className="image-preview-actions">
                        <button type="button" className="remove-img" onClick={() => removeImage(img.url)}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sizes & Availability */}
          <div className="form-section">
            <h3>Sizes &amp; Availability</h3>
            <div className="sizes-stock-list">
              {SIZES.map(size => {
                const sizeItem = formData.sizes.find(s => s.size === size);
                return (
                  <div key={size} className={`size-stock-row ${sizeItem ? 'active' : ''}`}>
                    <label className="checkbox-label">
                      <input type="checkbox" checked={!!sizeItem} onChange={() => handleSizeToggle(size)} />
                      <span className="size-label">{size}</span>
                    </label>
                    {sizeItem && (
                      <div className="size-stock-fields">
                        <div className="field-group">
                          <label>Stock</label>
                          <input type="number" min="0" className="stock-input"
                            value={sizeItem.stock}
                            onChange={e => updateSize(size, 'stock', parseInt(e.target.value) || 0)} />
                        </div>
                        <label className="availability-toggle">
                          <input type="checkbox" checked={sizeItem.isAvailable}
                            onChange={e => updateSize(size, 'isAvailable', e.target.checked)} />
                          Available
                        </label>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

           {/* Colors */}
           <div className="form-section">
             <h3>Colors</h3>
             <div className="form-group">
               <label>Available Colors (comma separated)</label>
               <input type="text" placeholder="e.g. Black, White, Navy"
                 value={formData.colors.join(', ')}
                 onChange={e => setFormData({ ...formData, colors: sanitizeInput(e.target.value).split(',').map(c => c.trim()).filter(Boolean) })} />
             </div>
           </div>

            {/* Audience Voting */}
            <div className="form-section">
              <h3>Audience Voting</h3>
              <p className="section-description">
                Mark this product as an audience-chosen pick and display the gender breakdown 
                chosen by public vote. Each percentage is independent (men out of 100, women out of 100).
              </p>
              <div className="form-checkboxes">
                <label className="checkbox-label">
                  <input type="checkbox" checked={formData.isAudiencePick}
                    onChange={e => setFormData({ ...formData, isAudiencePick: e.target.checked })} />
                  Audience Pick (marked as chosen by public vote)
                </label>
              </div>
              {formData.isAudiencePick && (
                <div className="audience-voting-fields">
                  <div className="form-group">
                    <label>Men Percentage (%)</label>
                    <input type="number" min="0" max="100" placeholder="e.g. 65"
                      value={formData.audienceMenPercentage}
                      onChange={e => {
                        const men = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                        setFormData({ ...formData, audienceMenPercentage: men });
                      }} />
                  </div>
                  <div className="form-group">
                    <label>Women Percentage (%)</label>
                    <input type="number" min="0" max="100" placeholder="e.g. 70"
                      value={formData.audienceWomenPercentage}
                      onChange={e => {
                        const women = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                        setFormData({ ...formData, audienceWomenPercentage: women });
                      }} />
                  </div>
                  <p className="voting-hint">Each percentage is out of 100 independently. Example: 65% men, 70% women.</p>
                </div>
              )}
              {formData.isAudiencePick && (
                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label>Voting Description</label>
                  <textarea rows="3" placeholder="e.g. Voted by 2,400+ customers in our Summer 2026 poll"
                    value={formData.votingDescription}
                    onChange={e => setFormData({ ...formData, votingDescription: sanitizeInput(e.target.value) })} />
                </div>
              )}
            </div>

           {/* Settings */}
          <div className="form-section">
            <h3>Settings</h3>
            <div className="form-group">
              <label>WhatsApp Number</label>
              <input type="text" placeholder="+1234567890" value={formData.whatsappNumber}
                onChange={e => setFormData({ ...formData, whatsappNumber: sanitizeInput(e.target.value) })} />
            </div>
            <div className="form-checkboxes">
              <label className="checkbox-label">
                <input type="checkbox" checked={formData.isAvailable}
                  onChange={e => setFormData({ ...formData, isAvailable: e.target.checked })} />
                Available for sale
              </label>
              <label className="checkbox-label">
                <input type="checkbox" checked={formData.isFeatured}
                  onChange={e => setFormData({ ...formData, isFeatured: e.target.checked })} />
                Featured on homepage
              </label>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading || Object.values(uploading).some(Boolean) || Object.values(scanning).some(Boolean)}>
              {loading ? 'Saving...' : (id ? 'Update Product' : 'Create Product')}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => navigate('/admin/products')}>
              Cancel
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default ProductForm;
