// routes/examRoutes.js
import express from 'express';
import ExamSession from '../models/ExamSession.js';
import Question    from '../models/Question.js';

const router = express.Router();
// Count all exam sessions
router.get('/count', async (req, res) => {
  try {
    const total = await ExamSession.countDocuments({});
    res.json({ totalAttended: total });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});
const LEVEL_CONFIG = {
  1: { total: 10, mcq: 8,  desc: 2, label: 'Easy',         passMark: 60 },
  2: { total: 15, mcq: 10, desc: 5, label: 'Intermediate',  passMark: 60 },
  3: { total: 10, mcq: 6,  desc: 4, label: 'Difficult',     passMark: 60 },
};

function getDifficultyConfig(level, failCount) {
  const base  = LEVEL_CONFIG[level];
  const total = base.total;
  const shift = Math.min(failCount, Math.floor(total / 2)) * 2;
  const mcq   = Math.max(0, base.mcq  - shift);
  const desc  = Math.min(total, base.desc + shift);
  return { ...base, mcq, desc };
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Grades a descriptive answer against one or more keywords.
 *
 * `question.answer` may be:
 *   - a plain string:  "photosynthesis"          → treated as 1 keyword
 *   - a comma list:    "photosynthesis,chlorophyll,sunlight"
 *   - already an array (future-proof)
 *
 * Scoring:
 *   - All keywords required  → student must include EVERY keyword  (matchAll mode)
 *   - Default (any keyword)  → student must include AT LEAST ONE keyword (matchAny mode)
 *
 * The question document may carry a `keywordMode` field: 'any' | 'all'  (default 'any').
 */
function gradeDescriptive(question, studentAnswer) {
  const raw = studentAnswer?.trim().toLowerCase() ?? '';

  // Normalise keywords
  let keywords = [];
  if (Array.isArray(question.answer)) {
    keywords = question.answer.map(k => k.trim().toLowerCase()).filter(Boolean);
  } else {
    keywords = String(question.answer)
      .split(',')
      .map(k => k.trim().toLowerCase())
      .filter(Boolean);
  }

  if (keywords.length === 0) return false;

  const mode = question.keywordMode === 'all' ? 'all' : 'any';

  if (mode === 'all') {
    // Student must mention every keyword
    return keywords.every(kw => raw.includes(kw));
  } else {
    // Student must mention at least one keyword
    return keywords.some(kw => raw.includes(kw));
  }
}

async function fetchBatch(level, subject, config) {
  const needed = config.total;
  const allMCQ  = await Question.find({ level, subject, type: 'MCQ' }).lean();
  const allDesc = await Question.find({ level, subject, type: 'Descriptive' }).lean();
  const mcqPool  = shuffle(allMCQ);
  const descPool = shuffle(allDesc);
  let picked = [
    ...mcqPool.slice(0, config.mcq),
    ...descPool.slice(0, config.desc),
  ];
  if (picked.length < needed) {
    const pickedIds = new Set(picked.map(q => q._id.toString()));
    const extras = shuffle([
      ...mcqPool.filter(q => !pickedIds.has(q._id.toString())),
      ...descPool.filter(q => !pickedIds.has(q._id.toString())),
    ]);
    for (const q of extras) {
      if (picked.length >= needed) break;
      picked.push(q);
    }
  }
  return shuffle(picked).slice(0, needed);
}

// ✅ FIXED getFailCount — case-insensitive subject match + string studentId
async function getFailCount(studentId, subject, level) {
  const count = await ExamSession.countDocuments({
    studentId:    String(studentId),
    subject:      subject,       // ✅ plain string match - no regex
    completed:    true,
    currentLevel: level,
  });
  console.log(`🔍 getFailCount("${subject}", level ${level}) = ${count}`);
  return count;
}

// ── POST /api/exam/startExam ──────────────────────────────────────────────
router.post('/startExam', async (req, res) => {
  try {
    const { studentId, subject } = req.body;

    // ✅ DEBUG
    console.log('='.repeat(50));
    console.log('📥 startExam called');
    console.log('   studentId:', studentId, '| type:', typeof studentId);
    console.log('   subject:', subject);

    if (!studentId || !subject)
      return res.status(400).json({ message: 'studentId and subject are required' });

    // ✅ DEBUG — show ALL sessions before closing
    const beforeSessions = await ExamSession.find({ studentId: String(studentId) }).lean();
    console.log(`📋 Sessions in DB for studentId="${studentId}" (${beforeSessions.length} total):`);
    beforeSessions.forEach((s, i) => {
      console.log(`   [${i+1}] subject="${s.subject}" level=${s.currentLevel} completed=${s.completed}`);
    });

    // Close open sessions
    await ExamSession.updateMany(
      { studentId: String(studentId), completed: false },
      { completed: true, endTime: new Date() }
    );

    // ✅ Count fails AFTER closing open sessions
    const failCount = await getFailCount(String(studentId), subject, 1);
    const config    = getDifficultyConfig(1, failCount);

    console.log(`📊 Level 1 | subject="${subject}" | failCount=${failCount} | MCQ=${config.mcq} Desc=${config.desc}`);
    console.log('='.repeat(50));

    const session = await ExamSession.create({
      studentId: String(studentId),  // ✅ always save as string
      subject,
      ability: 0, currentLevel: 1, questionsAttempted: [],
    });

    const questions = await fetchBatch(1, subject, config);

    if (questions.length === 0)
      return res.status(404).json({
        message: `No questions found for "${subject}" at Level 1.`,
      });

    res.json({
      examSessionId:  session._id,
      subject,
      level:          1,
      levelLabel:     'Easy',
      totalQuestions: questions.length,
      passMark:       config.passMark,
      questions,
      failCount,
      difficultyNote: failCount > 0
        ? `Attempt ${failCount + 1}: ${config.desc} descriptive questions (harder)`
        : null,
    });
  } catch (err) {
    console.error('startExam error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── POST /api/exam/submitAnswers ──────────────────────────────────────────
router.post('/submitAnswers', async (req, res) => {
  try {
    const { examSessionId, answers } = req.body;

    const session = await ExamSession.findById(examSessionId);
    if (!session)          return res.status(404).json({ message: 'Exam session not found' });
    if (session.completed) return res.status(400).json({ message: 'Exam already completed' });
    if (!answers || answers.length === 0)
      return res.status(400).json({ message: 'No answers received.' });

    const currentLevel = session.currentLevel;
    const config       = LEVEL_CONFIG[currentLevel];
    let   correctCount = 0;
    const reviewData   = [];

    for (const ans of answers) {
      const question = await Question.findById(ans.questionId);
      if (!question) continue;

      // ── Grading ────────────────────────────────────────────────────────
      const correct = question.type === 'MCQ'
        ? question.answer.trim() === ans.answer.trim()
        : gradeDescriptive(question, ans.answer);   // ✅ multi-keyword grading

      if (correct) correctCount++;
      session.ability += correct ? 0.3 : -0.2;
      session.questionsAttempted.push({
        questionId: ans.questionId,
        answer:     ans.answer,
        correct,
        thetaAfter: parseFloat(session.ability.toFixed(3)),
      });

      reviewData.push({
        questionId: question._id,
        text: question.text,
        type: question.type,
        options: question.options,
        studentAnswer: ans.answer,
        correctAnswer: question.answer,
        isCorrect: correct
      });
    }

    const scorePercent = Math.round((correctCount / answers.length) * 100);
    const passed       = scorePercent >= config.passMark;
    const nextLevel    = currentLevel + 1;
    const hasNextLevel = LEVEL_CONFIG[nextLevel] !== undefined;

    if (passed && hasNextLevel) {
      session.currentLevel = nextLevel;
      await session.save();

      const subject = session.subject || req.body.subject;
      const nextFailCount = await getFailCount(String(session.studentId), subject, nextLevel);
      const nextConfig    = getDifficultyConfig(nextLevel, nextFailCount);
      const nextQuestions = await fetchBatch(nextLevel, subject, nextConfig);

      return res.json({
        result:         'level_up',
        completedLevel: currentLevel,
        completedLabel: config.label,
        score:          scorePercent,
        correctCount,
        totalAnswered:  answers.length,
        nextLevel,
        nextLevelLabel: nextConfig.label,
        totalQuestions: nextQuestions.length,
        passMark:       nextConfig.passMark,
        questions:      nextQuestions,
        review:         reviewData,
        examSessionId:  session._id,
        subject,
        currentAbility: parseFloat(session.ability.toFixed(3)),
        failCount:      nextFailCount,
        difficultyNote: nextFailCount > 0
          ? `Attempt ${nextFailCount + 1}: ${nextConfig.desc} descriptive questions`
          : null,
      });
    }

    // ── Exam ends ─────────────────────────────────────────────────────────
    session.completed = true;
    session.endTime   = new Date();
    await session.save();

    // ✅ DEBUG — confirm what was saved
    console.log('💾 Failed session saved:', {
      studentId:    session.studentId,
      subject:      session.subject,
      currentLevel: session.currentLevel,
      completed:    session.completed,
    });

    const totalCorrect   = session.questionsAttempted.filter(q => q.correct).length;
    const totalAttempted = session.questionsAttempted.length;
    const overallScore   = totalAttempted > 0
      ? Math.round((totalCorrect / totalAttempted) * 100) : 0;

    return res.json({
      result:         passed ? 'completed' : 'failed',
      completedLevel: currentLevel,
      completedLabel: config.label,
      score:          scorePercent,
      correctCount,
      totalAnswered:  answers.length,
      review:         reviewData,
      finalAbility:   parseFloat(session.ability.toFixed(3)),
      overallScore,
      totalCorrect,
      totalAttempted,
      message: passed
        ? '🎉 Congratulations! You cleared all levels!'
        : `❌ Score ${scorePercent}% — below ${config.passMark}% pass mark. Exam ended.`,
    });

  } catch (err) {
    console.error('submitAnswers error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── POST /api/exam/endExam ────────────────────────────────────────────────
router.post('/endExam', async (req, res) => {
  try {
    const { examSessionId } = req.body;
    const session = await ExamSession.findById(examSessionId);
    if (!session) return res.status(404).json({ message: 'Not found' });
    session.completed = true;
    session.endTime   = new Date();
    await session.save();
    res.json({ message: 'Exam ended', finalAbility: session.ability });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});
// ── GET /api/exam/progress/:studentId ────────────────────────────────────
router.get('/progress/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;

    const sessions = await ExamSession.find({
      studentId: String(studentId),
      completed: true,
    }).sort({ startTime: -1 }).lean();

    if (sessions.length === 0) {
      return res.json({
        totalExams: 0, totalPassed: 0, totalFailed: 0,
        passRate: 0, avgScore: 0, currentStreak: 0, bestStreak: 0,
        totalStudyTime: 0, subjects: [], recentExams: [],
      });
    }

    // ── Per-subject stats ─────────────────────────────────────────────────
    const subjectMap = {};

    for (const session of sessions) {
      const subj    = session.subject || 'Unknown';
      const total   = session.questionsAttempted.length;
      const correct = session.questionsAttempted.filter(q => q.correct).length;
      const score   = total > 0 ? Math.round((correct / total) * 100) : 0;

      // Determine highest level reached label
      const levelLabel = { 1: 'Easy', 2: 'Intermediate', 3: 'Difficult' };
      const level = levelLabel[session.currentLevel] || 'Easy';

      // A session "passed" if it completed level 3 OR advanced past current level
      // We treat it simply: if score >= 60 on final level = passed
      const passed = score >= 60;

      if (!subjectMap[subj]) {
        subjectMap[subj] = {
          name: subj, totalAttempts: 0, passed: 0, failed: 0,
          scores: [], levelsPassed: [], highestLevel: 'Easy',
          recentScore: 0, history: [],
        };
      }

      const s = subjectMap[subj];
      s.totalAttempts++;
      if (passed) { s.passed++; s.levelsPassed = [...new Set([...s.levelsPassed, level])]; }
      else s.failed++;
      s.scores.push(score);
      s.recentScore = score; // last one (sorted desc)
      s.history.push({
        score,
        label: new Date(session.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      });
    }

    // ── Build subjects array ──────────────────────────────────────────────
    const LEVEL_ORDER = ['Easy', 'Intermediate', 'Difficult'];
    const subjects = Object.values(subjectMap).map(s => {
      const avgScore  = Math.round(s.scores.reduce((a, b) => a + b, 0) / s.scores.length);
      const passRate  = Math.round((s.passed / s.totalAttempts) * 100);
      const highestLevel = s.levelsPassed.sort((a, b) =>
        LEVEL_ORDER.indexOf(b) - LEVEL_ORDER.indexOf(a))[0] || 'Easy';

      // Improvement: compare first half avg vs second half avg
      const half = Math.floor(s.scores.length / 2);
      const firstHalf  = s.scores.slice(0, half || 1);
      const secondHalf = s.scores.slice(half);
      const improvement = Math.max(0, Math.round(
        secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length -
        firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
      ));

      return {
        name: s.name, totalAttempts: s.totalAttempts,
        passed: s.passed, failed: s.failed,
        avgScore, passRate, highestLevel,
        levelsPassed: s.levelsPassed,
        recentScore: s.recentScore,
        improvement,
        history: s.history.slice(-7), // last 7 for chart
      };
    });

    // ── Overall stats ─────────────────────────────────────────────────────
    const allScores   = sessions.map(s => {
      const total   = s.questionsAttempted.length;
      const correct = s.questionsAttempted.filter(q => q.correct).length;
      return total > 0 ? Math.round((correct / total) * 100) : 0;
    });

    const totalExams  = sessions.length;
    const totalPassed = sessions.filter(s => {
      const total   = s.questionsAttempted.length;
      const correct = s.questionsAttempted.filter(q => q.correct).length;
      return total > 0 && Math.round((correct / total) * 100) >= 60;
    }).length;
    const totalFailed    = totalExams - totalPassed;
    const passRate       = Math.round((totalPassed / totalExams) * 100);
    const avgScore       = Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length);
    const totalStudyTime = sessions.reduce((acc, s) => {
      if (s.endTime && s.startTime)
        return acc + Math.round((new Date(s.endTime) - new Date(s.startTime)) / 60000);
      return acc;
    }, 0);

    // ── Streak calculation ────────────────────────────────────────────────
    const examDates = [...new Set(
      sessions.map(s => new Date(s.startTime).toDateString())
    )].map(d => new Date(d)).sort((a, b) => b - a);

    let currentStreak = 0, bestStreak = 0, streak = 0;
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    if (examDates.length > 0) {
      if (examDates[0].toDateString() === today ||
          examDates[0].toDateString() === yesterday) {
        streak = 1;
        for (let i = 1; i < examDates.length; i++) {
          const diff = (examDates[i-1] - examDates[i]) / 86400000;
          if (diff === 1) { streak++; } else break;
        }
      }
      currentStreak = streak;
      // Best streak
      let tempStreak = 1;
      for (let i = 1; i < examDates.length; i++) {
        const diff = (examDates[i-1] - examDates[i]) / 86400000;
        if (diff === 1) { tempStreak++; bestStreak = Math.max(bestStreak, tempStreak); }
        else tempStreak = 1;
      }
      bestStreak = Math.max(bestStreak, currentStreak);
    }

    // ── Recent exams (last 10) ────────────────────────────────────────────
    const recentExams = sessions.slice(0, 10).map(s => {
      const total   = s.questionsAttempted.length;
      const correct = s.questionsAttempted.filter(q => q.correct).length;
      const score   = total > 0 ? Math.round((correct / total) * 100) : 0;
      return {
        subject: s.subject || 'Unknown',
        level:   { 1: 'Easy', 2: 'Intermediate', 3: 'Difficult' }[s.currentLevel] || 'Easy',
        score,
        passed:  score >= 60,
        date:    s.startTime,
      };
    });

    res.json({
      totalExams, totalPassed, totalFailed,
      passRate, avgScore, currentStreak, bestStreak,
      totalStudyTime, subjects, recentExams,
    });

  } catch (err) {
    console.error('progress error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ADD THIS ROUTE to your examRoutes.js  (paste before `export default router`)
//
// GET /api/exam/teacher-stats/:teacherId
//
// Returns aggregated stats from ExamSession for all subjects that appear in
// ExamSession documents where the subject is in the teacher's assigned list.
//
// If you don't have a "teacher owns subjects" link in the DB yet, it simply
// returns stats for ALL subjects in ExamSession.
// ─────────────────────────────────────────────────────────────────────────────

router.get('/teacher-stats/:teacherId', async (req, res) => {
  try {
    const { teacherId } = req.params;

    // Optional: fetch teacher's assigned subjects from your materials endpoint
    // For now we aggregate across all subjects present in completed ExamSessions.
    // To scope by teacher, you can filter: { subject: { $in: assignedSubjects } }

    const sessions = await ExamSession.find({ completed: true }).lean();

    if (!sessions.length) {
      return res.json({
        bySubject: [], passFailPie: [], levelPie: [], trend: [],
        histogram: [], radar: [],
        totalAttended: 0, totalPassed: 0, totalFailed: 0,
      });
    }

    // ── Per-subject aggregation ───────────────────────────────────────────
    const subjectMap = {};

    for (const s of sessions) {
      const subj    = s.subject || 'Unknown';
      const total   = s.questionsAttempted.length;
      const correct = s.questionsAttempted.filter(q => q.correct).length;
      const score   = total > 0 ? Math.round((correct / total) * 100) : 0;
      const passed  = score >= 60;

      // Level breakdown: count questions attempted per difficulty
      // We use currentLevel as a proxy — level 1 = Easy, 2 = Intermediate, 3 = Difficult
      const level = s.currentLevel || 1;

      if (!subjectMap[subj]) {
        subjectMap[subj] = {
          subject: subj,
          attended: 0, passed: 0, failed: 0,
          easy: 0, intermediate: 0, difficult: 0,
          scores: [],
          // For monthly trend
          byMonth: {},
        };
      }

      const m = subjectMap[subj];
      m.attended++;
      if (passed) m.passed++; else m.failed++;
      m.scores.push(score);

      // Accumulate level counts by number of questions in that session
      if (level === 1) m.easy         += total;
      else if (level === 2) m.intermediate += total;
      else if (level === 3) m.difficult    += total;

      // Monthly bucket
      const monthKey = new Date(s.startTime).toLocaleString('en-US', { month: 'short', year: '2-digit' });
      if (!m.byMonth[monthKey]) m.byMonth[monthKey] = { attended: 0, passed: 0 };
      m.byMonth[monthKey].attended++;
      if (passed) m.byMonth[monthKey].passed++;
    }

    const bySubject = Object.values(subjectMap).map(m => ({
      subject: m.subject,
      attended: m.attended,
      passed: m.passed,
      failed: m.failed,
      easy: m.easy,
      intermediate: m.intermediate,
      difficult: m.difficult,
      avg: m.scores.length ? Math.round(m.scores.reduce((a, b) => a + b, 0) / m.scores.length) : 0,
    }));

    // ── Totals ────────────────────────────────────────────────────────────
    const totalAttended = bySubject.reduce((a, b) => a + b.attended, 0);
    const totalPassed   = bySubject.reduce((a, b) => a + b.passed, 0);
    const totalFailed   = totalAttended - totalPassed;

    // ── Pie charts ────────────────────────────────────────────────────────
    const passFailPie = [
      { name: 'Passed', value: totalPassed },
      { name: 'Failed', value: totalFailed },
    ];
    const levelPie = [
      { name: 'Easy',         value: bySubject.reduce((a, b) => a + b.easy, 0) },
      { name: 'Intermediate', value: bySubject.reduce((a, b) => a + b.intermediate, 0) },
      { name: 'Difficult',    value: bySubject.reduce((a, b) => a + b.difficult, 0) },
    ];

    // ── 6-month trend (last 6 calendar months) ────────────────────────────
    const monthOrder = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      monthOrder.push(d.toLocaleString('en-US', { month: 'short' }));
    }

    const trendMap = {};
    for (const s of sessions) {
      const month    = new Date(s.startTime).toLocaleString('en-US', { month: 'short' });
      const total    = s.questionsAttempted.length;
      const correct  = s.questionsAttempted.filter(q => q.correct).length;
      const score    = total > 0 ? Math.round((correct / total) * 100) : 0;
      const passed   = score >= 60;
      if (!trendMap[month]) trendMap[month] = { attended: 0, passed: 0 };
      trendMap[month].attended++;
      if (passed) trendMap[month].passed++;
    }
    const trend = monthOrder.map(month => {
      const d = trendMap[month];
      return {
        month,
        attendance: d ? Math.round((d.attended / Math.max(...Object.values(trendMap).map(x => x.attended), 1)) * 100) : 0,
        passRate:   d && d.attended > 0 ? Math.round((d.passed / d.attended) * 100) : 0,
      };
    });

    // ── Score histogram ───────────────────────────────────────────────────
    const buckets = Array.from({ length: 10 }, (_, i) => ({
      range: `${i * 10}–${i * 10 + 9}`,
      students: 0,
    }));
    for (const s of sessions) {
      const total   = s.questionsAttempted.length;
      const correct = s.questionsAttempted.filter(q => q.correct).length;
      const score   = total > 0 ? Math.round((correct / total) * 100) : 0;
      const bucket  = Math.min(9, Math.floor(score / 10));
      buckets[bucket].students++;
    }
    const histogram = buckets;

    // ── Radar (per subject, per level avg score) ──────────────────────────
    const radar = bySubject.map(s => ({
      subject:      s.subject.length > 9 ? s.subject.slice(0, 9) : s.subject,
      Easy:         s.attended > 0 ? Math.round((s.easy / (s.easy + s.intermediate + s.difficult || 1)) * 100) : 0,
      Intermediate: s.attended > 0 ? Math.round((s.intermediate / (s.easy + s.intermediate + s.difficult || 1)) * 100) : 0,
      Difficult:    s.attended > 0 ? Math.round((s.difficult / (s.easy + s.intermediate + s.difficult || 1)) * 100) : 0,
    }));

    res.json({
      bySubject, passFailPie, levelPie, trend, histogram, radar,
      totalAttended, totalPassed, totalFailed,
    });

  } catch (err) {
    console.error('teacher-stats error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});
export default router;