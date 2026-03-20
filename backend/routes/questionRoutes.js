// routes/questionRoutes.js — with subject support
import express from 'express';
import Question from '../models/Question.js';

const router = express.Router();

// ── GET all distinct subjects that have questions ─────────────────────────────
// Used by StudentExam to populate subject selector
router.get('/subjects', async (req, res) => {
  try {
    const subjects = await Question.distinct('subject');
    res.json({ subjects: subjects.sort() });
  } catch (err) {
    console.error('FETCH SUBJECTS ERROR:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── GET all questions for a specific subject ──────────────────────────────────
router.get('/by-subject/:subject', async (req, res) => {
  try {
    const questions = await Question.find({ subject: req.params.subject })
      .sort({ level: 1, type: 1 });
    res.json(questions);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── GET question counts per level for a subject ───────────────────────────────
router.get('/counts/:subject', async (req, res) => {
  try {
    const counts = await Question.aggregate([
      { $match: { subject: req.params.subject } },
      { $group: { _id: { level: '$level', type: '$type' }, count: { $sum: 1 } } }
    ]);
    res.json(counts);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── POST create question ──────────────────────────────────────────────────────
router.post('/create', async (req, res) => {
  try {
    const { subject, text, type, options, answer, difficulty, level } = req.body;

    if (!subject || !text || !type || !answer || difficulty === undefined || !level) {
      return res.status(400).json({ message: 'All fields including subject are required.' });
    }
    if (type === 'MCQ' && (!options || options.length < 2)) {
      return res.status(400).json({ message: 'MCQ must have at least 2 options.' });
    }
    if (type === 'MCQ' && !options.includes(answer)) {
      return res.status(400).json({ message: 'Answer must be one of the MCQ options.' });
    }
    if (type === 'MAQ') {
      if (!options || options.length < 2) return res.status(400).json({ message: 'MAQ must have at least 2 options.' });
      if (!Array.isArray(answer) || answer.length === 0) return res.status(400).json({ message: 'MAQ answer must be an array of selected options.' });
      if (!answer.every(ans => options.includes(ans))) return res.status(400).json({ message: 'All MAQ answers must be valid options.' });
    }

    const question = await Question.create({ subject, text, type, options, answer, difficulty, level });
    res.status(201).json({ message: 'Question created successfully', question });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── DELETE question ───────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Question.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Question not found' });
    res.json({ message: 'Question deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── PUT update question ───────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const { subject, text, type, options, answer, keywordMode, difficulty, level } = req.body;

    if (!subject || !text || !type || !answer || difficulty === undefined || !level) {
      return res.status(400).json({ message: 'All fields including subject are required.' });
    }
    if (type === 'MCQ' && (!options || options.length < 2)) {
      return res.status(400).json({ message: 'MCQ must have at least 2 options.' });
    }
    if (type === 'MCQ' && !options.includes(answer)) {
      return res.status(400).json({ message: 'Answer must be one of the MCQ options.' });
    }
    if (type === 'MAQ') {
      if (!options || options.length < 2) return res.status(400).json({ message: 'MAQ must have at least 2 options.' });
      if (!Array.isArray(answer) || answer.length === 0) return res.status(400).json({ message: 'MAQ answer must be an array of selected options.' });
      if (!answer.every(ans => options.includes(ans))) return res.status(400).json({ message: 'All MAQ answers must be valid options.' });
    }

    const updatedQuestion = await Question.findByIdAndUpdate(
      req.params.id,
      { subject, text, type, options, answer, keywordMode, difficulty, level },
      { new: true }
    );

    if (!updatedQuestion) {
      return res.status(404).json({ message: 'Question not found' });
    }

    res.json({ message: 'Question updated successfully', question: updatedQuestion });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;