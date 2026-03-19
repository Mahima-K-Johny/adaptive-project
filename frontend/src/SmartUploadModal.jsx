// SmartUploadModal.jsx — with backend PDF/PPT/DOC text extraction
import React, { useState, useRef } from 'react';
import {
  Upload, X, File, Check, AlertCircle,
  ChevronDown, ShieldCheck, ShieldAlert, Loader, FileQuestion
} from 'lucide-react';
import axios from 'axios';

// ── Subject keyword dictionary ────────────────────────────────────────────────
const SUBJECT_KEYWORDS = {
  'react': [
    'react', 'jsx', 'component', 'props', 'state', 'usestate', 'useeffect',
    'hooks', 'virtual dom', 'reactdom', 'render', 'redux', 'context',
    'router', 'react-router', 'lifecycle', 'ref', 'usememo', 'usecallback'
  ],
  'javascript': [
    'javascript', 'js', 'dom', 'event', 'function', 'var', 'let', 'const',
    'promise', 'async', 'await', 'arrow function', 'prototype', 'closure',
    'callback', 'fetch', 'json', 'es6', 'ecmascript', 'array', 'object'
  ],
  'sql': [
    'sql', 'select', 'insert', 'update', 'delete', 'from', 'where',
    'join', 'table', 'database', 'query', 'primary key', 'foreign key',
    'index', 'schema', 'normalization', 'group by', 'order by', 'having',
    'mysql', 'postgresql', 'sqlite', 'relational', 'inner join', 'left join'
  ],
  'python': [
    'python', 'def', 'import', 'pip', 'list', 'dict', 'tuple',
    'lambda', 'pandas', 'numpy', 'matplotlib', 'django', 'flask',
    'indentation', 'print(', 'range(', '__init__', 'self.'
  ],
  'node.js': [
    'node', 'nodejs', 'npm', 'express', 'require', 'module.exports',
    'server', 'middleware', 'route', 'package.json', 'eventemitter', 'stream'
  ],
  'mongodb': [
    'mongodb', 'mongoose', 'nosql', 'document', 'collection', 'bson',
    'objectid', 'findone', 'insertone', 'aggregate', 'pipeline',
    'atlas', 'replica', 'sharding'
  ],
  'machine learning': [
    'machine learning', 'ml', 'model', 'training', 'dataset', 'algorithm',
    'neural network', 'deep learning', 'classification', 'regression',
    'overfitting', 'feature', 'accuracy', 'tensorflow', 'pytorch', 'sklearn',
    'supervised', 'unsupervised', 'gradient descent', 'epoch'
  ],
  'html & css': [
    'html', 'css', 'flexbox', 'grid', 'margin', 'padding', 'border',
    'selector', 'responsive', 'media query', 'bootstrap', 'tag', 'attribute'
  ],
  'data structures & algorithms': [
    'linked list', 'stack', 'queue', 'tree', 'graph', 'hash',
    'binary search', 'sorting', 'recursion', 'dynamic programming',
    'big o', 'complexity', 'traversal', 'bfs', 'dfs', 'heap', 'trie'
  ],
  'java': [
    'java', 'public', 'private', 'static', 'void', 'extends',
    'implements', 'interface', 'inheritance', 'polymorphism', 'jvm',
    'spring', 'maven', 'arraylist', 'hashmap', 'exception'
  ],
  'typescript': [
    'typescript', 'interface', 'type', 'enum', 'generic', 'decorator',
    'namespace', 'tsc', 'tsconfig', 'union type', 'intersection'
  ],
  'devops': [
    'devops', 'ci/cd', 'pipeline', 'jenkins', 'deployment',
    'ansible', 'terraform', 'monitoring', 'logging', 'automation', 'infrastructure'
  ],
  'docker': [
    'docker', 'container', 'image', 'dockerfile', 'compose',
    'volume', 'registry', 'daemon', 'kubernetes', 'k8s', 'orchestration'
  ],
  'aws': [
    'aws', 'amazon', 's3', 'ec2', 'lambda', 'cloudfront', 'rds',
    'iam', 'vpc', 'route53', 'cloudwatch', 'dynamodb', 'serverless'
  ],
};

function normalizeSubject(subject) {
  return subject.toLowerCase().trim();
}

function getKeywords(subject) {
  const key = normalizeSubject(subject);
  if (SUBJECT_KEYWORDS[key]) return SUBJECT_KEYWORDS[key];
  const partialKey = Object.keys(SUBJECT_KEYWORDS).find(k => key.includes(k) || k.includes(key));
  return partialKey ? SUBJECT_KEYWORDS[partialKey] : [];
}

