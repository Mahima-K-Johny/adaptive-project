import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Upload, 
  LogOut, 
  X, 
  File, 
  Check, 
  FileText, 
  Trash2, 
  ExternalLink,
  GraduationCap,
  Menu,
  Bell
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './TeacherDashboard.css';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const teacherName = localStorage.getItem('teacherEmail')?.split('@')[0] || 'Teacher';
  const teacherEmail = localStorage.getItem('teacherEmail') || 'teacher@example.com';
  const teacherId = localStorage.getItem('teacherId');

  const [showUploadForm, setShowUploadForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [notes, setNotes] = useState([]);
  const [showNotes, setShowNotes] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('teacherLoggedIn');
    localStorage.removeItem('teacherEmail');
    localStorage.removeItem('teacherId');
    alert('Logged out successfully!');
    navigate('/teacher-login');
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !subject || !title) return alert('Please fill all fields');

    setUploading(true);
    const formData = new FormData();
    formData.append('teacherId', teacherId);
    formData.append('subject', subject);
    formData.append('title', title);
    formData.append('file', file);

    try {
      const res = await axios.post(
        'http://localhost:5000/api/materials/upload',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      console.log('UPLOAD RESPONSE 👉', res.data);
      alert(res.data?.message || 'Material uploaded successfully!');

      setShowUploadForm(false);
      setSubject('');
      setTitle('');
      setFile(null);
      
      fetchNotes();
    } catch (err) {
      console.error('UPLOAD ERROR 👉', err.response?.data || err.message);
      alert(err.response?.data?.message || 'Upload failed, but file may have been uploaded.');
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    if (!teacherId) {
      alert("You are not logged in!");
      navigate("/teacher-login");
      return;
    }
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/materials/teacher/${teacherId}`);
      console.log('Fetched notes:', res.data);
      setNotes(res.data);
    } catch (err) {
      console.error('Failed to fetch notes:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/materials/${id}`);
      alert('Note deleted successfully!');
      fetchNotes();
    } catch (err) {
      console.error(err);
      alert('Failed to delete note');
    }
  };

  const closeModal = () => {
    setShowUploadForm(false);
    setSubject('');
    setTitle('');
    setFile(null);
  };

  const dashboardCards = [
    { 
      title: 'Upload Material', 
      count: '+',
      description: 'Share resources with students',
      icon: Upload, 
      colorBar: 'card-color-bar-teal',
      iconWrapper: 'card-icon-wrapper-teal',
      button: 'card-button-teal',
      action: () => setShowUploadForm(true) 
    },
    { 
      title: 'My Notes', 
      count: notes.length,
      description: 'Manage uploaded materials',
      icon: BookOpen, 
      colorBar: 'card-color-bar-orange',
      iconWrapper: 'card-icon-wrapper-orange',
      button: 'card-button-orange',
      action: () => setShowNotes(true) 
    },
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
              <div className="logo-section">
                <div className="logo-icon-container">
                  <GraduationCap className="logo-icon" />
                </div>
                <div className="logo-text-container">
                  <h1>EduAdapt</h1>
                  <p>Teacher Dashboard</p>
                </div>
              </div>
            </div>

            <div className="nav-right">
              <button className="notification-button">
                <Bell className="notification-icon" />
                <span className="notification-badge"></span>
              </button>

              <div className="user-info">
                <div className="user-avatar"><span>T</span></div>
                <div className="user-details">
                  <p>{teacherName}</p>
                  <p>{teacherEmail}</p>
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
            <h2 className="welcome-title">Welcome Back, {teacherName}! 👩‍🏫</h2>
            <p className="welcome-subtitle">Manage your teaching materials and resources</p>
          </div>

          <div className="cards-grid">
            {dashboardCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <div key={index} className="dashboard-card" onClick={card.action}>
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
                      <button className={`card-button ${card.button}`}>
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Upload Form Modal */}
          {showUploadForm && (
            <div className="notes-modal-overlay" onClick={closeModal}>
              <div className="notes-modal" onClick={(e) => e.stopPropagation()}>
                <div className="notes-modal-header">
                  <div className="notes-header-content">
                    <div className="notes-icon-wrapper">
                      <Upload className="notes-header-icon" />
                    </div>
                    <div>
                      <h2 className="notes-modal-title">Upload Material</h2>
                      <p className="notes-modal-subtitle">Share resources with your students</p>
                    </div>
                  </div>
                  <button className="notes-close-button" onClick={closeModal}>
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="notes-modal-body">
                  <form className="upload-form" onSubmit={handleUpload}>
                    <div className="form-fields">
                      {/* Subject Input */}
                      <div className="form-group">
                        <label className="form-label">Subject *</label>
                        <input
                          type="text"
                          placeholder="e.g., Mathematics, Physics"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          required
                          className="form-input"
                        />
                      </div>

                      {/* Title Input */}
                      <div className="form-group">
                        <label className="form-label">Title *</label>
                        <input
                          type="text"
                          placeholder="e.g., Chapter 5 Notes"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          required
                          className="form-input"
                        />
                      </div>

                      {/* File Input */}
                      <div className="form-group">
                        <label className="form-label">File *</label>
                        <div className="file-upload-area">
                          <input
                            type="file"
                            onChange={(e) => setFile(e.target.files[0])}
                            required
                            className="file-input"
                          />
                          {file ? (
                            <div className="file-selected">
                              <Check size={20} />
                              <span className="file-selected-name">{file.name}</span>
                            </div>
                          ) : (
                            <>
                              <File size={32} color="#a0aec0" className="file-placeholder-icon" />
                              <div className="file-placeholder-text">
                                Click to browse or drag and drop
                              </div>
                              <div className="file-placeholder-hint">
                                PDF, DOC, PPT, or any file type
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Buttons */}
                      <div className="form-buttons">
                        <button type="button" onClick={closeModal} className="cancel-button">
                          Cancel
                        </button>
                        <button type="submit" disabled={uploading} className="submit-button">
                          <Upload size={18} />
                          {uploading ? 'Uploading...' : 'Upload Material'}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

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
                      <h2 className="notes-modal-title">My Uploaded Notes</h2>
                      <p className="notes-modal-subtitle">
                        {notes.length} {notes.length === 1 ? 'material' : 'materials'} uploaded
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
                      <h3>No Materials Uploaded Yet</h3>
                      <p>Click "Upload Material" to add your first teaching resource!</p>
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
                              <ExternalLink className="w-4 h-4" />
                              <span>View File</span>
                            </a>
                            <button
                              className="note-delete-button"
                              onClick={() => handleDelete(note._id)}
                            >
                              <Trash2 className="w-4 h-4" />
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
};

export default TeacherDashboard;