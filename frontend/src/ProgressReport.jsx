// ProgressReport.jsx — Route: /teacher/progress-report

import React, { useState, useEffect, useMemo } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line,
} from 'recharts';
import {
  ArrowLeft, RefreshCw, ChevronDown,
  BookOpen, Users, TrendingUp, Award,
  GraduationCap, LogOut, Layers, Upload, HelpCircle, BarChart2, Clock,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const C = {
  bg:'#f1f5f9', white:'#ffffff', border:'#e2e8f0', border2:'#cbd5e1',
  text:'#0f172a', sub:'#475569', muted:'#94a3b8', accent:'#6366f1',
  easy:'#10b981', inter:'#f59e0b', hard:'#f43f5e', pass:'#3b82f6',
  fail:'#f97316', shadow:'rgba(99,102,241,0.08)',
};
const PIE_COLORS   = [C.pass, C.fail];
const LEVEL_COLORS = { Easy:C.easy, Intermediate:C.inter, Difficult:C.hard };
const BAR_PALETTE  = ['#6366f1','#3b82f6','#10b981','#f59e0b','#f43f5e','#8b5cf6','#06b6d4','#ec4899'];

const normalizeSubjects = (raw) => {
  if (!Array.isArray(raw)) return [];
  return raw.map(s => {
    if (typeof s === 'string') return s.trim();
    if (s && typeof s === 'object')
      return (s.name || s.subject || s.title || Object.values(s)[0] || '').toString().trim();
    return '';
  }).filter(Boolean);
};

const makeMock = (subjects) => {
  const subjs = subjects.length ? subjects : ['Mathematics','Science'];
  const bySubject = subjs.map(s => {
    const attended = Math.floor(Math.random()*60)+20;
    const passed   = Math.floor(attended*(0.45+Math.random()*0.4));
    return {
      subject:s, attended, passed, failed:attended-passed,
      easy:Math.floor(Math.random()*20)+5,
      intermediate:Math.floor(Math.random()*15)+4,
      difficult:Math.floor(Math.random()*10)+2,
      avg:Math.floor(50+Math.random()*35),
    };
  });
  const totalAttended = bySubject.reduce((a,b)=>a+b.attended,0);
  const totalPassed   = bySubject.reduce((a,b)=>a+b.passed,0);
  return {
    bySubject,
    passFailPie:[{name:'Passed',value:totalPassed},{name:'Failed',value:totalAttended-totalPassed}],
    levelPie:[
      {name:'Easy',        value:bySubject.reduce((a,b)=>a+b.easy,0)},
      {name:'Intermediate',value:bySubject.reduce((a,b)=>a+b.intermediate,0)},
      {name:'Difficult',   value:bySubject.reduce((a,b)=>a+b.difficult,0)},
    ],
    histogram:Array.from({length:10},(_,i)=>({
      range:`${i*10}–${i*10+9}`,
      students:Math.max(1,Math.floor(Math.pow(Math.sin((i/9)*Math.PI),1.5)*30+Math.random()*6)),
    })),
    trend:['Sep','Oct','Nov','Dec','Jan','Feb'].map(m=>({month:m,passRate:Math.floor(50+Math.random()*35)})),
    totalAttended, totalPassed, totalFailed:totalAttended-totalPassed, isMock:true,
  };
};

const Tip = ({active,payload,label}) => {
  if(!active||!payload?.length) return null;
  return (
    <div style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:10,padding:'10px 14px',fontSize:13,color:C.text,boxShadow:'0 4px 16px rgba(0,0,0,0.10)'}}>
      {label && <p style={{margin:'0 0 6px',color:C.accent,fontWeight:700}}>{label}</p>}
      {payload.map((p,i)=><p key={i} style={{margin:'3px 0',color:p.color||C.text}}>{p.name}: <strong>{p.value}</strong></p>)}
    </div>
  );
};

