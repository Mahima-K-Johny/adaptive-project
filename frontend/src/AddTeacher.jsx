// AddTeacher.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap, User, Mail, Lock, Phone,
  Calendar, ChevronLeft, X, CheckCircle, BookOpen
} from 'lucide-react';
import './AddTeacher.css';

export default function AddTeacher() {
  const navigate = useNavigate();

  const [name,        setName]        = useState('');
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [gender,      setGender]      = useState('');
  const [dob,         setDob]         = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [isSubmitting,     setIsSubmitting]      = useState(false);
  const [successMsg,       setSuccessMsg]        = useState('');

  // ── Fetch courses from API ─────────────────────────────────────────────
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [coursesLoading,    setCoursesLoading]    = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/courses/all');
        // Extract course names from the courses array
        const names = res.data.map(c => c.name);
        setAvailableSubjects(names);
      } catch (err) {
        console.error('Failed to fetch courses:', err);
        setAvailableSubjects([]);
      } finally {
        setCoursesLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const toggleSubject = (s) =>
    setSelectedSubjects(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );

  const removeSubject = (s) =>
    setSelectedSubjects(prev => prev.filter(x => x !== s));

  const handleSubmit = async (e) => {
    e.preventDefault();

    const missing = [];
    if (!name.trim())        missing.push('Full Name');
    if (!email.trim())       missing.push('Email');
    if (!password.trim())    missing.push('Password');
    if (!gender)             missing.push('Gender');
    if (!dob)                missing.push('Date of Birth');
    if (!phoneNumber.trim()) missing.push('Phone Number');
    if (selectedSubjects.length === 0) missing.push('At least one Subject');

    if (missing.length > 0) {
      alert(`Please fill in:\n• ${missing.join('\n• ')}`);
      return;
    }

    const payload = {
      name:        name.trim(),
      email:       email.trim(),
      password:    password.trim(),
      gender,
      dob,
      phoneNumber: phoneNumber.trim(),
      subjects:    selectedSubjects,
    };

    setIsSubmitting(true);
    try {
      const res = await axios.post('http://localhost:5000/api/teachers/add', payload, {
        headers: { 'Content-Type': 'application/json' },
      });
      setSuccessMsg(res.data.message);
      setTimeout(() => navigate('/admin-dashboard'), 1800);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="add-teacher-container">
      <div className="dashboard-bg">
        <div className="dashboard-orb dashboard-orb-1" />
        <div className="dashboard-orb dashboard-orb-2" />
        <div className="dashboard-orb dashboard-orb-3" />
      </div>

      <nav className="dashboard-nav">
        <div className="nav-container"><div className="nav-content">
          <div className="nav-left">
            <div className="logo-section">
              <div className="logo-icon-container"><GraduationCap className="logo-icon" /></div>
              <div className="logo-text-container"><h1>EduAdapt</h1><p>Add Teacher</p></div>
            </div>
          </div>
          <div className="nav-right">
            <button className="at-back-btn" onClick={() => navigate('/admin-dashboard')}>
              <ChevronLeft size={18} /> Back to Dashboard
            </button>
          </div>
        </div></div>
      </nav>

      <div className="dashboard-content"><div className="content-wrapper">
        <div className="welcome-section">
          <h2 className="welcome-title">Add New Teacher 👨‍🏫</h2>
          <p className="welcome-subtitle">Fill in the details and assign subjects from your course list</p>
        </div>

        {successMsg && (
          <div className="at-success-banner">
            <CheckCircle size={20} />
            <span>{successMsg} — redirecting...</span>
          </div>
        )}

        <div className="at-card">
          <form onSubmit={handleSubmit}>

            <div className="at-section-label"><User size={16} /> Personal Information</div>
            <div className="at-grid-2">

              <div className="at-field">
                <label>Full Name *</label>
                <div className="at-input-wrap">
                  <User size={16} className="at-input-icon" />
                  <input type="text" placeholder="e.g. Dr. Sarah Ahmed"
                    value={name} onChange={e => setName(e.target.value)} />
                </div>
              </div>

              <div className="at-field">
                <label>Email Address *</label>
                <div className="at-input-wrap">
                  <Mail size={16} className="at-input-icon" />
                  <input type="email" placeholder="teacher@school.edu"
                    value={email} onChange={e => setEmail(e.target.value)} />
                </div>
              </div>

              <div className="at-field">
                <label>Password *</label>
                <div className="at-input-wrap">
                  <Lock size={16} className="at-input-icon" />
                  <input type="password" placeholder="Min. 6 characters"
                    value={password} onChange={e => setPassword(e.target.value)} />
                </div>
              </div>

              <div className="at-field">
                <label>Phone Number *</label>
                <div className="at-input-wrap">
                  <Phone size={16} className="at-input-icon" />
                  <input type="tel" placeholder="+91 9876543210"
                    value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} />
                </div>
              </div>

              <div className="at-field">
                <label>Gender *</label>
                <div className="at-input-wrap">
                  <User size={16} className="at-input-icon" />
                  <select value={gender} onChange={e => setGender(e.target.value)}>
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="at-field">
                <label>Date of Birth *</label>
                <div className="at-input-wrap">
                  <Calendar size={16} className="at-input-icon" />
                  <input type="date" value={dob} onChange={e => setDob(e.target.value)} />
                </div>
              </div>

            </div>

            {/* ── Subjects ──────────────────────────────────────────────── */}
            <div className="at-section-label" style={{ marginTop: '2rem' }}>
              <BookOpen size={16} /> Assign Subjects
              <span className="at-subject-count">{selectedSubjects.length} selected</span>
            </div>

            {/* Selected chips */}
            {selectedSubjects.length > 0 && (
              <div className="at-chips">
                {selectedSubjects.map(s => (
                  <span key={s} className="at-chip">
                    {s}
                    <button type="button" className="at-chip-remove" onClick={() => removeSubject(s)}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Course pills from API */}
            {coursesLoading ? (
              <div style={{ padding: '20px', color: '#94a3b8', fontSize: 14, textAlign: 'center' }}>
                ⏳ Loading courses...
              </div>
            ) : availableSubjects.length === 0 ? (
              <div style={{
                padding: '20px', background: '#fef3c7', borderRadius: 10,
                color: '#92400e', fontSize: 14, textAlign: 'center',
                border: '1px solid #fde68a', marginBottom: 16,
              }}>
                ⚠️ No courses found. Please{' '}
                <span
                  style={{ color: '#4f46e5', cursor: 'pointer', fontWeight: 700, textDecoration: 'underline' }}
                  onClick={() => navigate('/add-course')}
                >
                  add a course first
                </span>
                {' '}before assigning subjects to teachers.
              </div>
            ) : (
              <div className="at-subject-grid">
                {availableSubjects.map(subj => {
                  const active = selectedSubjects.includes(subj);
                  return (
                    <button key={subj} type="button"
                      className={`at-subject-pill ${active ? 'active' : ''}`}
                      onClick={() => toggleSubject(subj)}>
                      {active && <CheckCircle size={13} />} {subj}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="at-actions">
              <button type="button" className="at-cancel-btn"
                onClick={() => navigate('/admin-dashboard')}>Cancel</button>
              <button type="submit"
                className={`at-submit-btn card-button-purple ${isSubmitting ? 'loading' : ''}`}
                disabled={isSubmitting}>
                {isSubmitting
                  ? <><span className="at-spinner" /> Adding Teacher...</>
                  : <><GraduationCap size={18} /> Add Teacher</>}
              </button>
            </div>

          </form>
        </div>

        <div className="dashboard-footer">
          <p className="footer-text">© 2026 EduAdapt • Empowering Education Through Innovation</p>
        </div>
      </div></div>
    </div>
  );
}