import React, { useState, useEffect } from 'react';
import {
  Trophy, TrendingUp, Target, Zap, Award,
  ChevronRight, ArrowLeft, BarChart2, Clock,
  CheckCircle, XCircle, Flame, BookOpen, Shield
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Area, AreaChart
} from 'recharts';

// ── IMPORT PREMIUM CSS ──
import './StudentProgressDashboard.css';

// ── Palette ────────────────────────────────────────────────────────────────
const COLORS = {
  primary:   '#6366f1',
  success:   '#22c55e',
  warning:   '#f59e0b',
  danger:    '#ef4444',
  info:      '#06b6d4',
  purple:    '#8b5cf6',
  pink:      '#ec4899',
  border:    'rgba(255,255,255,0.07)',
};

const SUBJECT_COLORS = ['#6366f1','#06b6d4','#22c55e','#f59e0b','#ec4899','#8b5cf6'];
const LEVEL_COLORS   = { Easy: '#10b981', Intermediate: '#f59e0b', Difficult: '#ef4444' };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="spd-tooltip">
      {label && <p className="spd-tooltip-label">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="spd-tooltip-val" style={{ color: p.color }}>
          {p.name}: <strong>{p.value}{typeof p.value === 'number' && p.name?.toLowerCase().includes('score') ? '%' : ''}</strong>
        </p>
      ))}
    </div>
  );
};