const StatCard = ({icon:Icon,label,value,color,sub}) => (
  <div style={{flex:1,minWidth:140,background:C.white,border:`1px solid ${C.border}`,borderRadius:16,padding:'18px 20px',boxShadow:`0 2px 12px ${C.shadow}`}}>
    <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
      <div style={{width:38,height:38,borderRadius:10,background:`${color}15`,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <Icon size={18} color={color}/>
      </div>
      <span style={{fontSize:11,color:C.muted,textTransform:'uppercase',letterSpacing:'0.08em',fontWeight:600}}>{label}</span>
    </div>
    <p style={{margin:0,fontSize:30,fontWeight:800,color:C.text,lineHeight:1}}>{value}</p>
    {sub && <p style={{margin:'4px 0 0',fontSize:11,color:C.muted}}>{sub}</p>}
  </div>
);

const Card = ({title,sub,children,wide}) => (
  <div style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:16,padding:'22px 24px',gridColumn:wide?'span 2':undefined,boxShadow:`0 2px 12px ${C.shadow}`}}>
    <p style={{margin:'0 0 2px',fontSize:14,fontWeight:700,color:C.text}}>{title}</p>
    <p style={{margin:'0 0 18px',fontSize:12,color:C.muted}}>{sub||'\u00A0'}</p>
    {children}
  </div>
);

const PassBadge = ({pct}) => {
  const color = pct>=70?C.easy:pct>=50?C.inter:C.hard;
  return <span style={{background:`${color}15`,color,border:`1px solid ${color}30`,padding:'2px 10px',borderRadius:20,fontWeight:700,fontSize:12}}>{pct}%</span>;
};

