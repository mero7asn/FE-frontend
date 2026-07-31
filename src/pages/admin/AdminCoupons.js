import React, { useState, useEffect } from 'react';
import { couponAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import './AdminCoupons.css';

const emptyForm = {
  code: '',
  discountType: 'percentage',
  discountValue: '',
  minPurchase: '',
  usageLimit: '',
  maxDiscount: '',
  startDate: '',
  endDate: '',
  isActive: true
};

const AdminCoupons = () => {
  const { hasPermission } = useAuth();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    try {
      const { data } = await couponAPI.getAll();
      setCoupons(data);
    } catch (error) {
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setShowForm(true);
  };

  const handleOpenEdit = (coupon) => {
    setEditingId(coupon._id);
    setFormData({
      code: coupon.code || '',
      discountType: coupon.discountType || 'percentage',
      discountValue: coupon.discountValue ?? '',
      minPurchase: coupon.minPurchase ?? '',
      usageLimit: coupon.usageLimit ?? '',
      maxDiscount: coupon.maxDiscount ?? '',
      startDate: coupon.startDate ? coupon.startDate.slice(0, 10) : '',
      endDate: coupon.endDate ? coupon.endDate.slice(0, 10) : '',
      isActive: coupon.isActive ?? true
    });
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(emptyForm);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        discountValue: formData.discountValue === '' ? 0 : Number(formData.discountValue),
        minPurchase: formData.minPurchase === '' ? 0 : Number(formData.minPurchase),
        usageLimit: formData.usageLimit === '' ? undefined : Number(formData.usageLimit),
        maxDiscount: formData.maxDiscount === '' ? undefined : Number(formData.maxDiscount),
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined
      };

      if (editingId) {
        await couponAPI.update(editingId, payload);
        toast.success('Coupon updated');
      } else {
        await couponAPI.create(payload);
        toast.success('Coupon created');
      }
      handleCloseForm();
      loadCoupons();
    } catch (error) {
      toast.error(error.displayMessage || 'Failed to save coupon');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this coupon? This cannot be undone.')) return;
    try {
      await couponAPI.delete(id);
      toast.success('Coupon deleted');
      loadCoupons();
    } catch (error) {
      toast.error('Failed to delete coupon');
    }
  };

  const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString();
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="admin-coupons">
      <div className="container">
        <div className="admin-header">
          <h1>Manage Coupons</h1>
          {hasPermission('coupons_create') && (
            <button className="btn btn-primary" onClick={handleOpenCreate}>
              Create Coupon
            </button>
          )}
        </div>

        {showForm && (
          <div className="coupon-form-overlay">
            <div className="coupon-form-modal">
              <h2>{editingId ? 'Edit Coupon' : 'Create Coupon'}</h2>
              <form className="coupon-form" onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Coupon Code *</label>
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleChange}
                      required
                      placeholder="e.g. SAVE20"
                      disabled={!!editingId}
                    />
                  </div>
                  <div className="form-group">
                    <label>Discount Type *</label>
                    <select name="discountType" value={formData.discountType} onChange={handleChange}>
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (EGP)</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Discount Value *</label>
                    <input
                      type="number"
                      name="discountValue"
                      value={formData.discountValue}
                      onChange={handleChange}
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="form-group">
                    <label>Max Discount (EGP)</label>
                    <input
                      type="number"
                      name="maxDiscount"
                      value={formData.maxDiscount}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      placeholder="No cap"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Min Purchase (EGP)</label>
                    <input
                      type="number"
                      name="minPurchase"
                      value={formData.minPurchase}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="form-group">
                    <label>Usage Limit</label>
                    <input
                      type="number"
                      name="usageLimit"
                      value={formData.usageLimit}
                      onChange={handleChange}
                      min="1"
                      placeholder="Unlimited"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Start Date</label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>End Date</label>
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-group form-group-checkbox">
                  <label>
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleChange}
                    />
                    Active
                  </label>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving...' : (editingId ? 'Update Coupon' : 'Create Coupon')}
                  </button>
                  <button type="button" className="btn btn-outline" onClick={handleCloseForm} disabled={saving}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="coupons-table-wrapper">
          <table className="coupons-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Type</th>
                <th>Value</th>
                <th>Min Purchase</th>
                <th>Usage</th>
                <th>Limit</th>
                <th>Dates</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan="9" className="empty-row">No coupons found</td>
                </tr>
              ) : coupons.map(coupon => (
                <tr key={coupon._id}>
                  <td><strong>{coupon.code}</strong></td>
                  <td>{coupon.discountType === 'percentage' ? '%' : 'EGP'}</td>
                  <td>{coupon.discountValue}{coupon.discountType === 'percentage' ? '%' : ' EGP'}</td>
                  <td>{coupon.minPurchase ? `EGP ${Number(coupon.minPurchase).toLocaleString('en-EG')}` : '-'}</td>
                  <td>{coupon.usedCount ?? 0}</td>
                  <td>{coupon.usageLimit ?? '∞'}</td>
                  <td>
                    {formatDate(coupon.startDate)} — {formatDate(coupon.endDate)}
                  </td>
                  <td>
                    <span className={`status-badge ${coupon.isActive ? 'available' : 'unavailable'}`}>
                      {coupon.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {hasPermission('coupons_edit') && (
                        <button className="btn-edit" onClick={() => handleOpenEdit(coupon)}>
                          Edit
                        </button>
                      )}
                      {hasPermission('coupons_delete') && (
                        <button className="btn-delete" onClick={() => handleDelete(coupon._id)}>
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
      </div>
    </div>
  );
};

export default AdminCoupons;
