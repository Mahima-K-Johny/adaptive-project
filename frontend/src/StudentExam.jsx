// StudentExam.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  GraduationCap, BookOpen, ChevronRight, CheckCircle,
  XCircle, Clock, Award, AlertCircle, ArrowLeft,
  Zap, BarChart2, Eye, EyeOff, Camera, CameraOff
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './StudentExam.css';

const PHASE = {
  SELECT_SUBJECT: 'select_subject',
  INSTRUCTIONS:   'instructions',
  IN_EXAM:        'in_exam',
  RESULT:         'result',
  FINAL:          'final',
};

const LEVEL_LABELS = { 1: 'Easy', 2: 'Intermediate', 3: 'Difficult' };
const LEVEL_COLORS = { 1: 'green', 2: 'amber', 3: 'red' };
const SECS_PER_Q   = 60; // ⏱ 60 seconds per question

export default function StudentExam() {
  const navigate = useNavigate();

  // Read studentId from any key the login might have used
  const studentId   = localStorage.getItem('studentId') || localStorage.getItem('userId') || null;
  const studentEmail = localStorage.getItem('studentEmail') || localStorage.getItem('email') || '';
  const studentName  = studentEmail.split('@')[0] || 'Student';

  const [subjects,        setSubjects]        = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState('');

  const [phase,         setPhase]         = useState(PHASE.SELECT_SUBJECT);
  const [examSessionId, setExamSessionId] = useState(null);
  const [currentLevel,  setCurrentLevel]  = useState(1);
  const [levelLabel,    setLevelLabel]    = useState('Easy');
  const [questions,     setQuestions]     = useState([]);
  const [answers,       setAnswers]       = useState({});
  const answersRef      = useRef({});        // ← always current answers
  const questionsRef    = useRef([]);        // ← always current questions
  const examSessionRef  = useRef(null);      // ← always current sessionId
  const [currentQ,      setCurrentQ]      = useState(0);
  const [timeLeft,      setTimeLeft]      = useState(null);
  const [totalQ,        setTotalQ]        = useState(0);
  const [passMark,      setPassMark]      = useState(60);

  const [levelResult,  setLevelResult]  = useState(null);
  const [finalResult,  setFinalResult]  = useState(null);
  const [error,        setError]        = useState('');
  const [submitting,   setSubmitting]   = useState(false);
  const [authError,    setAuthError]    = useState(false);
  const [showReview,   setShowReview]   = useState(false);
  
  const [difficultyNote, setDifficultyNote] = useState(null);
  
  // ── Proctoring State ──────────────────────────────────────────────────────
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [violations,   setViolations]   = useState(0);
  const [showWarning,  setShowWarning]  = useState(false);
  const [examPaused,   setExamPaused]   = useState(false);
  const containerRef = useRef(null);
  const videoRef     = useRef(null);
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [faceMissingTime, setFaceMissingTime] = useState(0);
  const [modelsLoaded,    setModelsLoaded]    = useState(false);
  const faceDetectionInterval = useRef(null);
  const violationRef = useRef(0); // For immediate access in listeners

  useEffect(() => {
    const role            = localStorage.getItem('role');
    const loggedIn        = localStorage.getItem('studentLoggedIn');
    const isStudent       = role === 'student' || loggedIn === 'true';

    // Must be a student AND have a valid studentId
    if (!isStudent || !studentId) {
      setAuthError(true);
      return;
    }
    fetchSubjects();
    loadFaceModels();
  }, []);

  const loadFaceModels = async () => {
    try {
      const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
      await window.faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      setModelsLoaded(true);
    } catch (err) {
      console.error("Face model load error:", err);
    }
  };

  // ── Timer ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== PHASE.IN_EXAM || timeLeft === null) return;
    if (timeLeft <= 0) { handleSubmit(questions, examSessionId); return; }
    const t = setInterval(() => setTimeLeft(p => p - 1), 1000);
    return () => clearInterval(t);
  }, [phase, timeLeft]);

  // ── Proctoring Logic ───────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== PHASE.IN_EXAM) {
      // Cleanup when leaving exam phase
      document.oncontextmenu = null;
      document.oncopy = null;
      document.onpaste = null;
      document.oncut = null;
      return;
    }

    // 1. Disable Right-Click and Copy/Paste
    document.oncontextmenu = (e) => { e.preventDefault(); return false; };
    document.oncopy = (e) => { e.preventDefault(); return false; };
    document.onpaste = (e) => { e.preventDefault(); return false; };
    document.oncut = (e) => { e.preventDefault(); return false; };

    // 2. Detect Tab Switching (Page Visibility API)
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        const v = violationRef.current + 1;
        violationRef.current = v;
        setViolations(v);

        if (v >= 2) {
          // AUTO-SUBMIT on 2nd violation
          alert("🛑 CRITICAL PROCTORING VIOLATION: Multiple unauthorized actions detected. Your exam is being automatically submitted.");
          handleSubmit();
        } else {
          setShowWarning(true);
        }
      }
    };

    // 3. Detect Fullscreen Exit
    const handleFullscreen = () => {
      const isFS = !!document.fullscreenElement || !!document.webkitFullscreenElement || !!document.msFullscreenElement;
      setIsFullscreen(isFS);
      
      if (!isFS) {
        setExamPaused(true);
        
        // EXITING FULLSCREEN IS ALSO A VIOLATION
        const v = violationRef.current + 1;
        violationRef.current = v;
        setViolations(v);

        if (v >= 2) {
          alert("🛑 CRITICAL PROCTORING VIOLATION: Fullscreen exit or tab switching detected. Your exam is being automatically submitted.");
          handleSubmit();
        }
      } else {
        setExamPaused(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    document.addEventListener('fullscreenchange', handleFullscreen);
    document.addEventListener('webkitfullscreenchange', handleFullscreen);
    document.addEventListener('mozfullscreenchange', handleFullscreen);
    document.addEventListener('MSFullscreenChange', handleFullscreen);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      document.removeEventListener('fullscreenchange', handleFullscreen);
      document.removeEventListener('webkitfullscreenchange', handleFullscreen);
      document.removeEventListener('mozfullscreenchange', handleFullscreen);
      document.removeEventListener('MSFullscreenChange', handleFullscreen);
      document.oncontextmenu = null;
      document.oncopy = null;
      document.onpaste = null;
      document.oncut = null;
      stopCamera(); // Ensure camera stops if component unmounts mid-exam
      if (faceDetectionInterval.current) clearInterval(faceDetectionInterval.current);
    };
  }, [phase]);

  useEffect(() => {
    if (phase === PHASE.IN_EXAM && cameraActive && modelsLoaded) {
      faceDetectionInterval.current = setInterval(runFaceDetection, 1000);
    } else {
      if (faceDetectionInterval.current) clearInterval(faceDetectionInterval.current);
      setFaceMissingTime(0);
    }
    return () => { if (faceDetectionInterval.current) clearInterval(faceDetectionInterval.current); };
  }, [phase, cameraActive, modelsLoaded]);

  const runFaceDetection = async () => {
    const video = videoRef.current;
    if (!video || !window.faceapi || video.readyState < 2) return;
    
    try {
      // Use TinyFaceDetector with a smaller input size for better performance
      const result = await window.faceapi.detectSingleFace(
        video, 
        new window.faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
      );
      
      if (!result) {
        setFaceMissingTime(prev => {
          const next = prev + 1;
          if (next >= 10) {
            alert("🛑 PROCTORING AUTO-SUBMIT: Face not detected for 10 seconds.");
            handleSubmit();
          }
          return next;
        });
      } else {
        setFaceMissingTime(0);
      }
    } catch (err) {
      console.error("Detection error:", err);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 320, height: 240, facingMode: "user" } 
      });
      setCameraStream(stream);
      setCameraActive(true);
      return true;
    } catch (err) {
      console.error("Camera error:", err);
      setError("Camera access is required for proctored exams. Please enable camera permissions.");
      return false;
    }
  };

  // Use a callback ref with useCallback to prevent re-creation and "blinking" on every render
  const setVideoRef = useCallback((node) => {
    videoRef.current = node; // Manually update the ref
    if (node && cameraStream && node.srcObject !== cameraStream) {
      node.srcObject = cameraStream;
      node.play().catch(e => console.error("Auto-play failed:", e));
    }
  }, [cameraStream]);

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
      setCameraActive(false);
    }
  };

  const fetchSubjects = async () => {
    setSubjectsLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/questions/subjects');
      setSubjects(res.data.subjects || res.data || []);
    } catch { setSubjects([]); }
    finally { setSubjectsLoading(false); }
  };

  const requestFullscreen = () => {
    const elem = containerRef.current;
    if (!elem) return;
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) { /* Safari */
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { /* IE11 */
      elem.msRequestFullscreen();
    }
  };

  const startExam = async () => {
    setError('');
    
    if (!modelsLoaded) {
      setError("Please wait, proctoring models are still loading...");
      return;
    }

    // 📸 Request Camera before starting
    const camOk = await startCamera();
    if (!camOk) return;

    try {
      const res = await axios.post('http://localhost:5000/api/exam/startExam', {
        studentId, subject: selectedSubject,
      });
      setExamSessionId(res.data.examSessionId);
      examSessionRef.current = res.data.examSessionId;
      setCurrentLevel(res.data.level);
      setLevelLabel(res.data.levelLabel);
      setQuestions(res.data.questions);
      questionsRef.current = res.data.questions;
      setTotalQ(res.data.totalQuestions);
      setPassMark(res.data.passMark);
      setAnswers({});
      setShowReview(false);
      answersRef.current = {};
      setCurrentQ(0);
      setTimeLeft(res.data.questions.length * SECS_PER_Q);
      setDifficultyNote(res.data.difficultyNote || null); 
      
      // ✅ Trigger Proctoring
      setViolations(0);
      violationRef.current = 0;
      setPhase(PHASE.IN_EXAM);
      requestFullscreen();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start exam. Please try again.');
      stopCamera(); // Clean up camera if start fails
    }
  };

  const selectAnswer = (qId, answer) => {
    const updated = { ...answersRef.current, [qId]: answer };
    answersRef.current = updated;
    setAnswers(updated);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const currentAnswers    = answersRef.current;
      const currentQuestions  = questionsRef.current;
      const currentSessionId  = examSessionRef.current;

      const payload = currentQuestions.map(q => {
        const id = q._id?.toString() || q._id;
        return { questionId: id, answer: currentAnswers[id] || '' };
      });

      const res = await axios.post('http://localhost:5000/api/exam/submitAnswers', {
        examSessionId: currentSessionId,
        answers: payload,
        subject: selectedSubject,  // ← send subject as fallback
      });
      if (res.data.result === 'level_up') {
        // ✅ Update examSessionId so next level submits to correct session
        if (res.data.examSessionId) setExamSessionId(res.data.examSessionId);
        setLevelResult(res.data);
        setPhase(PHASE.RESULT);
      } else {
        setFinalResult(res.data);
        setPhase(PHASE.FINAL);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Submit failed.');
    } finally { 
      setSubmitting(false); 
      stopCamera(); // Stop camera after final level submission or failure
    }
  };

  const proceedNextLevel = (d) => {
    if (!d) return;
    setCurrentLevel(d.nextLevel);
    setLevelLabel(d.nextLevelLabel);
    setQuestions(d.questions);
    questionsRef.current = d.questions;
    setTotalQ(d.totalQuestions);
    setPassMark(d.passMark);
    setAnswers({});
    setShowReview(false);
    answersRef.current = {};
    setCurrentQ(0);
    examSessionRef.current = d.examSessionId;
    setExamSessionId(d.examSessionId);
    setTimeLeft(d.questions.length * SECS_PER_Q);
      setDifficultyNote(d.difficultyNote || null);
    setLevelResult(null);
    setPhase(PHASE.IN_EXAM);
  };

  const fmt = s =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const timerClass    = timeLeft !== null && timeLeft < 30 ? 'danger' : timeLeft < 60 ? 'warning' : '';
  const answeredCount = Object.keys(answers).filter(k => 
    Array.isArray(answers[k]) ? answers[k].length > 0 : !!answers[k]
  ).length;
  const progress      = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

  // ── Auth error ─────────────────────────────────────────────────────────────
  if (authError) {
    return (
      <div className="se-container">
        <div className="se-bg">
          <div className="se-orb se-orb-1" /><div className="se-orb se-orb-2" /><div className="se-orb se-orb-3" />
        </div>
        <div className="se-content" style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div className="se-card" style={{ textAlign:'center', maxWidth:'400px' }}>
            <AlertCircle size={48} style={{ color:'#ef4444', marginBottom:'1rem' }} />
            <h2 style={{ marginBottom:'0.5rem' }}>Session Expired</h2>
            <p style={{ color:'#6b7280', marginBottom:'1.5rem' }}>Please log in again to access the exam.</p>
            <button className="se-start-btn" onClick={() => { localStorage.clear(); navigate('/admin-login'); }}>
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  const renderReviewSection = (reviewData) => {
    if (!reviewData || reviewData.length === 0) return null;
    return (
      <div className="se-review-section">
        <h3 className="se-review-title">Review Your Answers</h3>
        <div className="se-review-list">
          {reviewData.map((item, idx) => (
            <div key={idx} className={`se-review-item ${item.isCorrect ? 'correct' : 'incorrect'}`}>
              <div className="se-review-q-header">
                <span className="se-review-q-num">Q{idx + 1}</span>
                <span className={`se-review-q-type ${item.type === 'MCQ' || item.type === 'MAQ' ? 'mcq' : 'desc'}`}>{item.type}</span>
              </div>
              <p className="se-review-q-text">{item.text}</p>
              
              <div className="se-review-ans-row">
                <div className="se-review-your-ans">
                  <strong>Your Answer:</strong>
                  <div className={`se-review-ans-box ${item.isCorrect ? 'correct' : 'incorrect'}`}>
                    {item.isCorrect ? <CheckCircle size={14} /> : <XCircle size={14} />}
                    <span>
                      {Array.isArray(item.studentAnswer)
                        ? item.studentAnswer.join(', ') || '(No answer)'
                        : (item.studentAnswer || '(No answer)')}
                    </span>
                  </div>
                </div>
                {!item.isCorrect && (
                  <div className="se-review-correct-ans">
                    <strong>Correct Answer:</strong>
                    <div className="se-review-ans-box correct">
                      <CheckCircle size={14} />
                      <span>
                        {Array.isArray(item.correctAnswer)
                          ? item.correctAnswer.join(', ')
                          : item.correctAnswer}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="se-container" ref={containerRef}>
      <div className="se-bg">
        <div className="se-orb se-orb-1" /><div className="se-orb se-orb-2" /><div className="se-orb se-orb-3" />
      </div>

      {/* ── CAMERA FEED (Top Level) ────────────────────────────────────── */}
      {phase === PHASE.IN_EXAM && cameraActive && (
        <div className="se-camera-container">
          <div className="se-camera-header">
            <div className="se-camera-dot" />
            <span>LIVE PROCTORING</span>
          </div>
          <video 
            ref={setVideoRef} 
            autoPlay 
            playsInline 
            muted 
            className="se-camera-video"
          />
          {!cameraStream && (
            <div className="se-camera-placeholder">
              <CameraOff size={24} />
              <span>Camera Error</span>
            </div>
          )}
        </div>
      )}

      {/* ── PROCTORING OVERLAYS ─────────────────────────────────────────── */}
      {/* ── FACE MISSING OVERLAY (Show after 2s of absence to avoid screen flicker) ── */}
      {phase === PHASE.IN_EXAM && faceMissingTime >= 2 && faceMissingTime < 10 && (
        <div className="se-proctor-overlay face-missing">
          <div className="se-proctor-card">
            <div className="se-face-warning-icon">
              <CameraOff size={48} />
              <div className="se-face-scanner" />
            </div>
            <h2>Face Not Detected!</h2>
            <p>Please stay in the camera's view. Your exam will be <strong>automatically submitted</strong> in:</p>
            <div className="se-face-countdown">{10 - faceMissingTime}s</div>
            <p className="se-small-text">This is a mandatory proctoring requirement.</p>
          </div>
        </div>
      )}
      {phase === PHASE.IN_EXAM && examPaused && !submitting && (
        <div className="se-proctor-overlay">
          <div className="se-proctor-card">
            <XCircle size={48} color="#ef4444" />
            <h2>Fullscreen Required</h2>
            <p>You must be in fullscreen mode to continue the exam. Exiting or switching tabs is a violation.</p>
            <div className="se-violation-badge">Warning: {violations}/1</div>
            <button className="se-start-btn" onClick={requestFullscreen}>
              Re-enter Fullscreen & Continue
            </button>
          </div>
        </div>
      )}

      {phase === PHASE.IN_EXAM && showWarning && !examPaused && (
        <div className="se-proctor-overlay warning">
          <div className="se-proctor-card">
            <AlertCircle size={48} color="#f59e0b" />
            <h2>Proctoring Warning</h2>
            <p>Tab switching or window minimization detected!</p>
            <div className="se-violation-badge">Final Warning: {violations}/1</div>
            <p className="se-small-text">One more unauthorized action will result in <strong>automatic submission</strong> of your exam.</p>
            <button className="se-start-btn warning" onClick={() => setShowWarning(false)}>
              I Understand, Continue
            </button>
          </div>
        </div>
      )}

      {/* Navbar */}
      <nav className="se-nav">
        <div className="se-nav-inner">
          <div className="se-nav-left">
            <button className="se-back-btn" onClick={() => navigate('/student-dashboard')}>
              <ArrowLeft size={18} /> Dashboard
            </button>
            <div className="se-logo">
              <div className="se-logo-icon"><GraduationCap size={22} /></div>
              <div><h1>EduAdapt</h1><p>Adaptive Exam</p></div>
            </div>
          </div>
          <div className="se-nav-right">
            <div className="se-user"><div className="se-avatar">S</div><span>{studentName}</span></div>
          </div>
        </div>
      </nav>

      <div className="se-content">

        {/* ── SELECT SUBJECT ─────────────────────────────────────────────── */}
        {phase === PHASE.SELECT_SUBJECT && (
          <div className="se-card se-subject-card">
            <div className="se-card-header">
              <BookOpen size={32} className="se-card-icon" />
              <h2>Choose Your Exam Subject</h2>
              <p>Select a subject to begin your adaptive exam</p>
            </div>
            {error && <div className="se-error"><AlertCircle size={16} />{error}</div>}
            {subjectsLoading ? (
              <div className="se-loading">Loading subjects...</div>
            ) : subjects.length === 0 ? (
              <div className="se-empty">
                <p>No exam subjects available yet.</p>
                <p className="se-empty-hint">Ask your teacher to upload questions first.</p>
              </div>
            ) : (
              <>
                <div className="se-subject-grid">
                  {subjects.map(subj => (
                    <button key={subj}
                      className={`se-subject-pill ${selectedSubject === subj ? 'selected' : ''}`}
                      onClick={() => { setSelectedSubject(subj); setError(''); }}
                    >
                      <BookOpen size={18} /><span>{subj}</span>
                      {selectedSubject === subj && <CheckCircle size={16} className="se-pill-check" />}
                    </button>
                  ))}
                </div>
                {selectedSubject && (
                  <div className="se-selected-info"><span>📚 Selected:</span><strong>{selectedSubject}</strong></div>
                )}
                <button className="se-start-btn" disabled={!selectedSubject}
                  onClick={() => setPhase(PHASE.INSTRUCTIONS)}>
                  Continue <ChevronRight size={18} />
                </button>
              </>
            )}
          </div>
        )}

        {/* ── INSTRUCTIONS ──────────────────────────────────────────────── */}
        {phase === PHASE.INSTRUCTIONS && (
          <div className="se-card se-instructions-card">
            <div className="se-card-header">
              <Zap size={32} className="se-card-icon amber" />
              <h2>Exam Instructions</h2>
              <p>Subject: <strong>{selectedSubject}</strong></p>
            </div>
            <div className="se-instructions-body">
              {[
                ['3-Level Adaptive Exam', 'Easy → Intermediate → Difficult. Pass each to advance.'],
                ['Pass Mark: 60%', 'Score ≥ 60% to proceed to the next level.'],
                ['Question Types', 'MCQ (multiple choice) and Descriptive answers.'],
                ['Timer', '60 seconds per question. Auto-submits when time runs out.'],
                ['No Going Back', 'Once a level is submitted, you cannot revisit answers.'],
              ].map(([title, desc], i) => (
                <div key={i} className="se-instruction-item">
                  <span className="se-inst-num">{i + 1}</span>
                  <div><strong>{title}</strong> — {desc}</div>
                </div>
              ))}
            </div>
            <div className="se-level-overview">
              {[1,2,3].map(l => (
                <div key={l} className={`se-level-chip ${LEVEL_COLORS[l]}`}>
                  <span className="se-level-num">Level {l}</span>
                  <span>{LEVEL_LABELS[l]}</span>
                  <span className="se-level-q">{l === 2 ? '15 Qs' : '10 Qs'}</span>
                </div>
              ))}
            </div>
            {error && <div className="se-error"><AlertCircle size={16} />{error}</div>}
            <div className="se-inst-actions">
              <button className="se-back-link" onClick={() => setPhase(PHASE.SELECT_SUBJECT)}>
                <ArrowLeft size={16} /> Change Subject
              </button>
              <button className="se-start-btn" onClick={startExam}>
                Start Exam <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ── IN EXAM ───────────────────────────────────────────────────── */}
        {phase === PHASE.IN_EXAM && questions.length > 0 && (
          <div className="se-exam-layout">
            <div className="se-sidebar">
  <div className={`se-level-badge ${LEVEL_COLORS[currentLevel]}`}>
    Level {currentLevel} — {levelLabel}
  </div>

  {/* ✅ ADD THIS — shows difficulty warning on reattempts */}
  {difficultyNote && (
    <div style={{
      background: '#fef3c7',
      border: '1px solid #f59e0b',
      borderRadius: '8px',
      padding: '8px 10px',
      fontSize: '0.75rem',
      color: '#92400e',
      marginTop: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      lineHeight: '1.4',
    }}>
      ⚠️ {difficultyNote}
    </div>
  )}

 <div className="se-timer-box">
                <Clock size={18} />
                <span className={`se-timer ${timerClass}`}>{fmt(timeLeft || 0)}</span>
              </div>
              <div className="se-progress-box">
                <div className="se-progress-label">
                  <span>Answered</span><span>{answeredCount}/{questions.length}</span>
                </div>
                <div className="se-progress-bar">
                  <div className="se-progress-fill" style={{ width: `${progress}%` }} />
                </div>
              </div>
              <div className="se-q-nav-label">Questions</div>
              <div className="se-q-nav-grid">
                {questions.map((q, i) => {
                  const isAns = Array.isArray(answers[q._id]) ? answers[q._id].length > 0 : !!answers[q._id];
                  return (
                    <button key={i}
                      className={`se-q-nav-btn ${i === currentQ ? 'active' : ''} ${isAns ? 'answered' : ''}`}
                      onClick={() => setCurrentQ(i)}
                    >{i + 1}</button>
                  );
                })}
              </div>
              <button className="se-submit-btn" onClick={() => handleSubmit(questions, examSessionId)} disabled={submitting}>
                {submitting ? 'Submitting...' : `Submit Level ${currentLevel}`}
              </button>
            </div>

            <div className="se-question-panel">
              <div className="se-q-header">
                <span className="se-q-number">Q{currentQ + 1} of {questions.length}</span>
                <span className={`se-q-type ${
                  questions[currentQ]?.type === 'MCQ' ? 'mcq' :
                  questions[currentQ]?.type === 'MAQ' ? 'mcq' : 'desc'
                }`}>
                  {questions[currentQ]?.type}
                  {questions[currentQ]?.type === 'MAQ' && <span style={{ fontSize: '0.65rem', marginLeft: 4, opacity: 0.8 }}>(Multi)</span>}
                </span>
                <span className="se-subject-tag">{selectedSubject}</span>
              </div>
              <p className="se-q-text">{questions[currentQ]?.text}</p>

              {(questions[currentQ]?.type === 'MCQ' || questions[currentQ]?.type === 'MAQ') && (
                <div className="se-options">
                  {questions[currentQ].options.map((opt, i) => {
                    const qId = questions[currentQ]._id;
                    const isMAQ = questions[currentQ].type === 'MAQ';
                    const currentAns = answers[qId];
                    const isSelected = isMAQ
                      ? Array.isArray(currentAns) && currentAns.includes(opt)
                      : currentAns === opt;

                    const handleSelect = () => {
                      if (isMAQ) {
                        const arr = Array.isArray(currentAns) ? [...currentAns] : [];
                        if (arr.includes(opt)) {
                          selectAnswer(qId, arr.filter(x => x !== opt));
                        } else {
                          selectAnswer(qId, [...arr, opt]);
                        }
                      } else {
                        selectAnswer(qId, opt);
                      }
                    };

                    return (
                      <button key={i}
                        className={`se-option ${isSelected ? 'selected' : ''}`}
                        onClick={handleSelect}
                      >
                        <span className="se-opt-label">{String.fromCharCode(65 + i)}</span>
                        <span>{opt}</span>
                        {isSelected && <CheckCircle size={18} className="se-opt-check" />}
                      </button>
                    );
                  })}
                  {questions[currentQ]?.type === 'MAQ' && (
                    <div style={{ marginTop: '0.8rem', fontSize: '0.85rem', color: '#6b7280' }}>
                      💡 This question has multiple correct answers. Select all that apply.
                    </div>
                  )}
                </div>
              )}

              {questions[currentQ]?.type === 'Descriptive' && (
                <div className="se-desc-wrap">
                  <div className="se-ai-eval-banner">
                    <span className="se-ai-eval-badge">✨ AI Evaluation</span>
                    <span className="se-ai-eval-text">Write in your own words — AI understands synonyms and rephrasing.</span>
                  </div>
                  <textarea
                    className="se-desc-input"
                    placeholder="Explain clearly in your own words. The AI understands the underlying concepts — you don't need to use exact words."
                    rows={6}
                    value={answers[questions[currentQ]._id] || ''}
                    onChange={e => selectAnswer(questions[currentQ]._id, e.target.value)}
                  />
                  <p className="se-desc-hint">💡 AI will evaluate your answer semantically. Detailed explanations score better.</p>
                </div>
              )}

              <div className="se-q-nav-row">
                <button className="se-q-prev" disabled={currentQ === 0} onClick={() => setCurrentQ(p => p - 1)}>
                  ← Previous
                </button>
                {currentQ < questions.length - 1 ? (
                  <button className="se-q-next" onClick={() => setCurrentQ(p => p + 1)}>Next →</button>
                ) : (
                  <button className="se-q-next final" onClick={() => handleSubmit(questions, examSessionId)} disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit Level →'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── LEVEL RESULT ──────────────────────────────────────────────── */}
        {phase === PHASE.RESULT && levelResult && (
          <div className="se-card se-result-card">
            <div className="se-result-icon passed"><CheckCircle size={48} /></div>
            <h2 className="se-result-title">Level {levelResult.completedLevel} Cleared! 🎉</h2>
            <p className="se-result-subject">{selectedSubject}</p>
            <div className="se-score-row">
              <div className="se-score-box">
                <span className="se-score-num">{levelResult.score}%</span>
                <span className="se-score-lbl">Score</span>
              </div>
              <div className="se-score-box">
                <span className="se-score-num">{levelResult.correctCount}/{levelResult.totalAnswered}</span>
                <span className="se-score-lbl">Correct</span>
              </div>
              <div className="se-score-box">
                <span className="se-score-num green">{levelResult.completedLabel}</span>
                <span className="se-score-lbl">Level Passed</span>
              </div>
            </div>
            <div className="se-next-level-banner">
              <Zap size={20} />
              <span>Next: <strong>Level {levelResult.nextLevel} — {levelResult.nextLevelLabel}</strong> ({levelResult.totalQuestions} questions)</span>
            </div>
            <div className="se-final-actions" style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
              <button className="se-retry-btn" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }} onClick={() => setShowReview(!showReview)}>
                {showReview ? <EyeOff size={18} /> : <Eye size={18} />} {showReview ? 'Hide Answers' : 'Review Answers'}
              </button>
              <button className="se-start-btn" style={{ flex: 1 }} onClick={() => proceedNextLevel(levelResult)}>
                Start Level {levelResult.nextLevel} <ChevronRight size={18} />
              </button>
            </div>
            {showReview && renderReviewSection(levelResult.review)}
          </div>
        )}

        {/* ── FINAL RESULT ──────────────────────────────────────────────── */}
        {phase === PHASE.FINAL && finalResult && (
          <div className="se-card se-result-card">
            <div className={`se-result-icon ${finalResult.result === 'completed' ? 'passed' : 'failed'}`}>
              {finalResult.result === 'completed' ? <Award size={48} /> : <XCircle size={48} />}
            </div>
            <h2 className="se-result-title">
              {finalResult.result === 'completed' ? '🎉 Exam Completed!' : '❌ Exam Ended'}
            </h2>
            <p className="se-result-subject">{selectedSubject}</p>
            <p className="se-result-msg">{finalResult.message}</p>
            <div className="se-score-row">
              <div className="se-score-box">
                <span className="se-score-num">{finalResult.overallScore}%</span>
                <span className="se-score-lbl">Overall Score</span>
              </div>
              <div className="se-score-box">
                <span className="se-score-num">{finalResult.totalCorrect}/{finalResult.totalAttempted}</span>
                <span className="se-score-lbl">Total Correct</span>
              </div>
              <div className="se-score-box">
                <span className={`se-score-num ${finalResult.result === 'completed' ? 'green' : 'red'}`}>
                  Level {finalResult.completedLevel}
                </span>
                <span className="se-score-lbl">Reached</span>
              </div>
            </div>
            <div className="se-ability-bar-wrap">
              <div className="se-ability-label"><BarChart2 size={16} /> Ability Score: {finalResult.finalAbility}</div>
              <div className="se-ability-bar">
                <div className="se-ability-fill"
                  style={{ width: `${Math.min(100, Math.max(0, (finalResult.finalAbility + 3) / 6 * 100))}%` }} />
              </div>
            </div>
            <div className="se-final-actions" style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button className="se-retry-btn" style={{ flex: '1 1 calc(33% - 1rem)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }} onClick={() => setShowReview(!showReview)}>
                {showReview ? <EyeOff size={18} /> : <Eye size={18} />} {showReview ? 'Hide Answers' : 'Review Answers'}
              </button>
              <button className="se-retry-btn" style={{ flex: '1 1 calc(33% - 1rem)' }} onClick={() => {
                setPhase(PHASE.SELECT_SUBJECT); setSelectedSubject('');
                setFinalResult(null); setAnswers({}); setError(''); setShowReview(false);
              }}>Try Another Subject</button>
              <button className="se-start-btn" style={{ flex: '1 1 calc(33% - 1rem)' }} onClick={() => navigate('/student-dashboard')}>
                Back to Dashboard
              </button>
            </div>
            {showReview && renderReviewSection(finalResult.review)}
          </div>
        )}


      </div>
    </div>
  );
}