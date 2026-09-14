import React, { createContext, useState, useContext, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        setCart([]);
      }
    }
    const savedCoupon = localStorage.getItem('appliedCoupon');
    if (savedCoupon) {
      try {
        setAppliedCoupon(JSON.parse(savedCoupon));
      } catch (e) {
        setAppliedCoupon(null);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (appliedCoupon) {
      localStorage.setItem('appliedCoupon', JSON.stringify(appliedCoupon));
    } else {
      localStorage.removeItem('appliedCoupon');
    }
  }, [appliedCoupon]);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const toggleCart = () => setIsCartOpen(prev => !prev);

  const addToCart = (product, variant, quantity = 1, shouldOpenDrawer = true) => {
    const existingItem = cart.find(
      item => item.product._id === product._id && 
              item.variant.size === variant.size && 
              item.variant.color === variant.color
    );

    if (existingItem) {
      setCart(cart.map(item =>
        item.product._id === product._id && 
        item.variant.size === variant.size && 
        item.variant.color === variant.color
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
    } else {
      setCart([...cart, { product, variant, quantity }]);
    }

    if (shouldOpenDrawer) {
      setIsCartOpen(true);
    }
  };

  const removeFromCart = (productId, size, color) => {
    setCart(cart.filter(
      item => !(item.product._id === productId && 
                item.variant.size === size && 
                item.variant.color === color)
    ));
  };

  const updateQuantity = (productId, size, color, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId, size, color);
    } else {
      setCart(cart.map(item =>
        item.product._id === productId && 
        item.variant.size === size && 
        item.variant.color === color
          ? { ...item, quantity }
          : item
      ));
    }
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
    setCouponDiscount(0);
  };

  const getCartTotal = () => {
    const subtotal = cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
    return Math.max(0, subtotal - couponDiscount);
  };

  const getCartSubtotal = () => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const applyCoupon = (couponData) => {
    setAppliedCoupon(couponData);
    setCouponDiscount(couponData.discount || 0);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
  };

  const getCartCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartSubtotal,
    getCartCount,
    appliedCoupon,
    couponDiscount,
    applyCoupon,
    removeCoupon,
    isCartOpen,
    openCart,
    closeCart,
    toggleCart
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
