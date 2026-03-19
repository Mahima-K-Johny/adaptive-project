// AdminLogin.jsx
import React, { useState } from 'react';
import { Lock, Mail, AlertCircle, CheckCircle, GraduationCap, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminLogin() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError(''); setSuccess(false); setLoading(true);
    try {
      const res  = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        localStorage.setItem('token', data.token);
        localStorage.setItem('role',  data.role);
        localStorage.setItem('userId', data.userId);
        if (data.role === 'admin') {
          localStorage.setItem('adminLoggedIn', 'true');
          localStorage.setItem('adminEmail', email);
          navigate('/admin-dashboard');
        } else if (data.role === 'teacher') {
          localStorage.setItem('teacherId',       data.userId);
          localStorage.setItem('teacherEmail',    data.email || email);
          localStorage.setItem('teacherLoggedIn', 'true');
          localStorage.setItem('teacherName',     data.name || data.teacherName || '');
          navigate('/teacher-dashboard');
        } else if (data.role === 'student') {
          localStorage.setItem('studentId',       data.userId);
          localStorage.setItem('studentEmail',    data.email || email);
          localStorage.setItem('studentLoggedIn', 'true');
          navigate('/student-dashboard');
        } else { setError('Unknown role'); }
      } else { setError(data.message || 'Invalid credentials'); }
    } catch { setError('Server error. Try again later.'); }
    finally { setLoading(false); }
  };

  const handleKey = (e) => { if (e.key === 'Enter' && email && password) handleLogin(); };

  return (
    <div style={{ minHeight:'100vh', display:'flex', fontFamily:"'DM Sans', system-ui, sans-serif", background:'#f0f2f8' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&family=Playfair+Display:ital,wght@0,700;1,700&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }

        @keyframes fadeSlideLeft { from{opacity:0;transform:translateX(-32px)} to{opacity:1;transform:translateX(0)} }
        @keyframes fadeSlideRight{ from{opacity:0;transform:translateX(32px)}  to{opacity:1;transform:translateX(0)} }
        @keyframes fadeUp        { from{opacity:0;transform:translateY(20px)}  to{opacity:1;transform:translateY(0)} }
        @keyframes gridPan       { from{background-position:0 0} to{background-position:60px 60px} }
        @keyframes orbFloat1     { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(28px,-18px) scale(1.05)} 66%{transform:translate(-18px,14px) scale(.97)} }
        @keyframes orbFloat2     { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-22px,18px) scale(1.07)} }
        @keyframes scanline      { 0%{top:-4px} 100%{top:100%} }
        @keyframes spin          { to{transform:rotate(360deg)} }
        @keyframes pulse         { 0%,100%{opacity:1} 50%{opacity:.4} }

        .al-panel-right { animation: fadeUp .65s cubic-bezier(.16,1,.3,1) .05s both; }
        .al-up-1 { animation: fadeUp .55s cubic-bezier(.16,1,.3,1) .25s both; }
        .al-up-2 { animation: fadeUp .55s cubic-bezier(.16,1,.3,1) .38s both; }
        .al-up-3 { animation: fadeUp .55s cubic-bezier(.16,1,.3,1) .50s both; }
        .al-up-4 { animation: fadeUp .55s cubic-bezier(.16,1,.3,1) .60s both; }
        .al-up-5 { animation: fadeUp .55s cubic-bezier(.16,1,.3,1) .70s both; }

        .al-field {
          width:100%; padding:13px 14px 13px 44px;
          background:#f8fafc; border:1.5px solid #e2e8f0;
          border-radius:11px; color:#0f172a;
          font-size:14px; font-family:'DM Sans',sans-serif; font-weight:400;
          outline:none; transition:all .2s;
        }
        .al-field::placeholder { color:#94a3b8; }
        .al-field:focus {
          border-color:#667eea;
          background:#fafbff;
          box-shadow:0 0 0 3px rgba(102,126,234,.14);
        }

        .al-btn {
          width:100%; padding:15px;
          background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);
          border:none; border-radius:12px; cursor:pointer;
          font-size:15px; font-weight:700; font-family:'DM Sans',sans-serif;
          color:#fff; display:flex; align-items:center; justify-content:center; gap:10px;
          transition:all .25s; letter-spacing:.2px;
          box-shadow:0 6px 20px rgba(102,126,234,.4);
        }
        .al-btn:hover:not(:disabled) {
          transform:translateY(-2px);
          box-shadow:0 14px 36px rgba(102,126,234,.5);
          background:linear-gradient(135deg,#5a6fd6 0%,#6a3d8f 100%);
        }
        .al-btn:disabled { opacity:.45; cursor:not-allowed; transform:none; box-shadow:none; }

        .al-stat {
          padding:16px 18px;
          background:rgba(255,255,255,.07);
          border:1px solid rgba(165,180,252,.15);
          border-radius:13px; transition:all .2s;
        }
        .al-stat:hover {
          background:rgba(102,126,234,.12);
          border-color:rgba(165,180,252,.35);
          transform:translateY(-2px);
        }

        .al-nav-item {
          display:flex; align-items:center; gap:10px;
          padding:9px 13px; border-radius:10px;
          color:rgba(255,255,255,.55); font-size:13px; font-weight:500;
          cursor:default; transition:all .18s;
        }
        .al-nav-item:hover { background:rgba(255,255,255,.08); color:#fff; }
      `}</style>

      {/* ══ FULL PAGE CENTERED FORM ══ */}
      <div className="al-panel-right" style={{
        flex:1, display:'flex', alignItems:'center', justifyContent:'center',
        background:'#ffffff', padding:'40px 24px',
        position:'relative', overflow:'hidden',
      }}>

        {/* Dot texture */}
        <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(rgba(99,102,241,.05) 1px,transparent 1px)', backgroundSize:'28px 28px', pointerEvents:'none' }} />
        {/* Soft centre glow */}
        <div style={{ position:'absolute', top:'45%', left:'45%', transform:'translate(-50%,-50%)', width:480, height:480, borderRadius:'50%', background:'radial-gradient(circle,rgba(102,126,234,.07) 0%,transparent 65%)', pointerEvents:'none' }} />

        <div style={{ width:'100%', maxWidth:420, position:'relative', zIndex:2 }}>

          {/* Logo above card */}
          <div className="al-up-1" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:12, marginBottom:24 }}>
            <div style={{ width:44, height:44, borderRadius:13, background:'linear-gradient(135deg,#667eea,#764ba2)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 6px 18px rgba(102,126,234,.4)' }}>
              <GraduationCap size={21} color="#fff" />
            </div>
            <div>
              <p style={{ fontSize:21, fontWeight:800, color:'#0f172a', letterSpacing:'-.3px' }}>EduAdapt</p>
              <p style={{ fontSize:9, color:'#667eea', letterSpacing:2.5, textTransform:'uppercase', fontWeight:700 }}>Admin Panel</p>
            </div>
          </div>

          {/* Card */}
          <div style={{ background:'#fff', borderRadius:24, border:'1px solid #e2e8f0', boxShadow:'0 4px 32px rgba(102,126,234,.1), 0 1px 4px rgba(0,0,0,.06)', padding:'36px 38px 32px' }}>

            {/* Card header */}
            <div className="al-up-2" style={{ marginBottom:26, textAlign:'center' }}>
              <h2 style={{ fontSize:24, fontWeight:800, color:'#0f172a', letterSpacing:'-.4px', lineHeight:1.2 }}>Welcome back</h2>
              <p style={{ fontSize:13.5, color:'#64748b', marginTop:6, fontWeight:400 }}>Sign in to access your dashboard</p>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

              {/* Email */}
              <div className="al-up-3">
                <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#374151', marginBottom:7 }}>Email Address</label>
                <div style={{ position:'relative' }}>
                  <Mail size={15} color="#667eea" style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
                  <input type="email" placeholder="admin@example.com" value={email}
                    onChange={e => setEmail(e.target.value)} onKeyPress={handleKey}
                    className="al-field" />
                </div>
              </div>

              {/* Password */}
              <div className="al-up-4">
                <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#374151', marginBottom:7 }}>Password</label>
                <div style={{ position:'relative' }}>
                  <Lock size={15} color="#667eea" style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
                  <input type={showPass?'text':'password'} placeholder="••••••••••••" value={password}
                    onChange={e => setPassword(e.target.value)} onKeyPress={handleKey}
                    className="al-field" style={{ paddingRight:44 }} />
                  <button onClick={() => setShowPass(p=>!p)}
                    style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#94a3b8', padding:4, display:'flex', transition:'color .18s' }}
                    onMouseEnter={e=>e.currentTarget.style.color='#667eea'}
                    onMouseLeave={e=>e.currentTarget.style.color='#94a3b8'}>
                    {showPass ? <EyeOff size={15}/> : <Eye size={15}/>}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px', background:'#fff1f2', border:'1.5px solid #fecdd3', borderRadius:10 }}>
                  <AlertCircle size={15} color="#e11d48" style={{ flexShrink:0 }}/>
                  <p style={{ fontSize:13, color:'#be123c', fontWeight:500 }}>{error}</p>
                </div>
              )}

              {/* Success */}
              {success && (
                <div style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px', background:'#f0fdf4', border:'1.5px solid #86efac', borderRadius:10 }}>
                  <CheckCircle size={15} color="#16a34a" style={{ flexShrink:0 }}/>
                  <p style={{ fontSize:13, color:'#15803d', fontWeight:500 }}>Login successful! Redirecting…</p>
                </div>
              )}

              {/* Button */}
              <div className="al-up-5" style={{ marginTop:2 }}>
                <button onClick={handleLogin} disabled={loading||!email||!password} className="al-btn">
                  {loading
                    ? <><div style={{ width:18,height:18,border:'2.5px solid rgba(255,255,255,.35)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin .7s linear infinite' }}/><span>Signing in…</span></>
                    : <><span>Sign In to Dashboard</span><ArrowRight size={17}/></>
                  }
                </button>
              </div>

              {/* Divider */}
              <div className="al-up-5" style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ flex:1, height:1, background:'#e2e8f0' }} />
                <span style={{ fontSize:11, color:'#94a3b8', fontWeight:500 }}>or</span>
                <div style={{ flex:1, height:1, background:'#e2e8f0' }} />
              </div>

              {/* Register */}
              <div className="al-up-5" style={{ textAlign:'center' }}>
                <p style={{ fontSize:13, color:'#64748b' }}>
                  Not registered?{' '}
                  <span onClick={() => navigate('/student-registration')}
                    style={{ color:'#667eea', fontWeight:700, cursor:'pointer', textDecoration:'underline', textDecorationColor:'rgba(102,126,234,.4)', textUnderlineOffset:3 }}>
                    Create an account
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Secure badge */}
          <div style={{ marginTop:18, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background:'#10b981', boxShadow:'0 0 0 3px rgba(16,185,129,.2)', flexShrink:0, animation:'pulse 2s infinite' }} />
            <p style={{ fontSize:12, color:'#94a3b8', fontWeight:500 }}>Secure connection — session is encrypted and protected</p>
          </div>
        </div>
      </div>
    </div>
  );
}