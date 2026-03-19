import React, { useState } from 'react';
import {
  Users, GraduationCap, BookOpen, FileText,
  LogOut, LayoutDashboard, BarChart2, HelpCircle,
  Plus, ChevronRight, ArrowLeft, CheckCircle, AlertCircle,
  Hash, Type
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AddCourse() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeNav, setActiveNav] = useState('topics');
  const adminEmail = localStorage.getItem('adminEmail') || 'admin@example.com';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard',      icon: LayoutDashboard },
    { id: 'analytics', label: 'Analytics',      icon: BarChart2 },
    { id: 'teachers',  label: 'Teachers',        icon: GraduationCap },
    { id: 'students',  label: 'Students',        icon: Users },
    { id: 'topics',    label: 'Topics',          icon: BookOpen },
    { id: 'materials', label: 'Study Materials', icon: FileText },
    { id: 'questions', label: 'Question Bank',   icon: HelpCircle },
  ];

  const handleNav = (id) => {
    setActiveNav(id);
    if (id === 'dashboard') navigate('/admin-dashboard');
    if (id === 'analytics') navigate('/admin-analytics');
    if (id === 'topics')    navigate('/topics');
    if (id === 'teachers')  navigate('/add-teacher');
  };

  const handleLogout = () => {
    ['adminLoggedIn', 'adminEmail', 'role', 'token', 'userId'].forEach(k => localStorage.removeItem(k));
    navigate('/admin-login');
  };

  const handleAddCourse = async () => {
    setError(''); setSuccess('');
    if (!name.trim() || !code.trim()) {
      setError('Both Course Name and Course Code are required.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/courses/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Something went wrong.');
      } else {
        setSuccess('Course added successfully! Redirecting…');
        setName(''); setCode('');
        setTimeout(() => navigate('/topics'), 1400);
      }
    } catch {
      setError('Server error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f2f8', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #c7d2fe; border-radius: 99px; }

        @keyframes fadeUp { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse  { 0%,100% { opacity:1; } 50% { opacity:.45; } }
        @keyframes spin   { to { transform: rotate(360deg); } }

        .fade-up { animation: fadeUp .45s cubic-bezier(.16,1,.3,1) both; }

        .nav-item {
          display:flex; align-items:center; gap:11px; padding:10px 14px;
          border-radius:12px; cursor:pointer; transition:all .2s cubic-bezier(.16,1,.3,1);
          color:rgba(255,255,255,.65); font-size:13.5px; font-weight:500;
          border:none; background:none; width:100%; text-align:left; position:relative;
        }
        .nav-item:hover { background:rgba(255,255,255,.12); color:#fff; transform:translateX(2px); }
        .nav-item.active {
          background:rgba(255,255,255,.2); color:#fff; font-weight:700;
          box-shadow:0 4px 16px rgba(0,0,0,.2); border:1px solid rgba(255,255,255,.25);
        }
        .nav-item.active::before {
          content:''; position:absolute; left:-8px; top:50%; transform:translateY(-50%);
          width:3px; height:60%; background:#fff; border-radius:99px; opacity:.9;
        }
        .sidebar-section {
          font-size:10px; font-weight:700; letter-spacing:1.5px;
          text-transform:uppercase; color:rgba(255,255,255,.4); padding:8px 14px 4px;
        }

        .ac-input {
          width:100%; background:#fff; border:1.5px solid #e2e8f0; border-radius:12px;
          padding:13px 16px 13px 46px; font-family:'DM Sans',sans-serif;
          font-size:14px; color:#0f172a; outline:none;
          transition:border-color .2s, box-shadow .2s;
        }
        .ac-input::placeholder { color:#94a3b8; }
        .ac-input:focus { border-color:#667eea; box-shadow:0 0 0 4px rgba(102,126,234,.1); }
        .ac-input:hover:not(:focus) { border-color:#c7d2fe; }

        .ac-input-wrap { position:relative; }
        .ac-input-icon {
          position:absolute; left:15px; top:50%; transform:translateY(-50%);
          color:#94a3b8; pointer-events:none; transition:color .2s;
        }
        .ac-input-wrap:focus-within .ac-input-icon { color:#667eea; }

        .btn-submit {
          display:flex; align-items:center; justify-content:center; gap:8px;
          background:linear-gradient(135deg,#667eea,#764ba2);
          border:none; border-radius:12px; color:#fff;
          font-family:'DM Sans',sans-serif; font-size:14.5px; font-weight:700;
          padding:13px 28px; cursor:pointer; width:100%;
          box-shadow:0 6px 20px rgba(102,126,234,.38);
          transition:all .2s cubic-bezier(.16,1,.3,1); letter-spacing:-.1px;
        }
        .btn-submit:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 10px 28px rgba(102,126,234,.48); }
        .btn-submit:active:not(:disabled) { transform:translateY(0); }
        .btn-submit:disabled { opacity:.6; cursor:not-allowed; }

        .btn-cancel {
          display:flex; align-items:center; justify-content:center; gap:7px;
          background:#fff; border:1.5px solid #e2e8f0; border-radius:12px;
          color:#475569; font-family:'DM Sans',sans-serif; font-size:14px;
          font-weight:600; padding:12px 22px; cursor:pointer; transition:all .18s;
        }
        .btn-cancel:hover { border-color:#c7d2fe; color:#667eea; background:#eef2ff; }

        .spinner {
          width:16px; height:16px; border:2.5px solid rgba(255,255,255,.35);
          border-top-color:#fff; border-radius:50%;
          animation:spin .65s linear infinite; flex-shrink:0;
        }
        .glow-dot {
          width:8px; height:8px; border-radius:50%;
          background:#10b981; box-shadow:0 0 0 3px rgba(16,185,129,.25);
          animation:pulse 2s infinite; display:inline-block;
        }
        .quick-nav-btn {
          display:flex; align-items:center; gap:10px; width:100%;
          padding:10px 12px; background:none; border:none; border-radius:10px;
          cursor:pointer; transition:all .15s; color:#374151; font-size:13px;
          font-weight:600; font-family:inherit; text-align:left;
        }
        .quick-nav-btn:hover { background:#eef2ff; color:#667eea; }
      `}</style>

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: sidebarOpen ? 248 : 68, minHeight: '100vh',
        background: 'linear-gradient(180deg,#1e1b4b 0%,#312e81 60%,#4c1d95 100%)',
        transition: 'width .28s cubic-bezier(.16,1,.3,1)', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
        position: 'sticky', top: 0, height: '100vh',
        boxShadow: '4px 0 32px rgba(0,0,0,.25)',
      }}>
        <div style={{ padding: '20px 14px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(255,255,255,.1)', minHeight: 72 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 14px rgba(0,0,0,.3)', border: '1px solid rgba(255,255,255,.25)' }}>
            <GraduationCap size={20} color="#fff" />
          </div>
          {sidebarOpen && (
            <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
              <p style={{ fontSize: 17, fontWeight: 800, color: '#ffffff', letterSpacing: '-.3px' }}>EduAdapt</p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,.6)', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700 }}>Admin Panel</p>
            </div>
          )}
        </div>

        <nav style={{ flex: 1, padding: '14px 8px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
          {sidebarOpen && <p className="sidebar-section">Menu</p>}
          {navItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button key={item.id}
                className={`nav-item ${activeNav === item.id ? 'active' : ''}`}
                onClick={() => handleNav(item.id)}
                title={!sidebarOpen ? item.label : ''}
                style={{ animationDelay: `${idx * 0.04}s` }}
              >
                <Icon size={18} style={{ flexShrink: 0 }} />
                {sidebarOpen && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {sidebarOpen && (
          <div style={{ margin: '0 8px 12px', padding: '14px', background: 'rgba(255,255,255,.1)', borderRadius: 14, border: '1px solid rgba(255,255,255,.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 800, flexShrink: 0, border: '1px solid rgba(255,255,255,.3)' }}>A</div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#ffffff' }}>Administrator</p>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,.65)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{adminEmail}</p>
              </div>
            </div>
          </div>
        )}

        <div style={{ padding: '8px 8px 16px', borderTop: '1px solid rgba(255,255,255,.1)' }}>
          <button className="nav-item" onClick={handleLogout} style={{ color: '#fca5a5' }} title={!sidebarOpen ? 'Logout' : ''}>
            <LogOut size={18} style={{ flexShrink: 0 }} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Topbar */}
        <header style={{
          background: 'rgba(255,255,255,.85)', backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(226,232,240,.8)',
          padding: '0 28px', height: 66,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 100,
          boxShadow: '0 1px 12px rgba(0,0,0,.05)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={() => setSidebarOpen(o => !o)} style={{ width: 38, height: 38, borderRadius: 10, border: '1.5px solid #e8eaf0', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', transition: 'all .18s' }}>
              <LayoutDashboard size={16} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 13, color: '#94a3b8', cursor: 'pointer', fontWeight: 500 }} onClick={() => navigate('/admin-dashboard')}>Dashboard</span>
              <ChevronRight size={14} color="#cbd5e1" />
              <span style={{ fontSize: 13, color: '#94a3b8', cursor: 'pointer', fontWeight: 500 }} onClick={() => navigate('/topics')}>Topics</span>
              <ChevronRight size={14} color="#cbd5e1" />
              <span style={{ fontSize: 13, color: '#667eea', fontWeight: 700 }}>Add Course</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'linear-gradient(135deg,#eef2ff,#ede9fe)', border: '1.5px solid #c7d2fe', borderRadius: 12, padding: '6px 14px' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 800, boxShadow: '0 3px 8px rgba(102,126,234,.4)' }}>A</div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#3730a3' }}>Admin</p>
              <p style={{ fontSize: 10, color: '#4f46e5', fontWeight: 600 }}>{adminEmail}</p>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ flex: 1, padding: '32px 28px 48px', overflowY: 'auto' }}>

          {/* Page title */}
          <div className="fade-up" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: '-.4px' }}>Add New Course</h1>
              <p style={{ fontSize: 13, color: '#475569', marginTop: 4 }}>Register a new course to the platform</p>
            </div>
            <button className="btn-cancel" onClick={() => navigate('/topics')}>
              <ArrowLeft size={15} /> Back to Topics
            </button>
          </div>

          {/* Two-column layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>

            {/* ── Form Card ── */}
            <div className="fade-up" style={{ background: '#fff', borderRadius: 20, border: '1px solid rgba(226,232,240,.8)', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,.05)', animationDelay: '.06s' }}>
              <div style={{ padding: '20px 26px', borderBottom: '1px solid #f1f5f9', background: 'linear-gradient(135deg,#fafbff,#f5f7ff)', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#667eea,#764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 16px rgba(102,126,234,.4)' }}>
                  <BookOpen size={20} color="#fff" />
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', letterSpacing: '-.2px' }}>Course Details</p>
                  <p style={{ fontSize: 12, color: '#475569' }}>Fill in the information below</p>
                </div>
              </div>

              <div style={{ padding: '28px 26px', display: 'flex', flexDirection: 'column', gap: 22 }}>

                {error && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', background: '#fff1f2', border: '1.5px solid #fecdd3', borderRadius: 12 }}>
                    <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: '#be123c', fontWeight: 600 }}>{error}</span>
                  </div>
                )}
                {success && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 12 }}>
                    <CheckCircle size={16} color="#16a34a" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: '#166534', fontWeight: 600 }}>{success}</span>
                  </div>
                )}

                {/* Course Name */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', letterSpacing: '.04em', textTransform: 'uppercase' }}>
                    Course Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div className="ac-input-wrap">
                    <span className="ac-input-icon"><Type size={16} /></span>
                    <input className="ac-input" placeholder="e.g. Introduction to Computer Science" value={name} onChange={e => setName(e.target.value)} />
                  </div>
                  <p style={{ fontSize: 11.5, color: '#94a3b8', paddingLeft: 2 }}>Use the full official title of the course.</p>
                </div>

                {/* Course Code */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', letterSpacing: '.04em', textTransform: 'uppercase' }}>
                    Course Code <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div className="ac-input-wrap">
                    <span className="ac-input-icon"><Hash size={16} /></span>
                    <input className="ac-input" placeholder="e.g. CS101" value={code} onChange={e => setCode(e.target.value)} />
                  </div>
                  <p style={{ fontSize: 11.5, color: '#94a3b8', paddingLeft: 2 }}>A short, unique identifier for this course.</p>
                </div>

                <div style={{ height: 1, background: '#f1f5f9' }} />

                <div style={{ display: 'flex', gap: 12 }}>
                  <button className="btn-cancel" onClick={() => navigate('/topics')}>Cancel</button>
                  <button className="btn-submit" onClick={handleAddCourse} disabled={loading}>
                    {loading ? <><div className="spinner" /> Saving…</> : <><Plus size={16} /> Add Course</>}
                  </button>
                </div>
              </div>
            </div>

            {/* ── Side Panel ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Tips */}
              <div className="fade-up" style={{ background: '#fff', borderRadius: 20, border: '1px solid rgba(226,232,240,.8)', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,.05)', animationDelay: '.12s' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', background: 'linear-gradient(135deg,#fafbff,#f5f7ff)' }}>
                  <p style={{ fontSize: 13.5, fontWeight: 800, color: '#0f172a' }}>💡 Tips</p>
                </div>
                <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { icon: '📌', text: 'Course codes should be unique and short (e.g. CS101, MTH202).' },
                    { icon: '✏️', text: 'Use the full official name for the course title.' },
                    { icon: '🔗', text: 'After adding, link topics to this course from the Topics page.' },
                  ].map((tip, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>{tip.icon}</span>
                      <p style={{ fontSize: 12.5, color: '#475569', lineHeight: 1.6, fontWeight: 500 }}>{tip.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div className="fade-up" style={{ background: 'linear-gradient(135deg,#eef2ff,#ede9fe)', borderRadius: 20, border: '1.5px solid #c7d2fe', padding: '18px 20px', animationDelay: '.18s', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -16, right: -16, width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', opacity: .12, filter: 'blur(18px)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 11, background: 'linear-gradient(135deg,#667eea,#764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(102,126,234,.4)' }}>
                    <BookOpen size={16} color="#fff" />
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 800, color: '#3730a3' }}>Course Registry</p>
                    <p style={{ fontSize: 11, color: '#4338ca', fontWeight: 600 }}>EduAdapt Platform</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#059669', background: 'rgba(255,255,255,.7)', padding: '6px 12px', borderRadius: 99, width: 'fit-content', border: '1px solid #6ee7b7' }}>
                  <span className="glow-dot" /> System Ready
                </div>
              </div>

              {/* Quick Nav */}
              <div className="fade-up" style={{ background: '#fff', borderRadius: 20, border: '1px solid rgba(226,232,240,.8)', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,.05)', animationDelay: '.22s' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', background: 'linear-gradient(135deg,#fafbff,#f5f7ff)' }}>
                  <p style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>Quick Navigate</p>
                </div>
                <div style={{ padding: '8px' }}>
                  {[
                    { label: 'Admin Dashboard', icon: LayoutDashboard, path: '/admin-dashboard' },
                    { label: 'View Topics',      icon: BookOpen,        path: '/topics' },
                    { label: 'Add Teacher',      icon: GraduationCap,   path: '/add-teacher' },
                  ].map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <button key={i} className="quick-nav-btn" onClick={() => navigate(item.path)}>
                        <Icon size={15} />
                        <span>{item.label}</span>
                        <ChevronRight size={13} style={{ marginLeft: 'auto', color: '#cbd5e1' }} />
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}