export default function ProgressReport() {
  const navigate = useNavigate();

  const [teacherId,        setTeacherId]        = useState(null);
  const [displayName,      setDisplayName]      = useState('Teacher');
  const [assignedSubjects, setAssignedSubjects] = useState([]);
  const [time,             setTime]             = useState(new Date());
  const [data,             setData]             = useState(null);
  const [loading,          setLoading]          = useState(true);
  const [selSubject,       setSelSubject]       = useState('All');

  useEffect(() => {
    const id    = localStorage.getItem('teacherId');
    const email = localStorage.getItem('teacherEmail') || '';
    const raw   = localStorage.getItem('teacherName')  || email.split('@')[0] || 'Teacher';

    if (!id) { navigate('/teacher-login'); return; }

    let subjects = [];
    try {
      subjects = normalizeSubjects(JSON.parse(localStorage.getItem('assignedSubjects') || '[]'));
    } catch { subjects = []; }

    setTeacherId(id);
    setDisplayName(raw.charAt(0).toUpperCase() + raw.slice(1));
    setAssignedSubjects(subjects);
    fetchData(id, subjects);

    const tick = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  const fetchData = async (tid, subjects) => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/exam/teacher-stats/${tid}`);
      const d   = res.data;
      const mySubjects = subjects.map(s => s.toLowerCase().trim());
      const filtered   = mySubjects.length
        ? (d.bySubject||[]).filter(s => mySubjects.includes(s.subject.toLowerCase().trim()))
        : (d.bySubject||[]);
      const totalAttended = filtered.reduce((a,b)=>a+b.attended,0);
      const totalPassed   = filtered.reduce((a,b)=>a+b.passed,0);
      const totalFailed   = totalAttended - totalPassed;
      setData({
        bySubject:filtered,
        passFailPie:[{name:'Passed',value:totalPassed},{name:'Failed',value:totalFailed}],
        levelPie:[
          {name:'Easy',        value:filtered.reduce((a,b)=>a+b.easy,0)},
          {name:'Intermediate',value:filtered.reduce((a,b)=>a+b.intermediate,0)},
          {name:'Difficult',   value:filtered.reduce((a,b)=>a+b.difficult,0)},
        ],
        histogram:d.histogram||[], trend:d.trend||[],
        totalAttended, totalPassed, totalFailed,
        isMock:false, isEmpty:filtered.length===0,
      });
    } catch {
      setData({...makeMock(subjects)});
    } finally { setLoading(false); }
  };

  const handleLogout = () => {
    ['teacherLoggedIn','teacherEmail','teacherId','teacherName','assignedSubjects','role','userId']
      .forEach(k => localStorage.removeItem(k));
    navigate('/teacher-login');
  };

  const viewData = useMemo(() => {
    if (!data) return [];
    return selSubject === 'All' ? data.bySubject : data.bySubject.filter(s => s.subject === selSubject);
  }, [data, selSubject]);

  const subjectPieData = useMemo(() => viewData.map(s => ({name:s.subject, value:s.attended})), [viewData]);
  const passRate = data ? (data.totalAttended ? Math.round((data.totalPassed/data.totalAttended)*100) : 0) : 0;

  const navBtn = (active) => ({
    display:'flex', alignItems:'center', gap:10,
    padding:'11px 20px', width:'100%', border:'none',
    background: active ? 'rgba(255,255,255,0.13)' : 'transparent',
    color: active ? '#fff' : 'rgba(255,255,255,0.60)',
    cursor:'pointer', fontSize:14, fontWeight: active ? 700 : 400,
    borderLeft: active ? '3px solid #a5b4fc' : '3px solid transparent',
    transition:'all .15s', textAlign:'left',
  });

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{overflow:hidden}
        .pr-page{display:flex;height:100vh;background:${C.bg};font-family:'Segoe UI',system-ui,sans-serif}
        .pr-main{flex:1;overflow-y:auto;padding:32px 32px 48px}
        .pr-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}
        @media(max-width:860px){.pr-grid{grid-template-columns:1fr!important}}
        .pr-main::-webkit-scrollbar{width:6px}
        .pr-main::-webkit-scrollbar-thumb{background:${C.border2};border-radius:99px}
        .pr-select{appearance:none;background:${C.white};border:1px solid ${C.border2};border-radius:10px;color:${C.text};padding:8px 34px 8px 14px;font-size:13px;cursor:pointer;outline:none;font-weight:600}
        .pr-select:hover{border-color:${C.accent}}
        .pr-row:hover{background:#f0f4ff!important}
        .pr-nav:hover{background:rgba(255,255,255,0.08)!important;color:#fff!important}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadein{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .pr-animate{animation:fadein .3s ease both}
      `}</style>

      <div className="pr-page">

        {/* Sidebar */}
        <aside style={{width:240,flexShrink:0,background:'#1e1b4b',display:'flex',flexDirection:'column',height:'100vh'}}>
          <div style={{display:'flex',alignItems:'center',gap:10,padding:'22px 20px',borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
            <div style={{width:36,height:36,borderRadius:10,background:'#6366f1',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <GraduationCap size={20} color="#fff"/>
            </div>
            <span style={{color:'#fff',fontWeight:800,fontSize:18,letterSpacing:'-0.02em'}}>EduAdapt</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:12,padding:'18px 20px',borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
            <div style={{width:40,height:40,borderRadius:'50%',background:'linear-gradient(135deg,#6366f1,#a78bfa)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:800,fontSize:16,flexShrink:0}}>
              {displayName.charAt(0)}
            </div>
            <div>
              <p style={{color:'#fff',fontWeight:700,fontSize:14,margin:0}}>{displayName}</p>
              <p style={{color:'rgba(255,255,255,0.45)',fontSize:12,margin:0}}>Teacher</p>
            </div>
          </div>
          <nav style={{flex:1,paddingTop:8}}>
            <button className="pr-nav" style={navBtn(false)} onClick={()=>navigate('/teacher-dashboard')}><Layers size={16}/> Dashboard</button>
            <button className="pr-nav" style={navBtn(false)} onClick={()=>navigate('/teacher-dashboard')}><Upload size={16}/> Upload Material</button>
            <button className="pr-nav" style={navBtn(false)} onClick={()=>navigate('/teacher-dashboard')}><BookOpen size={16}/> My Notes</button>
            <button className="pr-nav" style={navBtn(false)} onClick={()=>navigate('/teacher-dashboard')}><HelpCircle size={16}/> Question Bank</button>
            <button className="pr-nav" style={navBtn(true)}><BarChart2 size={16}/> Progress Report</button>
          </nav>
          <div style={{padding:'14px 20px',borderTop:'1px solid rgba(255,255,255,0.08)',display:'flex',alignItems:'center',gap:8,color:'rgba(255,255,255,0.4)',fontSize:13}}>
            <Clock size={13}/>
            <span>{time.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}</span>
          </div>
          <button onClick={handleLogout} style={{display:'flex',alignItems:'center',gap:8,margin:'4px 12px 12px',padding:'10px 14px',border:'none',borderRadius:10,background:'transparent',color:'rgba(255,255,255,0.4)',cursor:'pointer',fontSize:13,textAlign:'left'}}>
            <LogOut size={14}/> Sign out
          </button>
        </aside>

        {/* Main */}
        <main className="pr-main">

          {/* Header */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:28,gap:12,flexWrap:'wrap'}}>
            <div style={{display:'flex',alignItems:'center',gap:14}}>
              <button onClick={()=>navigate('/teacher-dashboard')}
                style={{display:'flex',alignItems:'center',gap:6,background:C.white,border:`1px solid ${C.border}`,borderRadius:10,padding:'8px 14px',cursor:'pointer',color:C.sub,fontSize:13,fontWeight:600,boxShadow:`0 1px 4px ${C.shadow}`}}>
                <ArrowLeft size={15}/> Back
              </button>
              <div>
                <h1 style={{fontSize:22,fontWeight:900,color:C.text,margin:0,letterSpacing:'-0.03em'}}>📊 Progress Report</h1>
                <p style={{fontSize:12,color:C.muted,margin:'3px 0 0'}}>
                  Showing data for your assigned subjects only
                  {data?.isMock && <span style={{marginLeft:8,color:C.inter,fontSize:11,background:'#fef3c7',border:'1px solid #fcd34d',padding:'1px 8px',borderRadius:6,fontWeight:600}}>⚠ demo data</span>}
                </p>
              </div>
            </div>
            <div style={{display:'flex',gap:10,alignItems:'center'}}>
              {data && data.bySubject.length > 1 && (
                <div style={{position:'relative'}}>
                  <select className="pr-select" value={selSubject} onChange={e=>setSelSubject(e.target.value)}>
                    <option value="All">All Subjects</option>
                    {data.bySubject.map(s=><option key={s.subject} value={s.subject}>{s.subject}</option>)}
                  </select>
                  <ChevronDown size={13} color={C.accent} style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}/>
                </div>
              )}
              <button onClick={()=>teacherId && fetchData(teacherId, assignedSubjects)} title="Refresh"
                style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:10,padding:8,cursor:'pointer',display:'flex',color:C.muted,boxShadow:`0 1px 4px ${C.shadow}`}}>
                <RefreshCw size={15}/>
              </button>
            </div>
          </div>

          {/* Subject chips */}
          {assignedSubjects.length > 0 && (
            <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:22}}>
              <span style={{fontSize:12,color:C.muted,lineHeight:'26px',marginRight:4}}>Your subjects ({assignedSubjects.length}):</span>
              {assignedSubjects.map(s=>(
                <span key={s} style={{background:`${C.accent}10`,color:C.accent,border:`1px solid ${C.accent}25`,padding:'3px 12px',borderRadius:20,fontSize:12,fontWeight:600}}>{s}</span>
              ))}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:300}}>
              <div style={{textAlign:'center'}}>
                <div style={{width:44,height:44,margin:'0 auto 14px',border:`3px solid ${C.border}`,borderTopColor:C.accent,borderRadius:'50%',animation:'spin .8s linear infinite'}}/>
                <p style={{color:C.muted,fontSize:13,fontFamily:'monospace'}}>Loading analytics…</p>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!loading && data?.isEmpty && (
            <div style={{textAlign:'center',padding:'80px 20px'}}>
              <div style={{fontSize:56,marginBottom:16}}>📭</div>
              <h3 style={{margin:'0 0 8px',color:C.text,fontSize:22,fontWeight:800}}>No exam data yet</h3>
              <p style={{margin:'0 0 6px',fontSize:14,color:C.sub}}>No students have completed exams in your subjects yet.</p>
              <p style={{margin:0,fontSize:13,color:C.muted}}>Charts will appear automatically once students finish their first exam.</p>
            </div>
          )}

          {/* Charts */}
          {!loading && data && !data.isEmpty && (
            <div className="pr-animate">
              <div style={{display:'flex',gap:14,flexWrap:'wrap',marginBottom:24}}>
                <StatCard icon={Users}      label="Total Attended" value={data.totalAttended} color={C.accent} sub="exam sessions"/>
                <StatCard icon={Award}      label="Total Passed"   value={data.totalPassed}   color={C.easy}   sub={`${passRate}% pass rate`}/>
                <StatCard icon={TrendingUp} label="Total Failed"   value={data.totalFailed}   color={C.hard}   sub="below 60%"/>
                <StatCard icon={BookOpen}   label="Subjects"       value={assignedSubjects.length} color={C.inter} sub="assigned to you"/>
              </div>

              <div className="pr-grid">
                <Card title="Pass vs Fail" sub="Overall outcome across your subjects">
                  <ResponsiveContainer width="100%" height={230}>
                    <PieChart>
                      <Pie data={data.passFailPie} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={4}
                        label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={{stroke:C.border2}}>
                        {data.passFailPie.map((_,i)=><Cell key={i} fill={PIE_COLORS[i]} stroke="none"/>)}
                      </Pie>
                      <Tooltip content={<Tip/>}/><Legend/>
                    </PieChart>
                  </ResponsiveContainer>
                </Card>

                <Card title="Questions by Difficulty" sub="Easy / Intermediate / Difficult">
                  <ResponsiveContainer width="100%" height={230}>
                    <PieChart>
                      <Pie data={data.levelPie} cx="50%" cy="50%" outerRadius={90} dataKey="value" paddingAngle={3}
                        label={({name,percent})=>`${name.slice(0,5)} ${(percent*100).toFixed(0)}%`} labelLine={{stroke:C.border2}}>
                        {data.levelPie.map(e=><Cell key={e.name} fill={LEVEL_COLORS[e.name]} stroke="none"/>)}
                      </Pie>
                      <Tooltip content={<Tip/>}/><Legend/>
                    </PieChart>
                  </ResponsiveContainer>
                </Card>

                <Card title="Attendance vs Passed per Subject" sub="Grouped — your assigned subjects only" wide>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={viewData} barCategoryGap="30%" barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
                      <XAxis dataKey="subject" tick={{fill:C.sub,fontSize:12}}/><YAxis tick={{fill:C.muted,fontSize:11}}/>
                      <Tooltip content={<Tip/>}/><Legend/>
                      <Bar dataKey="attended" name="Attended" fill={C.accent} radius={[5,5,0,0]}/>
                      <Bar dataKey="passed"   name="Passed"   fill={C.easy}   radius={[5,5,0,0]}/>
                      <Bar dataKey="failed"   name="Failed"   fill={C.hard}   radius={[5,5,0,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>

                <Card title="Score Distribution Histogram" sub="Students spread across 0–100 score ranges" wide>
                  <ResponsiveContainer width="100%" height={230}>
                    <BarChart data={data.histogram} barCategoryGap="5%">
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
                      <XAxis dataKey="range" tick={{fill:C.sub,fontSize:11}}/><YAxis tick={{fill:C.muted,fontSize:11}}/>
                      <Tooltip content={<Tip/>}/>
                      <Bar dataKey="students" name="Students" radius={[4,4,0,0]}>
                        {data.histogram.map((_,i)=><Cell key={i} fill={`hsl(${215+i*15},75%,${52+i*2}%)`}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>

                <Card title="Level-wise Count per Subject" sub="Easy / Intermediate / Difficult stacked" wide>
                  <ResponsiveContainer width="100%" height={230}>
                    <BarChart data={viewData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
                      <XAxis dataKey="subject" tick={{fill:C.sub,fontSize:12}}/><YAxis tick={{fill:C.muted,fontSize:11}}/>
                      <Tooltip content={<Tip/>}/><Legend/>
                      <Bar dataKey="easy"         name="Easy"         stackId="a" fill={C.easy}/>
                      <Bar dataKey="intermediate" name="Intermediate" stackId="a" fill={C.inter}/>
                      <Bar dataKey="difficult"    name="Difficult"    stackId="a" fill={C.hard} radius={[5,5,0,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>

                {viewData.length > 1 && (
                  <Card title="Subject-wise Attendance Share" sub="Proportion of students per subject">
                    <ResponsiveContainer width="100%" height={230}>
                      <PieChart>
                        <Pie data={subjectPieData} cx="50%" cy="50%" outerRadius={88} dataKey="value" paddingAngle={3}
                          label={({name,percent})=>`${name.length>8?name.slice(0,8)+'…':name} ${(percent*100).toFixed(0)}%`}
                          labelLine={{stroke:C.border2}}>
                          {subjectPieData.map((_,i)=><Cell key={i} fill={BAR_PALETTE[i%BAR_PALETTE.length]} stroke="none"/>)}
                        </Pie>
                        <Tooltip content={<Tip/>}/><Legend/>
                      </PieChart>
                    </ResponsiveContainer>
                  </Card>
                )}

                {data.trend?.length > 0 && (
                  <Card title="Monthly Pass Rate Trend" sub="Pass % over the last 6 months">
                    <ResponsiveContainer width="100%" height={230}>
                      <LineChart data={data.trend}>
                        <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
                        <XAxis dataKey="month" tick={{fill:C.sub,fontSize:12}}/><YAxis tick={{fill:C.muted,fontSize:11}} domain={[0,100]}/>
                        <Tooltip content={<Tip/>}/><Legend/>
                        <Line type="monotone" dataKey="passRate" name="Pass Rate %" stroke={C.accent} strokeWidth={2.5} dot={{r:5,fill:C.accent}} activeDot={{r:7}}/>
                      </LineChart>
                    </ResponsiveContainer>
                  </Card>
                )}
              </div>

              {/* Summary table */}
              <div style={{marginTop:24,background:C.white,border:`1px solid ${C.border}`,borderRadius:16,overflow:'hidden',boxShadow:`0 2px 12px ${C.shadow}`}}>
                <div style={{padding:'14px 20px',borderBottom:`1px solid ${C.border}`,display:'flex',justifyContent:'space-between',alignItems:'center',background:'#f8fafc'}}>
                  <span style={{fontWeight:800,color:C.text,fontSize:14}}>Subject Summary</span>
                  <span style={{color:C.muted,fontSize:12}}>{viewData.length} subject(s)</span>
                </div>
                <div style={{overflowX:'auto'}}>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                    <thead>
                      <tr style={{background:'#f1f5f9'}}>
                        {['Subject','Attended','Passed','Failed','Pass %','Avg Score','Easy','Inter.','Difficult'].map(h=>(
                          <th key={h} style={{padding:'10px 16px',textAlign:'left',color:C.sub,fontWeight:700,fontSize:11,textTransform:'uppercase',letterSpacing:'0.06em',whiteSpace:'nowrap'}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {viewData.map((row,i)=>{
                        const pct = row.attended ? Math.round((row.passed/row.attended)*100) : 0;
                        return (
                          <tr key={row.subject} className="pr-row" style={{borderTop:`1px solid ${C.border}`,background:i%2===0?C.white:'#fafbff'}}>
                            <td style={{padding:'11px 16px',fontWeight:700,color:C.text}}>{row.subject}</td>
                            <td style={{padding:'11px 16px',color:C.sub}}>{row.attended}</td>
                            <td style={{padding:'11px 16px',color:C.easy,fontWeight:600}}>{row.passed}</td>
                            <td style={{padding:'11px 16px',color:C.hard,fontWeight:600}}>{row.failed}</td>
                            <td style={{padding:'11px 16px'}}><PassBadge pct={pct}/></td>
                            <td style={{padding:'11px 16px',color:C.text,fontFamily:'monospace'}}>{row.avg??'—'}%</td>
                            <td style={{padding:'11px 16px',color:C.easy,fontWeight:600}}>{row.easy}</td>
                            <td style={{padding:'11px 16px',color:C.inter,fontWeight:600}}>{row.intermediate}</td>
                            <td style={{padding:'11px 16px',color:C.hard,fontWeight:600}}>{row.difficult}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}