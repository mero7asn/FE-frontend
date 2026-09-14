import React, { useState, useEffect } from 'react';
import { settingAPI } from '../../services/api';
import { useStore } from '../../context/StoreContext';
import { toast } from 'react-toastify';
import { FiSliders, FiCreditCard, FiMessageSquare, FiSave, FiCheckCircle, FiShield } from 'react-icons/fi';
import './AdminStoreSettings.css';

const AdminStoreSettings = () => {
  const { setWorkModelDirect, refreshSettings } = useStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [workModel, setWorkModel] = useState('whatsapp');
  const [paymentSettings, setPaymentSettings] = useState({
    activeGateway: 'paymob',
    enableCOD: true,
    currency: 'EGP',
    shippingRate: 75,
    freeShippingThreshold: 2000,
    paymob: {
      apiKey: '',
      secretKey: '',
      publicKey: '',
      integrationIdCard: '',
      integrationIdWallet: '',
      iframeId: '',
      hmacSecret: '',
      isLive: false
    },
    stripe: {
      publishableKey: '',
      secretKey: '',
      webhookSecret: '',
      isLive: false
    }
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const { data } = await settingAPI.getAdminSettings();
      if (data) {
        if (data.workModel) setWorkModel(data.workModel);
        if (data.paymentSettings) setPaymentSettings(data.paymentSettings);
      }
    } catch (err) {
      toast.error('Failed to load store settings');
    } finally {
      setLoading(false);
    }
  };

  const handleModelChange = async (newModel) => {
    setWorkModel(newModel);
    try {
      await settingAPI.updateWorkModel(newModel);
      setWorkModelDirect(newModel);
      await refreshSettings();
      toast.success(`Work model switched to: ${newModel === 'whatsapp' ? 'WhatsApp Direct' : 'Card / Online Cart'}`);
    } catch (err) {
      toast.error(err.displayMessage || 'Failed to update work model');
    }
  };

  const handlePaymobChange = (field, value) => {
    setPaymentSettings(prev => ({
      ...prev,
      paymob: { ...prev.paymob, [field]: value }
    }));
  };

  const handleStripeChange = (field, value) => {
    setPaymentSettings(prev => ({
      ...prev,
      stripe: { ...prev.stripe, [field]: value }
    }));
  };

  const handleSavePaymentSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await settingAPI.updatePaymentSettings(paymentSettings);
      await refreshSettings();
      toast.success('Payment gateway & store settings saved successfully!');
    } catch (err) {
      toast.error(err.displayMessage || 'Failed to save payment settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-store-settings loading-state">
        <div className="container">
          <p>Loading Store Settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-store-settings">
      <div className="container">
        <div className="settings-header">
          <div className="settings-header-title">
            <FiSliders className="header-icon" />
            <div>
              <h1>Store & Payment Settings</h1>
              <p>Control whether customers order via WhatsApp or Online Card Checkout with Shopping Cart.</p>
            </div>
          </div>
        </div>

        {/* 1. Work Model Switcher Section */}
        <div className="settings-card model-switcher-card">
          <div className="card-header">
            <h2>Active Store Work Model</h2>
            <span className="badge-active-model">
              Active: {workModel === 'whatsapp' ? '💬 WhatsApp Model' : '💳 Card / Cart Model'}
            </span>
          </div>
          <p className="card-desc">
            You can switch back and forth between WhatsApp mode and Card checkout mode at any time. All changes apply immediately across the entire store.
          </p>

          <div className="model-options-grid">
            <div 
              className={`model-option-box ${workModel === 'whatsapp' ? 'selected' : ''}`}
              onClick={() => handleModelChange('whatsapp')}
            >
              <div className="option-radio-icon">
                {workModel === 'whatsapp' ? <FiCheckCircle className="checked" /> : <div className="unchecked" />}
              </div>
              <div className="option-icon-box whatsapp-icon-box">
                <FiMessageSquare />
              </div>
              <div className="option-details">
                <h3>WhatsApp Direct Model</h3>
                <p>Customers click "Order via WhatsApp" on products. Pre-formatted message with image & specs is generated directly to your WhatsApp.</p>
                <div className="model-features-list">
                  <span>✓ Direct WhatsApp communication</span>
                  <span>✓ Minimal friction for custom requests</span>
                  <span>✓ Cart hidden / disabled</span>
                </div>
              </div>
            </div>

            <div 
              className={`model-option-box ${workModel === 'card_checkout' ? 'selected' : ''}`}
              onClick={() => handleModelChange('card_checkout')}
            >
              <div className="option-radio-icon">
                {workModel === 'card_checkout' ? <FiCheckCircle className="checked" /> : <div className="unchecked" />}
              </div>
              <div className="option-icon-box card-icon-box">
                <FiCreditCard />
              </div>
              <div className="option-details">
                <h3>Card / Online Checkout Model</h3>
                <p>Customers use full shopping cart, login/signup, place orders with cards, mobile wallets or COD, and track orders with digital UUO cards.</p>
                <div className="model-features-list">
                  <span>✓ Interactive Shopping Cart & Drawer</span>
                  <span>✓ Pay with Visa/Mastercard/Wallets</span>
                  <span>✓ Customer Account & Digital UUO Cards</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Payment Gateway Configuration Form */}
        <form onSubmit={handleSavePaymentSettings} className="payment-settings-form">
          <div className="settings-card">
            <div className="card-header">
              <h2>Payment Gateway Integration</h2>
              <FiShield className="shield-icon" />
            </div>
            <p className="card-desc">
              Configure online payment gateways (Paymob / Accept for Egypt & Middle East, or Stripe for international cards).
            </p>

            <div className="form-row-grid">
              <div className="form-group">
                <label>Primary Gateway Provider</label>
                <select
                  value={paymentSettings.activeGateway}
                  onChange={(e) => setPaymentSettings({ ...paymentSettings, activeGateway: e.target.value })}
                >
                  <option value="paymob">Paymob (Cards, Vodafone Cash, Wallets, InstaPay)</option>
                  <option value="stripe">Stripe (Visa, Mastercard, Amex)</option>
                  <option value="cod">Cash on Delivery Only</option>
                </select>
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={paymentSettings.enableCOD}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, enableCOD: e.target.checked })}
                  />
                  <span>Enable Cash on Delivery (COD) Option</span>
                </label>
              </div>
            </div>

            {/* Paymob Specific Fields */}
            {paymentSettings.activeGateway === 'paymob' && (
              <div className="gateway-subpanel">
                <h3>Paymob (Accept) Credentials</h3>
                <p className="subpanel-desc">Get these from your Paymob Dashboard under Settings → Developer Keys.</p>

                <div className="form-row-grid">
                  <div className="form-group">
                    <label>Public Key (Client Side)</label>
                    <input
                      type="text"
                      placeholder="egy_pk_test_..."
                      value={paymentSettings.paymob?.publicKey || ''}
                      onChange={(e) => handlePaymobChange('publicKey', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>API Secret Key</label>
                    <input
                      type="password"
                      placeholder="egy_sk_test_..."
                      value={paymentSettings.paymob?.secretKey || ''}
                      onChange={(e) => handlePaymobChange('secretKey', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-row-grid">
                  <div className="form-group">
                    <label>Card Integration ID</label>
                    <input
                      type="text"
                      placeholder="e.g. 123456"
                      value={paymentSettings.paymob?.integrationIdCard || ''}
                      onChange={(e) => handlePaymobChange('integrationIdCard', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Wallet / InstaPay Integration ID</label>
                    <input
                      type="text"
                      placeholder="e.g. 654321"
                      value={paymentSettings.paymob?.integrationIdWallet || ''}
                      onChange={(e) => handlePaymobChange('integrationIdWallet', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Iframe ID</label>
                    <input
                      type="text"
                      placeholder="e.g. 987654"
                      value={paymentSettings.paymob?.iframeId || ''}
                      onChange={(e) => handlePaymobChange('iframeId', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>HMAC Secret (Webhook Verification)</label>
                  <input
                    type="password"
                    placeholder="Enter HMAC Secret from Paymob"
                    value={paymentSettings.paymob?.hmacSecret || ''}
                    onChange={(e) => handlePaymobChange('hmacSecret', e.target.value)}
                  />
                </div>

                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={paymentSettings.paymob?.isLive || false}
                      onChange={(e) => handlePaymobChange('isLive', e.target.checked)}
                    />
                    <span><strong>Live Production Mode</strong> (Uncheck for Test / Sandbox Mode)</span>
                  </label>
                </div>
              </div>
            )}

            {/* Stripe Specific Fields */}
            {paymentSettings.activeGateway === 'stripe' && (
              <div className="gateway-subpanel">
                <h3>Stripe Credentials</h3>
                <div className="form-row-grid">
                  <div className="form-group">
                    <label>Stripe Publishable Key</label>
                    <input
                      type="text"
                      placeholder="pk_test_..."
                      value={paymentSettings.stripe?.publishableKey || ''}
                      onChange={(e) => handleStripeChange('publishableKey', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Stripe Secret Key</label>
                    <input
                      type="password"
                      placeholder="sk_test_..."
                      value={paymentSettings.stripe?.secretKey || ''}
                      onChange={(e) => handleStripeChange('secretKey', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={paymentSettings.stripe?.isLive || false}
                      onChange={(e) => handleStripeChange('isLive', e.target.checked)}
                    />
                    <span><strong>Live Production Mode</strong> (Uncheck for Test Mode)</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* 3. Delivery & Shipping Rates */}
          <div className="settings-card">
            <h2>Shipping & Delivery Rates</h2>
            <div className="form-row-grid">
              <div className="form-group">
                <label>Standard Shipping Rate (EGP)</label>
                <input
                  type="number"
                  min="0"
                  value={paymentSettings.shippingRate}
                  onChange={(e) => setPaymentSettings({ ...paymentSettings, shippingRate: Number(e.target.value) })}
                />
              </div>

              <div className="form-group">
                <label>Free Shipping Threshold (EGP)</label>
                <input
                  type="number"
                  min="0"
                  value={paymentSettings.freeShippingThreshold}
                  onChange={(e) => setPaymentSettings({ ...paymentSettings, freeShippingThreshold: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>

          <div className="settings-submit-bar">
            <button type="submit" className="btn btn-primary save-btn" disabled={saving}>
              <FiSave />
              <span>{saving ? 'Saving Settings...' : 'Save Payment & Store Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminStoreSettings;
