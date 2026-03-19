import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, BookOpen, ChevronLeft } from "lucide-react";

export default function Topics() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

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
            <p style={{ margin: 0, fontSize: 10, color: "#94a3b8", letterSpacing: 2 }}>TOPICS</p>
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
          <h2 style={{ margin: "0 0 4px", fontSize: 26, fontWeight: 800, color: "#0f172a" }}>All Topics</h2>
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
    </div>
  );
}