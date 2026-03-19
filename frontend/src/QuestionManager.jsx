// QuestionManager.jsx — with subject selection + multi-keyword descriptive support
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Plus, Trash2, X, ChevronDown, BookOpen,
  CheckCircle, AlertCircle, Filter, HelpCircle, Tag
} from 'lucide-react';
import './QuestionManager.css';

const LEVELS = [
  { value: 1, label: 'Easy',         color: '#10b981', bg: '#d1fae5' },
  { value: 2, label: 'Intermediate', color: '#f59e0b', bg: '#fef3c7' },
  { value: 3, label: 'Difficult',    color: '#ef4444', bg: '#fee2e2' },
];
const TYPES = ['MCQ', 'Descriptive'];
const DIFFICULTY_LABELS = { '-1': 'Easy', '0': 'Medium', '1': 'Hard' };
const REQUIRED_COUNTS   = { 1: 10, 2: 15, 3: 10 };

const emptyForm = {
  text: '', type: 'MCQ', options: ['', '', '', ''],
  answer: '', keywords: [''],   // keywords: used only for Descriptive
  keywordMode: 'any',           // 'any' | 'all'
  difficulty: 0, level: 1,
};

export default function QuestionManager({ onClose, assignedSubjects = [] }) {
  const [selectedSubject, setSelectedSubject] = useState('');
  const [questions,       setQuestions]       = useState([]);
  const [form,            setForm]            = useState(emptyForm);
  const [loading,         setLoading]         = useState(false);
  const [fetchLoading,    setFetchLoading]    = useState(false);
  const [success,         setSuccess]         = useState('');
  const [error,           setError]           = useState('');
  const [filterLevel,     setFilterLevel]     = useState('all');
  const [filterType,      setFilterType]      = useState('all');
  const [tab,             setTab]             = useState('add');

  useEffect(() => {
    if (selectedSubject) fetchQuestions(selectedSubject);
  }, [selectedSubject]);

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
    opts[i] = val;
    setForm({ ...form, options: opts });
  };

  const handleTypeChange = (type) => {
    setForm({
      ...form,
      type,
      options:     type === 'MCQ' ? ['', '', '', ''] : [],
      answer:      '',
      keywords:    [''],
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
      if (!form.answer.trim()) return setError('Answer is required.');
      const filled = form.options.filter(o => o.trim());
      if (filled.length < 2)                    return setError('At least 2 options are required for MCQ.');
      if (!filled.includes(form.answer.trim())) return setError('Answer must match one of the options exactly.');
    } else {
      // Descriptive — validate keywords
      const validKws = form.keywords.map(k => k.trim()).filter(Boolean);
      if (validKws.length === 0) return setError('At least one keyword is required for Descriptive questions.');
    }

    setLoading(true);
    try {
      const validKeywords = form.keywords.map(k => k.trim()).filter(Boolean);

      const payload = {
        subject:     selectedSubject,
        text:        form.text.trim(),
        type:        form.type,
        options:     form.type === 'MCQ' ? form.options.filter(o => o.trim()) : [],
        // For MCQ: answer is a plain string.
        // For Descriptive: answer is stored as comma-joined keywords for backward compat,
        //   AND we also send keywordMode.
        answer:      form.type === 'MCQ'
                       ? form.answer.trim()
                       : validKeywords.join(','),
        keywordMode: form.type === 'Descriptive' ? form.keywordMode : undefined,
        difficulty:  Number(form.difficulty),
        level:       Number(form.level),
      };

      await axios.post('http://localhost:5000/api/questions/create', payload);
      setSuccess('Question added!');
      setForm(emptyForm);
      fetchQuestions(selectedSubject);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add question.');
    } finally { setLoading(false); }
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
    if (filterType  !== 'all' && q.type  !== filterType)           return false;
    return true;
  });

  const getLevelInfo = (val) => LEVELS.find(l => l.value === val) || LEVELS[0];

  /** Parse a descriptive question's keywords for display */
  const parseKeywords = (q) => {
    if (Array.isArray(q.answer)) return q.answer.filter(Boolean);
    return String(q.answer ?? '').split(',').map(k => k.trim()).filter(Boolean);
  };

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
                const count    = countByLevel(lv.value);
                const required = REQUIRED_COUNTS[lv.value];
                const pct      = Math.min(100, Math.round((count / required) * 100));
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
              <button className={`qm-tab ${tab === 'add'    ? 'qm-tab-active' : ''}`} onClick={() => setTab('add')}>
                <Plus size={15} /> Add Question
              </button>
              <button className={`qm-tab ${tab === 'manage' ? 'qm-tab-active' : ''}`} onClick={() => setTab('manage')}>
                <BookOpen size={15} /> Manage ({questions.length})
              </button>
            </div>

            {/* ── ADD TAB ── */}
            {tab === 'add' && (
              <div className="qm-body">
                <form onSubmit={handleSubmit} className="qm-form">
                  {error   && <div className="qm-alert qm-alert-error">  <AlertCircle  size={15}/>{error}  </div>}
                  {success && <div className="qm-alert qm-alert-success"><CheckCircle size={15}/>{success}</div>}

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
                          <option value={-1}>Easy (-1)</option>
                          <option value={0}>Medium (0)</option>
                          <option value={1}>Hard (1)</option>
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

                  {/* MCQ Options */}
                  {form.type === 'MCQ' && (
                    <div className="qm-field">
                      <label className="qm-label">Options * <span className="qm-hint">(min 2)</span></label>
                      <div className="qm-options-grid">
                        {form.options.map((opt, i) => (
                          <div key={i} className="qm-option-wrap">
                            <span className="qm-option-letter">{String.fromCharCode(65 + i)}</span>
                            <input className="qm-input" placeholder={`Option ${String.fromCharCode(65 + i)}`}
                              value={opt} onChange={e => handleOptionChange(i, e.target.value)} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* MCQ Answer picker */}
                  {form.type === 'MCQ' && (
                    <div className="qm-field">
                      <label className="qm-label">
                        Correct Answer * <span className="qm-hint">— select from options above</span>
                      </label>
                      <div className="qm-select-wrap">
                        <ChevronDown size={13} className="qm-select-icon" />
                        <select className="qm-select" value={form.answer}
                          onChange={e => setForm({ ...form, answer: e.target.value })} required>
                          <option value="">— Select correct answer —</option>
                          {form.options.filter(o => o.trim()).map((opt, i) => (
                            <option key={i} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* ── Descriptive: multi-keyword UI ─────────────────────── */}
                  {form.type === 'Descriptive' && (
                    <>
                      <div className="qm-field">
                        <label className="qm-label">
                          <Tag size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                          Answer Keywords *
                          <span className="qm-hint"> — student answer must contain these word(s)</span>
                        </label>

                        {/* Keyword mode toggle */}
                        <div className="qm-keyword-mode">
                          <span className="qm-keyword-mode-label">Match mode:</span>
                          <button
                            type="button"
                            className={`qm-mode-btn ${form.keywordMode === 'any' ? 'qm-mode-btn-active' : ''}`}
                            onClick={() => setForm({ ...form, keywordMode: 'any' })}
                          >
                            Any keyword
                          </button>
                          <button
                            type="button"
                            className={`qm-mode-btn ${form.keywordMode === 'all' ? 'qm-mode-btn-active' : ''}`}
                            onClick={() => setForm({ ...form, keywordMode: 'all' })}
                          >
                            All keywords
                          </button>
                          <span className="qm-mode-hint">
                            {form.keywordMode === 'any'
                              ? '(correct if answer includes at least one keyword)'
                              : '(correct only if answer includes every keyword)'}
                          </span>
                        </div>

                        {/* Keyword inputs */}
                        <div className="qm-keyword-list">
                          {form.keywords.map((kw, i) => (
                            <div key={i} className="qm-keyword-row">
                              <span className="qm-keyword-num">{i + 1}</span>
                              <input
                                className="qm-input"
                                placeholder={`Keyword ${i + 1} (e.g. photosynthesis)`}
                                value={kw}
                                onChange={e => handleKeywordChange(i, e.target.value)}
                              />
                              {form.keywords.length > 1 && (
                                <button
                                  type="button"
                                  className="qm-keyword-remove"
                                  onClick={() => removeKeyword(i)}
                                  title="Remove keyword"
                                >
                                  <X size={14} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>

                        {form.keywords.length < 10 && (
                          <button type="button" className="qm-add-keyword" onClick={addKeyword}>
                            <Plus size={13} /> Add another keyword
                          </button>
                        )}
                      </div>
                    </>
                  )}

                  <div className="qm-form-btns">
                    <button type="button" className="qm-btn-cancel" onClick={() => setForm(emptyForm)}>Reset</button>
                    <button type="submit" className="qm-btn-submit" disabled={loading}>
                      <Plus size={16} />{loading ? 'Adding…' : `Add to ${selectedSubject}`}
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
                                Keywords
                                {q.keywordMode === 'all'
                                  ? <span className="qm-mode-tag qm-mode-tag-all">ALL required</span>
                                  : <span className="qm-mode-tag qm-mode-tag-any">ANY one</span>}
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