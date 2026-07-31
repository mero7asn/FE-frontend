import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { orderAPI, couponAPI } from '../services/api';
import { toast } from 'react-toastify';
import { FiTrash2, FiTag, FiX } from 'react-icons/fi';
import './Cart.css';

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, getCartTotal, getCartSubtotal, appliedCoupon, couponDiscount, applyCoupon, removeCoupon, clearCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [couponCode, setCouponCode] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    try {
      const { data } = await couponAPI.validate({ code: couponCode.trim(), orderTotal: getCartSubtotal() });
      applyCoupon(data);
      setCouponCode('');
      toast.success(`Coupon applied! You saved EGP ${data.discount.toFixed(2)}`);
    } catch (error) {
      toast.error(error.displayMessage || 'Invalid coupon code');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login?redirect=checkout');
    } else {
      navigate('/checkout');
    }
  };

  if (cart.length === 0) {
    return (
      <div className="cart empty-cart">
        <div className="container">
          <h1>{t('cartEmpty')}</h1>
          <Link to="/shop" className="btn btn-primary">{t('continueShopping')}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart">
      <div className="container">
        <h1>{t('shoppingCart')}</h1>
        
        <div className="cart-layout">
          <div className="cart-items">
            {cart.map(item => (
              <div key={`${item.product._id}-${item.variant.size}-${item.variant.color}`} className="cart-item">
                <img 
                  src={item.product.images[0]?.url} 
                  alt={item.product.name} 
                  className="cart-item-image"
                />
                
                <div className="cart-item-details">
                  <h3>{item.product.name}</h3>
                  <p className="cart-item-meta">
                    {t('size')}: {item.variant.size} | {t('color')}: {item.variant.color}
                  </p>
                  <p className="cart-item-price">EGP {Number(item.product.price).toLocaleString('en-EG')}</p>
                </div>

                <div className="cart-item-actions">
                  <input
                    type="number"
                    min="1"
                    max={item.variant.stock}
                    value={item.quantity}
                    onChange={(e) => updateQuantity(
                      item.product._id, 
                      item.variant.size, 
                      item.variant.color, 
                      Number(e.target.value)
                    )}
                    className="quantity-input"
                  />
                  <button 
                    onClick={() => removeFromCart(item.product._id, item.variant.size, item.variant.color)}
                    className="remove-btn"
                  >
                    <FiTrash2 />
                  </button>
                </div>

                <div className="cart-item-total">
                  EGP {(item.product.price * item.quantity).toLocaleString('en-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <h2>{t('orderSummary')}</h2>

            {appliedCoupon ? (
              <div className="coupon-applied-banner">
                <FiTag />
                <span>
                  <strong>{appliedCoupon.code}</strong> — Saved EGP {couponDiscount.toFixed(2)}
                </span>
                <button className="coupon-remove" onClick={removeCoupon}>
                  <FiX />
                </button>
              </div>
            ) : (
              <div className="coupon-input-group">
                <input
                  type="text"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                />
                <button 
                  className="btn btn-outline btn-sm"
                  onClick={handleApplyCoupon}
                  disabled={validatingCoupon || !couponCode.trim()}
                >
                  {validatingCoupon ? '...' : 'Apply'}
                </button>
              </div>
            )}

            <div className="summary-row">
              <span>{t('subtotal')}</span>
              <span>EGP {getCartSubtotal().toFixed(2)}</span>
            </div>
            {couponDiscount > 0 && (
              <div className="summary-row discount">
                <span>Discount</span>
                <span>- EGP {couponDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="summary-row">
              <span>{t('shipping')}</span>
              <span>{t('shippingNote')}</span>
            </div>
            <div className="summary-row total">
              <span>{t('total')}</span>
              <span>EGP {getCartTotal().toFixed(2)}</span>
            </div>
            <button onClick={handleCheckout} className="btn btn-primary checkout-btn">
              {t('checkout')}
            </button>
            <Link to="/shop" className="continue-shopping">{t('continueShopping')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
