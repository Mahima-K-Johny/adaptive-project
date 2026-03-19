import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen, X, FileText, Trash2, ExternalLink,
  GraduationCap, LogOut, Layers, Clock, Upload, HelpCircle,
  BarChart2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './TeacherDashboard.css';
import SmartUploadModal from './SmartUploadModal';
import QuestionManager  from './QuestionManager';

const TeacherDashboard = () => {
  const navigate = useNavigate();

  // ✅ FIX 1: Read localStorage inside state initialisers so values are
  //    always available on first render (avoids null on mount).
  const [teacherEmail,     setTeacherEmail]     = useState(() => localStorage.getItem('teacherEmail') || 'teacher@example.com');
  const [teacherId,        setTeacherId]        = useState(() => localStorage.getItem('teacherId'));
  const [displayName,      setDisplayName]      = useState(() => {
    const raw = localStorage.getItem('teacherName')
             || localStorage.getItem('teacherEmail')?.split('@')[0]
             || 'Teacher';
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  });

  const [showUploadForm,   setShowUploadForm]   = useState(false);
  const [showQuestions,    setShowQuestions]    = useState(false);
  const [notes,            setNotes]            = useState([]);
  const [showNotes,        setShowNotes]        = useState(false);
  const [assignedSubjects, setAssignedSubjects] = useState([]);
  const [subjectsLoading,  setSubjectsLoading]  = useState(false);
  const [time,             setTime]             = useState(new Date());

  // ✅ FIX 2: Keep a ref that always has the latest assignedSubjects so
  //    goToProgressReport never captures a stale closure value.
  const assignedSubjectsRef = useRef([]);
  useEffect(() => {
    assignedSubjectsRef.current = assignedSubjects;
  }, [assignedSubjects]);

  useEffect(() => {
    const id = localStorage.getItem('teacherId');
    if (!id) {
      navigate('/teacher-login');
      return;
    }
    // Sync state from localStorage in case component remounted
    setTeacherId(id);
    setTeacherEmail(localStorage.getItem('teacherEmail') || 'teacher@example.com');
    const raw = localStorage.getItem('teacherName')
             || localStorage.getItem('teacherEmail')?.split('@')[0]
             || 'Teacher';
    setDisplayName(raw.charAt(0).toUpperCase() + raw.slice(1));

    fetchNotes(id);
    fetchAssignedSubjects(id);

    const tick = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  const fetchAssignedSubjects = async (id) => {
    // ✅ FIX 3: Accept id as parameter — never rely on state variable which
    //    may not have updated yet when this runs right after setState.
    const tid = id || teacherId;
    if (!tid) return;
    setSubjectsLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/materials/teacher/${tid}/subjects`);
      const subjects = res.data.subjects || [];
      setAssignedSubjects(subjects);
      assignedSubjectsRef.current = subjects;
      localStorage.setItem('assignedSubjects', JSON.stringify(subjects));
    } catch {
      setAssignedSubjects([]);
      assignedSubjectsRef.current = [];
      localStorage.setItem('assignedSubjects', '[]');
    } finally {
      setSubjectsLoading(false);
    }
  };

  const fetchNotes = async (id) => {
    const tid = id || teacherId;
    if (!tid) return;
    try {
      const res = await axios.get(`http://localhost:5000/api/materials/teacher/${tid}`);
      setNotes(res.data);
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this material?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/materials/${id}`);
      fetchNotes();
    } catch { alert('Failed to delete.'); }
  };

  const handleLogout = () => {
    localStorage.removeItem('teacherLoggedIn');
    localStorage.removeItem('teacherEmail');
    localStorage.removeItem('teacherId');
    localStorage.removeItem('teacherName');
    localStorage.removeItem('assignedSubjects');
    navigate('/teacher-login');
  };

  // ✅ FIX 4: Use the ref to get the latest subjects so we never save a
  //    stale empty array, even if the API hasn't responded yet.
  const goToProgressReport = () => {
    const subjects = assignedSubjectsRef.current;
    localStorage.setItem('assignedSubjects', JSON.stringify(subjects));
    navigate('/teacher/progress-report');
  };

  const greeting = () => {
    const h = time.getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="td2-root">
      <aside className="td2-sidebar">
        <div className="td2-sidebar-logo">
          <div className="td2-logo-mark"><GraduationCap size={22} /></div>
          <span className="td2-logo-text">EduAdapt</span>
        </div>
        <div className="td2-sidebar-avatar">
          <div className="td2-avatar-ring">
            <span className="td2-avatar-letter">{displayName.charAt(0)}</span>
          </div>
          <div className="td2-avatar-info">
            <p className="td2-avatar-name">{displayName}</p>
            <p className="td2-avatar-role">Teacher</p>
          </div>
        </div>
        <nav className="td2-sidebar-nav">
          <button className="td2-nav-item td2-nav-active"><Layers size={16} /> Dashboard</button>
          <button className="td2-nav-item" onClick={() => setShowUploadForm(true)}><Upload size={16} /> Upload Material</button>
          <button className="td2-nav-item" onClick={() => setShowNotes(true)}>
            <BookOpen size={16} /> My Notes
            {notes.length > 0 && <span className="td2-nav-badge">{notes.length}</span>}
          </button>
          <button className="td2-nav-item" onClick={() => setShowQuestions(true)}><HelpCircle size={16} /> Question Bank</button>
          <button className="td2-nav-item" onClick={goToProgressReport}><BarChart2 size={16} /> Progress Report</button>
        </nav>
        <button className="td2-sidebar-logout" onClick={handleLogout}><LogOut size={15} /> Logout</button>
      </aside>

      <main className="td2-main">
        <header className="td2-topbar">
          <div className="td2-topbar-left">
            <div className="td2-clock"><Clock size={13} />
              <span>{time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
          <div className="td2-topbar-right"><span className="td2-topbar-email">{teacherEmail}</span></div>
        </header>

        <section className="td2-hero">
          <div className="td2-hero-text">
            <p className="td2-hero-greeting">{greeting()},</p>
            <h1 className="td2-hero-name">{displayName} <span className="td2-hero-wave">👋</span></h1>
            <p className="td2-hero-sub">Ready to inspire today?</p>
          </div>
          <div className="td2-hero-shape" aria-hidden="true" />
        </section>

        <section className="td2-stats">
          <div className="td2-stat-card td2-stat-indigo">
            <div className="td2-stat-icon"><FileText size={20} /></div>
            <div><p className="td2-stat-num">{notes.length}</p><p className="td2-stat-lbl">Materials Uploaded</p></div>
          </div>
          <div className="td2-stat-card td2-stat-rose">
            <div className="td2-stat-icon"><BookOpen size={20} /></div>
            <div><p className="td2-stat-num">{assignedSubjects.length}</p><p className="td2-stat-lbl">Assigned Subjects</p></div>
          </div>
        </section>

        <section className="td2-cards">
          <div className="td2-card" onClick={() => setShowUploadForm(true)}>
            <div className="td2-card-accent" />
            <div className="td2-card-body">
              <div className="td2-card-icon-wrap td2-ci-teal"><Upload size={26} /></div>
              <h3 className="td2-card-title">Upload Material</h3>
              <p className="td2-card-desc">Content is verified against the selected subject.</p>
              <button className="td2-card-btn td2-btn-teal">Upload Now →</button>
            </div>
          </div>

          <div className="td2-card" onClick={() => setShowNotes(true)}>
            <div className="td2-card-accent td2-accent-orange" />
            <div className="td2-card-body">
              <div className="td2-card-icon-wrap td2-ci-orange"><BookOpen size={26} /></div>
              <h3 className="td2-card-title">My Notes</h3>
              <p className="td2-card-desc">You have <strong>{notes.length}</strong> {notes.length === 1 ? 'material' : 'materials'} uploaded.</p>
              <button className="td2-card-btn td2-btn-orange">Browse Notes →</button>
            </div>
          </div>

          <div className="td2-card" onClick={() => setShowQuestions(true)}>
            <div className="td2-card-accent td2-accent-purple" />
            <div className="td2-card-body">
              <div className="td2-card-icon-wrap td2-ci-purple"><HelpCircle size={26} /></div>
              <h3 className="td2-card-title">Question Bank</h3>
              <p className="td2-card-desc">Add exam questions per subject for Easy, Intermediate and Difficult levels.</p>
              <button className="td2-card-btn td2-btn-purple">Manage Questions →</button>
            </div>
          </div>

          <div className="td2-card" onClick={goToProgressReport}>
            <div className="td2-card-accent" style={{ background: 'linear-gradient(180deg,#6366f1,#06b6d4)' }} />
            <div className="td2-card-body">
              <div className="td2-card-icon-wrap" style={{ background: '#6366f118' }}>
                <BarChart2 size={26} color="#6366f1" />
              </div>
              <h3 className="td2-card-title">Progress Report</h3>
              <p className="td2-card-desc">
                Attendance, pass rates, score histograms &amp; level-wise charts per subject.
              </p>
              <button className="td2-card-btn" style={{ background: '#6366f112', color: '#818cf8', border: '1px solid #6366f130' }}>
                View Analytics →
              </button>
            </div>
          </div>
        </section>
      </main>

      {showUploadForm && (
        <SmartUploadModal
          assignedSubjects={assignedSubjects}
          subjectsLoading={subjectsLoading}
          teacherId={teacherId}
          onClose={() => setShowUploadForm(false)}
          onSuccess={() => fetchNotes()}
        />
      )}

      {showQuestions && (
        <QuestionManager
          assignedSubjects={assignedSubjects}
          onClose={() => setShowQuestions(false)}
        />
      )}

      {showNotes && (
        <div className="td2-overlay" onClick={() => setShowNotes(false)}>
          <div className="td2-modal td2-modal-wide" onClick={e => e.stopPropagation()}>
            <div className="td2-modal-header">
              <div className="td2-modal-header-icon td2-mhi-orange"><FileText size={20} /></div>
              <div>
                <h2 className="td2-modal-title">My Uploaded Notes</h2>
                <p className="td2-modal-sub">{notes.length} {notes.length === 1 ? 'material' : 'materials'}</p>
              </div>
              <button className="td2-modal-close" onClick={() => setShowNotes(false)}><X size={18} /></button>
            </div>
            <div className="td2-modal-body">
              {notes.length === 0 ? (
                <div className="td2-empty">
                  <span className="td2-empty-icon">📚</span>
                  <h3>Nothing here yet</h3>
                  <p>Upload your first material to get started.</p>
                </div>
              ) : (
                <div className="td2-notes-grid">
                  {notes.map(note => (
                    <div key={note._id} className="td2-note-card">
                      <div className="td2-note-top">
                        <div className="td2-note-file-icon"><FileText size={16} /></div>
                        <span className="td2-note-badge">{note.subject}</span>
                      </div>
                      <p className="td2-note-title">{note.title}</p>
                      <div className="td2-note-actions">
                        <a href={`http://localhost:5000/uploads/${note.fileUrl}`}
                          target="_blank" rel="noopener noreferrer" className="td2-note-view">
                          <ExternalLink size={14} /> View
                        </a>
                        <button className="td2-note-delete" onClick={() => handleDelete(note._id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;