import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { couponAPI } from '../services/api';
import { toast } from 'react-toastify';
import { FiX, FiTrash2, FiShoppingBag, FiArrowRight, FiArrowLeft, FiTag } from 'react-icons/fi';
import './CartDrawer.css';

const CartDrawer = () => {
  const {
    cart,
    isCartOpen,
    closeCart,
    removeFromCart,
    updateQuantity,
    getCartSubtotal,
    getCartTotal,
    appliedCoupon,
    couponDiscount,
    applyCoupon,
    removeCoupon
  } = useCart();
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();

  const [couponCode, setCouponCode] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  if (!isCartOpen) return null;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    try {
      const { data } = await couponAPI.validate({ code: couponCode.trim(), orderTotal: getCartSubtotal() });
      applyCoupon(data);
      setCouponCode('');
      toast.success(isRTL ? `تم تطبيق الكوبون! وفرت ${data.discount.toFixed(2)} جنيه` : `Coupon applied! You saved EGP ${data.discount.toFixed(2)}`);
    } catch (error) {
      toast.error(error.displayMessage || (isRTL ? 'كود غير صالح' : 'Invalid coupon code'));
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleCheckout = () => {
    closeCart();
    navigate('/checkout');
  };

  const handleViewFullCart = () => {
    closeCart();
    navigate('/cart');
  };

  const ArrowIcon = isRTL ? FiArrowLeft : FiArrowRight;

  return (
    <div className="cart-drawer-overlay" onClick={closeCart}>
      <div 
        className={`cart-drawer ${isRTL ? 'rtl' : 'ltr'}`} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="cart-drawer-header">
          <div className="cart-drawer-title">
            <FiShoppingBag className="cart-title-icon" />
            <h2>{t('shoppingCart')}</h2>
            <span className="cart-item-count">
              ({cart.reduce((s, i) => s + i.quantity, 0)})
            </span>
          </div>
          <button className="cart-drawer-close" onClick={closeCart} title={t('close')}>
            <FiX />
          </button>
        </div>

        {/* Content */}
        {cart.length === 0 ? (
          <div className="cart-drawer-empty">
            <div className="empty-cart-icon-wrap">
              <FiShoppingBag />
            </div>
            <h3>{t('cartEmpty')}</h3>
            <p>{isRTL ? 'لم تقم بإضافة أي قطع مميزة إلى سلتك بعد.' : 'You have not added any exclusive pieces yet.'}</p>
            <button className="btn btn-primary start-shopping-btn" onClick={closeCart}>
              {t('continueShopping')}
            </button>
          </div>
        ) : (
          <>
            <div className="cart-drawer-items">
              {cart.map((item) => {
                const itemImg = item.product.images?.find(i => i.isPrimary)?.url || item.product.images?.[0]?.url || '/placeholder.png';
                const key = `${item.product._id}-${item.variant.size}-${item.variant.color}`;
                return (
                  <div key={key} className="cart-drawer-item">
                    <div className="drawer-item-image-wrap">
                      <img src={itemImg} alt={item.product.name} />
                    </div>

                    <div className="drawer-item-info">
                      <div className="drawer-item-header">
                        <h4>{item.product.name}</h4>
                        <button 
                          className="drawer-item-remove"
                          onClick={() => removeFromCart(item.product._id, item.variant.size, item.variant.color)}
                          title="Remove item"
                        >
                          <FiTrash2 />
                        </button>
                      </div>

                      <div className="drawer-item-variants">
                        <span className="variant-tag">{t('size')}: <strong>{item.variant.size}</strong></span>
                        {item.variant.color && (
                          <span className="variant-tag">{t('color')}: <strong>{item.variant.color}</strong></span>
                        )}
                      </div>

                      <div className="drawer-item-bottom">
                        <div className="quantity-stepper">
                          <button 
                            type="button"
                            onClick={() => updateQuantity(item.product._id, item.variant.size, item.variant.color, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            -
                          </button>
                          <span>{item.quantity}</span>
                          <button 
                            type="button"
                            onClick={() => updateQuantity(item.product._id, item.variant.size, item.variant.color, item.quantity + 1)}
                            disabled={item.variant.stock && item.quantity >= item.variant.stock}
                          >
                            +
                          </button>
                        </div>

                        <div className="drawer-item-price">
                          EGP {Number(item.product.price * item.quantity).toLocaleString('en-EG')}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer Summary */}
            <div className="cart-drawer-footer">
              {/* Coupon Section */}
              {appliedCoupon ? (
                <div className="drawer-coupon-applied">
                  <div className="coupon-left">
                    <FiTag />
                    <span><strong>{appliedCoupon.code}</strong> (-EGP {couponDiscount.toFixed(2)})</span>
                  </div>
                  <button onClick={removeCoupon} className="btn-remove-coupon">
                    <FiX />
                  </button>
                </div>
              ) : (
                <div className="drawer-coupon-input">
                  <input
                    type="text"
                    placeholder={isRTL ? 'كود الخصم...' : 'Discount code...'}
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                  />
                  <button 
                    onClick={handleApplyCoupon}
                    disabled={validatingCoupon || !couponCode.trim()}
                  >
                    {validatingCoupon ? '...' : (isRTL ? 'تطبيق' : 'Apply')}
                  </button>
                </div>
              )}

              <div className="drawer-subtotal-row">
                <span>{t('subtotal')}</span>
                <span>EGP {Number(getCartSubtotal()).toLocaleString('en-EG')}</span>
              </div>

              {couponDiscount > 0 && (
                <div className="drawer-subtotal-row discount-row">
                  <span>{isRTL ? 'الخصم' : 'Discount'}</span>
                  <span>- EGP {Number(couponDiscount).toLocaleString('en-EG')}</span>
                </div>
              )}

              <div className="drawer-total-row">
                <span>{t('total')}</span>
                <span className="total-gold">EGP {Number(getCartTotal()).toLocaleString('en-EG')}</span>
              </div>

              <p className="shipping-calc-notice">
                {isRTL ? 'يتم حساب رسوم الشحن عند إتمام الطلب' : 'Shipping is calculated during checkout'}
              </p>

              <button className="btn btn-primary drawer-checkout-btn" onClick={handleCheckout}>
                <span>{t('checkout')}</span>
                <ArrowIcon />
              </button>

              <button className="btn-link view-full-cart" onClick={handleViewFullCart}>
                {isRTL ? 'عرض سلة المشتريات كاملة' : 'View Full Cart Details'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CartDrawer;
