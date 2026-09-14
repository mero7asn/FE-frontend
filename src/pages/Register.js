import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { toast } from 'react-toastify';
import sanitizeInput from '../utils/sanitize';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { isRTL } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await register(formData);
      toast.success(isRTL ? 'تم إنشاء الحساب بنجاح! مرحباً بك في First Edition.' : 'Account created successfully! Welcome to First Edition.');
      const redirect = searchParams.get('redirect');
      navigate(redirect ? `/${redirect}` : '/account');
    } catch (error) {
      toast.error(error.displayMessage || error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1>{isRTL ? 'إنشاء حساب جديد' : 'Create Account'}</h1>
        <p className="auth-subtext">
          {isRTL ? 'انضم إلى مجتمع First Edition الحصري' : 'Join the exclusive First Edition community.'}
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>{isRTL ? 'الاسم بالكامل' : 'Full Name'}</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: sanitizeInput(e.target.value) })}
              placeholder="e.g. Karim Ahmed"
              required
            />
          </div>

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
            <label>{isRTL ? 'رقم الهاتف' : 'Phone Number'}</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: sanitizeInput(e.target.value) })}
              placeholder="+20 1xx xxx xxxx"
            />
          </div>

          <div className="form-group">
            <label>{isRTL ? 'كلمة المرور' : 'Password'}</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: sanitizeInput(e.target.value) })}
              placeholder="Min. 6 characters"
              required
              minLength="6"
            />
          </div>

          <button type="submit" className="btn btn-primary auth-submit-btn" disabled={loading}>
            {loading ? (isRTL ? 'جاري إنشاء الحساب...' : 'Creating account...') : (isRTL ? 'إنشاء الحساب' : 'Register')}
          </button>
        </form>

        <p className="auth-link">
          {isRTL ? 'لديك حساب بالفعل؟ ' : 'Already have an account? '}
          <Link to="/login">{isRTL ? 'تسجيل الدخول' : 'Sign In'}</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
