import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { orderAPI } from '../services/api';
import { toast } from 'react-toastify';
import './Checkout.css';

const emptyForm = {
  phone: '',
  address: '',
  city: '',
  notes: '',
  paymentMethod: 'cash'
};

const Checkout = () => {
  const { cart, getCartSubtotal, getCartTotal, appliedCoupon, couponDiscount, clearCart } = useCart();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(emptyForm);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;

    if (!formData.phone || !formData.address) {
      toast.error('Phone number and address are required');
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

      const subtotal = getCartSubtotal();
      const total = getCartTotal();

      const orderData = {
        items,
        shippingAddress: {
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          notes: formData.notes
        },
        billingAddress: {
          phone: formData.phone,
          address: formData.address,
          city: formData.city
        },
        payment: {
          method: formData.paymentMethod,
          status: 'pending'
        },
        pricing: {
          subtotal,
          discount: couponDiscount,
          total
        },
        coupon: appliedCoupon || null
      };

      const { data } = await orderAPI.create(orderData);
      clearCart();
      toast.success('Order placed successfully!');

      const waNumber = (cart[0]?.product?.whatsappNumber || process.env.REACT_APP_WHATSAPP_NUMBER || '+1234567890').replace(/[^0-9]/g, '');
      const message = encodeURIComponent(
        `Hi! I just placed order #${data._id}.\nItems: ${items.length} product(s).\nTotal: EGP ${total.toFixed(2)}.\nPhone: ${formData.phone}\nAddress: ${formData.address}`
      );
      setTimeout(() => {
        window.open(`https://wa.me/${waNumber}?text=${message}`, '_blank');
        navigate('/account');
      }, 1500);
    } catch (error) {
      toast.error(error.displayMessage || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="checkout-page">
        <div className="container">
          <div className="checkout-empty">
            <h1>Your cart is empty</h1>
            <Link to="/shop" className="btn btn-primary">Continue Shopping</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="container">
        <h1>Checkout</h1>

        <div className="checkout-layout">
          <form className="checkout-form" onSubmit={handleSubmit}>
            <h2>Delivery Information</h2>

            <div className="form-group">
              <label htmlFor="phone">Phone Number *</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+20 1xx xxx xxxx"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="address">Delivery Address *</label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows="3"
                placeholder="Full address including building, street, area..."
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="city">City</label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Cairo, Alexandria..."
              />
            </div>

            <div className="form-group">
              <label htmlFor="notes">Order Notes</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="2"
                placeholder="Any special instructions..."
              />
            </div>

            <div className="form-group">
              <label htmlFor="paymentMethod">Payment Method</label>
              <select
                id="paymentMethod"
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
              >
                <option value="cash">Cash on Delivery</option>
                <option value="card">Card (on delivery)</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary checkout-submit" disabled={loading}>
              {loading ? 'Placing Order...' : `Place Order — EGP ${getCartTotal().toFixed(2)}`}
            </button>
          </form>

          <div className="checkout-summary">
            <h2>Order Summary</h2>

            <div className="order-items-list">
              {cart.map(item => (
                <div key={`${item.product._id}-${item.variant.size}-${item.variant.color}`} className="order-item">
                  <img src={item.product.images[0]?.url} alt={item.product.name} className="order-item-img" />
                  <div className="order-item-info">
                    <p className="order-item-name">{item.product.name}</p>
                    <p className="order-item-meta">
                      {item.variant.size} / {item.variant.color} × {item.quantity}
                    </p>
                  </div>
                  <p className="order-item-price">
                    EGP {(item.product.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            <div className="order-totals">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>EGP {getCartSubtotal().toFixed(2)}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="summary-row discount">
                  <span>Discount</span>
                  <span>- EGP {couponDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="summary-row total">
                <span>Total</span>
                <span>EGP {getCartTotal().toFixed(2)}</span>
              </div>
            </div>

            <Link to="/cart" className="back-to-cart">← Back to Cart</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