export default function StudentProgressDashboard() {
  const navigate = useNavigate();

  const studentId =
    localStorage.getItem('studentId') ||
    localStorage.getItem('userId') ||
    localStorage.getItem('_id') ||
    localStorage.getItem('id') ||
    localStorage.getItem('studentEmail');

  const email = localStorage.getItem('studentEmail') || '';
  const displayName = (email.split('@')[0] || 'Student').replace(/^\w/, c => c.toUpperCase());

  const [stats, setStats]                 = useState(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [activeSubject, setActiveSubject] = useState(null);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      if (!studentId) throw new Error('No student ID found');
      const res = await axios.get(`http://localhost:5000/api/exam/progress/${studentId}`);
      setStats(res.data);
      if (res.data.subjects?.length) setActiveSubject(res.data.subjects[0].name);
    } catch (e) {
      setError(e.message);
      setStats({ totalExams:0, totalPassed:0, totalFailed:0, passRate:0, currentStreak:0, bestStreak:0, totalStudyTime:0, avgScore:0, subjects:[], recentExams:[] });
    } finally { setLoading(false); }
  };

  const activeSubjectData = stats?.subjects?.find(s => s.name === activeSubject);

  if (loading) return (
    <div className="spd-root spd-loading-screen">
      <div className="spd-loader" />
      <p>Syncing neuro-link database...</p>
    </div>
  );

  if (!stats || stats.totalExams === 0) return (
    <div className="spd-root">
      <div className="spd-bg">
        <div className="spd-bg-grid" />
        <div className="spd-bg-orb spd-orb-1" />
        <div className="spd-bg-orb spd-orb-2" />
      </div>
      <header className="spd-header">
        <div className="spd-header-left">
          <button className="spd-back-btn" onClick={() => navigate('/student-dashboard')}>
            <ArrowLeft size={16}/> Dashboard
          </button>
          <div>
            <div className="spd-header-title">My Progress</div>
          </div>
        </div>
        <div className="spd-header-right">
          <div className="spd-avatar">{displayName.charAt(0)}</div>
          <span className="spd-header-name">{displayName}</span>
        </div>
      </header>
      <div className="spd-main spd-empty">
        <div className="spd-empty-icon">📊</div>
        <h2 className="spd-empty-title">No Exam Data Yet</h2>
        <p className="spd-empty-sub">Complete your first adaptive exam to unlock analytics.</p>
        {error && <p className="spd-error">Error: {error}</p>}
        <button className="spd-cta-btn" onClick={() => navigate('/student-exam')}>
          <Zap size={18}/> Take Your First Exam <ChevronRight size={18}/>
        </button>
      </div>
    </div>
  );

  const passPieData = [
    { name: 'Passed', value: stats.totalPassed },
    { name: 'Failed', value: stats.totalFailed },
  ];

  const subjectBarData = stats.subjects.map((s, i) => ({
    name: s.name.length > 10 ? s.name.substring(0,10)+'…' : s.name,
    'Avg Score': s.avgScore,
    'Pass Rate': s.passRate,
    fill: SUBJECT_COLORS[i % SUBJECT_COLORS.length],
  }));

  const trendData = activeSubjectData?.history?.map((h, i) => ({
    attempt: `A${i + 1}`,
    Score: h.score,
    label: h.label,
  })) || [];

  const allScores = stats.recentExams.map(e => e.score);
  const buckets = ['0–20','20–40','40–60','60–80','80–100'];
  const histData = buckets.map((b, i) => ({
    range: b,
    count: allScores.filter(s => s >= i*20 && s < (i+1)*20).length,
  }));
  histData[4].count += allScores.filter(s => s === 100).length;

  const levelCounts = { Easy:0, Intermediate:0, Difficult:0 };
  stats.recentExams.forEach(e => { if (levelCounts[e.level] !== undefined) levelCounts[e.level]++; });
  const levelPieData = Object.entries(levelCounts)
    .filter(([,v]) => v > 0)
    .map(([name, value]) => ({ name, value }));

  return (
    <div className="spd-root">
      
      {/* ── Background Elements ── */}
      <div className="spd-bg">
        <div className="spd-bg-grid" />
        <div className="spd-bg-orb spd-orb-1" />
        <div className="spd-bg-orb spd-orb-2" />
        <div className="spd-bg-orb spd-orb-3" />
      </div>

      {/* ── Header ── */}
      <header className="spd-header">
        <div className="spd-header-left">
          <button className="spd-back-btn" onClick={() => navigate('/student-dashboard')}>
            <ArrowLeft size={16}/> Dashboard
          </button>
          <div>
            <div className="spd-header-title">Learning Analytics</div>
            <div className="spd-header-sub">Your cognitive performance metrics</div>
          </div>
        </div>
        <div className="spd-header-right">
          <div className="spd-streak-pill">
            <Flame size={14}/> {stats.currentStreak} day streak
          </div>
          <div className="spd-avatar">{displayName.charAt(0)}</div>
          <span className="spd-header-name">{displayName}</span>
        </div>
      </header>

      <main className="spd-main">

        {/* ── KPI STAT CARDS ── */}
        <div className="spd-stats-grid">
          <div className="spd-stat-card">
            <div className="spd-stat-card-top">
              <div className="spd-stat-icon purple-bg"><Trophy size={20} /></div>
              <span className={`spd-stat-badge ${stats.passRate >= 60 ? 'success' : 'danger'}`}>
                {stats.passRate}% Pass
              </span>
            </div>
            <div className="spd-stat-value">{stats.totalPassed}<span className="spd-stat-mute">/{stats.totalExams}</span></div>
            <div className="spd-stat-label">Exams Passed</div>
            <div className="spd-card-accent purple" />
          </div>

          <div className="spd-stat-card">
            <div className="spd-stat-card-top">
              <div className="spd-stat-icon cyan-bg"><BarChart2 size={20} /></div>
              <span className="spd-stat-badge info">Avg</span>
            </div>
            <div className="spd-stat-value">{stats.avgScore}<span className="spd-stat-mute">%</span></div>
            <div className="spd-stat-label">Average Score</div>
            <div className="spd-card-accent cyan" />
          </div>

          <div className="spd-stat-card">
            <div className="spd-stat-card-top">
              <div className="spd-stat-icon amber-bg"><Flame size={20} /></div>
              <span className="spd-stat-badge warning">best: {stats.bestStreak}d</span>
            </div>
            <div className="spd-stat-value">{stats.currentStreak}<span className="spd-stat-mute"> days</span></div>
            <div className="spd-stat-label">Current Streak</div>
            <div className="spd-card-accent amber" />
          </div>

          <div className="spd-stat-card">
            <div className="spd-stat-card-top">
              <div className="spd-stat-icon green-bg"><BookOpen size={20} /></div>
              <span className="spd-stat-badge success">{stats.totalStudyTime} min</span>
            </div>
            <div className="spd-stat-value">{stats.subjects?.length || 0}</div>
            <div className="spd-stat-label">Subjects Studied</div>
            <div className="spd-card-accent green" />
          </div>
        </div>

        {/* ── ROW 1: Pie charts ── */}
        <div className="spd-chart-grid pie-row">
          <div className="spd-chart-card">
            <div className="spd-chart-title"><Trophy size={18} className="icon-purple"/> Pass vs Fail Ratio</div>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={passPieData} cx="50%" cy="50%" innerRadius={65} outerRadius={95}
                  paddingAngle={5} dataKey="value" stroke="none" 
                  label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}>
                  <Cell fill={COLORS.success}/>
                  <Cell fill={COLORS.danger}/>
                </Pie>
                <Tooltip content={<CustomTooltip/>}/>
                <Legend iconType="circle" wrapperStyle={{ fontSize: '0.85rem', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="spd-chart-card">
            <div className="spd-chart-title"><Target size={18} className="icon-amber"/> Level Distribution</div>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={levelPieData} cx="50%" cy="50%" innerRadius={40} outerRadius={95}
                  paddingAngle={5} dataKey="value" stroke="none"
                  label={({ name, value }) => `${name}: ${value}`}>
                  {levelPieData.map((entry, i) => (
                    <Cell key={i} fill={LEVEL_COLORS[entry.name] || SUBJECT_COLORS[i]}/>
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip/>}/>
                <Legend iconType="circle" wrapperStyle={{ fontSize: '0.85rem', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── ROW 2: Bar chart + Histogram ── */}
        <div className="spd-chart-grid bar-row">
          <div className="spd-chart-card span-col">
            <div className="spd-chart-title"><BarChart2 size={18} className="icon-cyan"/> Subject Performance</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={subjectBarData} barCategoryGap="25%" margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} vertical={false}/>
                <XAxis dataKey="name" tick={{ fontSize:12, fill:'#94a3b8' }} axisLine={false} tickLine={false} dy={10}/>
                <YAxis domain={[0,100]} tick={{ fontSize:12, fill:'#94a3b8' }} axisLine={false} tickLine={false} dx={-10}/>
                <Tooltip content={<CustomTooltip/>} cursor={{ fill: 'rgba(255,255,255,0.04)' }}/>
                <Legend iconType="circle" wrapperStyle={{ fontSize: '0.85rem', paddingTop: '10px' }}/>
                <Bar dataKey="Avg Score" radius={[6,6,0,0]} fill={COLORS.primary}/>
                <Bar dataKey="Pass Rate" radius={[6,6,0,0]} fill={COLORS.info}/>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="spd-chart-card">
            <div className="spd-chart-title"><BarChart2 size={18} className="icon-pink"/> Score Distribution</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={histData} barCategoryGap="15%" margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} vertical={false}/>
                <XAxis dataKey="range" tick={{ fontSize:12, fill:'#94a3b8' }} axisLine={false} tickLine={false} dy={10}/>
                <YAxis allowDecimals={false} tick={{ fontSize:12, fill:'#94a3b8' }} axisLine={false} tickLine={false} dx={-10}/>
                <Tooltip content={<CustomTooltip/>} cursor={{ fill: 'rgba(255,255,255,0.04)' }}/>
                <Bar dataKey="count" name="Exams" radius={[6,6,0,0]}>
                  {histData.map((entry, i) => (
                    <Cell key={i} fill={
                      i === 0 ? COLORS.danger :
                      i === 1 ? '#fb923c' :
                      i === 2 ? COLORS.warning :
                      i === 3 ? '#a3e635' :
                      COLORS.success
                    }/>
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── ROW 3: Subject trend + Recent exams ── */}
        <div className="spd-chart-grid mixed-row">
          <div className="spd-chart-card area-card">
            <div className="spd-chart-title"><TrendingUp size={18} className="icon-green"/> Score Trend</div>

            <div className="spd-tab-row">
              {stats.subjects.map((s, i) => (
                <button key={s.name} 
                  className={`spd-tab ${activeSubject === s.name ? 'active' : ''}`}
                  style={activeSubject === s.name ? { backgroundColor: SUBJECT_COLORS[i % SUBJECT_COLORS.length], borderColor: SUBJECT_COLORS[i % SUBJECT_COLORS.length] } : {}}
                  onClick={() => setActiveSubject(s.name)}>
                  {s.name}
                </button>
              ))}
            </div>

            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={SUBJECT_COLORS[stats.subjects.findIndex(s => s.name === activeSubject) % SUBJECT_COLORS.length]} stopOpacity={0.4}/>
                      <stop offset="95%" stopColor={SUBJECT_COLORS[stats.subjects.findIndex(s => s.name === activeSubject) % SUBJECT_COLORS.length]} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} vertical={false}/>
                  <XAxis dataKey="attempt" tick={{ fontSize:12, fill:'#94a3b8' }} axisLine={false} tickLine={false} dy={10}/>
                  <YAxis domain={[0,100]} tick={{ fontSize:12, fill:'#94a3b8' }} axisLine={false} tickLine={false} dx={-10}/>
                  <Tooltip content={<CustomTooltip/>}/>
                  <Area type="monotone" dataKey="Score" 
                    stroke={SUBJECT_COLORS[stats.subjects.findIndex(s => s.name === activeSubject) % SUBJECT_COLORS.length]}
                    strokeWidth={3} fill="url(#scoreGrad)" 
                    dot={{ r:4, fill:'#0f172a', strokeWidth:2 }} activeDot={{ r:6, fill:'#fff' }}/>
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="spd-no-data">No trend data available.</div>
            )}

            {activeSubjectData && (
              <div className="spd-levels-passed">
                {['Easy','Intermediate','Difficult'].map(lvl => {
                  const passed = activeSubjectData.levelsPassed.includes(lvl);
                  return (
                    <div key={lvl} className={`spd-level-badge ${passed ? 'passed' : 'locked'}`}>
                      {passed ? <CheckCircle size={14}/> : <Shield size={14}/>}
                      <span>{lvl}</span>
                    </div>
                  );
                })}
                {activeSubjectData.improvement > 0 && (
                  <div className="spd-level-badge improvement">
                    <TrendingUp size={14}/> <span>+{activeSubjectData.improvement}% growth</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="spd-chart-card recent-card">
            <div className="spd-chart-title"><Clock size={18} className="icon-slate"/> Recent Activity</div>
            <div className="spd-recent-list">
              {stats.recentExams?.slice(0, 7).map((exam, i) => (
                <div key={i} className="spd-recent-item">
                  <div className={`spd-dot ${exam.passed ? 'green' : 'red'}`}/>
                  <div className="spd-recent-info">
                    <div className="spd-recent-subj">{exam.subject}</div>
                    <div className="spd-recent-meta">
                      <span style={{ color: LEVEL_COLORS[exam.level] }}>{exam.level}</span>
                      <span className="spd-bullet">&bull;</span>
                      {new Date(exam.date).toLocaleDateString('en-US',{ month:'short', day:'numeric' })}
                    </div>
                  </div>
                  <div className={`spd-recent-score ${exam.passed ? 'green' : 'red'}`}>{exam.score}%</div>
                </div>
              ))}
            </div>

            <div className="spd-grade-box">
              <div className="spd-grade-info">
                <Award size={24} className="icon-primary"/>
                <div>
                  <div className="spd-grade-title">Overall Grade</div>
                  <div className="spd-grade-sub">Across {stats.totalExams} exams</div>
                </div>
              </div>
              <div className="spd-grade-badge">
                {stats.avgScore >= 80 ? 'A' : stats.avgScore >= 65 ? 'B' : stats.avgScore >= 50 ? 'C' : 'D'}
              </div>
            </div>
          </div>
        </div>

        {/* ── CTA ── */}
        <div className="spd-cta">
          <button className="spd-cta-btn" onClick={() => navigate('/student-exam')}>
            <span className="spd-cta-icon-wrapper"><Zap size={18}/></span>
            Take Next Exam <ChevronRight size={18}/>
          </button>
        </div>

      </main>
    </div>
  );
}