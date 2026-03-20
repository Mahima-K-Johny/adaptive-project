import React, { useState, useEffect } from 'react';
import {
  Users, GraduationCap, BookOpen, FileText,
  LogOut, X, Bell, HelpCircle, Trash2, Filter, BarChart2,
  LayoutDashboard, ChevronRight, TrendingUp, Award, Plus,
  Search, Settings, Sparkles, Zap, Clock, Edit2, Download
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import QuestionManager from './QuestionManager';

const LEVEL_LABELS = { 1: 'Easy', 2: 'Intermediate', 3: 'Difficult' };
const LEVEL_STYLES = {
  1: { background: 'linear-gradient(135deg,#d1fae5,#a7f3d0)', color: '#065f46', border: '1px solid #6ee7b7' },
  2: { background: 'linear-gradient(135deg,#fef3c7,#fde68a)', color: '#78350f', border: '1px solid #fbbf24' },
  3: { background: 'linear-gradient(135deg,#fee2e2,#fecaca)', color: '#7f1d1d', border: '1px solid #f87171' },
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [courses,       setCourses]       = useState([]);
  const [sidebarOpen,   setSidebarOpen]   = useState(true);
  const adminEmail = localStorage.getItem('adminEmail') || 'admin@example.com';
  const [studentCount,  setStudentCount]  = useState(0);
  const [teacherCount,  setTeacherCount]  = useState(0);
  const [examCount,     setExamCount]     = useState(0);
  const [activeNav,     setActiveNav]     = useState('dashboard');

  const [time,          setTime]          = useState(new Date());
  const [showNotes,     setShowNotes]     = useState(false);
  const [notes,         setNotes]         = useState([]);

  const [showQuestions,   setShowQuestions]   = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [questions,       setQuestions]       = useState([]);
  const [qSubjects,       setQSubjects]       = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [filterLevel,     setFilterLevel]     = useState('all');
  const [filterType,      setFilterType]      = useState('all');
  const [qLoading,        setQLoading]        = useState(false);

  useEffect(() => {
    fetchCourses();
    fetchStudentCount();
    fetchTeacherCount();
    fetchExamCount();
    const tick = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  const fetchCourses      = async () => { try { const r = await axios.get('http://localhost:5000/api/courses/all'); setCourses(r.data); } catch {} };
  const fetchAllNotes     = async () => { try { const r = await axios.get('http://localhost:5000/api/materials/all'); setNotes(r.data); } catch {} };
  const fetchStudentCount = async () => { try { const r = await axios.get('http://localhost:5000/api/admin/students/count'); const d = r.data; setStudentCount(typeof d === 'object' ? (d.count ?? d.total ?? 0) : d); } catch {} };
  const fetchTeacherCount = async () => { try { const r = await axios.get('http://localhost:5000/api/admin/teachers/count'); const d = r.data; setTeacherCount(typeof d === 'object' ? (d.count ?? d.total ?? 0) : d); } catch {} };
  const fetchExamCount = async () => { 
  try { 
    const r = await axios.get('http://localhost:5000/api/exam/count'); 
    setExamCount(r.data?.totalAttended ?? 0); 
  } catch(e) { 
    console.error('examCount error', e); 
  } 
};
  const openQuestionBank = async () => {
    setShowQuestions(true); setQLoading(true);
    setSelectedSubject('all'); setFilterLevel('all'); setFilterType('all');
    try {
      const [qRes, sRes] = await Promise.all([
        axios.get('http://localhost:5000/api/admin/questions'),
        axios.get('http://localhost:5000/api/admin/questions/subjects'),
      ]);
      setQuestions(qRes.data); setQSubjects(sRes.data);
    } catch {} finally { setQLoading(false); }
  };

  const handleSubjectFilter = async (subject) => {
    setSelectedSubject(subject); setFilterLevel('all'); setFilterType('all'); setQLoading(true);
    try {
      const url = subject === 'all' ? 'http://localhost:5000/api/admin/questions' : `http://localhost:5000/api/admin/questions?subject=${encodeURIComponent(subject)}`;
      const res = await axios.get(url); setQuestions(res.data);
    } catch {} finally { setQLoading(false); }
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm('Delete this question permanently?')) return;
    try { await axios.delete(`http://localhost:5000/api/admin/questions/${id}`); setQuestions(prev => prev.filter(q => q._id !== id)); } catch { alert('Failed to delete.'); }
  };

  const filteredQuestions = questions.filter(q => {
    if (filterLevel !== 'all' && q.level !== Number(filterLevel)) return false;
    if (filterType  !== 'all' && q.type  !== filterType)           return false;
    return true;
  });

  const handleLogout = () => {
    ['adminLoggedIn','adminEmail','role','token','userId'].forEach(k => localStorage.removeItem(k));
    navigate('/admin-login');
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Delete this material?')) return;
    try { await axios.delete(`http://localhost:5000/api/materials/${noteId}`); fetchAllNotes(); } catch { alert('Failed to delete.'); }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard',      icon: LayoutDashboard },
    { id: 'analytics', label: 'Analytics',      icon: BarChart2 },
    { id: 'teachers',  label: 'Teachers',        icon: GraduationCap },
    { id: 'students',  label: 'Students',        icon: Users },
    { id: 'topics',    label: 'Courses',         icon: BookOpen },
    { id: 'materials', label: 'Study Materials', icon: FileText },
    { id: 'questions', label: 'Question Bank',   icon: HelpCircle },
  ];

  const handleNav = (id) => {
    setActiveNav(id);
    if (id === 'analytics')  navigate('/admin-analytics');
    if (id === 'topics')     navigate('/topics');
    if (id === 'teachers')   navigate('/add-teacher');
    if (id === 'materials')  { setShowNotes(true); fetchAllNotes(); }
    if (id === 'questions')  openQuestionBank();
  };

  const statCards = [
    { label: 'Total Students',  value: studentCount,   icon: Users,         gradient: 'linear-gradient(135deg,#667eea,#764ba2)', glow: 'rgba(102,126,234,0.35)', trend: '+12%', bg: 'linear-gradient(135deg,#eef2ff,#ede9fe)' },
    { label: 'Total Teachers',  value: teacherCount,   icon: GraduationCap, gradient: 'linear-gradient(135deg,#06b6d4,#0ea5e9)', glow: 'rgba(14,165,233,0.35)',  trend: '+3%',  bg: 'linear-gradient(135deg,#ecfeff,#e0f2fe)' },
    { label: 'Active Courses',  value: courses.length, icon: BookOpen,      gradient: 'linear-gradient(135deg,#10b981,#059669)', glow: 'rgba(16,185,129,0.35)',  trend: '+5%',  bg: 'linear-gradient(135deg,#f0fdf4,#dcfce7)' },
    
  ];

  const quickActions = [
    { label: 'Add Course',   icon: Plus,          gradient: 'linear-gradient(135deg,#10b981,#059669)', action: () => navigate('/add-course') },
    { label: 'Add Teacher',  icon: GraduationCap, gradient: 'linear-gradient(135deg,#667eea,#764ba2)', action: () => navigate('/add-teacher') },
    { label: 'View Courses', icon: BookOpen,      gradient: 'linear-gradient(135deg,#06b6d4,#0ea5e9)', action: () => navigate('/topics') },
    { label: 'Analytics',    icon: BarChart2,     gradient: 'linear-gradient(135deg,#f59e0b,#f97316)', action: () => navigate('/admin-analytics') },
    { label: 'Materials',    icon: FileText,      gradient: 'linear-gradient(135deg,#ec4899,#f43f5e)', action: () => { setShowNotes(true); fetchAllNotes(); } },
    { label: 'Questions',    icon: HelpCircle,    gradient: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', action: openQuestionBank },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f2f8', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&family=Playfair+Display:wght@700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #c7d2fe; border-radius: 99px; }

        @keyframes fadeUp   { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes scaleIn  { from { opacity:0; transform:scale(.94); } to { opacity:1; transform:scale(1); } }
        @keyframes floatDot { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-5px); } }
        @keyframes pulse    { 0%,100% { opacity:1; } 50% { opacity:.5; } }
        @keyframes shimmerBg {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }

        .fade-up  { animation: fadeUp .45s cubic-bezier(.16,1,.3,1) both; }
        .scale-in { animation: scaleIn .35s cubic-bezier(.16,1,.3,1) both; }

        .nav-item {
          display:flex; align-items:center; gap:11px; padding:10px 14px;
          border-radius:12px; cursor:pointer; transition:all .2s cubic-bezier(.16,1,.3,1);
          color:rgba(255,255,255,.65); font-size:13.5px; font-weight:500;
          border:none; background:none; width:100%; text-align:left; position:relative;
        }
        .nav-item:hover { background:rgba(255,255,255,.12); color:#fff; transform:translateX(2px); }
        .nav-item.active {
          background: rgba(255,255,255,.2);
          color:#fff;
          font-weight: 700;
          box-shadow: 0 4px 16px rgba(0,0,0,.2);
          border: 1px solid rgba(255,255,255,.25);
        }
        .nav-item.active::before {
          content:'';
          position:absolute; left:-8px; top:50%; transform:translateY(-50%);
          width:3px; height:60%; background:#fff; border-radius:99px; opacity:.9;
        }

        .stat-card {
          border-radius:20px; padding:24px;
          border:1px solid rgba(255,255,255,.8);
          transition:all .25s cubic-bezier(.16,1,.3,1);
          cursor:default; position:relative; overflow:hidden;
          backdrop-filter: blur(10px);
        }
        .stat-card::before {
          content:'';
          position:absolute; inset:0; opacity:0;
          background:linear-gradient(135deg,rgba(255,255,255,.6),rgba(255,255,255,.1));
          transition: opacity .3s;
        }
        .stat-card:hover { transform:translateY(-4px); box-shadow:0 20px 40px rgba(0,0,0,.1); }
        .stat-card:hover::before { opacity:1; }

        .action-btn {
          display:flex; flex-direction:column; align-items:center; gap:10px;
          padding:22px 16px; background:rgba(255,255,255,.9);
          border:1px solid rgba(255,255,255,.8); border-radius:18px;
          cursor:pointer; transition:all .22s cubic-bezier(.16,1,.3,1);
          font-family:inherit; font-size:13px; font-weight:600; color:#374151;
          backdrop-filter:blur(8px);
          position:relative; overflow:hidden;
        }
        .action-btn::after {
          content:''; position:absolute; inset:0;
          opacity:0; transition:opacity .2s;
        }
        .action-btn:hover { transform:translateY(-4px); box-shadow:0 12px 28px rgba(0,0,0,.1); border-color:#c7d2fe; }

        .pill {
          padding:5px 16px; border-radius:99px;
          border:1.5px solid #e2e8f0; background:#fff;
          color:#374151; font-size:12px; font-weight:600;
          cursor:pointer; transition:all .18s;
          font-family:inherit;
        }
        .pill:hover  { border-color:#667eea; color:#667eea; background:#eef2ff; }
        .pill.on     { background:linear-gradient(135deg,#667eea,#764ba2); color:#fff; border-color:transparent; box-shadow:0 4px 12px rgba(102,126,234,.35); }

        .qb-card {
          border:1.5px solid #e8eaf0; border-radius:14px;
          padding:18px 20px; background:#fff;
          transition:all .22s; margin-bottom:12px;
          box-shadow: 0 1px 3px rgba(0,0,0,.04);
        }
        .qb-card:hover { border-color:#a5b4fc; box-shadow:0 6px 20px rgba(99,102,241,.1); transform:translateX(2px); }

        .overlay {
          position:fixed; inset:0;
          background:rgba(10,14,30,.6);
          backdrop-filter:blur(12px);
          z-index:1000; display:flex; align-items:center;
          justify-content:center; padding:16px;
          animation:scaleIn .3s ease;
        }
        .modal {
          background:#fff; border-radius:24px; width:100%;
          max-width:840px; max-height:90vh; overflow:hidden;
          display:flex; flex-direction:column;
          box-shadow:0 40px 80px rgba(0,0,0,.3), 0 0 0 1px rgba(255,255,255,.1);
        }
        .modal-header {
          padding:26px 30px; border-bottom:1px solid #f1f5f9;
          display:flex; align-items:center; justify-content:space-between;
          background:linear-gradient(135deg,#fafbff,#f5f7ff);
        }
        .modal-body { flex:1; overflow-y:auto; padding:24px 30px; }

        .close-btn {
          width:36px; height:36px; border-radius:10px;
          border:1.5px solid #e2e8f0; background:#fff;
          display:flex; align-items:center; justify-content:center;
          cursor:pointer; transition:all .18s; color:#64748b;
        }
        .close-btn:hover { background:#fff1f2; border-color:#fecdd3; color:#ef4444; transform:rotate(90deg); }

        select.slim {
          border:1.5px solid #e2e8f0; border-radius:10px;
          padding:7px 12px; font-size:12px; font-family:inherit;
          color:#374151; background:#fff; outline:none; cursor:pointer;
          transition: border-color .18s;
          font-weight: 500;
        }
        select.slim:focus { border-color:#667eea; }

        .course-row {
          display:flex; align-items:center; gap:12px;
          padding:10px 22px; transition:all .15s; border-radius:0;
        }
        .course-row:hover { background:linear-gradient(90deg,#f8faff,#f0f2ff); padding-left:28px; }

        .glow-dot {
          width:8px; height:8px; border-radius:50%;
          background:#10b981; box-shadow:0 0 0 3px rgba(16,185,129,.25);
          animation: pulse 2s infinite;
        }

        .sidebar-section {
          font-size:10px; font-weight:700; letter-spacing:1.5px;
          text-transform:uppercase; color:rgba(255,255,255,.4); padding:8px 14px 4px;
        }


      `}</style>

      {/* ── SIDEBAR ──────────────────────────────────────────────────────── */}
      <aside style={{
        width: sidebarOpen ? 248 : 68, minHeight: '100vh',
        background: 'linear-gradient(180deg,#1e1b4b 0%,#312e81 60%,#4c1d95 100%)',
        borderRight: 'none',
        transition: 'width .28s cubic-bezier(.16,1,.3,1)', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
        position: 'sticky', top: 0, height: '100vh',
        boxShadow: '4px 0 32px rgba(0,0,0,.25)',
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 14px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(255,255,255,.1)', minHeight: 72 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'rgba(255,255,255,.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            boxShadow: '0 4px 14px rgba(0,0,0,.3)',
            border: '1px solid rgba(255,255,255,.25)',
          }}>
            <GraduationCap size={20} color="#fff" />
          </div>
          {sidebarOpen && (
            <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
              <p style={{ fontSize: 17, fontWeight: 800, color: '#ffffff', letterSpacing: '-.3px' }}>EduAdapt</p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,.6)', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700 }}>Admin Panel</p>
            </div>
          )}
        </div>

        {/* Nav */}
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

        {/* Bottom user card */}
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

        {/* Logout */}
        <div style={{ padding: '8px 8px 16px', borderTop: '1px solid rgba(255,255,255,.1)' }}>
          <button className="nav-item" onClick={handleLogout} style={{ color: '#fca5a5' }} title={!sidebarOpen ? 'Logout' : ''}>
            <LogOut size={18} style={{ flexShrink: 0 }} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── MAIN ─────────────────────────────────────────────────────────── */}
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
            <button onClick={() => setSidebarOpen(o => !o)} style={{
              width: 38, height: 38, borderRadius: 10, border: '1.5px solid #e8eaf0',
              background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#64748b', transition: 'all .18s',
            }}>
              <LayoutDashboard size={16} />
            </button>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', letterSpacing: '-.2px' }}>Welcome back, Admin 👋</p>
              <p style={{ fontSize: 11.5, color: '#475569' }}>Here's what's happening on your platform</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, padding: '5px 12px', marginLeft: 8 }}>
              <Clock size={13} color="#6366f1" />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#3730a3', fontFamily: "'DM Mono', monospace", letterSpacing: '0.5px' }}>
                {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'linear-gradient(135deg,#eef2ff,#ede9fe)', border: '1.5px solid #c7d2fe', borderRadius: 12, padding: '6px 14px' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 800, boxShadow: '0 3px 8px rgba(102,126,234,.4)' }}>A</div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#3730a3' }}>Admin</p>
                <p style={{ fontSize: 10, color: '#4f46e5', fontWeight: 600 }}>{adminEmail}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: '28px 28px 40px', overflowY: 'auto' }}>

          {/* ── Stat cards ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 16, marginBottom: 28 }}>
            {statCards.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="stat-card fade-up" style={{ background: s.bg, animationDelay: `${i * 0.08}s` }}>
                  {/* Decorative blob */}
                  <div style={{ position:'absolute', top:-20, right:-20, width:80, height:80, borderRadius:'50%', background: s.gradient, opacity:.12, filter:'blur(20px)' }} />
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, position:'relative' }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 14,
                      background: s.gradient,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: `0 8px 20px ${s.glow}`,
                    }}>
                      <Icon size={22} color="#fff" />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981', background: 'rgba(255,255,255,.8)', padding: '4px 10px', borderRadius: 99, display: 'flex', alignItems: 'center', gap: 4, backdropFilter:'blur(8px)', border:'1px solid rgba(16,185,129,.2)' }}>
                      <TrendingUp size={10} /> {s.trend}
                    </span>
                  </div>
                  <p style={{ fontSize: 30, fontWeight: 800, color: '#0f172a', fontFamily: "'DM Mono',monospace", marginBottom: 4, letterSpacing:'-1px', position:'relative' }}>{s.value}</p>
                  <p style={{ fontSize: 13, color: '#374151', fontWeight: 600, position:'relative' }}>{s.label}</p>
                </div>
              );
            })}
          </div>

          {/* ── Quick Actions ── */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', letterSpacing:'-.3px' }}>Quick Actions</h2>
                <p style={{ fontSize: 12, color: '#475569' }}>Common tasks at a glance</p>
              </div>
              <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'#818cf8', fontWeight:700, background:'#eef2ff', padding:'4px 12px', borderRadius:99, border:'1px solid #c7d2fe' }}>
                <Sparkles size={11} /> 6 actions
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 12 }}>
              {quickActions.map((a, i) => {
                const Icon = a.icon;
                return (
                  <button key={i} className="action-btn fade-up" style={{ animationDelay: `${0.25 + i * 0.06}s` }} onClick={a.action}>
                    <div style={{
                      width: 46, height: 46, borderRadius: 14,
                      background: a.gradient,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 6px 16px rgba(0,0,0,.15)',
                      transition: 'transform .18s',
                    }}>
                      <Icon size={20} color="#fff" />
                    </div>
                    {a.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Bottom row ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

            {/* Recent courses */}
            <div style={{ background: '#fff', borderRadius: 20, border: '1px solid rgba(226,232,240,.8)', overflow: 'hidden', boxShadow:'0 4px 24px rgba(0,0,0,.05)' }}>
              <div style={{
                padding: '18px 22px', borderBottom: '1px solid #f1f5f9',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'linear-gradient(135deg,#fafbff,#f5f7ff)',
              }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', letterSpacing:'-.2px' }}>Courses</p>
                  <p style={{ fontSize: 12, color: '#475569' }}>{courses.length} total enrolled</p>
                </div>
                <button onClick={() => navigate('/add-course')} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'linear-gradient(135deg,#667eea,#764ba2)',
                  border: 'none', color: '#fff', borderRadius: 10,
                  padding: '8px 16px', cursor: 'pointer', fontSize: 12,
                  fontWeight: 700, fontFamily: 'inherit',
                  boxShadow: '0 4px 12px rgba(102,126,234,.4)',
                  transition: 'all .18s',
                }}>
                  <Plus size={13} /> Add New
                </button>
              </div>
              <div style={{ padding: '6px 0', maxHeight: 260, overflowY: 'auto' }}>
                {courses.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: 13 }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📚</div>No courses yet
                  </div>
                ) : courses.slice(0, 8).map((c, i) => {
                  const hues = [220,250,280,200,170,140,320,340];
                  const h = hues[i % hues.length];
                  return (
                    <div key={c._id} className="course-row">
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: `hsl(${h},70%,94%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border:`1px solid hsl(${h},60%,86%)` }}>
                        <BookOpen size={15} color={`hsl(${h},60%,42%)`} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</p>
                        <p style={{ fontSize: 11, color: '#6b7280', fontFamily: "'DM Mono',monospace", marginTop:1 }}>{c.code}</p>
                      </div>
                      <ChevronRight size={14} color="#cbd5e1" />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Platform overview */}
            <div style={{ background: '#fff', borderRadius: 20, border: '1px solid rgba(226,232,240,.8)', overflow: 'hidden', boxShadow:'0 4px 24px rgba(0,0,0,.05)' }}>
              <div style={{ padding: '18px 22px', borderBottom: '1px solid #f1f5f9', background: 'linear-gradient(135deg,#fafbff,#f5f7ff)' }}>
                <p style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', letterSpacing:'-.2px' }}>Platform Overview</p>
                <p style={{ fontSize: 12, color: '#475569' }}>Real-time key metrics</p>
              </div>
              <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { label: 'Student Enrollment', value: studentCount, total: Math.max(studentCount, 100), gradient: 'linear-gradient(90deg,#667eea,#764ba2)', glow:'rgba(102,126,234,.3)' },
                  { label: 'Teacher Capacity',   value: teacherCount, total: Math.max(teacherCount, 20),  gradient: 'linear-gradient(90deg,#10b981,#059669)', glow:'rgba(16,185,129,.3)' },
                  { label: 'Course Coverage',    value: courses.length, total: Math.max(courses.length, 10), gradient: 'linear-gradient(90deg,#f59e0b,#f97316)', glow:'rgba(245,158,11,.3)' },
                ].map((m, i) => {
                  const pct = Math.round((m.value / m.total) * 100);
                  return (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>{m.label}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', fontFamily: "'DM Mono',monospace", background:'#f8fafc', padding:'2px 8px', borderRadius:6 }}>{m.value}</span>
                      </div>
                      <div style={{ height: 7, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden', position:'relative' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: m.gradient, borderRadius: 99, transition: 'width 1.2s cubic-bezier(.16,1,.3,1)', boxShadow:`0 0 8px ${m.glow}` }} />
                      </div>
                    </div>
                  );
                })}

                {/* Health card */}
                <div style={{ marginTop: 4, padding: '16px', background: 'linear-gradient(135deg,#eef2ff,#ede9fe)', borderRadius: 14, border:'1px solid #c7d2fe', position:'relative', overflow:'hidden' }}>
                  <div style={{ position:'absolute', top:-10, right:-10, width:60, height:60, borderRadius:'50%', background:'linear-gradient(135deg,#667eea,#764ba2)', opacity:.12, filter:'blur(16px)' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width:40, height:40, borderRadius:12, background:'linear-gradient(135deg,#667eea,#764ba2)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 12px rgba(102,126,234,.4)' }}>
                      <Award size={18} color="#fff" />
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 800, color: '#3730a3' }}>Platform Health</p>
                      <p style={{ fontSize: 11, color: '#4338ca', fontWeight:600 }}>All systems operational</p>
                    </div>
                    <div style={{ marginLeft: 'auto', display:'flex', alignItems:'center', gap:6, fontSize: 11, fontWeight: 800, color: '#059669', background: '#d1fae5', padding: '5px 12px', borderRadius: 99, border:'1px solid #6ee7b7' }}>
                      <span className="glow-dot" style={{width:6,height:6}} />Live
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ══ NOTES MODAL ══ */}
      {showNotes && (
        <div className="overlay" onClick={() => setShowNotes(false)}>
          <div className="modal scale-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#ec4899,#f97316)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow:'0 6px 16px rgba(236,72,153,.35)' }}>
                  <FileText size={20} color="#fff" />
                </div>
                <div>
                  <p style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', letterSpacing:'-.3px' }}>Study Materials</p>
                  <p style={{ fontSize: 12, color: '#475569' }}>{notes.length} materials available</p>
                </div>
              </div>
              <button className="close-btn" onClick={() => setShowNotes(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              {notes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '56px 0', color: '#94a3b8' }}>
                  <div style={{ fontSize: 48, marginBottom: 14 }}>📚</div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#64748b' }}>No materials yet</p>
                  <p style={{ fontSize: 13, marginTop:6 }}>Upload study materials to get started</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: 16 }}>
                  {notes.map(note => (
                    <div key={note._id} style={{ border: '1.5px solid #e8eaf0', borderRadius: 16, overflow: 'hidden', transition: 'all .22s', background:'#fff', boxShadow:'0 2px 8px rgba(0,0,0,.04)' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor='#a5b4fc'; e.currentTarget.style.boxShadow='0 8px 24px rgba(99,102,241,.12)'; e.currentTarget.style.transform='translateY(-2px)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor='#e8eaf0'; e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,.04)'; e.currentTarget.style.transform='none'; }}>
                      <div style={{ padding: '14px', background: 'linear-gradient(135deg,#fafbff,#f5f7ff)', borderBottom: '1px solid #e8eaf0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', background: '#eef2ff', padding: '4px 12px', borderRadius: 99, border:'1px solid #c7d2fe' }}>{note.subject}</span>
                        <FileText size={15} color="#94a3b8" />
                      </div>
                      <div style={{ padding: '14px 16px' }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 14, lineHeight: 1.5 }}>{note.title}</p>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <a href={`http://localhost:5000/uploads/${note.fileUrl}`} target="_blank" rel="noopener noreferrer"
                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', borderRadius: 10, fontSize: 12, fontWeight: 700, textDecoration: 'none', boxShadow:'0 4px 10px rgba(102,126,234,.35)' }}>
                            <BookOpen size={13} /> View
                          </a>
                          <a href={`http://localhost:5000/uploads/${note.fileUrl}`} download={note.title}
                            style={{ width: 36, height: 36, borderRadius: 10, border: '1.5px solid #10b981', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition:'all .18s', textDecoration: 'none' }}>
                            <Download size={13} />
                          </a>
                          <button onClick={() => handleDeleteNote(note._id)}
                            style={{ width: 36, height: 36, borderRadius: 10, border: '1.5px solid #fecdd3', background: '#fff1f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition:'all .18s' }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ QUESTION BANK MODAL ══ */}
      {showQuestions && (
        <div className="overlay" onClick={() => setShowQuestions(false)}>
          <div className="modal scale-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#667eea,#764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow:'0 6px 16px rgba(102,126,234,.4)' }}>
                  <HelpCircle size={20} color="#fff" />
                </div>
                <div>
                  <p style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', letterSpacing:'-.3px' }}>Question Bank</p>
                  <p style={{ fontSize: 12, color: '#475569' }}>{filteredQuestions.length} questions · {selectedSubject !== 'all' ? selectedSubject : 'All Subjects'}</p>
                </div>
              </div>
              <button className="close-btn" onClick={() => setShowQuestions(false)}><X size={16} /></button>
            </div>

            {/* Subject pills */}
            <div style={{ padding: '12px 30px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', background: '#fafbff' }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', letterSpacing: 1.5, textTransform: 'uppercase', marginRight:2 }}>Subject</span>
              <button className={`pill ${selectedSubject === 'all' ? 'on' : ''}`} onClick={() => handleSubjectFilter('all')}>All</button>
              {qSubjects.map(s => <button key={s} className={`pill ${selectedSubject === s ? 'on' : ''}`} onClick={() => handleSubjectFilter(s)}>{s}</button>)}
            </div>

            {/* Filters */}
            <div style={{ padding: '10px 30px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', background:'#fff' }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, color:'#94a3b8' }}><Filter size={13} /><span style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:1}}>Filter</span></div>
              <select className="slim" value={filterLevel} onChange={e => setFilterLevel(e.target.value)}>
                <option value="all">All Levels</option>
                <option value="1">Easy</option><option value="2">Intermediate</option><option value="3">Difficult</option>
              </select>
              <select className="slim" value={filterType} onChange={e => setFilterType(e.target.value)}>
                <option value="all">All Types</option>
                <option value="MCQ">MCQ</option><option value="Descriptive">Descriptive</option>
              </select>
              <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight:700, color: '#6366f1', background:'#eef2ff', padding:'4px 12px', borderRadius:99 }}>{filteredQuestions.length} shown</span>
            </div>

            <div className="modal-body">
              {qLoading ? (
                <div style={{ textAlign: 'center', padding: '56px 0', color: '#94a3b8' }}>
                  <div style={{ fontSize: 36, marginBottom: 10, animation:'pulse 1.5s infinite' }}>⏳</div>
                  <p style={{fontWeight:600}}>Loading questions…</p>
                </div>
              ) : filteredQuestions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '56px 0', color: '#94a3b8' }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>❓</div>
                  <p style={{fontWeight:600}}>No questions found</p>
                </div>
              ) : filteredQuestions.map(q => (
                <div key={q._id} className="qb-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 99, background: 'linear-gradient(135deg,#eef2ff,#ede9fe)', color: '#4338ca', border:'1px solid #c7d2fe' }}>{q.subject}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 99, ...(LEVEL_STYLES[q.level] || {}) }}>{LEVEL_LABELS[q.level]}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 99, background: '#f1f5f9', color: '#475569', border:'1px solid #e2e8f0' }}>{q.type}</span>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                      <button onClick={() => setEditingQuestion(q)}
                        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 14px', borderRadius: 9, border: '1.5px solid #c7d2fe', background: '#eef2ff', color: '#4f46e5', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition:'all .18s' }}>
                        <Edit2 size={12} /> Edit
                      </button>
                      <button onClick={() => handleDeleteQuestion(q._id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 14px', borderRadius: 9, border: '1.5px solid #fecdd3', background: '#fff1f2', color: '#be123c', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition:'all .18s' }}>
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </div>
                  <p style={{ fontSize: 13.5, color: '#1e293b', lineHeight: 1.65, marginBottom: q.type === 'MCQ' ? 12 : 0, fontWeight:500 }}>{q.text}</p>
                  {q.type === 'MCQ' && q.options?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop:4 }}>
                      {q.options.map((opt, i) => (
                        <span key={i} style={{
                          fontSize: 12, padding: '5px 14px', borderRadius: 99,
                          background: opt === q.answer ? 'linear-gradient(135deg,#d1fae5,#a7f3d0)' : '#f8fafc',
                          color: opt === q.answer ? '#065f46' : '#475569',
                          fontWeight: opt === q.answer ? 700 : 500,
                          border: opt === q.answer ? '1px solid #6ee7b7' : '1px solid #e8eaf0',
                        }}>
                          {String.fromCharCode(65 + i)}. {opt}{opt === q.answer && ' ✓'}
                        </span>
                      ))}
                    </div>
                  )}
                  {q.type === 'Descriptive' && (
                    <p style={{ fontSize: 12.5, color: '#374151', fontStyle: 'italic', marginTop: 8, padding:'10px 14px', background:'#f8fafc', borderRadius:10, borderLeft:'3px solid #10b981' }}>✅ {q.answer}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* ══ EDIT QUESTION OVERLAY ══ */}
      {editingQuestion && (
        <QuestionManager
          initialEditQuestion={editingQuestion}
          assignedSubjects={qSubjects}
          onClose={() => {
            setEditingQuestion(null);
            handleSubjectFilter(selectedSubject);
          }}
        />
      )}
    </div>
  );
}