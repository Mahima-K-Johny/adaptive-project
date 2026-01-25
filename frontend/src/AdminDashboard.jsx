import React, { useState, useEffect } from 'react';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  FileText,
  LogOut,
  Menu,
  X,
  Bell
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [courses, setCourses] = useState([]);
  const adminEmail = localStorage.getItem('adminEmail') || 'admin@example.com';
  const [studentCount, setStudentCount] = useState(0);
  const [teacherCount, setTeacherCount] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    fetchCourses();
    fetchStudentCount();
    fetchTeacherCount(); 
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/courses/all');
      setCourses(res.data);
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    }
  };

  const fetchAllNotes = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/materials/all');
      setNotes(res.data);
    } catch (err) {
      console.error('Failed to fetch notes:', err);
    }
  };

  const fetchStudentCount = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/students/count');
      setStudentCount(res.data);
    } catch (err) {
      console.error('Failed to fetch student count:', err);
    }
  };

  const fetchTeacherCount = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/teachers/count');
      setTeacherCount(res.data);
    } catch (err) {
      console.error('Failed to fetch teacher count:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('adminEmail');
    alert('Logged out successfully!');
    navigate('/admin-login');
  };

  const handleAddCourse = async () => {
    const name = prompt('Enter course name:');
    if (!name) return;

    const code = prompt('Enter course code:');
    if (!code) return;

    try {
      const res = await axios.post('http://localhost:5000/api/courses/add', { name, code });
      alert(res.data.message);
      fetchCourses();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add course');
    }
  };

  const handleDeleteNote = async (noteId) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this material?');
    if (!confirmDelete) return;

    try {
      await axios.delete(`http://localhost:5000/api/materials/${noteId}`);
      alert('Material deleted successfully');
      fetchAllNotes();
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete material');
    }
  };

  const dashboardCards = [
    {
      title: 'Teachers',
      count: teacherCount,
      description: 'Active teaching staff',
      icon: GraduationCap,
      colorBar: 'card-color-bar-purple',
      iconWrapper: 'card-icon-wrapper-purple',
      button: 'card-button-purple'
    },
    { 
      title: 'Topics', 
      count: courses.length, 
      description: 'Available courses', 
      icon: BookOpen, 
      colorBar: 'card-color-bar-orange', 
      iconWrapper: 'card-icon-wrapper-orange', 
      button: 'card-button-orange' 
    },
    { 
      title: 'Exams', 
      count: '324', 
      description: 'Total exams conducted', 
      icon: FileText, 
      colorBar: 'card-color-bar-green', 
      iconWrapper: 'card-icon-wrapper-green', 
      button: 'card-button-green' 
    },
    { 
      title: 'Add Course', 
      count: '+', 
      description: 'Create a new course', 
      icon: BookOpen, 
      colorBar: 'card-color-bar-teal', 
      iconWrapper: 'card-icon-wrapper-teal', 
      button: 'card-button-teal' 
    },
    { 
      title: 'Add Teacher', 
      count: '+', 
      description: 'Create a new teacher', 
      icon: GraduationCap, 
      colorBar: 'card-color-bar-purple', 
      iconWrapper: 'card-icon-wrapper-purple', 
      button: 'card-button-purple' 
    },
    {
      title: 'Students',
      count: studentCount,
      description: 'Total registered students',
      icon: Users,
      colorBar: 'card-color-bar-blue',
      iconWrapper: 'card-icon-wrapper-blue',
      button: 'card-button-blue'
    },
    {
      title: 'Study Materials',
      count: '📚',
      description: 'All uploaded notes',
      icon: FileText,
      colorBar: 'card-color-bar-green',
      iconWrapper: 'card-icon-wrapper-green',
      button: 'card-button-green'
    }
  ];

  return (
    <div className="dashboard-container">
      {/* Background */}
      <div className="dashboard-bg">
        <div className="dashboard-orb dashboard-orb-1"></div>
        <div className="dashboard-orb dashboard-orb-2"></div>
        <div className="dashboard-orb dashboard-orb-3"></div>
      </div>

      {/* Navbar */}
      <nav className="dashboard-nav">
        <div className="nav-container">
          <div className="nav-content">
            <div className="nav-left">
              <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="menu-button">
                {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              <div className="logo-section">
                <div className="logo-icon-container">
                  <GraduationCap className="logo-icon" />
                </div>
                <div className="logo-text-container">
                  <h1>EduAdapt</h1>
                  <p>Admin Dashboard</p>
                </div>
              </div>
            </div>

            <div className="nav-right">
              <button className="notification-button">
                <Bell className="notification-icon" />
                <span className="notification-badge"></span>
              </button>

              <div className="user-info">
                <div className="user-avatar"><span>A</span></div>
                <div className="user-details">
                  <p>Admin</p>
                  <p>{adminEmail}</p>
                </div>
              </div>

              <button onClick={handleLogout} className="logout-button">
                <LogOut className="logout-icon" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="dashboard-content">
        <div className="content-wrapper">
          <div className="welcome-section">
            <h2 className="welcome-title">Welcome Back, Admin! 👋</h2>
            <p className="welcome-subtitle">Here's an overview of your platform</p>
          </div>

          <div className="cards-grid">
            {dashboardCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <div key={index} className="dashboard-card">
                  <div className="card-inner">
                    <div className={`card-color-bar ${card.colorBar}`}></div>
                    <div className="card-content">
                      <div className={`card-icon-wrapper ${card.iconWrapper}`}>
                        <Icon className="card-icon" />
                      </div>
                      <div className="card-text-content">
                        <h3 className="card-title">{card.title}</h3>
                        <p className="card-count">{card.count}</p>
                        <p className="card-description">{card.description}</p>
                      </div>
                      <button
                        className={`card-button ${card.button}`}
                        onClick={() => {
                          if (card.title === 'Study Materials') {
                            setShowNotes(true);
                            fetchAllNotes();
                          }
                          if (card.title === 'Add Course') navigate('/add-course');
                          if (card.title === 'Topics') navigate('/topics');
                          if (card.title === 'Add Teacher') navigate('/add-teacher');
                        }}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Notes Modal */}
          {showNotes && (
            <div className="notes-modal-overlay" onClick={() => setShowNotes(false)}>
              <div className="notes-modal" onClick={(e) => e.stopPropagation()}>
                <div className="notes-modal-header">
                  <div className="notes-header-content">
                    <div className="notes-icon-wrapper">
                      <FileText className="notes-header-icon" />
                    </div>
                    <div>
                      <h2 className="notes-modal-title">Study Materials</h2>
                      <p className="notes-modal-subtitle">
                        {notes.length} {notes.length === 1 ? 'material' : 'materials'} available
                      </p>
                    </div>
                  </div>
                  <button className="notes-close-button" onClick={() => setShowNotes(false)}>
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="notes-modal-body">
                  {notes.length === 0 ? (
                    <div className="notes-empty-state">
                      <div className="empty-state-icon">📚</div>
                      <h3>No Study Materials Yet</h3>
                      <p>Study materials uploaded by teachers will appear here</p>
                    </div>
                  ) : (
                    <div className="notes-grid">
                      {notes.map((note) => (
                        <div key={note._id} className="note-card">
                          <div className="note-card-header">
                            <div className="note-file-icon">
                              <FileText />
                            </div>
                            <span className="note-subject-badge">{note.subject}</span>
                          </div>
                          <div className="note-card-body">
                            <h3 className="note-title">{note.title}</h3>
                          </div>
                          <div className="note-card-footer">
                            <a
                              href={`http://localhost:5000/uploads/${note.fileUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="note-view-button"
                            >
                              <BookOpen className="w-4 h-4" />
                              <span>View File</span>
                            </a>
                            <button
                              className="note-delete-button"
                              onClick={() => handleDeleteNote(note._id)}
                            >
                              <X className="w-4 h-4" />
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

          <div className="dashboard-footer">
            <p className="footer-text">© 2024 EduAdapt • Empowering Education Through Innovation</p>
          </div>
        </div>
      </div>
    </div>
  );
}