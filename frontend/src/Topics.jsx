import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, BookOpen, ChevronLeft, X, FileText, Download, ExternalLink } from "lucide-react";

export default function Topics() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [courseNotes,    setCourseNotes]    = useState([]);
  const [viewingCourse,  setViewingCourse]  = useState(null);
  const [notesLoading,   setNotesLoading]   = useState(false);

  const handleBack = () => {
    const isAdmin   = localStorage.getItem('adminLoggedIn');
    const isStudent = localStorage.getItem('studentLoggedIn');
    if (isAdmin)        navigate('/admin-dashboard');
    else if (isStudent) navigate('/student-dashboard');
    else                navigate('/');
  };

  const fetchCourses = async () => {
    try {
      const res  = await fetch("http://localhost:5000/api/courses/all");
      const data = await res.json();
      setCourses(data);
    } catch {
      setError("Failed to fetch courses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCourses(); }, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete course "${name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`http://localhost:5000/api/courses/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setCourses(prev => prev.filter(c => c._id !== id));
    } catch {
      alert("Failed to delete course. Please try again.");
    }
  };

  const handleViewNotes = async (courseName) => {
    setViewingCourse(courseName);
    setShowNotesModal(true);
    setNotesLoading(true);
    setCourseNotes([]);
    try {
      const res = await fetch(`http://localhost:5000/api/materials/subject/${encodeURIComponent(courseName)}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCourseNotes(data);
    } catch {
      console.error("Failed to fetch notes");
    } finally {
      setNotesLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "'Outfit',system-ui,sans-serif" }}>

      {/* ── Navbar ── */}
      <nav style={{ background: "#fff", borderBottom: "1px solid rgba(0,0,0,0.08)", padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <BookOpen size={20} color="#fff" />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#0f172a" }}>EduAdapt</p>
            <p style={{ margin: 0, fontSize: 10, color: "#94a3b8", letterSpacing: 2 }}>COURSES</p>
          </div>
        </div>

        {/* ✅ FIXED: was hardcoded to /admin-dashboard */}
        <button
          onClick={handleBack}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(79,70,229,0.08)", border: "1px solid rgba(79,70,229,0.25)", color: "#4f46e5", borderRadius: 8, padding: "7px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}
        >
          <ChevronLeft size={16} /> Back to Dashboard
        </button>
      </nav>

      {/* ── Content ── */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 32px" }}>

        <div style={{ marginBottom: 28 }}>
          <h2 style={{ margin: "0 0 4px", fontSize: 26, fontWeight: 800, color: "#0f172a" }}>All Courses</h2>
          <p style={{ margin: 0, color: "#94a3b8", fontSize: 14 }}>
            {courses.length} course{courses.length !== 1 ? "s" : ""} available
          </p>
        </div>

        {loading && (
          <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
            Loading courses...
          </div>
        )}

        {error && (
          <div style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: 10, padding: "14px 20px", color: "#dc2626", fontSize: 14 }}>
            ⚠️ {error}
          </div>
        )}

        {!loading && !error && courses.length === 0 && (
          <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
            <p style={{ fontSize: 16, fontWeight: 600, color: "#64748b" }}>No courses yet</p>
            <p style={{ fontSize: 13 }}>Click "Add Course" from the dashboard to get started.</p>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
          {courses.map((course, i) => (
            <div key={course._id} style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 16, padding: "22px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", gap: 12, transition: "box-shadow .2s" }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = "0 8px 24px rgba(79,70,229,0.1)"}
              onMouseLeave={e => e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)"}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `hsl(${200 + i * 30}, 65%, 94%)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <BookOpen size={20} color={`hsl(${200 + i * 30}, 65%, 40%)`} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{course.name}</h3>
                  <p style={{ margin: 0, fontSize: 12, color: "#94a3b8", fontFamily: "'DM Mono',monospace" }}>{course.code}</p>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: "auto" }}>
                <button
                  onClick={() => handleViewNotes(course.name)}
                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", color: "#6366f1", borderRadius: 8, padding: "8px 0", cursor: "pointer", fontSize: 13, fontWeight: 600, transition: "all .18s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#6366f1"; e.currentTarget.style.color = "#fff"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(99,102,241,0.08)"; e.currentTarget.style.color = "#6366f1"; }}
                >
                  <FileText size={14} /> View Notes
                </button>
              </div>

              {/* ✅ Hide Delete button for students */}
              {localStorage.getItem('adminLoggedIn') && (
                <button
                  onClick={() => handleDelete(course._id, course.name)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)", color: "#dc2626", borderRadius: 8, padding: "8px 0", cursor: "pointer", fontSize: 13, fontWeight: 600, transition: "all .18s", width: "100%" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#dc2626"; e.currentTarget.style.color = "#fff"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(220,38,38,0.06)"; e.currentTarget.style.color = "#dc2626"; }}
                >
                  <Trash2 size={14} /> Delete Course
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Notes Modal ── */}
      {showNotesModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
          <div style={{ background: "#fff", width: "100%", maxWidth: 600, borderRadius: 24, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", overflow: "hidden", animation: "modalIn 0.3s ease-out" }}>
            <style>{`
              @keyframes modalIn {
                from { opacity: 0; transform: translateY(20px) scale(0.95); }
                to { opacity: 1; transform: translateY(0) scale(1); }
              }
            `}</style>
            
            <div style={{ padding: "24px 32px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", background: "linear-gradient(to right, #f8fafc, #fff)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(99,102,241,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FileText size={20} color="#6366f1" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0f172a" }}>Course Notes</h3>
                  <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>{viewingCourse}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowNotesModal(false)}
                style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748b", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.color = "#ef4444"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#64748b"; }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: "32px", maxHeight: "60vh", overflowY: "auto" }}>
              {notesLoading ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>
                  <div style={{ fontSize: 32, marginBottom: 8, animation: "spin 1s linear infinite" }}>⏳</div>
                  <p>Fetching notes...</p>
                </div>
              ) : courseNotes.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>📂</div>
                  <h4 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700, color: "#334155" }}>No notes available</h4>
                  <p style={{ margin: 0, fontSize: 14, color: "#94a3b8" }}>There are no study materials uploaded for this course yet.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {courseNotes.map((note) => (
                    <div key={note._id} style={{ padding: "16px", border: "1px solid #e2e8f0", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff", transition: "all 0.2s" }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = "#6366f1"}
                      onMouseLeave={e => e.currentTarget.style.borderColor = "#e2e8f0"}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e2e8f0" }}>
                          <FileText size={18} color="#94a3b8" />
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#1e293b" }}>{note.title}</p>
                          <p style={{ margin: 0, fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>Uploaded by: {note.teacher?.name || 'Teacher'}</p>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <a 
                          href={`http://localhost:5000/uploads/${note.fileUrl}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ width: 36, height: 36, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "#f1f5f9", color: "#6366f1", transition: "all 0.2s", textDecoration: "none" }}
                          title="View"
                          onMouseEnter={e => e.currentTarget.style.background = "#eef2ff"}
                          onMouseLeave={e => e.currentTarget.style.background = "#f1f5f9"}
                        >
                          <ExternalLink size={18} />
                        </a>
                        <a 
                          href={`http://localhost:5000/uploads/${note.fileUrl}`} 
                          download={note.title}
                          style={{ width: 36, height: 36, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "#f1f5f9", color: "#10b981", transition: "all 0.2s", textDecoration: "none" }}
                          title="Download"
                          onMouseEnter={e => e.currentTarget.style.background = "#ecfdf5"}
                          onMouseLeave={e => e.currentTarget.style.background = "#f1f5f9"}
                        >
                          <Download size={18} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ padding: "20px 32px", background: "#f8fafc", borderTop: "1px solid #f1f5f9", textAlign: "right" }}>
              <button 
                onClick={() => setShowNotesModal(false)}
                style={{ padding: "10px 24px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.background = "#f1f5f9"}
                onMouseLeave={e => e.currentTarget.style.background = "#fff"}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}