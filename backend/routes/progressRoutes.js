// routes/progressRoutes.js  –  add this to your Express app
// Mount with:  app.use('/api/exam', progressRouter);  (shares prefix with examRoutes)

import express from 'express';
import ExamSession from '../models/ExamSession.js';

const router = express.Router();

// ── GET /api/exam/progress/:studentId ──────────────────────────────────────
router.get('/progress/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;

    // Fetch ALL completed sessions for this student
    const sessions = await ExamSession.find({
      studentId: String(studentId),
      completed: true,
    }).lean().sort({ createdAt: 1 });

    if (!sessions.length) {
      return res.json({
        totalExams: 0, totalPassed: 0, totalFailed: 0,
        passRate: 0, currentStreak: 0, bestStreak: 0,
        totalStudyTime: 0, avgScore: 0, subjects: [], recentExams: [],
      });
    }

    // ── Per-session derived data ─────────────────────────────────────────
    const enriched = sessions.map(s => {
      const total    = s.questionsAttempted.length;
      const correct  = s.questionsAttempted.filter(q => q.correct).length;
      const score    = total > 0 ? Math.round((correct / total) * 100) : 0;
      const passed   = s.result === 'completed' || score >= 60;
      const levelMap = { 1: 'Easy', 2: 'Intermediate', 3: 'Difficult' };
      const level    = levelMap[s.currentLevel] || 'Easy';
      const durationMins = s.endTime && s.createdAt
        ? Math.round((new Date(s.endTime) - new Date(s.createdAt)) / 60000)
        : 15;
      return { ...s, score, passed, level, durationMins, date: s.createdAt };
    });

    // ── Aggregate totals ─────────────────────────────────────────────────
    const totalExams  = enriched.length;
    const totalPassed = enriched.filter(s => s.passed).length;
    const totalFailed = totalExams - totalPassed;
    const passRate    = Math.round((totalPassed / totalExams) * 100);
    const avgScore    = Math.round(enriched.reduce((a, s) => a + s.score, 0) / totalExams);
    const totalStudyTime = enriched.reduce((a, s) => a + s.durationMins, 0);

    // ── Streak calculation ───────────────────────────────────────────────
    const examDates = [...new Set(enriched
      .filter(s => s.passed)
      .map(s => new Date(s.date).toDateString())
    )].sort((a, b) => new Date(b) - new Date(a));

    let currentStreak = 0, bestStreak = 0, streak = 0;
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 864e5).toDateString();
    if (examDates[0] === today || examDates[0] === yesterday) {
      for (let i = 0; i < examDates.length; i++) {
        const diff = Math.round((new Date(examDates[0]) - new Date(examDates[i])) / 864e5);
        if (diff === i) { streak++; currentStreak = i === 0 ? streak : currentStreak; }
        else break;
      }
    }
    for (let i = 0; i < examDates.length; i++) {
      if (i === 0 || Math.round((new Date(examDates[i-1]) - new Date(examDates[i])) / 864e5) === 1) {
        streak++;
      } else { bestStreak = Math.max(bestStreak, streak); streak = 1; }
    }
    bestStreak = Math.max(bestStreak, streak, currentStreak);

    // ── Per-subject breakdown ────────────────────────────────────────────
    const subjectMap = {};
    for (const s of enriched) {
      const name = s.subject;
      if (!subjectMap[name]) {
        subjectMap[name] = {
          name, totalAttempts: 0, passed: 0, failed: 0,
          scores: [], levelsPassed: new Set(), highestLevelNum: 0,
          history: [],
        };
      }
      const sm = subjectMap[name];
      sm.totalAttempts++;
      sm.scores.push(s.score);
      sm.history.push({ label: `A${sm.totalAttempts}`, score: s.score });
      if (s.passed) {
        sm.passed++;
        // Track highest level reached
        if (s.currentLevel > sm.highestLevelNum) sm.highestLevelNum = s.currentLevel;
        // Levels 1,2,3 map to Easy/Intermediate/Difficult
        const lvlMap = { 1:'Easy', 2:'Intermediate', 3:'Difficult' };
        for (let l = 1; l <= s.currentLevel; l++) {
          if (lvlMap[l]) sm.levelsPassed.add(lvlMap[l]);
        }
      } else { sm.failed++; }
    }

    const LEVEL_NAMES = { 1:'Easy', 2:'Intermediate', 3:'Difficult' };
    const subjects = Object.values(subjectMap).map(sm => {
      const avgSubScore = Math.round(sm.scores.reduce((a,v) => a+v, 0) / sm.scores.length);
      const recentScore = sm.scores[sm.scores.length - 1];
      const prevScore   = sm.scores.length > 1 ? sm.scores[sm.scores.length - 2] : recentScore;
      const improvement = recentScore - prevScore;
      return {
        name:         sm.name,
        totalAttempts: sm.totalAttempts,
        passed:       sm.passed,
        failed:       sm.failed,
        passRate:     Math.round((sm.passed / sm.totalAttempts) * 100),
        avgScore:     avgSubScore,
        recentScore,
        improvement,
        highestLevel: LEVEL_NAMES[sm.highestLevelNum] || 'Easy',
        levelsPassed: [...sm.levelsPassed],
        history:      sm.history,
      };
    });

    // ── Recent 5 exams ───────────────────────────────────────────────────
    const recentExams = enriched.slice(-5).reverse().map(s => ({
      subject: s.subject,
      level:   s.level,
      score:   s.score,
      passed:  s.passed,
      date:    s.date,
    }));

    res.json({
      totalExams, totalPassed, totalFailed, passRate,
      currentStreak, bestStreak, totalStudyTime, avgScore,
      subjects, recentExams,
    });

  } catch (err) {
    console.error('progress route error:', err);
    res.status(500).json({ message: 'Server error fetching progress' });
  }
});

export default router;