import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area,
  LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";

const API = "http://localhost:5000/api";

const C = {
  pass:   "#16a34a",
  fail:   "#dc2626",
  mid:    "#d97706",
  blue:   "#2563eb",
  indigo: "#4f46e5",
  bg:     "#f1f5f9",
  card:   "#ffffff",
  border: "rgba(0,0,0,0.08)",
  muted:  "#94a3b8",
  sub:    "#64748b",
  text:   "#0f172a",
};

const PIE_COLORS = [C.pass, C.fail];
const LEVEL_PIE  = [C.pass, C.mid, C.fail];

// ── Tooltip ───────────────────────────────────────────────────────────────────
const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"#fff", border:"1px solid rgba(0,0,0,0.12)", borderRadius:10, padding:"10px 16px", fontSize:13, boxShadow:"0 4px 20px rgba(0,0,0,0.1)" }}>
      {label && <p style={{ color:C.indigo, fontWeight:700, marginBottom:4 }}>{label}</p>}
      {payload.map((p,i) => <p key={i} style={{ color:p.color||C.text, margin:"2px 0" }}>{p.name}: <strong>{p.value}</strong></p>)}
    </div>
  );
};

// ── Stat card ─────────────────────────────────────────────────────────────────
const Stat = ({ label, value, accent, icon, sub }) => (
  <div style={{ background:C.card, border:`1px solid ${accent}22`, borderRadius:16, padding:"22px 24px", position:"relative", overflow:"hidden", transition:"transform .2s, box-shadow .2s", cursor:"default", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}
    onMouseEnter={e => { e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.boxShadow=`0 14px 32px ${accent}22`; }}
    onMouseLeave={e => { e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,0.06)"; }}
  >
    <div style={{ position:"absolute", top:-16, right:-16, width:72, height:72, borderRadius:"50%", background:`${accent}14`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:28 }}>{icon}</div>
    <p style={{ margin:"0 0 6px", fontSize:11, color:C.muted, letterSpacing:2, textTransform:"uppercase" }}>{label}</p>
    <p style={{ margin:"0 0 4px", fontSize:38, fontWeight:800, color:C.text, fontFamily:"'DM Mono',monospace" }}>
      {value === null ? <span style={{ fontSize:22, color:C.muted }}>Loading…</span> : value.toLocaleString()}
    </p>
    {sub && <p style={{ margin:0, fontSize:12, color:accent }}>{sub}</p>}
  </div>
);

// ── Card wrapper ──────────────────────────────────────────────────────────────
const Card = ({ title, children, style={} }) => (
  <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"20px 22px", boxShadow:"0 1px 4px rgba(0,0,0,0.06)", ...style }}>
    <p style={{ margin:"0 0 18px", fontSize:11, color:C.indigo, fontWeight:700, letterSpacing:2, textTransform:"uppercase" }}>{title}</p>
    {children}
  </div>
);

const Spin = () => (
  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:180, gap:12 }}>
    <div style={{ width:36, height:36, borderRadius:"50%", border:`3px solid ${C.border}`, borderTopColor:C.indigo, animation:"spin 0.8s linear infinite" }} />
    <p style={{ color:C.muted, fontSize:13 }}>Loading data…</p>
  </div>
);

