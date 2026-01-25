// StudentRegistration.jsx
import React, { useState } from 'react';
import { Lock, Mail, AlertCircle, CheckCircle, GraduationCap, Sparkles, Zap } from 'lucide-react';
import './AdminLogin.css'; // Using the same CSS for consistency
import { useNavigate } from 'react-router-dom';

export default function StudentRegistration() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async () => {
  setError('');
  setSuccess(false);

  if (!email || !password || !confirmPassword) {
    setError('Please fill all fields');
    return;
  }

  if (password !== confirmPassword) {
    setError('Passwords do not match');
    return;
  }

  setLoading(true);

  try {
    const res = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.message);
    } else {
      setSuccess(true);
      setTimeout(() => navigate('/admin-login'), 1000);
    }
  } catch (err) {
    setError('Server error. Try again later.');
  }

  setLoading(false);
};


  const handleKeyPress = (e) => {
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
                  onKeyPress={handleKeyPress}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <div className="input-wrapper">
                <Lock className="input-icon" />
                <input
                  type="password"
                  id="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
              <div className="input-wrapper">
                <Lock className="input-icon" />
                <input
                  type="password"
                  id="confirmPassword"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="form-input"
                />
              </div>
            </div>

            {error && (
              <div className="alert alert-error">
                <AlertCircle className="alert-icon alert-icon-error" />
                <p className="alert-text alert-text-error">{error}</p>
              </div>
            )}

            {success && (
              <div className="alert alert-success">
                <CheckCircle className="alert-icon alert-icon-success" />
                <p className="alert-text alert-text-success">Registration successful! Redirecting to login...</p>
              </div>
            )}

            <button
              onClick={handleRegister}
              disabled={loading || !email || !password || !confirmPassword}
              className="login-button"
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <Lock style={{ width: '1.25rem', height: '1.25rem' }} />
                  <span>Register</span>
                </>
              )}
            </button>

            <p
              style={{ marginTop: '1rem', textAlign: 'center', cursor: 'pointer', color: '#2563eb' }}
              onClick={() => navigate('/login')}
            >
              Already registered? Login here
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
