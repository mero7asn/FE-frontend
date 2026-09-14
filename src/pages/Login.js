import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { toast } from 'react-toastify';
import sanitizeInput from '../utils/sanitize';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { isRTL } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await login(formData);
      toast.success(isRTL ? 'تم تسجيل الدخول بنجاح!' : 'Login successful!');
      const redirect = searchParams.get('redirect');
      if (redirect) {
        navigate(`/${redirect}`);
      } else if (['admin', 'staff', 'superadmin'].includes(data?.role)) {
        navigate('/admin');
      } else {
        navigate('/account');
      }
    } catch (error) {
      toast.error(error.displayMessage || error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1>{isRTL ? 'تسجيل الدخول' : 'Sign In'}</h1>
        <p className="auth-subtext">
          {isRTL ? 'سجل دخولك لمتابعة طلباتك وكروت الأصالة الخاصة بك' : 'Access your orders, saved addresses, and digital authenticity cards.'}
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>{isRTL ? 'البريد الإلكتروني' : 'Email Address'}</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: sanitizeInput(e.target.value) })}
              placeholder="name@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label>{isRTL ? 'كلمة المرور' : 'Password'}</label>
            <input
              type="password"
              value={formData.password}
              // Credentials must be sent exactly as entered.
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary auth-submit-btn" disabled={loading}>
            {loading ? (isRTL ? 'جاري الدخول...' : 'Signing in...') : (isRTL ? 'تسجيل الدخول' : 'Sign In')}
          </button>
        </form>

        <p className="auth-link">
          {isRTL ? 'ليس لديك حساب؟ ' : "Don't have an account? "}
          <Link to="/register">{isRTL ? 'إنشاء حساب جديد' : 'Create Account'}</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
