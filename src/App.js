import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { useLanguage } from './context/LanguageContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import About from './pages/About';
import Contact from './pages/Contact';
import Gallery from './pages/Gallery';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Login from './pages/Login';
import Checkout from './pages/Checkout';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import ProductForm from './pages/admin/ProductForm';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCoupons from './pages/admin/AdminCoupons';
import AdminSoldProducts from './pages/admin/AdminSoldProducts';
import AdminSuperReports from './pages/admin/AdminSuperReports';
import Account from './pages/Account';
import VerifyProduct from './pages/VerifyProduct';

import './styles/global.css';

const GeoBlocked = () => (
  <div style={{
    minHeight: '100vh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    background: '#FCFBF8', color: '#1A1612', textAlign: 'center', padding: '2rem'
  }}>
    <img src="/logo.png" alt="First Edition" style={{ height: 60, marginBottom: '2rem' }} />
    <h1 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>Service Not Available</h1>
    <p style={{ color: '#5C4E38', maxWidth: 400 }}>
      First Edition is currently only available in Egypt.
    </p>
  </div>
);

function AppInner() {
  const { isRTL } = useLanguage();
  const [geoBlocked, setGeoBlocked] = useState(null);

  useEffect(() => {
    // Check the response header injected by Vercel edge
    const blocked = document.querySelector('meta[name="x-geo-blocked"]');
    if (blocked) {
      setGeoBlocked(true);
      return;
    }

    // Fallback: call a free IP-geo API
    fetch('https://ipapi.co/country/')
      .then(r => r.text())
      .then(country => setGeoBlocked(country.trim() !== 'EG'))
      .catch(() => setGeoBlocked(false)); // fail open — don't block if API is down
  }, []);

  if (geoBlocked === null) return null;
  if (geoBlocked) return <GeoBlocked />;

  return (
    <AuthProvider>
      <div className="app">
        <Header />
        <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/login" element={<Login />} />
          <Route path="/verify" element={<VerifyProduct />} />
          <Route path="/checkout" element={
            <ProtectedRoute requireAdmin={false}>
              <Checkout />
            </ProtectedRoute>
          } />


          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/products" element={
            <ProtectedRoute permission="products_view">
              <AdminProducts />
            </ProtectedRoute>
          } />
          <Route path="/admin/products/new" element={
            <ProtectedRoute permission="products_create">
              <ProductForm />
            </ProtectedRoute>
          } />
          <Route path="/admin/products/edit/:id" element={
            <ProtectedRoute permission="products_edit">
              <ProductForm />
            </ProtectedRoute>
          } />
          <Route path="/admin/analytics" element={
            <ProtectedRoute>
              <AdminAnalytics />
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute requireSuperAdmin={true}>
              <AdminUsers />
            </ProtectedRoute>
          } />
          <Route path="/admin/coupons" element={
            <ProtectedRoute permission="coupons_create">
              <AdminCoupons />
            </ProtectedRoute>
          } />
          <Route path="/admin/sold-products" element={
            <ProtectedRoute permission="products_view">
              <AdminSoldProducts />
            </ProtectedRoute>
          } />
          <Route path="/admin/super-reports" element={
            <ProtectedRoute requireSuperAdmin={true}>
              <AdminSuperReports />
            </ProtectedRoute>
          } />
          <Route path="/account" element={
            <ProtectedRoute requireAdmin={false}>
              <Account />
            </ProtectedRoute>
          } />
          <Route path="*" element={
            <div className="container" style={{ padding: '100px 0', textAlign: 'center' }}>
              <h2>404 - Page Not Found</h2>
            </div>
          } />
        </Routes>
      </main>
      <Footer />
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={isRTL}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  </AuthProvider>
  );
}

function App() {
  return (
    <Router>
      <LanguageProvider>
        <AppInner />
      </LanguageProvider>
    </Router>
  );
}

export default App;
