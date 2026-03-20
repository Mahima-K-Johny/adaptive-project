// QuestionManager.jsx — with subject selection + multi-keyword descriptive support
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Plus, Trash2, X, ChevronDown, BookOpen,
  CheckCircle, AlertCircle, Filter, HelpCircle, Tag, Edit2
} from 'lucide-react';
import './QuestionManager.css';

const LEVELS = [
  { value: 1, label: 'Easy', color: '#10b981', bg: '#d1fae5' },
  { value: 2, label: 'Intermediate', color: '#f59e0b', bg: '#fef3c7' },
  { value: 3, label: 'Difficult', color: '#ef4444', bg: '#fee2e2' },
];
const TYPES = ['MCQ', 'MAQ', 'Descriptive'];
const DIFFICULTY_LABELS = { '-1': 'Easy', '0': 'Medium', '1': 'Hard' };
const REQUIRED_COUNTS = { 1: 10, 2: 15, 3: 10 };

const emptyForm = {
  text: '', type: 'MCQ', options: ['', '', '', ''],
  answer: '', keywords: [''],   // keywords: used only for Descriptive
  keywordMode: 'any',           // 'any' | 'all'
  difficulty: 0, level: 1,
};

export default function QuestionManager({ onClose, assignedSubjects = [], initialEditQuestion = null }) {
  const [selectedSubject, setSelectedSubject] = useState('');
  const [questions, setQuestions] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [tab, setTab] = useState('add');
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (selectedSubject) fetchQuestions(selectedSubject);
  }, [selectedSubject]);

  useEffect(() => {
    if (initialEditQuestion) {
      setSelectedSubject(initialEditQuestion.subject);
      setEditingId(initialEditQuestion._id);

      const q = initialEditQuestion;
      let kws = [];
      if (q.type === 'Descriptive') {
        if (Array.isArray(q.answer)) kws = q.answer.filter(Boolean);
        else kws = String(q.answer ?? '').split(',').map(k => k.trim()).filter(Boolean);
      }

      setForm({
        text: q.text || '',
        type: q.type || 'MCQ',
        options: (q.type === 'MCQ' || q.type === 'MAQ') ? (q.options || ['', '', '', '']) : [],
        answer: q.type === 'MCQ' ? (q.answer || '') : (q.type === 'MAQ' ? (Array.isArray(q.answer) ? q.answer : []) : ''),
        keywords: kws.length ? kws : [''],
        keywordMode: q.keywordMode || 'any',
        difficulty: q.difficulty !== undefined ? q.difficulty : 0,
        level: q.level || 1,
      });
      setTab('add');
    }
  }, [initialEditQuestion]);

  const fetchQuestions = async (subject) => {
    setFetchLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/questions/by-subject/${encodeURIComponent(subject)}`);
      setQuestions(res.data);
    } catch { setError('Failed to load questions.'); }
    finally { setFetchLoading(false); }
  };

  const countByLevel = (level) => questions.filter(q => q.level === level).length;

  const handleOptionChange = (i, val) => {
    const opts = [...form.options];
    const oldVal = opts[i];
    opts[i] = val;
    const newForm = { ...form, options: opts };
    if (form.type === 'MCQ' && form.answer === oldVal && oldVal.trim() !== '') {
      newForm.answer = val;
    } else if (form.type === 'MAQ' && Array.isArray(form.answer) && form.answer.includes(oldVal) && oldVal.trim() !== '') {
      newForm.answer = form.answer.map(a => a === oldVal ? val : a);
    }
    setForm(newForm);
  };

  const handleTypeChange = (type) => {
    setForm({
      ...form,
      type,
      options: (type === 'MCQ' || type === 'MAQ') ? ['', '', '', ''] : [],
      answer: type === 'MAQ' ? [] : '',
      keywords: [''],
      keywordMode: 'any',
    });
  };

  // ── Keyword helpers ──────────────────────────────────────────────────────
  const handleKeywordChange = (i, val) => {
    const kws = [...form.keywords];
    kws[i] = val;
    setForm({ ...form, keywords: kws });
  };

  const addKeyword = () => {
    if (form.keywords.length >= 10) return;
    setForm({ ...form, keywords: [...form.keywords, ''] });
  };

  const removeKeyword = (i) => {
    if (form.keywords.length <= 1) return;
    setForm({ ...form, keywords: form.keywords.filter((_, idx) => idx !== i) });
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (!form.text.trim()) return setError('Question text is required.');

    if (form.type === 'MCQ') {
      if (!form.answer || typeof form.answer !== 'string' || !form.answer.trim()) return setError('Answer is required.');
      const filled = form.options.filter(o => o.trim());
      if (filled.length < 2) return setError('At least 2 options are required for MCQ.');
      if (!filled.includes(form.answer.trim())) return setError('Answer must match one of the options exactly.');
    } else if (form.type === 'MAQ') {
      if (!Array.isArray(form.answer) || form.answer.length === 0) return setError('At least one correct answer must be selected.');
      const filled = form.options.filter(o => o.trim());
      if (filled.length < 2) return setError('At least 2 options are required for MAQ.');
    } else {
      // Descriptive — validate keywords
      const validKws = form.keywords.map(k => k.trim()).filter(Boolean);
      if (validKws.length === 0) return setError('At least one keyword is required for Descriptive questions.');
    }

    setLoading(true);
    try {
      const validKeywords = form.keywords.map(k => k.trim()).filter(Boolean);

      const payload = {
        subject: selectedSubject,
        text: form.text.trim(),
        type: form.type,
        options: (form.type === 'MCQ' || form.type === 'MAQ') ? form.options.filter(o => o.trim()) : [],
        // For MCQ: answer is a plain string.
        // For MAQ: answer is an array of strings.
        // For Descriptive: answer is stored as comma-joined keywords for backward compat.
        answer: form.type === 'MCQ'
          ? form.answer.trim()
          : form.type === 'MAQ'
            ? form.answer
            : validKeywords.join(','),
        keywordMode: form.type === 'Descriptive' ? form.keywordMode : undefined,
        difficulty: Number(form.difficulty),
        level: Number(form.level),
      };

      if (editingId) {
        await axios.put(`http://localhost:5000/api/questions/${editingId}`, payload);
        setSuccess('Question updated!');
      } else {
        await axios.post('http://localhost:5000/api/questions/create', payload);
        setSuccess('Question added!');
      }
      setForm(emptyForm);
      setEditingId(null);
      fetchQuestions(selectedSubject);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to finish operation.');
    } finally { setLoading(false); }
  };

  /** Parse a descriptive question's keywords for display */
  const parseKeywords = (q) => {
    if (Array.isArray(q.answer)) return q.answer.filter(Boolean);
    return String(q.answer ?? '').split(',').map(k => k.trim()).filter(Boolean);
  };

  const handleEdit = (q) => {
    setEditingId(q._id);
    const kws = q.type === 'Descriptive' ? parseKeywords(q) : [''];
    setForm({
      text: q.text || '',
      type: q.type || 'MCQ',
      options: (q.type === 'MCQ' || q.type === 'MAQ') ? (q.options || ['', '', '', '']) : [],
      answer: q.type === 'MCQ' ? (q.answer || '') : (q.type === 'MAQ' ? (Array.isArray(q.answer) ? q.answer : []) : ''),
      keywords: kws.length ? kws : [''],
      keywordMode: q.keywordMode || 'any',
      difficulty: q.difficulty !== undefined ? q.difficulty : 0,
      level: q.level || 1,
    });
    setTab('add');
    setError('');
    setSuccess('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/questions/${id}`);
      fetchQuestions(selectedSubject);
    } catch { setError('Failed to delete.'); }
  };

  const filtered = questions.filter(q => {
    if (filterLevel !== 'all' && q.level !== Number(filterLevel)) return false;
    if (filterType !== 'all' && q.type !== filterType) return false;
    return true;
  });

  const getLevelInfo = (val) => LEVELS.find(l => l.value === val) || LEVELS[0];

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="qm-overlay" onClick={onClose}>
      <div className="qm-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="qm-header">
          <div className="qm-header-left">
            <div className="qm-header-icon"><HelpCircle size={20} /></div>
            <div>
              <h2 className="qm-title">Question Bank</h2>
              <p className="qm-subtitle">
                {selectedSubject ? `Managing: ${selectedSubject}` : 'Select a subject to begin'}
              </p>
            </div>
          </div>
          <button className="qm-close" onClick={onClose}><X size={18} /></button>
        </div>

        {/* ── SUBJECT SELECTOR ─────────────────────────────────────────────── */}
        <div className="qm-subject-bar">
          <span className="qm-subject-label">Subject:</span>
          <div className="qm-subject-pills">
            {assignedSubjects.length === 0 ? (
              <span className="qm-no-subjects">⚠️ No subjects assigned to you</span>
            ) : (
              assignedSubjects.map(s => (
                <button
                  key={s}
                  className={`qm-subject-pill ${selectedSubject === s ? 'qm-subject-pill-active' : ''}`}
                  onClick={() => {
                    setSelectedSubject(s);
                    setQuestions([]);
                    setForm(emptyForm);
                    setEditingId(null);
                    setError('');
                    setSuccess('');
                    setFilterLevel('all');
                    setFilterType('all');
                  }}
                >
                  {s}
                </button>
              ))
            )}
          </div>
        </div>

        {/* If no subject selected yet — show placeholder */}
        {!selectedSubject ? (
          <div className="qm-pick-subject">
            <HelpCircle size={40} style={{ color: '#c7d2fe' }} />
            <p>Select a subject above to manage its questions</p>
          </div>
        ) : (
          <>
            {/* Level progress bar */}
            <div className="qm-level-bar">
              {LEVELS.map(lv => {
                const count = countByLevel(lv.value);
                const required = REQUIRED_COUNTS[lv.value];
                const pct = Math.min(100, Math.round((count / required) * 100));
                return (
                  <div key={lv.value} className="qm-level-item">
                    <div className="qm-level-top">
                      <span className="qm-level-name" style={{ color: lv.color }}>{lv.label}</span>
                      <span className="qm-level-count">{count}/{required}</span>
                    </div>
                    <div className="qm-progress-track">
                      <div className="qm-progress-fill" style={{ width: `${pct}%`, background: lv.color }} />
                    </div>
                    {count >= required && <span className="qm-level-ready">✅ Ready</span>}
                  </div>
                );
              })}
            </div>

            {/* Tabs */}
            <div className="qm-tabs">
              <button className={`qm-tab ${tab === 'add' ? 'qm-tab-active' : ''}`} onClick={() => { setTab('add'); if (!editingId) setForm(emptyForm); }}>
                <Plus size={15} /> {editingId ? 'Edit Question' : 'Add Question'}
              </button>
              <button className={`qm-tab ${tab === 'manage' ? 'qm-tab-active' : ''}`} onClick={() => setTab('manage')}>
                <BookOpen size={15} /> Manage ({questions.length})
              </button>
            </div>

            {/* ── ADD TAB ── */}
            {tab === 'add' && (
              <div className="qm-body">
                <form onSubmit={handleSubmit} className="qm-form">
                  {error && <div className="qm-alert qm-alert-error">  <AlertCircle size={15} />{error}  </div>}
                  {success && <div className="qm-alert qm-alert-success"><CheckCircle size={15} />{success}</div>}

                  <div className="qm-row">
                    {/* Level */}
                    <div className="qm-field">
                      <label className="qm-label">Level *</label>
                      <div className="qm-btn-group">
                        {LEVELS.map(lv => (
                          <button
                            key={lv.value} type="button"
                            className={`qm-level-btn ${form.level === lv.value ? 'qm-level-btn-active' : ''}`}
                            style={form.level === lv.value ? { background: lv.color, color: '#fff', borderColor: lv.color } : {}}
                            onClick={() => setForm({ ...form, level: lv.value })}
                          >{lv.label}</button>
                        ))}
                      </div>
                    </div>

                    {/* Type */}
                    <div className="qm-field">
                      <label className="qm-label">Type *</label>
                      <div className="qm-btn-group">
                        {TYPES.map(t => (
                          <button
                            key={t} type="button"
                            className={`qm-type-btn ${form.type === t ? 'qm-type-btn-active' : ''}`}
                            onClick={() => handleTypeChange(t)}
                          >{t}</button>
                        ))}
                      </div>
                    </div>

                    {/* Difficulty */}
                    <div className="qm-field">
                      <label className="qm-label">Difficulty *</label>
                      <div className="qm-select-wrap">
                        <ChevronDown size={13} className="qm-select-icon" />
                        <select className="qm-select" value={form.difficulty}
                          onChange={e => setForm({ ...form, difficulty: Number(e.target.value) })}>
                          <option value={-1}>Easy </option>
                          <option value={0}>Medium </option>
                          <option value={1}>Hard </option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Question text */}
                  <div className="qm-field">
                    <label className="qm-label">Question Text *</label>
                    <textarea className="qm-textarea" placeholder="Enter the question..." rows={3}
                      value={form.text} onChange={e => setForm({ ...form, text: e.target.value })} required />
                  </div>

                  {/* MCQ & MAQ Modern Options UI */}
                  {(form.type === 'MCQ' || form.type === 'MAQ') && (
                    <div className="qm-field">
                      <label className="qm-label">
                        Options & Correct Answer *
                        <span className="qm-hint"> — type options and tick the {form.type === 'MCQ' ? 'radio button' : 'checkbox(es)'} to mark the correct one(s) (min 2)</span>
                      </label>
                      <div className="qm-options-modern">
                        {form.options.map((opt, i) => {
                          const isCorrect = form.type === 'MCQ'
                            ? form.answer && form.answer === opt && opt.trim() !== ''
                            : Array.isArray(form.answer) && form.answer.includes(opt) && opt.trim() !== '';

                          const toggleCorrect = () => {
                            if (!opt.trim()) return;
                            if (form.type === 'MCQ') {
                              setForm({ ...form, answer: opt });
                            } else {
                              const currentAnswers = Array.isArray(form.answer) ? [...form.answer] : [];
                              if (currentAnswers.includes(opt)) {
                                setForm({ ...form, answer: currentAnswers.filter(a => a !== opt) });
                              } else {
                                setForm({ ...form, answer: [...currentAnswers, opt] });
                              }
                            }
                          };

                          return (
                            <label key={i} className={`qm-option-modern-wrap ${isCorrect ? 'qm-option-modern-correct' : ''}`}>
                              <div className="qm-option-radio" title="Mark as correct answer">
                                <input
                                  type={form.type === 'MCQ' ? 'radio' : 'checkbox'}
                                  name="options-answer"
                                  checked={isCorrect}
                                  onChange={toggleCorrect}
                                  disabled={!opt.trim()}
                                />
                              </div>
                              <span className="qm-option-letter" style={isCorrect ? { background: '#10b981', color: '#fff' } : {}}>
                                {String.fromCharCode(65 + i)}
                              </span>
                              <input className="qm-input qm-option-input"
                                placeholder={`Option ${String.fromCharCode(65 + i)}`}
                                value={opt}
                                onChange={e => handleOptionChange(i, e.target.value)}
                              />
                              {isCorrect && <CheckCircle className="qm-option-check-icon" size={18} />}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ── Descriptive: AI-powered Evaluation UI ─────────────────────── */}
                  {form.type === 'Descriptive' && (
                    <>
                      <div className="qm-ai-status">
                        <span className="qm-ai-badge">AI Grading Active</span>
                        <span className="qm-ai-status-text">Semantically evaluates answer based on core concepts.</span>
                      </div>

                      <div className="qm-field">
                        <label className="qm-label">
                          <Tag size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                          AI Core Concepts (Keywords) *
                        </label>
                        <p className="qm-ai-special-hint">
                          <strong>Note:</strong> The AI uses these concepts to grade the student's explanation. 
                          It understands synonyms and rephrasing, so the student doesn't need to match words exactly.
                        </p>

                        {/* Keyword mode toggle */}
                        <div className="qm-keyword-mode">
                          <span className="qm-keyword-mode-label">Fallback Match mode:</span>
                          <button
                            type="button"
                            className={`qm-mode-btn ${form.keywordMode === 'any' ? 'qm-mode-btn-active' : ''}`}
                            onClick={() => setForm({ ...form, keywordMode: 'any' })}
                          >
                            Any key
                          </button>
                          <button
                            type="button"
                            className={`qm-mode-btn ${form.keywordMode === 'all' ? 'qm-mode-btn-active' : ''}`}
                            onClick={() => setForm({ ...form, keywordMode: 'all' })}
                          >
                            All keys
                          </button>
                          <span className="qm-mode-hint" style={{ fontSize: '0.65rem' }}>
                            (Used only if AI is offline)
                          </span>
                        </div>

                        {/* Keyword inputs */}
                        <div className="qm-keyword-list">
                          {form.keywords.map((kw, i) => (
                            <div key={i} className="qm-keyword-row">
                              <span className={`qm-keyword-num qm-keyword-num-ai`}>{i + 1}</span>
                              <input
                                className="qm-input"
                                placeholder={`Concept ${i + 1} (e.g. photosynthesis)`}
                                value={kw}
                                onChange={e => handleKeywordChange(i, e.target.value)}
                              />
                              {form.keywords.length > 1 && (
                                <button
                                  type="button"
                                  className="qm-keyword-remove"
                                  onClick={() => removeKeyword(i)}
                                  title="Remove concept"
                                >
                                  <X size={14} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>

                        {form.keywords.length < 10 && (
                          <button type="button" className="qm-add-keyword" onClick={addKeyword}>
                            <Plus size={13} /> Add another core concept
                          </button>
                        )}
                      </div>
                    </>
                  )}

                  <div className="qm-form-btns">
                    <button type="button" className="qm-btn-cancel" onClick={() => { setForm(emptyForm); setEditingId(null); }}>
                      {editingId ? 'Cancel Edit' : 'Reset'}
                    </button>
                    <button type="submit" className="qm-btn-submit" disabled={loading}>
                      <Plus size={16} />{loading ? (editingId ? 'Updating…' : 'Adding…') : (editingId ? 'Update Question' : `Add to ${selectedSubject}`)}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ── MANAGE TAB ── */}
            {tab === 'manage' && (
              <div className="qm-body">
                <div className="qm-filters">
                  <div className="qm-filter-group">
                    <Filter size={14} />
                    <select className="qm-filter-select" value={filterLevel} onChange={e => setFilterLevel(e.target.value)}>
                      <option value="all">All Levels</option>
                      {LEVELS.map(lv => <option key={lv.value} value={lv.value}>{lv.label}</option>)}
                    </select>
                  </div>
                  <div className="qm-filter-group">
                    <select className="qm-filter-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
                      <option value="all">All Types</option>
                      {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <span className="qm-filter-count">{filtered.length} question{filtered.length !== 1 ? 's' : ''}</span>
                </div>

                {fetchLoading ? (
                  <div className="qm-loading">Loading questions…</div>
                ) : filtered.length === 0 ? (
                  <div className="qm-empty">
                    <HelpCircle size={36} />
                    <p>No questions yet for <strong>{selectedSubject}</strong>. Add some using the Add tab.</p>
                  </div>
                ) : (
                  <div className="qm-question-list">
                    {filtered.map(q => {
                      const lv = getLevelInfo(q.level);
                      const keywords = q.type === 'Descriptive' ? parseKeywords(q) : [];
                      return (
                        <div key={q._id} className="qm-question-card">
                          <div className="qm-question-top">
                            <span className="qm-badge" style={{ background: lv.bg, color: lv.color }}>{lv.label}</span>
                            <span className="qm-badge qm-badge-type">{q.type}</span>
                            <span className="qm-badge qm-badge-diff">{DIFFICULTY_LABELS[String(q.difficulty)]}</span>
                            <button className="qm-edit-btn" onClick={() => handleEdit(q)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#6366f1', marginLeft: 'auto', marginRight: '4px' }} title="Edit"><Edit2 size={14} /></button>
                            <button className="qm-delete-btn" onClick={() => handleDelete(q._id)}><Trash2 size={14} /></button>
                          </div>
                          <p className="qm-question-text">{q.text}</p>
                          {q.type === 'MCQ' && q.options?.length > 0 && (
                            <div className="qm-options-list">
                              {q.options.map((opt, i) => (
                                <span key={i} className={`qm-option-chip ${opt === q.answer ? 'qm-option-correct' : ''}`}>
                                  {String.fromCharCode(65 + i)}. {opt}{opt === q.answer && ' ✓'}
                                </span>
                              ))}
                            </div>
                          )}
                          {q.type === 'Descriptive' && (
                            <div className="qm-keyword-display">
                              <span className="qm-keyword-display-label">
                                <Tag size={12} />
                                AI Core Concepts
                                {q.keywordMode === 'all'
                                  ? <span className="qm-mode-tag qm-mode-tag-all" title="Used if AI is offline">ALL Required</span>
                                  : <span className="qm-mode-tag qm-mode-tag-any" title="Used if AI is offline">ANY Required</span>}
                                :
                              </span>
                              <div className="qm-keyword-chips">
                                {keywords.map((kw, i) => (
                                  <span key={i} className="qm-keyword-chip">{kw}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}