const Empty = ({ msg="No data yet" }) => (
  <div style={{ textAlign:"center", padding:"40px 0", color:C.muted, fontSize:14 }}>
    <div style={{ fontSize:32, marginBottom:8 }}>📭</div>{msg}
  </div>
);

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AdminAnalytics() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem("role")) navigate("/admin-login");
  }, [navigate]);

  const adminEmail = localStorage.getItem("adminEmail") || "admin";

  const [tab,           setTab]           = useState("overview");
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [studentCount,  setStudentCount]  = useState(null);
  const [teacherCount,  setTeacherCount]  = useState(null);
  const [questionCount, setQuestionCount] = useState(null);
  const [stats,         setStats]         = useState(null);
  const [selectedSubject, setSelectedSubject] = useState("all");

  const fetchAll = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [sCount, tCount, qAll, examStats] = await Promise.all([
        axios.get(`${API}/admin/students/count`),
        axios.get(`${API}/admin/teachers/count`),
        axios.get(`${API}/admin/questions`),
        axios.get(`${API}/exam/teacher-stats/admin`),
      ]);
      setStudentCount(sCount.data);
      setTeacherCount(tCount.data);
      setQuestionCount(Array.isArray(qAll.data) ? qAll.data.length : 0);
      setStats(examStats.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load analytics data. Please check the server.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Raw data ───────────────────────────────────────────────────────────────
  const allBySubject = (stats?.bySubject || []).filter(s => s.subject && s.subject !== "Unknown");
  const allTrend     = stats?.trend        || [];
  const allHistogram = stats?.histogram    || [];
  const allRadar     = (stats?.radar || []).filter(s => s.subject && s.subject !== "Unknown");
  const allAttended  = stats?.totalAttended || 0;
  const allPassed    = stats?.totalPassed   || 0;
  const allFailed    = stats?.totalFailed   || 0;

  // ── Unique subject list (no Unknown, auto-grows as subjects are added) ─────
  const subjectList = allBySubject.map(s => s.subject);

  // ── Filtered data ──────────────────────────────────────────────────────────
  const activeRow = selectedSubject === "all"
    ? null
    : allBySubject.find(s => s.subject === selectedSubject);

  const bySubject   = selectedSubject === "all" ? allBySubject : (activeRow ? [activeRow] : []);
  const radar       = selectedSubject === "all" ? allRadar     : allRadar.filter(s => s.subject === selectedSubject);
  const trend       = allTrend;
  const histogram   = allHistogram;

  const passFailPie = selectedSubject === "all"
    ? (stats?.passFailPie || [])
    : activeRow
      ? [{ name:"Passed", value:activeRow.passed }, { name:"Failed", value:activeRow.failed }]
      : [];

  const levelPie = selectedSubject === "all"
    ? (stats?.levelPie || [])
    : activeRow
      ? [
          { name:"Easy",         value:activeRow.easy },
          { name:"Intermediate", value:activeRow.intermediate },
          { name:"Difficult",    value:activeRow.difficult },
        ]
      : [];

  const totalAttended = selectedSubject === "all" ? allAttended : (activeRow?.attended || 0);
  const totalPassed   = selectedSubject === "all" ? allPassed   : (activeRow?.passed   || 0);
  const totalFailed   = selectedSubject === "all" ? allFailed   : (activeRow?.failed   || 0);

  const handleLogout = () => {
    ["adminLoggedIn","adminEmail","role","token","userId"].forEach(k => localStorage.removeItem(k));
    navigate("/admin-login");
  };

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:"'Outfit','Sora',system-ui,sans-serif", color:C.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing:border-box; }
        ::-webkit-scrollbar { width:5px; background:transparent; }
        ::-webkit-scrollbar-thumb { background:#cbd5e1; border-radius:3px; }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
        .fade { animation:fadeUp 0.45s ease both; }
        .tab { background:none; border:none; cursor:pointer; padding:8px 22px; border-radius:8px;
               font-family:inherit; font-size:14px; font-weight:600; transition:all .2s; color:${C.sub}; }
        .tab.on { background:rgba(79,70,229,0.1); color:${C.indigo}; }
        .tab:hover:not(.on) { color:${C.text}; background:rgba(0,0,0,0.05); }
        .row { display:grid; gap:16px; margin-bottom:16px; }

        /* ── Subject dropdown ── */
        .subj-select-wrap {
          position: relative;
          display: inline-flex;
          align-items: center;
        }
        .subj-select-wrap::after {
          content: "▾";
          position: absolute;
          right: 14px;
          color: ${C.indigo};
          font-size: 13px;
          pointer-events: none;
        }
        .subj-select {
          appearance: none;
          -webkit-appearance: none;
          background: #fff;
          border: 1.5px solid rgba(79,70,229,0.3);
          border-radius: 10px;
          padding: 9px 40px 9px 14px;
          font-family: inherit;
          font-size: 14px;
          font-weight: 600;
          color: ${C.indigo};
          cursor: pointer;
          outline: none;
          transition: border-color .2s, box-shadow .2s;
          min-width: 200px;
        }
        .subj-select:hover,
        .subj-select:focus {
          border-color: ${C.indigo};
          box-shadow: 0 0 0 3px rgba(79,70,229,0.1);
        }
        .subj-select option {
          color: ${C.text};
          font-weight: 500;
        }
      `}</style>

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <nav style={{ position:"sticky", top:0, zIndex:200, background:"rgba(255,255,255,0.95)", backdropFilter:"blur(20px)", borderBottom:`1px solid rgba(0,0,0,0.08)`, padding:"14px 32px", display:"flex", alignItems:"center", justifyContent:"space-between", boxShadow:"0 1px 8px rgba(0,0,0,0.06)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:38, height:38, borderRadius:10, background:"linear-gradient(135deg,#6366f1,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:19 }}>🎓</div>
          <div>
            <p style={{ margin:0, fontSize:17, fontWeight:800, color:C.text }}>EduAdapt</p>
            <p style={{ margin:0, fontSize:10, color:C.muted, letterSpacing:2 }}>ANALYTICS</p>
          </div>
        </div>
        <div style={{ display:"flex", gap:4 }}>
          {["overview","subjects","exams"].map(t => (
            <button key={t} className={`tab ${tab===t?"on":""}`} onClick={() => setTab(t)}>
              {{"overview":"📊 Overview","subjects":"📚 Subjects","exams":"📝 Exams"}[t]}
            </button>
          ))}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <span style={{ fontSize:12, color:C.muted }}>{adminEmail}</span>
          <button onClick={() => navigate("/admin-dashboard")} style={{ background:"rgba(79,70,229,0.08)", border:`1px solid rgba(79,70,229,0.25)`, color:C.indigo, borderRadius:8, padding:"6px 14px", cursor:"pointer", fontSize:13, fontFamily:"inherit", fontWeight:600 }}>← Dashboard</button>
          <button onClick={handleLogout} style={{ background:"rgba(220,38,38,0.07)", border:`1px solid rgba(220,38,38,0.2)`, color:C.fail, borderRadius:8, padding:"6px 14px", cursor:"pointer", fontSize:13, fontFamily:"inherit", fontWeight:600 }}>Logout</button>
        </div>
      </nav>

      <div style={{ padding:"28px 32px 0", maxWidth:1400, margin:"0 auto" }}>

        {/* ── Page heading + dropdown on same row ──────────────────────────── */}
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:24, flexWrap:"wrap", gap:16 }}>
          <div>
            <h1 style={{ margin:"0 0 4px", fontSize:28, fontWeight:800, color:C.text }}>Platform Analytics</h1>
            <p style={{ margin:0, color:C.muted, fontSize:14 }}>
              Live data from your EduAdapt backend
              {!loading && <span style={{ marginLeft:12, color:C.pass, fontSize:12 }}>● up to date</span>}
            </p>
          </div>

          {/* ── SUBJECT DROPDOWN ─────────────────────────────────────────── */}
          {!loading && subjectList.length > 0 && (
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:12, fontWeight:700, color:C.muted, letterSpacing:1, textTransform:"uppercase" }}>
                Subject:
              </span>
              <div className="subj-select-wrap">
                <select
                  className="subj-select"
                  value={selectedSubject}
                  onChange={e => setSelectedSubject(e.target.value)}
                >
                  <option value="all">All Subjects</option>
                  {subjectList.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              {selectedSubject !== "all" && (
                <button
                  onClick={() => setSelectedSubject("all")}
                  style={{ background:"none", border:"none", cursor:"pointer", color:C.muted, fontSize:18, lineHeight:1, padding:"2px 4px" }}
                  title="Clear filter"
                >✕</button>
              )}
            </div>
          )}
        </div>

        {/* error banner */}
        {error && (
          <div style={{ background:"rgba(220,38,38,0.06)", border:`1px solid rgba(220,38,38,0.3)`, borderRadius:10, padding:"14px 20px", marginBottom:20, color:C.fail, fontSize:14, display:"flex", alignItems:"center", gap:10 }}>
            ⚠️ {error}
            <button onClick={fetchAll} style={{ marginLeft:"auto", background:"none", border:`1px solid ${C.fail}`, color:C.fail, borderRadius:6, padding:"4px 12px", cursor:"pointer", fontSize:12, fontFamily:"inherit" }}>Retry</button>
          </div>
        )}

        {/* ── OVERVIEW TAB ─────────────────────────────────────────────────── */}
        {tab === "overview" && (
          <div className="fade">
            <div className="row" style={{ gridTemplateColumns:"repeat(4,1fr)" }}>
              <Stat label="Students"        value={studentCount}  accent={C.indigo} icon="👩‍🎓" sub="Registered accounts" />
              <Stat label="Teachers"        value={teacherCount}  accent={C.pass}   icon="👨‍🏫" sub="Active staff" />
              <Stat label="Questions"       value={questionCount} accent={C.mid}    icon="❓"  sub="In question bank" />
              <Stat label="Exams Completed" value={totalAttended} accent={C.blue}   icon="📝"  sub={selectedSubject==="all" ? "All time sessions" : `In ${selectedSubject}`} />
            </div>

            <div className="row" style={{ gridTemplateColumns:"2fr 1fr 1fr" }}>
              <Card title={selectedSubject==="all" ? "Pass vs Fail by Subject" : `Pass vs Fail · ${selectedSubject}`}>
                {loading ? <Spin /> : bySubject.length===0 ? <Empty /> : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={bySubject} barCategoryGap="30%">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                      <XAxis dataKey="subject" tick={{ fill:C.muted, fontSize:11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill:C.muted, fontSize:11 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<Tip />} />
                      <Legend wrapperStyle={{ color:C.sub, fontSize:12 }} />
                      <Bar dataKey="passed" name="Passed" fill={C.pass} radius={[5,5,0,0]} />
                      <Bar dataKey="failed" name="Failed" fill={C.fail} radius={[5,5,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Card>

              <Card title="Overall Pass/Fail">
                {loading ? <Spin /> : passFailPie.length===0 ? <Empty /> : (
                  <>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={passFailPie} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                          {passFailPie.map((_,i) => <Cell key={i} fill={PIE_COLORS[i]} stroke="none" />)}
                        </Pie>
                        <Tooltip content={<Tip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display:"flex", justifyContent:"center", gap:20, marginTop:4 }}>
                      {passFailPie.map((d,i) => (
                        <span key={i} style={{ fontSize:12, color:PIE_COLORS[i], display:"flex", alignItems:"center", gap:5 }}>
                          <span style={{ width:8, height:8, borderRadius:"50%", background:PIE_COLORS[i], display:"inline-block" }} />
                          {d.name}: <strong>{d.value}</strong>
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </Card>

              <Card title="By Difficulty">
                {loading ? <Spin /> : levelPie.length===0 ? <Empty /> : (
                  <>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={levelPie} cx="50%" cy="50%" outerRadius={80} paddingAngle={3} dataKey="value"
                          label={({ percent }) => `${(percent*100).toFixed(0)}%`} labelLine={{ stroke:C.muted }}>
                          {levelPie.map((_,i) => <Cell key={i} fill={LEVEL_PIE[i]} stroke="none" />)}
                        </Pie>
                        <Tooltip content={<Tip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display:"flex", justifyContent:"center", gap:12, marginTop:4, flexWrap:"wrap" }}>
                      {levelPie.map((d,i) => (
                        <span key={i} style={{ fontSize:11, color:LEVEL_PIE[i], display:"flex", alignItems:"center", gap:4 }}>
                          <span style={{ width:7, height:7, borderRadius:"50%", background:LEVEL_PIE[i], display:"inline-block" }} />
                          {d.name}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </Card>
            </div>

            <div className="row" style={{ gridTemplateColumns:"1fr" }}>
              <Card title="6-Month Attendance & Pass Rate Trend">
                {loading ? <Spin /> : trend.length===0 ? <Empty msg="No trend data yet" /> : (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={trend}>
                      <defs>
                        <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={C.indigo} stopOpacity={0.2} />
                          <stop offset="95%" stopColor={C.indigo} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={C.pass} stopOpacity={0.2} />
                          <stop offset="95%" stopColor={C.pass} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                      <XAxis dataKey="month" tick={{ fill:C.muted, fontSize:12 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill:C.muted, fontSize:12 }} axisLine={false} tickLine={false} unit="%" />
                      <Tooltip content={<Tip />} />
                      <Legend wrapperStyle={{ color:C.sub, fontSize:12 }} />
                      <Area type="monotone" dataKey="attendance" name="Attendance %" stroke={C.indigo} fill="url(#g1)" strokeWidth={2} dot={{ fill:C.indigo, r:4 }} />
                      <Area type="monotone" dataKey="passRate"   name="Pass Rate %"   stroke={C.pass}   fill="url(#g2)" strokeWidth={2} dot={{ fill:C.pass,   r:4 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </Card>
            </div>

            <Card title="Score Distribution Histogram" style={{ marginBottom:16 }}>
              {loading ? <Spin /> : histogram.length===0 ? <Empty /> : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={histogram}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                    <XAxis dataKey="range" tick={{ fill:C.muted, fontSize:11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill:C.muted, fontSize:11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<Tip />} />
                    <Bar dataKey="students" name="Students" radius={[4,4,0,0]}>
                      {histogram.map((_,i) => <Cell key={i} fill={i<5?C.fail:i<7?C.mid:C.pass} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>
        )}

        {/* ── SUBJECTS TAB ─────────────────────────────────────────────────── */}
        {tab === "subjects" && (
          <div className="fade">
            <div className="row" style={{ gridTemplateColumns:"1fr 1fr" }}>
              <Card title="Average Score by Subject">
                {loading ? <Spin /> : bySubject.length===0 ? <Empty /> : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={bySubject} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" horizontal={false} />
                      <XAxis type="number" tick={{ fill:C.muted, fontSize:12 }} axisLine={false} tickLine={false} domain={[0,100]} unit="%" />
                      <YAxis dataKey="subject" type="category" tick={{ fill:C.sub, fontSize:13 }} axisLine={false} tickLine={false} width={90} />
                      <Tooltip content={<Tip />} />
                      <Bar dataKey="avg" name="Avg Score" radius={[0,6,6,0]}>
                        {bySubject.map((_,i) => <Cell key={i} fill={`hsl(${200+i*25},65%,50%)`} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Card>

              <Card title="Difficulty Profile (Radar)">
                {loading ? <Spin /> : radar.length===0 ? <Empty /> : (
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={radar} outerRadius={100}>
                      <PolarGrid stroke="rgba(0,0,0,0.07)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill:C.sub, fontSize:12 }} />
                      <PolarRadiusAxis angle={30} domain={[0,100]} tick={{ fill:C.muted, fontSize:10 }} />
                      <Radar name="Easy"         dataKey="Easy"         stroke={C.pass} fill={C.pass} fillOpacity={0.15} />
                      <Radar name="Intermediate" dataKey="Intermediate" stroke={C.mid}  fill={C.mid}  fillOpacity={0.15} />
                      <Radar name="Difficult"    dataKey="Difficult"    stroke={C.fail} fill={C.fail} fillOpacity={0.15} />
                      <Legend wrapperStyle={{ color:C.sub, fontSize:12 }} />
                      <Tooltip content={<Tip />} />
                    </RadarChart>
                  </ResponsiveContainer>
                )}
              </Card>
            </div>

            <Card title="Subject Performance Table">
              {loading ? <Spin /> : bySubject.length===0 ? <Empty msg="No exam sessions recorded yet" /> : (
                <div style={{ overflowX:"auto" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:14 }}>
                    <thead>
                      <tr style={{ borderBottom:`1px solid ${C.border}` }}>
                        {["Subject","Attended","Passed","Failed","Pass Rate","Avg Score"].map(h => (
                          <th key={h} style={{ textAlign:"left", padding:"8px 16px", color:C.muted, fontSize:11, textTransform:"uppercase", letterSpacing:1.2, fontWeight:600 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {bySubject.map((r,i) => {
                        const rate = r.attended>0 ? Math.round((r.passed/r.attended)*100) : 0;
                        return (
                          <tr key={i} style={{ borderBottom:`1px solid rgba(0,0,0,0.04)`, transition:"background .15s" }}
                            onMouseEnter={e => e.currentTarget.style.background="rgba(79,70,229,0.04)"}
                            onMouseLeave={e => e.currentTarget.style.background="none"}
                          >
                            <td style={{ padding:"12px 16px", fontWeight:700, color:C.text }}>{r.subject}</td>
                            <td style={{ padding:"12px 16px", color:C.sub }}>{r.attended}</td>
                            <td style={{ padding:"12px 16px", color:C.pass, fontWeight:700 }}>{r.passed}</td>
                            <td style={{ padding:"12px 16px", color:C.fail, fontWeight:700 }}>{r.failed}</td>
                            <td style={{ padding:"12px 16px" }}>
                              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                                <div style={{ flex:1, height:5, background:"rgba(0,0,0,0.08)", borderRadius:3, overflow:"hidden" }}>
                                  <div style={{ height:"100%", width:`${rate}%`, background:rate>=60?C.pass:C.fail, borderRadius:3 }} />
                                </div>
                                <span style={{ color:rate>=60?C.pass:C.fail, fontWeight:700, minWidth:34, fontSize:13 }}>{rate}%</span>
                              </div>
                            </td>
                            <td style={{ padding:"12px 16px" }}>
                              <span style={{ background:r.avg>=70?`${C.pass}14`:r.avg>=60?`${C.mid}14`:`${C.fail}14`, color:r.avg>=70?C.pass:r.avg>=60?C.mid:C.fail, padding:"3px 10px", borderRadius:6, fontWeight:700, fontSize:13 }}>{r.avg}%</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ── EXAMS TAB ────────────────────────────────────────────────────── */}
        {tab === "exams" && (
          <div className="fade">
            <div className="row" style={{ gridTemplateColumns:"repeat(3,1fr)" }}>
              {[
                { label:"Total Attended", val:totalAttended, accent:C.blue, icon:"📋" },
                { label:"Total Passed",   val:totalPassed,   accent:C.pass, icon:"✅" },
                { label:"Total Failed",   val:totalFailed,   accent:C.fail, icon:"❌" },
              ].map((c,i) => (
                <div key={i} style={{ background:C.card, border:`1px solid ${c.accent}22`, borderRadius:16, padding:"22px 24px", display:"flex", alignItems:"center", gap:18, boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
                  <span style={{ fontSize:36 }}>{c.icon}</span>
                  <div>
                    <p style={{ margin:"0 0 4px", fontSize:11, color:C.muted, textTransform:"uppercase", letterSpacing:1.5 }}>{c.label}</p>
                    <p style={{ margin:0, fontSize:36, fontWeight:800, color:c.accent, fontFamily:"'DM Mono',monospace" }}>{loading?"…":c.val}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="row" style={{ gridTemplateColumns:"1fr 1fr" }}>
              <Card title="Questions Attempted by Difficulty">
                {loading ? <Spin /> : bySubject.length===0 ? <Empty /> : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={bySubject} barCategoryGap="25%">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                      <XAxis dataKey="subject" tick={{ fill:C.muted, fontSize:11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill:C.muted, fontSize:11 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<Tip />} />
                      <Legend wrapperStyle={{ color:C.sub, fontSize:12 }} />
                      <Bar dataKey="easy"         name="Easy"         fill={C.pass} radius={[4,4,0,0]} />
                      <Bar dataKey="intermediate" name="Intermediate" fill={C.mid}  radius={[4,4,0,0]} />
                      <Bar dataKey="difficult"    name="Difficult"    fill={C.fail} radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Card>

              <Card title="Monthly Pass Rate Trend">
                {loading ? <Spin /> : trend.length===0 ? <Empty msg="No monthly trend data" /> : (
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={trend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                      <XAxis dataKey="month" tick={{ fill:C.muted, fontSize:12 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill:C.muted, fontSize:12 }} axisLine={false} tickLine={false} unit="%" />
                      <Tooltip content={<Tip />} />
                      <Legend wrapperStyle={{ color:C.sub, fontSize:12 }} />
                      <Line type="monotone" dataKey="attendance" name="Exam Attendance %" stroke={C.indigo} strokeWidth={2.5} dot={{ fill:C.indigo, r:5 }} activeDot={{ r:7 }} />
                      <Line type="monotone" dataKey="passRate"   name="Pass Rate %"       stroke={C.pass}   strokeWidth={2.5} dot={{ fill:C.pass,   r:5 }} activeDot={{ r:7 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </Card>
            </div>

            <Card title="Score Distribution (All Students, All Exams)" style={{ marginBottom:16 }}>
              {loading ? <Spin /> : histogram.length===0 ? <Empty /> : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={histogram}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                    <XAxis dataKey="range" tick={{ fill:C.muted, fontSize:11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill:C.muted, fontSize:11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<Tip />} />
                    <Bar dataKey="students" name="No. of Students" radius={[4,4,0,0]}>
                      {histogram.map((_,i) => <Cell key={i} fill={i<5?C.fail:i<7?C.mid:C.pass} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>
        )}

        <div style={{ padding:"32px 0 8px", textAlign:"center", color:C.muted, fontSize:12 }}>
          © 2026 EduAdapt • Analytics Platform
        </div>
      </div>
    </div>
  );
}