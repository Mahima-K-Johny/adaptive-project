// StudentRegistration.jsx
import React, { useState } from 'react';
import { Lock, Mail, AlertCircle, CheckCircle, GraduationCap, Sparkles, Zap, Eye, EyeOff } from 'lucide-react';
import './AdminLogin.css';
import { useNavigate } from 'react-router-dom';

export default function StudentRegistration() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async () => {
    setError('');
    setSuccess(false);

    // ── Validations ──
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          role: 'student',          // ← include role if your backend requires it
        }),
      });

      // Handle non-JSON responses gracefully
      const contentType = res.headers.get('content-type');
      const data = contentType && contentType.includes('application/json')
        ? await res.json()
        : { message: `Server returned status ${res.status}` };

      if (!res.ok) {
        setError(data.message || `Registration failed (${res.status}). Please try again.`);
      } else {
        setSuccess(true);
        setTimeout(() => navigate('/login'), 1500);
      }
    } catch (err) {
      // Network error — server is likely not running or CORS blocked
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Cannot connect to server. Make sure the backend is running on port 5000.');
      } else {
        setError('Server error. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleRegister();
  };

  return (
    <div className="admin-login-container">
      <div className="animated-bg">
        <div className="bg-orb bg-orb-1"></div>
        <div className="bg-orb bg-orb-2"></div>
        <div className="bg-orb bg-orb-3"></div>
        <div className="floating-icon floating-icon-1">
          <Sparkles className="icon-sparkle" style={{ width: '2rem', height: '2rem' }} />
        </div>
        <div className="floating-icon floating-icon-2">
          <Zap className="icon-zap" style={{ width: '2.5rem', height: '2.5rem' }} />
        </div>
        <div className="floating-icon floating-icon-3">
          <Sparkles className="icon-sparkle" style={{ width: '1.5rem', height: '1.5rem' }} />
        </div>
      </div>

      <div className="login-content">
        <div className="branding-header">
          <div className="logo-badge">
            <GraduationCap className="logo-icon" />
          </div>
          <h1 className="brand-title">EduAdapt</h1>
          <p className="brand-subtitle">Adaptive Learning Platform</p>
        </div>

        <div className="login-card">
          <div className="card-header">
            <div className="lock-badge">
              <Lock className="lock-icon" />
            </div>
            <h2 className="card-title">Student Registration</h2>
            <p className="card-subtitle">Create your account to get started</p>
          </div>

          <div className="form-container">

            {/* Email */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email Address</label>
              <div className="input-wrapper">
                <Mail className="input-icon" />
                <input
                  type="email"
                  id="email"
                  placeholder="example@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="form-input"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <div className="input-wrapper" style={{ position: 'relative' }}>
                <Lock className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="form-input"
                  style={{ paddingRight: '2.8rem' }}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  style={{ position: 'absolute', right: '0.9rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
              <div className="input-wrapper" style={{ position: 'relative' }}>
                <Lock className="input-icon" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  id="confirmPassword"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="form-input"
                  style={{ paddingRight: '2.8rem' }}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  style={{ position: 'absolute', right: '0.9rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Live match indicator */}
              {confirmPassword.length > 0 && (
                <p style={{
                  fontSize: '11.5px', marginTop: '5px', fontWeight: 600,
                  color: password === confirmPassword ? '#16a34a' : '#dc2626',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  {password === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                </p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="alert alert-error">
                <AlertCircle className="alert-icon alert-icon-error" />
                <p className="alert-text alert-text-error">{error}</p>
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="alert alert-success">
                <CheckCircle className="alert-icon alert-icon-success" />
                <p className="alert-text alert-text-success">Registration successful! Redirecting to login…</p>
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleRegister}
              disabled={loading}
              className="login-button"
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  <span>Registering…</span>
                </>
              ) : (
                <>
                  <GraduationCap style={{ width: '1.25rem', height: '1.25rem' }} />
                  <span>Create Account</span>
                </>
              )}
            </button>

            <p
              style={{ marginTop: '1rem', textAlign: 'center', cursor: 'pointer', color: '#2563eb', fontSize: '14px' }}
              onClick={() => navigate('/login')}
            >
              Already have an account? <strong>Login here</strong>
            </p>

          </div>
        </div>
      </div>
    </div>
  );
}