function checkFilename(fileName, subject) {
  const name  = fileName.toLowerCase().replace(/[^a-z0-9]/g, ' ');
  const words = normalizeSubject(subject).split(/\s+/).filter(w => w.length > 2);
  const filenameMatch = words.some(w => name.includes(w));

  const otherSubjects = Object.keys(SUBJECT_KEYWORDS).filter(k => k !== normalizeSubject(subject));
  const conflictSubject = otherSubjects.find(other => {
    const otherWords = other.split(/\s+/);
    return otherWords.some(w => w.length > 3 && name.includes(w));
  });

  return { filenameMatch, conflictSubject };
}

// ── Check if file is binary (PDF/DOC/PPT) ────────────────────────────────────
function isBinaryFile(file) {
  return (
    file.type === 'application/pdf' ||
    file.type === 'application/msword' ||
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.type === 'application/vnd.ms-powerpoint' ||
    file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
    file.name.endsWith('.docx') ||
    file.name.endsWith('.doc') ||
    file.name.endsWith('.pptx') ||
    file.name.endsWith('.ppt') ||
    file.name.endsWith('.pdf')
  );
}

// ── Extract text — browser for plain text, backend for PDF/PPT/DOC ───────────
async function extractText(file) {
  if (!isBinaryFile(file)) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload  = (e) => resolve(e.target.result || '');
      reader.onerror = ()  => resolve('');
      reader.readAsText(file);
    });
  }

  // Send binary file to backend for text extraction
  try {
    const formData = new FormData();
    formData.append('file', file);
    const res = await axios.post('http://localhost:5000/api/materials/verify', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data.text || '';
  } catch {
    return ''; // fallback — verifyLocally will use filename check
  }
}

