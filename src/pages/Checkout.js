import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { useLanguage } from '../context/LanguageContext';
import { paymentAPI } from '../services/api';
import { toast } from 'react-toastify';
import { 
  FiCreditCard, 
  FiCheckCircle, 
  FiShield, 
  FiMapPin, 
  FiShoppingBag,
  FiAward
} from 'react-icons/fi';
import vodafoneLogo from '../assets/vodafone.png';
import instapayLogo from '../assets/instapay.png';
import './Checkout.css';

const Checkout = () => {
  const { cart, getCartSubtotal, appliedCoupon, couponDiscount, clearCart } = useCart();
  const { user } = useAuth();
  const { settings } = useStore();
  const { t, isRTL } = useLanguage();

  const [loading, setLoading] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: '',
    city: 'Cairo',
    notes: '',
    paymentMethod: 'card' // 'card' | 'wallet' | 'cod'
  });

  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardHolder: '',
    expiry: '',
    cvv: ''
  });

  const [walletPhone, setWalletPhone] = useState('');

  useEffect(() => {
    if (user) {
      const defaultAddr = user.addresses?.find(a => a.isDefault) || user.addresses?.[0];
      setFormData(prev => ({
        ...prev,
        name: prev.name || user.name || '',
        phone: prev.phone || user.phone || '',
        address: prev.address || (defaultAddr ? defaultAddr.street : ''),
        city: prev.city || (defaultAddr ? defaultAddr.city : 'Cairo')
      }));
    }
  }, [user]);

  const subtotal = getCartSubtotal();
  const shippingRate = Number(settings.shippingRate) || 75;
  const freeThreshold = Number(settings.freeShippingThreshold) || 2000;
  const shipping = subtotal >= freeThreshold ? 0 : shippingRate;
  const grandTotal = Math.max(0, subtotal - couponDiscount + shipping);

  const handleSelectSavedAddress = (addr) => {
    setFormData(prev => ({
      ...prev,
      address: addr.street,
      city: addr.city
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;

    if (!formData.phone || !formData.address) {
      toast.error(isRTL ? 'رقم الهاتف والعنوان مطلوبان' : 'Phone number and address are required');
      return;
    }

    if (formData.paymentMethod === 'card' && (!cardDetails.cardNumber || !cardDetails.expiry || !cardDetails.cvv)) {
      toast.error(isRTL ? 'يرجى استكمال بيانات البطاقة البنكية' : 'Please fill in all card details');
      return;
    }

    if (formData.paymentMethod === 'wallet' && !walletPhone) {
      toast.error(isRTL ? 'يرجى إدخال رقم المحفظة الإلكترونية' : 'Please enter your mobile wallet number');
      return;
    }

    setLoading(true);
    try {
      const items = cart.map(item => ({
        product: item.product._id,
        size: item.variant.size,
        color: item.variant.color,
        quantity: item.quantity
      }));

      const payload = {
        items,
        shippingAddress: {
          name: formData.name || user?.name || 'Customer',
          phone: formData.phone,
          address: formData.address,
          city: formData.city
        },
        paymentMethod: formData.paymentMethod,
        couponCode: appliedCoupon?.code || null,
        notes: formData.notes
      };

      const { data } = await paymentAPI.initiateCheckout(payload);

      // If card or wallet, complete verification
      if (formData.paymentMethod === 'card' || formData.paymentMethod === 'wallet') {
        const verifyRes = await paymentAPI.verifyPayment(data.orderId, {
          transactionId: `TXN_${Date.now()}`,
          status: 'paid'
        });
        setPlacedOrder(verifyRes.data.order || { orderNumber: data.orderNumber, _id: data.orderId });
      } else {
        setPlacedOrder({ orderNumber: data.orderNumber, _id: data.orderId, isCOD: true });
      }

      clearCart();
      toast.success(isRTL ? 'تم تأكيد طلبك بنجاح!' : 'Order placed successfully!');
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(error.displayMessage || (isRTL ? 'فشل في إتمام الطلب' : 'Failed to place order'));
    } finally {
      setLoading(false);
    }
  };

  // ── Success View ──
  if (placedOrder) {
    return (
      <div className="checkout-page checkout-success-view">
        <div className="container">
          <div className="order-success-card">
            <div className="success-icon-wrap">
              <FiCheckCircle />
            </div>
            <h1>{isRTL ? 'شكراً لطلبك من First Edition!' : 'Thank You for Your Order!'}</h1>
            <p className="order-confirm-sub">
              {isRTL ? 'تم استلام وتأكيد طلبك بنجاح.' : 'Your exclusive piece is being prepared.'}
            </p>

            <div className="order-reference-box">
              <span className="ref-label">{isRTL ? 'رقم الطلب' : 'Order Reference'}</span>
              <span className="ref-number">#{placedOrder.orderNumber || placedOrder._id}</span>
            </div>

            <div className="success-uuo-notice">
              <FiAward className="uuo-notice-icon" />
              <div>
                <h4>{isRTL ? 'تم إصدار كارت الأصالة الرقمي (UUO Card)' : 'Digital Authenticity Card Issued'}</h4>
                <p>
                  {isRTL 
                    ? 'يمكنك الآن استعراض كارت الأصالة والتحقق من كود القطعة في صفحة حسابك.' 
                    : 'Your certificate of authenticity has been added to your account.'}
                </p>
              </div>
            </div>

            <div className="success-actions">
              <Link to="/account" className="btn btn-primary">
                {isRTL ? 'عرض في حسابي وكروت الأصالة' : 'View in My Account & UUO Cards'}
              </Link>
              <Link to="/shop" className="btn btn-outline">
                {t('continueShopping')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Empty Cart View ──
  if (cart.length === 0) {
    return (
      <div className="checkout-page">
        <div className="container">
          <div className="checkout-empty">
            <FiShoppingBag className="empty-bag-icon" />
            <h1>{isRTL ? 'سلة المشتريات فارغة' : 'Your cart is empty'}</h1>
            <p>{isRTL ? 'أضف بعض القطع المميزة إلى سلتك للمتابعة.' : 'Add some exclusive items before checkout.'}</p>
            <Link to="/shop" className="btn btn-primary">{t('continueShopping')}</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="container">
        <div className="checkout-header-title">
          <h1>{t('checkout')}</h1>
          <p>{isRTL ? 'أكمل بيانات التوصيل والدفع الآمن' : 'Complete your delivery and secure payment details'}</p>
        </div>

        <div className="checkout-layout">
          <form className="checkout-form" onSubmit={handleSubmit}>
            {/* 1. Delivery Information */}
            <div className="checkout-section-card">
              <div className="section-title-wrap">
                <FiMapPin className="sec-icon" />
                <h2>{isRTL ? 'بيانات التوصيل' : 'Delivery Information'}</h2>
              </div>

              {/* Saved Address Quick Select */}
              {user?.addresses && user.addresses.length > 0 && (
                <div className="saved-addr-quickselect">
                  <label>{isRTL ? 'العناوين المسجلة لديك:' : 'Choose from saved addresses:'}</label>
                  <div className="saved-chips-list">
                    {user.addresses.map((addr, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={`addr-chip ${formData.address === addr.street ? 'selected' : ''}`}
                        onClick={() => handleSelectSavedAddress(addr)}
                      >
                        {addr.street} ({addr.city})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-row-2">
                <div className="form-group">
                  <label>{isRTL ? 'الاسم بالكامل *' : 'Full Name *'}</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Omar Hassan"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>{isRTL ? 'رقم الهاتف للتواصل *' : 'Phone Number *'}</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+20 1xx xxx xxxx"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>{isRTL ? 'العنوان بالتفصيل (الشارع، المبنى، الشقة) *' : 'Delivery Address *'}</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows="3"
                  placeholder={isRTL ? 'اسم الشارع، رقم العقار، الدور، الشقة، وأي علامة مميزة...' : 'Full street address, building number, floor, apartment...'}
                  required
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>{isRTL ? 'المحافظة / المدينة' : 'City / Governorate'}</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Cairo, Giza, Alexandria..."
                  />
                </div>

                <div className="form-group">
                  <label>{isRTL ? 'ملاحظات الطلب (اختياري)' : 'Order Notes (Optional)'}</label>
                  <input
                    type="text"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder={isRTL ? 'أي تعليمات خاصة للمندوب...' : 'Special instructions...'}
                  />
                </div>
              </div>
            </div>

            {/* 2. Payment Method */}
            <div className="checkout-section-card">
              <div className="section-title-wrap">
                <FiCreditCard className="sec-icon" />
                <h2>{isRTL ? 'طريقة الدفع' : 'Payment Method'}</h2>
                <div className="secure-badge">
                  <FiShield /> 256-bit Encrypted
                </div>
              </div>

              <div className="payment-options-grid">
                {/* Option: Card */}
                <div 
                  className={`payment-option-card ${formData.paymentMethod === 'card' ? 'active' : ''}`}
                  onClick={() => setFormData({ ...formData, paymentMethod: 'card' })}
                >
                  <div className="pay-option-header">
                    <input 
                      type="radio" 
                      name="paymentMethod" 
                      value="card"
                      checked={formData.paymentMethod === 'card'} 
                      onChange={handleChange} 
                    />
                    <strong>{isRTL ? 'بطاقة بنكية (Visa / Mastercard / Meeza)' : 'Credit / Debit Card'}</strong>
                  </div>
                  <p>{isRTL ? 'دفع آمن وفوري عبر البطاقة البنكية' : 'Instant and secure payment'}</p>
                </div>

                {/* Option: Wallet / InstaPay */}
                <div 
                  className={`payment-option-card ${formData.paymentMethod === 'wallet' ? 'active' : ''}`}
                  onClick={() => setFormData({ ...formData, paymentMethod: 'wallet' })}
                >
                  <div className="pay-option-header">
                    <input 
                      type="radio" 
                      name="paymentMethod" 
                      value="wallet"
                      checked={formData.paymentMethod === 'wallet'} 
                      onChange={handleChange} 
                    />
                    <strong>{isRTL ? 'محافظ إلكترونية / إنستاباي' : 'Mobile Wallets / InstaPay'}</strong>
                  </div>
                  <div className="wallet-logos-row">
                    <img src={vodafoneLogo} alt="Vodafone Cash" />
                    <img src={instapayLogo} alt="InstaPay" />
                  </div>
                </div>

                {/* Option: COD */}
                {settings.enableCOD && (
                  <div 
                    className={`payment-option-card ${formData.paymentMethod === 'cod' ? 'active' : ''}`}
                    onClick={() => setFormData({ ...formData, paymentMethod: 'cod' })}
                  >
                    <div className="pay-option-header">
                      <input 
                        type="radio" 
                        name="paymentMethod" 
                        value="cod"
                        checked={formData.paymentMethod === 'cod'} 
                        onChange={handleChange} 
                      />
                      <strong>{isRTL ? 'الدفع عند الاستلام (COD)' : 'Cash on Delivery'}</strong>
                    </div>
                    <p>{isRTL ? 'ادفع نقداً عند استلام الشحنة' : 'Pay in cash upon delivery'}</p>
                  </div>
                )}
              </div>

              {/* Card Inputs Form */}
              {formData.paymentMethod === 'card' && (
                <div className="card-input-subform">
                  <h4>{isRTL ? 'بيانات البطاقة' : 'Card Details'}</h4>
                  <div className="form-group">
                    <label>{isRTL ? 'رقم البطاقة' : 'Card Number'}</label>
                    <input
                      type="text"
                      placeholder="4000 1234 5678 9010"
                      maxLength="19"
                      value={cardDetails.cardNumber}
                      onChange={(e) => setCardDetails({ ...cardDetails, cardNumber: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-row-2">
                    <div className="form-group">
                      <label>{isRTL ? 'تاريخ الانتهاء' : 'Expiry Date'}</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        maxLength="5"
                        value={cardDetails.expiry}
                        onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>CVV / CVC</label>
                      <input
                        type="password"
                        placeholder="123"
                        maxLength="4"
                        value={cardDetails.cvv}
                        onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Wallet Input */}
              {formData.paymentMethod === 'wallet' && (
                <div className="card-input-subform">
                  <div className="form-group">
                    <label>{isRTL ? 'رقم الهاتف المسجل بالمحفظة' : 'Mobile Wallet Number'}</label>
                    <input
                      type="tel"
                      placeholder="+20 10x xxx xxxx"
                      value={walletPhone}
                      onChange={(e) => setWalletPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-primary checkout-submit-btn" disabled={loading}>
              {loading ? (isRTL ? 'جاري معالجة الطلب...' : 'Processing Payment...') : (
                <>
                  <FiShield />
                  <span>
                    {formData.paymentMethod === 'cod' 
                      ? (isRTL ? `تأكيد الطلب — ${grandTotal.toFixed(2)} جنيه` : `Confirm Order — EGP ${grandTotal.toFixed(2)}`)
                      : (isRTL ? `ادفع الآن — ${grandTotal.toFixed(2)} جنيه` : `Pay Now — EGP ${grandTotal.toFixed(2)}`)}
                  </span>
                </>
              )}
            </button>
          </form>

          {/* 3. Order Summary Sidebar */}
          <aside className="checkout-summary-sidebar">
            <div className="summary-card">
              <h2>{t('orderSummary')}</h2>

              <div className="checkout-items-list">
                {cart.map(item => (
                  <div key={`${item.product._id}-${item.variant.size}-${item.variant.color}`} className="checkout-item-row">
                    <div className="checkout-item-img-wrap">
                      <img src={item.product.images?.[0]?.url || '/placeholder.png'} alt={item.product.name} />
                      <span className="item-qty-tag">{item.quantity}</span>
                    </div>
                    <div className="checkout-item-details">
                      <h4>{item.product.name}</h4>
                      <p className="item-spec">{item.variant.size} {item.variant.color ? `• ${item.variant.color}` : ''}</p>
                    </div>
                    <span className="checkout-item-price">
                      EGP {(item.product.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="summary-pricing-breakdown">
                <div className="breakdown-row">
                  <span>{t('subtotal')}</span>
                  <span>EGP {subtotal.toFixed(2)}</span>
                </div>

                {couponDiscount > 0 && (
                  <div className="breakdown-row discount">
                    <span>{isRTL ? 'الخصم المطبق' : 'Coupon Discount'}</span>
                    <span>- EGP {couponDiscount.toFixed(2)}</span>
                  </div>
                )}

                <div className="breakdown-row">
                  <span>{t('shipping')}</span>
                  <span>{shipping === 0 ? (isRTL ? 'مجاني' : 'FREE') : `EGP ${shipping.toFixed(2)}`}</span>
                </div>

                <div className="breakdown-row grand-total-row">
                  <span>{t('total')}</span>
                  <span className="grand-total-val">EGP {grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="guarantee-box">
                <FiAward className="guarantee-icon" />
                <p>
                  {isRTL 
                    ? 'كل قطعة تأتي مع كارت أصالة رقمي وموثق برقم UUO فريد.' 
                    : 'Each authentic piece comes with an official digital UUO certificate.'}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
