// StudentExam.jsx
import React, { useState, useEffect } from 'react';
import {
  GraduationCap, BookOpen, ChevronRight, CheckCircle,
  XCircle, Clock, Award, AlertCircle, LogOut, ArrowLeft,
  Zap, Star, BarChart2
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

export default function StudentExam() {
  const navigate    = useNavigate();
  const studentId   = localStorage.getItem('studentId');
  const studentEmail = localStorage.getItem('studentEmail') || '';
  const studentName  = studentEmail.split('@')[0] || 'Student';

  // ── Subjects ──────────────────────────────────────────────────────────────
  const [subjects,         setSubjects]         = useState([]);
  const [subjectsLoading,  setSubjectsLoading]  = useState(true);
  const [selectedSubject,  setSelectedSubject]  = useState('');

  // ── Exam state ────────────────────────────────────────────────────────────
  const [phase,            setPhase]            = useState(PHASE.SELECT_SUBJECT);
  const [examSessionId,    setExamSessionId]    = useState(null);
  const [currentLevel,     setCurrentLevel]     = useState(1);
  const [levelLabel,       setLevelLabel]       = useState('Easy');
  const [questions,        setQuestions]        = useState([]);
  const [answers,          setAnswers]          = useState({});   // { questionId: answer }
  const [currentQ,         setCurrentQ]         = useState(0);
  const [timeLeft,         setTimeLeft]         = useState(null);
  const [totalQ,           setTotalQ]           = useState(0);
  const [passMark,         setPassMark]         = useState(60);

  // ── Results ───────────────────────────────────────────────────────────────
  const [levelResult,      setLevelResult]      = useState(null);
  const [finalResult,      setFinalResult]      = useState(null);
  const [error,            setError]            = useState('');
  const [submitting,       setSubmitting]       = useState(false);

  useEffect(() => {
    if (!studentId) { navigate('/student-login'); return; }
    fetchSubjects();
  }, []);

  // Timer
  useEffect(() => {
    if (phase !== PHASE.IN_EXAM || timeLeft === null) return;
    if (timeLeft <= 0) { handleSubmit(); return; }
    const t = setInterval(() => setTimeLeft(p => p - 1), 1000);
    return () => clearInterval(t);
  }, [phase, timeLeft]);

  // ── Fetch available subjects (from Question collection) ───────────────────
  const fetchSubjects = async () => {
    setSubjectsLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/questions/subjects');
      setSubjects(res.data.subjects || []);
    } catch (err) {
      console.error('Failed to fetch subjects:', err);
      setSubjects([]);
    } finally {
      setSubjectsLoading(false);
    }
  };

  // ── Start exam ────────────────────────────────────────────────────────────
  const startExam = async () => {
    setError('');
    try {
      const res = await axios.post('http://localhost:5000/api/exam/startExam', {
        studentId, subject: selectedSubject
      });
      setExamSessionId(res.data.examSessionId);
      setCurrentLevel(res.data.level);
      setLevelLabel(res.data.levelLabel);
      setQuestions(res.data.questions);
      setTotalQ(res.data.totalQuestions);
      setPassMark(res.data.passMark);
      setAnswers({});
      setCurrentQ(0);
      setTimeLeft(res.data.totalQuestions * 90); // 90s per question
      setPhase(PHASE.IN_EXAM);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start exam. Please try again.');
    }
  };

  // ── Answer selection ──────────────────────────────────────────────────────
  const selectAnswer = (qId, answer) => {
    setAnswers(prev => ({ ...prev, [qId]: answer }));
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = questions.map(q => ({
        questionId: q._id,
        answer:     answers[q._id] || ''
      }));
      const res = await axios.post('http://localhost:5000/api/exam/submitAnswers', {
        examSessionId, answers: payload
      });

      if (res.data.result === 'level_up') {
        // Show level result, then move to next level
        setLevelResult(res.data);
        setPhase(PHASE.RESULT);
      } else {
        // Exam over (completed or failed)
        setFinalResult(res.data);
        setPhase(PHASE.FINAL);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Submit failed.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Proceed to next level ─────────────────────────────────────────────────
  const proceedNextLevel = () => {
    const d = levelResult;
    setCurrentLevel(d.nextLevel);
    setLevelLabel(d.nextLevelLabel);
    setQuestions(d.questions);
    setTotalQ(d.totalQuestions);
    setPassMark(d.passMark);
    setAnswers({});
    setCurrentQ(0);
    setTimeLeft(d.totalQuestions * 90);
    setLevelResult(null);
    setPhase(PHASE.IN_EXAM);
  };

  // ── Timer format ──────────────────────────────────────────────────────────
  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const timerClass = timeLeft !== null && timeLeft < 60 ? 'danger' : timeLeft < 180 ? 'warning' : '';

  const answeredCount = Object.keys(answers).length;
  const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="se-container">
      {/* Background */}
      <div className="se-bg">
        <div className="se-orb se-orb-1" />
        <div className="se-orb se-orb-2" />
        <div className="se-orb se-orb-3" />
      </div>

      {/* Navbar */}
      <nav className="se-nav">
        <div className="se-nav-inner">
          <div className="se-nav-left">
            <button className="se-back-btn" onClick={() => navigate('/student-dashboard')}>
              <ArrowLeft size={18} /> Dashboard
            </button>
            <div className="se-logo">
              <div className="se-logo-icon"><GraduationCap size={22} /></div>
              <div>
                <h1>EduAdapt</h1>
                <p>Adaptive Exam</p>
              </div>
            </div>
          </div>
          <div className="se-nav-right">
            <div className="se-user">
              <div className="se-avatar">S</div>
              <span>{studentName}</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="se-content">

        {/* ── SUBJECT SELECTION ─────────────────────────────────────────── */}
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
                    <button
                      key={subj}
                      className={`se-subject-pill ${selectedSubject === subj ? 'selected' : ''}`}
                      onClick={() => { setSelectedSubject(subj); setError(''); }}
                    >
                      <BookOpen size={18} />
                      <span>{subj}</span>
                      {selectedSubject === subj && <CheckCircle size={16} className="se-pill-check" />}
                    </button>
                  ))}
                </div>

                {selectedSubject && (
                  <div className="se-selected-info">
                    <span>📚 Selected:</span>
                    <strong>{selectedSubject}</strong>
                  </div>
                )}

                <button
                  className="se-start-btn"
                  disabled={!selectedSubject}
                  onClick={() => setPhase(PHASE.INSTRUCTIONS)}
                >
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
              <div className="se-instruction-item">
                <span className="se-inst-num">1</span>
                <div><strong>3-Level Adaptive Exam</strong> — Easy → Intermediate → Difficult. Pass each to advance.</div>
              </div>
              <div className="se-instruction-item">
                <span className="se-inst-num">2</span>
                <div><strong>Pass Mark: 60%</strong> — Score ≥ 60% to proceed to the next level.</div>
              </div>
              <div className="se-instruction-item">
                <span className="se-inst-num">3</span>
                <div><strong>Question Types</strong> — MCQ (multiple choice) and Descriptive answers.</div>
              </div>
              <div className="se-instruction-item">
                <span className="se-inst-num">4</span>
                <div><strong>Timer</strong> — 90 seconds per question. Auto-submits when time runs out.</div>
              </div>
              <div className="se-instruction-item">
                <span className="se-inst-num">5</span>
                <div><strong>No Going Back</strong> — Once submitted a level, you cannot revisit answers.</div>
              </div>
            </div>

            <div className="se-level-overview">
              {[1,2,3].map(l => (
                <div key={l} className={`se-level-chip ${LEVEL_COLORS[l]}`}>
                  <span className="se-level-num">Level {l}</span>
                  <span>{LEVEL_LABELS[l]}</span>
                  <span className="se-level-q">{l === 1 ? '10 Qs' : l === 2 ? '15 Qs' : '10 Qs'}</span>
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
            {/* Sidebar */}
            <div className="se-sidebar">
              <div className={`se-level-badge ${LEVEL_COLORS[currentLevel]}`}>
                Level {currentLevel} — {levelLabel}
              </div>

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

              {/* Question navigation grid */}
              <div className="se-q-nav-label">Questions</div>
              <div className="se-q-nav-grid">
                {questions.map((q, i) => (
                  <button
                    key={i}
                    className={`se-q-nav-btn
                      ${i === currentQ ? 'active' : ''}
                      ${answers[q._id] ? 'answered' : ''}
                    `}
                    onClick={() => setCurrentQ(i)}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                className="se-submit-btn"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : `Submit Level ${currentLevel}`}
              </button>
            </div>

            {/* Question panel */}
            <div className="se-question-panel">
              <div className="se-q-header">
                <span className="se-q-number">Q{currentQ + 1} of {questions.length}</span>
                <span className={`se-q-type ${questions[currentQ]?.type === 'MCQ' ? 'mcq' : 'desc'}`}>
                  {questions[currentQ]?.type}
                </span>
                <span className="se-subject-tag">{selectedSubject}</span>
              </div>

              <p className="se-q-text">{questions[currentQ]?.text}</p>

              {/* MCQ */}
              {questions[currentQ]?.type === 'MCQ' && (
                <div className="se-options">
                  {questions[currentQ].options.map((opt, i) => (
                    <button
                      key={i}
                      className={`se-option ${answers[questions[currentQ]._id] === opt ? 'selected' : ''}`}
                      onClick={() => selectAnswer(questions[currentQ]._id, opt)}
                    >
                      <span className="se-opt-label">{String.fromCharCode(65 + i)}</span>
                      <span>{opt}</span>
                      {answers[questions[currentQ]._id] === opt && <CheckCircle size={18} className="se-opt-check" />}
                    </button>
                  ))}
                </div>
              )}

              {/* Descriptive */}
              {questions[currentQ]?.type === 'Descriptive' && (
                <div className="se-desc-wrap">
                  <textarea
                    className="se-desc-input"
                    placeholder="Type your answer here..."
                    rows={6}
                    value={answers[questions[currentQ]._id] || ''}
                    onChange={e => selectAnswer(questions[currentQ]._id, e.target.value)}
                  />
                  <p className="se-desc-hint">💡 Be specific and include key terms from the topic.</p>
                </div>
              )}

              {/* Q navigation */}
              <div className="se-q-nav-row">
                <button
                  className="se-q-prev"
                  disabled={currentQ === 0}
                  onClick={() => setCurrentQ(p => p - 1)}
                >
                  ← Previous
                </button>
                {currentQ < questions.length - 1 ? (
                  <button className="se-q-next" onClick={() => setCurrentQ(p => p + 1)}>
                    Next →
                  </button>
                ) : (
                  <button className="se-q-next final" onClick={handleSubmit} disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit Level →'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── LEVEL RESULT (levelled up) ─────────────────────────────────── */}
        {phase === PHASE.RESULT && levelResult && (
          <div className="se-card se-result-card">
            <div className="se-result-icon passed">
              <CheckCircle size={48} />
            </div>
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

            <button className="se-start-btn" onClick={proceedNextLevel}>
              Start Level {levelResult.nextLevel} <ChevronRight size={18} />
            </button>
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
              <div className="se-ability-label">
                <BarChart2 size={16} /> Ability Score: {finalResult.finalAbility}
              </div>
              <div className="se-ability-bar">
                <div
                  className="se-ability-fill"
                  style={{ width: `${Math.min(100, Math.max(0, (finalResult.finalAbility + 3) / 6 * 100))}%` }}
                />
              </div>
            </div>

            <div className="se-final-actions">
              <button className="se-retry-btn" onClick={() => {
                setPhase(PHASE.SELECT_SUBJECT);
                setSelectedSubject('');
                setFinalResult(null);
                setAnswers({});
                setError('');
              }}>
                Try Another Subject
              </button>
              <button className="se-start-btn" onClick={() => navigate('/student-dashboard')}>
                Back to Dashboard
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}