// ── Main verification ─────────────────────────────────────────────────────────
async function verifyLocally(file, subject) {
  const binary   = isBinaryFile(file);
  const text     = await extractText(file); // now works for ALL file types
  const keywords = getKeywords(subject);
  const { filenameMatch, conflictSubject } = checkFilename(file.name, subject);

  // ── BINARY FILE where backend couldn't extract text — fall back to filename ─
  if (binary && text.trim() === '') {
    if (conflictSubject) {
      return {
        match:           false,
        confidence:      'medium',
        detectedSubject: conflictSubject,
        reason:          `Filename suggests this is a ${conflictSubject} file, not ${subject}.`,
        isBinary:        true,
      };
    }
    return {
      match:           false,
      confidence:      'low',
      detectedSubject: 'unknown',
      reason:          `Could not read file content. Please confirm this file is about ${subject}.`,
      isBinary:        true,
      requireConfirm:  true,
    };
  }

  // ── Keyword scan (works for both text files AND binary files with extracted text) ──
  const textLower     = text.toLowerCase();
  const foundKeywords = keywords.filter(kw => textLower.includes(kw.toLowerCase()));
  const matchCount    = foundKeywords.length;
  const totalKeywords = keywords.length;

  if (totalKeywords === 0) {
    return {
      match:           true,
      confidence:      'low',
      reason:          'No keyword list for this subject — please verify manually.',
      detectedSubject: subject,
    };
  }

  const score = matchCount / totalKeywords;

  // Find best matching other subject
  let bestOtherSubject = null;
  let bestOtherScore   = 0;
  for (const [otherSubject, otherKeywords] of Object.entries(SUBJECT_KEYWORDS)) {
    if (normalizeSubject(otherSubject) === normalizeSubject(subject)) continue;
    const otherFound = otherKeywords.filter(kw => textLower.includes(kw.toLowerCase()));
    const otherScore = otherFound.length / otherKeywords.length;
    if (otherScore > bestOtherScore) {
      bestOtherScore   = otherScore;
      bestOtherSubject = otherSubject;
    }
  }

  if (score >= 0.15) {
    return {
      match:           true,
      confidence:      score >= 0.3 ? 'high' : 'medium',
      detectedSubject: subject,
      reason:          `Found ${matchCount} ${subject}-related terms in the file.`,
    };
  }

  if (bestOtherScore > score && bestOtherScore > 0.1 && bestOtherSubject) {
    return {
      match:           false,
      confidence:      bestOtherScore >= 0.25 ? 'high' : 'medium',
      detectedSubject: bestOtherSubject,
      reason:          `Content appears to be about ${bestOtherSubject} — more ${bestOtherSubject}-related terms found than ${subject} terms.`,
    };
  }

  if (conflictSubject) {
    return {
      match:           false,
      confidence:      'medium',
      detectedSubject: conflictSubject,
      reason:          `Filename suggests this is a ${conflictSubject} file, not ${subject}.`,
    };
  }

  return {
    match:           true,
    confidence:      'low',
    detectedSubject: subject,
    reason:          `Only ${matchCount} ${subject}-related terms found — please double check the file.`,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
export default function SmartUploadModal({
  assignedSubjects,
  subjectsLoading,
  teacherId,
  onClose,
  onSuccess
}) {
  const [subject,      setSubject]      = useState('');
  const [title,        setTitle]        = useState('');
  const [file,         setFile]         = useState(null);
  const [uploading,    setUploading]    = useState(false);
  const [uploadError,  setUploadError]  = useState('');
  const [verifying,    setVerifying]    = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);
  const [overrideWarn, setOverrideWarn] = useState(false);

  const fileInputRef = useRef();

  const runVerification = async (pickedFile, selectedSubject) => {
    setVerifying(true);
    setVerifyResult(null);
    setOverrideWarn(false);
    try {
      const result = await verifyLocally(pickedFile, selectedSubject);
      setVerifyResult(result);
    } catch (err) {
      console.error(err);
      setVerifyResult({
        match:           false,
        confidence:      'low',
        requireConfirm:  true,
        isBinary:        false,
        detectedSubject: selectedSubject,
        reason:          'Could not scan file — please confirm this file is correct before uploading.',
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleFileChange = async (e) => {
    const picked = e.target.files[0];
    if (!picked) return;
    setFile(picked);
    setVerifyResult(null);
    setOverrideWarn(false);
    if (subject) await runVerification(picked, subject);
  };

  const handleSubjectChange = async (e) => {
    const val = e.target.value;
    setSubject(val);
    setUploadError('');
    setVerifyResult(null);
    setOverrideWarn(false);
    if (file && val) await runVerification(file, val);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setUploadError('');

    if (!file || !subject || !title) {
      setUploadError('Please fill all fields and select a file.');
      return;
    }

    const needsConfirmation = verifyResult && !verifyResult.match && !overrideWarn;
    if (needsConfirmation) {
      setUploadError(
        verifyResult.requireConfirm
          ? 'Please confirm that this file is for the correct subject.'
          : 'Please tick the confirmation box to upload despite the mismatch warning.'
      );
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('teacherId', teacherId);
    formData.append('subject',   subject);
    formData.append('title',     title);
    formData.append('file',      file);

    try {
      await axios.post('http://localhost:5000/api/materials/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onSuccess();
      onClose();
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const confidenceColor = (c) => ({
    high:   '#dc2626',
    medium: '#d97706',
    low:    '#6b7280',
  }[c] || '#6b7280');

  const isBlocked     = verifyResult && !verifyResult.match && !overrideWarn;
  const isConfirmOnly = verifyResult?.requireConfirm;

  return (
    <div className="td2-overlay" onClick={onClose}>
      <div className="td2-modal su-modal" onClick={e => e.stopPropagation()}>

        <div className="td2-modal-header">
          <div className="td2-modal-header-icon"><Upload size={20} /></div>
          <div>
            <h2 className="td2-modal-title">Upload Material</h2>
            <p className="td2-modal-sub">Content is checked against the selected subject</p>
          </div>
          <button className="td2-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="td2-modal-body">
          <form onSubmit={handleUpload} className="td2-form">

            {uploadError && (
              <div className="td2-error-banner">
                <AlertCircle size={15} /><span>{uploadError}</span>
              </div>
            )}

            {/* Subject */}
            <div className="td2-field">
              <label className="td2-label">Subject *</label>
              {subjectsLoading ? (
                <div className="td2-field-hint">Loading subjects…</div>
              ) : assignedSubjects.length === 0 ? (
                <div className="td2-no-subjects">⚠️ No subjects assigned. Contact your admin.</div>
              ) : (
                <div className="td2-select-wrap">
                  <ChevronDown size={14} className="td2-select-icon" />
                  <select
                    className="td2-select"
                    value={subject}
                    onChange={handleSubjectChange}
                    required
                  >
                    <option value="">— Select a subject —</option>
                    {assignedSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}
            </div>

            {/* Title */}
            <div className="td2-field">
              <label className="td2-label">Title *</label>
              <input
                type="text"
                className="td2-input"
                placeholder="e.g., Chapter 5 Notes"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />
            </div>

            {/* File */}
            <div className="td2-field">
              <label className="td2-label">File *</label>
              <div
                className={`td2-file-zone
                  ${verifyResult && !verifyResult.match && !isConfirmOnly ? 'su-file-zone-warn' : ''}
                  ${verifyResult && !verifyResult.match && isConfirmOnly  ? 'su-file-zone-info' : ''}
                  ${verifyResult?.match ? 'su-file-zone-ok' : ''}`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.md,.js,.py,.java,.html,.css,.ts,.jsx,.tsx"
                />
                {file ? (
                  <div className="td2-file-ready">
                    <Check size={18} /><span>{file.name}</span>
                  </div>
                ) : (
                  <>
                    <File size={28} className="td2-file-ico" />
                    <p className="td2-file-text">Click to browse or drag & drop</p>
                    <p className="td2-file-hint">PDF, DOC, PPT, TXT — any format</p>
                  </>
                )}
              </div>
            </div>

            {/* Verification Result */}
            {(verifying || verifyResult) && (
              <div className={`su-verify-box
                ${verifyResult?.match                                      ? 'su-verify-ok'       : ''}
                ${verifyResult && !verifyResult.match && !isConfirmOnly    ? 'su-verify-fail'     : ''}
                ${verifyResult && isConfirmOnly                            ? 'su-verify-info'     : ''}
                ${verifying                                                ? 'su-verify-checking' : ''}
              `}>

                {/* Checking spinner */}
                {verifying && (
                  <div className="su-verify-row">
                    <Loader size={16} className="su-spin" />
                    <span className="su-verify-text">
                      Checking if this file matches <strong>{subject}</strong>…
                    </span>
                  </div>
                )}

                {/* ✅ Match */}
                {verifyResult?.match && !verifying && (
                  <div className="su-verify-row">
                    <ShieldCheck size={18} style={{ color: '#059669' }} />
                    <div>
                      <p className="su-verify-title" style={{ color: '#059669' }}>
                        Content matches <strong>{subject}</strong>
                      </p>
                      <p className="su-verify-reason">{verifyResult.reason}</p>
                    </div>
                    <span className="su-conf-badge" style={{ background: '#d1fae5', color: '#065f46' }}>
                      {verifyResult.confidence} confidence
                    </span>
                  </div>
                )}

                {/* 📄 Binary file — needs manual confirmation (not a real mismatch) */}
                {verifyResult && !verifyResult.match && isConfirmOnly && !verifying && (
                  <div>
                    <div className="su-verify-row">
                      <FileQuestion size={18} style={{ color: '#6366f1' }} />
                      <div style={{ flex: 1 }}>
                        <p className="su-verify-title" style={{ color: '#6366f1' }}>
                          📄 PDF/DOC — manual confirmation required
                        </p>
                        <p className="su-verify-reason">{verifyResult.reason}</p>
                      </div>
                    </div>
                    <label className="su-override-label su-override-info">
                      <input
                        type="checkbox"
                        className="su-override-check"
                        checked={overrideWarn}
                        onChange={e => { setOverrideWarn(e.target.checked); setUploadError(''); }}
                      />
                      ✅ Yes, I confirm this file is about <strong>{subject}</strong>
                    </label>
                  </div>
                )}

                {/* ⚠️ Real mismatch */}
                {verifyResult && !verifyResult.match && !isConfirmOnly && !verifying && (
                  <div>
                    <div className="su-verify-row">
                      <ShieldAlert size={18} style={{ color: confidenceColor(verifyResult.confidence) }} />
                      <div style={{ flex: 1 }}>
                        <p className="su-verify-title" style={{ color: confidenceColor(verifyResult.confidence) }}>
                          ⚠️ Subject mismatch detected
                        </p>
                        <p className="su-verify-reason">
                          This file looks like <strong>{verifyResult.detectedSubject}</strong>,
                          not <strong>{subject}</strong>.
                        </p>
                        <p className="su-verify-reason">{verifyResult.reason}</p>
                      </div>
                      <span className="su-conf-badge" style={{ background: '#fef3c7', color: '#92400e' }}>
                        {verifyResult.confidence} confidence
                      </span>
                    </div>

                    <label className="su-override-label">
                      <input
                        type="checkbox"
                        className="su-override-check"
                        checked={overrideWarn}
                        onChange={e => { setOverrideWarn(e.target.checked); setUploadError(''); }}
                      />
                      I understand the warning — this file is correct for <strong>{subject}</strong>, upload anyway
                    </label>
                  </div>
                )}
              </div>
            )}

            <div className="td2-form-btns">
              <button type="button" className="td2-btn-cancel" onClick={onClose}>Cancel</button>
              <button
                type="submit"
                className="td2-btn-submit"
                disabled={uploading || verifying || assignedSubjects.length === 0 || isBlocked}
              >
                <Upload size={16} />
                {uploading ? 'Uploading…'                       :
                 verifying ? 'Checking…'                        :
                 isBlocked && isConfirmOnly ? 'Please confirm'  :
                 isBlocked ? 'Confirm warning first'            :
                             'Upload Material'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}