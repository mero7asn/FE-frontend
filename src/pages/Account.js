import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { authAPI, orderAPI } from '../services/api';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { 
  FiUser, 
  FiPackage, 
  FiAward, 
  FiLock, 
  FiMapPin, 
  FiPhone, 
  FiMail, 
  FiCalendar, 
  FiExternalLink,
  FiCheckCircle,
  FiClock,
  FiTruck,
  FiShoppingBag
} from 'react-icons/fi';
import './Account.css';

const Account = () => {
  const { user, updateUser } = useAuth();
  const { t, isRTL } = useLanguage();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'orders' | 'cards' | 'security'

  // Profile State
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    addresses: user?.addresses || []
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // New Address form state
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    street: '',
    city: 'Cairo',
    state: 'Cairo',
    zipCode: '',
    isDefault: false
  });

  // Orders State
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // My UUO Cards State
  const [uooCards, setUooCards] = useState([]);
  const [loadingCards, setLoadingCards] = useState(false);

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submittingPassword, setSubmittingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        phone: user.phone || '',
        addresses: user.addresses || []
      });
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'orders') {
      loadOrders();
    } else if (activeTab === 'cards') {
      loadUooCards();
    }
  }, [activeTab]);

  const loadOrders = async () => {
    setLoadingOrders(true);
    try {
      const { data } = await orderAPI.getMyOrders();
      setOrders(data || []);
    } catch (error) {
      toast.error(error.displayMessage || 'Failed to load orders');
    } finally {
      setLoadingOrders(false);
    }
  };

  const loadUooCards = async () => {
    setLoadingCards(true);
    try {
      const { data } = await authAPI.getMyCards();
      setUooCards(data || []);
    } catch (error) {
      toast.error(error.displayMessage || 'Failed to load UUO authenticity cards');
    } finally {
      setLoadingCards(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { data } = await authAPI.updateProfile(profileData);
      updateUser(data);
      toast.success(isRTL ? 'تم تحديث الملف الشخصي بنجاح' : 'Profile updated successfully');
    } catch (error) {
      toast.error(error.displayMessage || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddAddress = (e) => {
    e.preventDefault();
    if (!newAddress.street.trim()) return;

    const updatedAddresses = [...profileData.addresses, newAddress];
    setProfileData({ ...profileData, addresses: updatedAddresses });
    setNewAddress({ street: '', city: 'Cairo', state: 'Cairo', zipCode: '', isDefault: false });
    setShowAddressForm(false);
    toast.info(isRTL ? 'اضغط حفظ لتأكيد العنوان الجديد' : 'Click "Save Profile" to save your new address');
  };

  const handleRemoveAddress = (index) => {
    const updated = profileData.addresses.filter((_, i) => i !== index);
    setProfileData({ ...profileData, addresses: updated });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error(isRTL ? 'كلمتا المرور غير متطابقتين' : 'New passwords do not match');
      return;
    }

    setSubmittingPassword(true);
    try {
      await authAPI.updatePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success(isRTL ? 'تم تغيير كلمة المرور بنجاح' : 'Password updated successfully');
    } catch (error) {
      toast.error(error.displayMessage || 'Failed to update password');
    } finally {
      setSubmittingPassword(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
      case 'processing':
        return <span className="status-pill status-processing"><FiClock /> {isRTL ? 'قيد التجهيز' : 'Processing'}</span>;
      case 'shipped':
        return <span className="status-pill status-shipped"><FiTruck /> {isRTL ? 'تم الشحن' : 'Shipped'}</span>;
      case 'delivered':
        return <span className="status-pill status-delivered"><FiCheckCircle /> {isRTL ? 'تم التوصيل' : 'Delivered'}</span>;
      case 'canceled':
        return <span className="status-pill status-canceled">{isRTL ? 'ملغي' : 'Canceled'}</span>;
      default:
        return <span className="status-pill status-pending"><FiClock /> {isRTL ? 'قيد الانتظار' : 'Pending'}</span>;
    }
  };

  return (
    <div className="account-page">
      <div className="container">
        <div className="account-header">
          <h1>{isRTL ? 'حسابي' : 'My Account'}</h1>
          <p className="account-welcome">
            {isRTL ? `مرحباً، ${user?.name}` : `Welcome back, ${user?.name}`}
          </p>
        </div>

        <div className="account-layout">
          {/* Sidebar Tabs */}
          <aside className="account-sidebar">
            <button 
              className={`account-nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <FiUser />
              <span>{isRTL ? 'الملف الشخصي والعناوين' : 'Profile & Addresses'}</span>
            </button>

            <button 
              className={`account-nav-btn ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              <FiPackage />
              <span>{isRTL ? 'طلباتي' : 'My Orders'}</span>
              {orders.length > 0 && <span className="tab-count">{orders.length}</span>}
            </button>

            <button 
              className={`account-nav-btn ${activeTab === 'cards' ? 'active' : ''}`}
              onClick={() => setActiveTab('cards')}
            >
              <FiAward />
              <span>{isRTL ? 'كروت الأصالة (UUO Cards)' : 'My UUO Cards'}</span>
              {uooCards.length > 0 && <span className="tab-count gold-count">{uooCards.length}</span>}
            </button>

            <button 
              className={`account-nav-btn ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <FiLock />
              <span>{isRTL ? 'الأمان وكلمة المرور' : 'Security & Password'}</span>
            </button>
          </aside>

          {/* Tab Content */}
          <main className="account-content">
            {/* 1. PROFILE & ADDRESSES */}
            {activeTab === 'profile' && (
              <div className="account-card">
                <h2>{isRTL ? 'معلومات الحساب' : 'Account Details'}</h2>
                <p className="card-subtext">{isRTL ? 'تعديل بياناتك الشخصية وعناوين التوصيل المسجلة' : 'Update your personal details and delivery addresses.'}</p>

                <form onSubmit={handleUpdateProfile} className="profile-form">
                  <div className="form-grid">
                    <div className="form-group">
                      <label><FiUser /> {isRTL ? 'الاسم الكامل' : 'Full Name'}</label>
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label><FiMail /> {isRTL ? 'البريد الإلكتروني' : 'Email Address'}</label>
                      <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="disabled-input"
                      />
                    </div>

                    <div className="form-group">
                      <label><FiPhone /> {isRTL ? 'رقم الهاتف' : 'Phone Number'}</label>
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        placeholder="+20 1xx xxx xxxx"
                      />
                    </div>
                  </div>

                  {/* Saved Addresses */}
                  <div className="addresses-section">
                    <div className="addresses-header">
                      <h3><FiMapPin /> {isRTL ? 'دفتر العناوين' : 'Saved Addresses'}</h3>
                      <button 
                        type="button" 
                        className="btn-link"
                        onClick={() => setShowAddressForm(!showAddressForm)}
                      >
                        {showAddressForm ? (isRTL ? 'إلغاء' : 'Cancel') : (isRTL ? '+ إضافة عنوان جديد' : '+ Add New Address')}
                      </button>
                    </div>

                    {showAddressForm && (
                      <div className="add-address-box">
                        <h4>{isRTL ? 'عنوان جديد' : 'New Address'}</h4>
                        <div className="address-form-grid">
                          <input
                            type="text"
                            placeholder={isRTL ? 'العنوان بالتفصيل (الشارع، المبنى، الشقة)' : 'Street address, building, apartment'}
                            value={newAddress.street}
                            onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                          />
                          <input
                            type="text"
                            placeholder={isRTL ? 'المدينة / المحافظة' : 'City (e.g. Cairo, Alexandria)'}
                            value={newAddress.city}
                            onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                          />
                        </div>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddAddress}>
                          {isRTL ? 'إضافة إلى القائمة' : 'Add to List'}
                        </button>
                      </div>
                    )}

                    {profileData.addresses.length === 0 ? (
                      <p className="no-address-text">{isRTL ? 'لا توجد عناوين محفوظة بعد.' : 'No saved addresses yet.'}</p>
                    ) : (
                      <div className="saved-addresses-grid">
                        {profileData.addresses.map((addr, idx) => (
                          <div key={idx} className="saved-address-card">
                            <p className="addr-street">{addr.street}</p>
                            <p className="addr-city">{addr.city}, Egypt</p>
                            <button 
                              type="button" 
                              className="remove-addr-btn"
                              onClick={() => handleRemoveAddress(idx)}
                            >
                              {isRTL ? 'حذف' : 'Remove'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button type="submit" className="btn btn-primary save-profile-btn" disabled={savingProfile}>
                    {savingProfile ? (isRTL ? 'جاري الحفظ...' : 'Saving...') : (isRTL ? 'حفظ التعديلات' : 'Save Changes')}
                  </button>
                </form>
              </div>
            )}

            {/* 2. MY ORDERS */}
            {activeTab === 'orders' && (
              <div className="account-card">
                <h2>{isRTL ? 'سجل الطلبات' : 'Order History'}</h2>
                <p className="card-subtext">{isRTL ? 'متابعة تفاصيل وحالة طلباتك السابقة' : 'Track and review your past orders.'}</p>

                {loadingOrders ? (
                  <p className="loading-text">{isRTL ? 'جاري تحميل الطلبات...' : 'Loading your orders...'}</p>
                ) : orders.length === 0 ? (
                  <div className="empty-tab-state">
                    <FiShoppingBag className="empty-icon" />
                    <h3>{isRTL ? 'لا توجد طلبات بعد' : 'No orders found'}</h3>
                    <p>{isRTL ? 'استكشف تشكيلتنا الحصرية وابدأ التسوق الآن.' : 'Explore our exclusive collection and place your first order.'}</p>
                    <Link to="/shop" className="btn btn-primary">{t('continueShopping')}</Link>
                  </div>
                ) : (
                  <div className="orders-list">
                    {orders.map((order) => (
                      <div key={order._id} className="order-card-box">
                        <div className="order-box-header">
                          <div>
                            <span className="order-num">#{order.orderNumber || order._id.slice(-6)}</span>
                            <span className="order-date">
                              <FiCalendar /> {new Date(order.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          {getStatusBadge(order.status)}
                        </div>

                        <div className="order-items-preview">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="order-item-row">
                              <div className="order-item-title">
                                <strong>{item.name || item.product?.name}</strong>
                                <span className="item-variant-spec">
                                  {item.size} {item.color ? `/ ${item.color}` : ''} × {item.quantity}
                                </span>
                              </div>
                              <span className="item-price">
                                EGP {Number(item.price * item.quantity).toLocaleString('en-EG')}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="order-box-footer">
                          <div className="order-total-info">
                            <span>{t('total')}:</span>
                            <strong>EGP {Number(order.pricing?.total || 0).toLocaleString('en-EG')}</strong>
                          </div>
                          {order.trackingNumber && (
                            <div className="tracking-badge">
                              <FiTruck /> Tracking: <strong>{order.trackingNumber}</strong>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 3. MY UUO CARDS (Digital Authenticity Cards) */}
            {activeTab === 'cards' && (
              <div className="account-card uuo-cards-tab">
                <div className="cards-tab-header">
                  <div>
                    <h2>{isRTL ? 'كروت الأصالة الرقمية (UUO Cards)' : 'Digital Authenticity Cards (UUO)'}</h2>
                    <p className="card-subtext">
                      {isRTL 
                        ? 'كروت أصالة القطع الحصرية الخاصة بك مع الرقم المميز ورابط التوثيق الفوري' 
                        : 'Your exclusive digital certificates of authenticity with unique UUO identification codes.'}
                    </p>
                  </div>
                </div>

                {loadingCards ? (
                  <p className="loading-text">{isRTL ? 'جاري تحميل الكروت...' : 'Loading your authenticity cards...'}</p>
                ) : uooCards.length === 0 ? (
                  <div className="empty-tab-state">
                    <FiAward className="empty-icon gold-icon" />
                    <h3>{isRTL ? 'لا توجد كروت أصالة مسجلة حالياً' : 'No authenticity cards yet'}</h3>
                    <p>
                      {isRTL 
                        ? 'يتم إصدار كارت أصالة رقمي مميز مع كل قطعة تشتريها من First Edition.' 
                        : 'A unique digital authenticity card is issued for each exclusive piece you purchase.'}
                    </p>
                    <Link to="/shop" className="btn btn-primary">{t('continueShopping')}</Link>
                  </div>
                ) : (
                  <div className="uuo-cards-grid">
                    {uooCards.map((card) => {
                      const prodImg = card.product?.images?.[0]?.url || '/placeholder.png';
                      return (
                        <div key={card._id} className="luxury-uuo-card">
                          <div className="uuo-card-inner">
                            <div className="uuo-card-top">
                              <div className="brand-badge">FIRST EDITION</div>
                              <span className="cert-tag">GENUINE AUTHENTIC</span>
                            </div>

                            <div className="uuo-card-body">
                              <div className="uuo-card-thumb">
                                <img src={prodImg} alt={card.productName} />
                              </div>
                              <div className="uuo-card-meta">
                                <h3 className="card-prod-name">{card.productName}</h3>
                                <div className="card-meta-line">
                                  <span>Product Ref:</span>
                                  <strong>{card.productNumber || card.product?.productNumber || 'FE-0001'}</strong>
                                </div>
                                <div className="card-meta-line">
                                  <span>Size / Color:</span>
                                  <strong>{card.size} {card.color ? `/ ${card.color}` : ''}</strong>
                                </div>
                                <div className="card-meta-line">
                                  <span>Issued:</span>
                                  <strong>{new Date(card.createdAt || card.soldAt).toLocaleDateString()}</strong>
                                </div>
                              </div>
                            </div>

                            {/* Embossed Gold Foil UOO Number */}
                            <div className="uuo-code-banner">
                              <span className="uuo-code-label">EXCLUSIVE UOO ID</span>
                              <span className="uuo-code-value">{card.uooNumber}</span>
                            </div>

                            <div className="uuo-card-actions">
                              <Link 
                                to={`/verify?productNumber=${encodeURIComponent(card.productNumber || card.product?.productNumber || '')}&uoo=${encodeURIComponent(card.uooNumber)}`} 
                                className="btn-verify-direct"
                                target="_blank"
                              >
                                <span>{isRTL ? 'فحص الأصالة في الموثق' : 'Verify Certificate'}</span>
                                <FiExternalLink />
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 4. SECURITY & PASSWORD */}
            {activeTab === 'security' && (
              <div className="account-card">
                <h2>{isRTL ? 'تغيير كلمة المرور' : 'Change Password'}</h2>
                <p className="card-subtext">{isRTL ? 'قم بتحديث كلمة المرور لحماية حسابك' : 'Secure your account with a strong password.'}</p>

                <form className="password-form" onSubmit={handlePasswordSubmit}>
                  <div className="form-group">
                    <label>{isRTL ? 'كلمة المرور الحالية' : 'Current Password'}</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>{isRTL ? 'كلمة المرور الجديدة' : 'New Password'}</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength="6"
                    />
                  </div>

                  <div className="form-group">
                    <label>{isRTL ? 'تأكيد كلمة المرور الجديدة' : 'Confirm New Password'}</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength="6"
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" disabled={submittingPassword}>
                    {submittingPassword ? (isRTL ? 'جاري التحديث...' : 'Updating...') : (isRTL ? 'تحديث كلمة المرور' : 'Update Password')}
                  </button>
                </form>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Account;
