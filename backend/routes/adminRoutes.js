// routes/adminRoutes.js
import express  from 'express';
import jwt      from 'jsonwebtoken';
import Admin    from '../models/Admin.js';
import Student  from '../models/Student.js';
import Teacher  from '../models/Teacher.js';
import Question from '../models/Question.js';

const router = express.Router();

// ── JWT secret — put this in your .env file as JWT_SECRET ────────────────────
const JWT_SECRET  = process.env.JWT_SECRET || 'your_super_secret_key_change_in_production';
const JWT_EXPIRES = '7d'; // token valid for 7 days

// ── Helper: sign a token ─────────────────────────────────────────────────────
const signToken = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });

// ── CREATE ADMIN (run once) ───────────────────────────────────────────────────
router.get('/create', async (req, res) => {
  await Admin.create({ email: 'admin@example.com', password: 'admin@123' });
  res.send('Admin created');
});

// ── LOGIN ─────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    // Admin (hardcoded check against DB)
    const admin = await Admin.findOne({ email, password });
    if (admin) {
      const token = signToken({ userId: 'admin', role: 'admin', email: admin.email });
      return res.json({ token, userId: 'admin', email: admin.email, role: 'admin' });
    }

    // Teacher
    const teacher = await Teacher.findOne({ email, password });
    if (teacher) {
      const payload = { userId: teacher._id.toString(), role: 'teacher', email: teacher.email };
      const token   = signToken(payload);
      return res.json({
        token,
        userId:      teacher._id.toString(),
        email:       teacher.email,
        role:        'teacher',
        name:        teacher.name || teacher.teacherName || '',
        teacherName: teacher.name || teacher.teacherName || '',
      });
    }

    // Student
    const student = await Student.findOne({ email, password });
    if (student) {
      const payload = { userId: student._id.toString(), role: 'student', email: student.email };
      const token   = signToken(payload);
      return res.json({
        token,
        userId: student._id.toString(),
        email:  student.email,
        role:   'student',
        name:   student.name || '',
      });
    }

    res.status(401).json({ message: 'Invalid credentials' });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── Student count ─────────────────────────────────────────────────────────────
router.get('/students/count', async (req, res) => {
  try {
    const count = await Student.countDocuments();
    res.json(count);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Teacher count ─────────────────────────────────────────────────────────────
router.get('/teachers/count', async (req, res) => {
  try {
    const count = await Teacher.countDocuments();
    res.json(count);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── QUESTION BANK ─────────────────────────────────────────────────────────────

router.get('/questions/subjects', async (req, res) => {
  try {
    const subjects = await Question.distinct('subject');
    res.json(subjects);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

router.get('/questions', async (req, res) => {
  try {
    const filter = {};
    if (req.query.subject) filter.subject = req.query.subject;
    const questions = await Question.find(filter).sort({ subject: 1, level: 1, type: 1 });
    res.json(questions);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

router.delete('/questions/:id', async (req, res) => {
  try {
    const deleted = await Question.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Question not found' });
    res.json({ message: 'Question deleted' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

export default router;