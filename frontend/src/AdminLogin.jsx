// AdminLogin.jsx
import React, { useState } from 'react';
import { Lock, Mail, AlertCircle, CheckCircle, GraduationCap, Sparkles, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './AdminLogin.css';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
  setError('');
  setSuccess(false);
  setLoading(true);

  try {
    // ✅ Admin login (hardcoded)
    if (email === 'admin@example.com' && password === 'admin@123') {
      setSuccess(true);
      localStorage.setItem('role', 'admin');
      localStorage.setItem('userId', 'admin'); // optional
      setLoading(false); // stop loading before redirect
      return navigate('/admin-dashboard'); // redirect immediately
    }

    // ✅ Teacher / Student login via backend
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      setSuccess(true);
      localStorage.setItem('role', data.role);
      localStorage.setItem('userId', data.userId);
      localStorage.setItem('studentEmail', data.email || email);

      setLoading(false);

     if (data.role === 'teacher') {
  // store the correct MongoDB _id
  localStorage.setItem('teacherId', data.userId); // must be real _id
  localStorage.setItem('teacherEmail', data.email || email);
  localStorage.setItem('teacherLoggedIn', 'true');
  navigate('/teacher-dashboard');

}


       else if (data.role === 'student') {
        navigate('/student-dashboard');
      } else {
        setError('Unknown role');
      }
    } else {
      setError(data.message);
      setLoading(false);
    }

  } catch (err) {
    console.error('Login error:', err);
    setError('Server error. Try again later.');
    setLoading(false);
  }
};


  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && email && password) handleLogin();
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
            <h2 className="card-title">Admin/Student Portal</h2>
            <p className="card-subtitle">Welcome back! Please sign in</p>
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

            {error && (
              <div className="alert alert-error">
                <AlertCircle className="alert-icon alert-icon-error" />
                <p className="alert-text alert-text-error">{error}</p>
              </div>
            )}

            {success && (
              <div className="alert alert-success">
                <CheckCircle className="alert-icon alert-icon-success" />
                <p className="alert-text alert-text-success">Login successful! Redirecting...</p>
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={loading || !email || !password}
              className="login-button"
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <Lock style={{ width: '1.25rem', height: '1.25rem' }} />
                  <span>Sign In to Dashboard</span>
                </>
              )}
            </button>

            <p
              style={{ marginTop: '1rem', textAlign: 'center', cursor: 'pointer', color: '#2563eb' }}
              onClick={() => navigate('/student-registration')}
            >
              Not registered? Register here
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
