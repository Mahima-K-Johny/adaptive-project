// routes/teacherRoutes.js
import express from 'express';
import Teacher from '../models/Teacher.js';
import Question from '../models/Question.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// ─── TEST ─────────────────────────────────────────────────────────────────────
router.get('/test', (req, res) => {
  res.json({ message: 'Teacher route working ✅' });
});

// ─── ADD TEACHER ──────────────────────────────────────────────────────────────
router.post('/add', async (req, res) => {
  console.log('📥 BODY:', req.body);

  const { name, email, password, gender, dob, phoneNumber, subjects } = req.body;

  const missing = [];
  if (!name)        missing.push('name');
  if (!email)       missing.push('email');
  if (!password)    missing.push('password');
  if (!gender)      missing.push('gender');
  if (!dob)         missing.push('dob');
  if (!phoneNumber) missing.push('phoneNumber');

  if (missing.length > 0) {
    return res.status(400).json({ message: `Missing: ${missing.join(', ')}` });
  }

  // Accept subjects as array or comma string
  let rawSubjects = subjects;
  if (typeof rawSubjects === 'string') {
    rawSubjects = rawSubjects.split(',').map(s => s.trim()).filter(Boolean);
  }
  if (!Array.isArray(rawSubjects) || rawSubjects.length === 0) {
    return res.status(400).json({ message: 'Please select at least one subject.' });
  }

  const cleanSubjects = [...new Set(rawSubjects.map(s => s.trim()).filter(Boolean))];

  try {
    const existing = await Teacher.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'A teacher with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const teacher = await Teacher.create({
      name, email, password: hashedPassword,
      gender, dob, phoneNumber,
      subjects: cleanSubjects
    });

    return res.status(201).json({
      message: 'Teacher added successfully',
      teacher: {
        _id:         teacher._id,
        name:        teacher.name,
        subjects:    teacher.subjects,
        email:       teacher.email,
        gender:      teacher.gender,
        dob:         teacher.dob,
        phoneNumber: teacher.phoneNumber,
      }
    });

  } catch (err) {
    console.error('❌ ERROR:', err);
    if (err.code === 11000) {
      return res.status(400).json({
        message: `A teacher with this ${Object.keys(err.keyValue)[0]} already exists.`
      });
    }
    return res.status(500).json({ message: err.message || 'Server error' });
  }
});

// ─── UPLOAD QUESTION ─────────────────────────────────────────────────────────
router.post('/uploadQuestion', async (req, res) => {
  try {
    const { text, type, options, answer, difficulty, level } = req.body;
    const newQuestion = await Question.create({
      text, type,
      options: type === 'MCQ' ? options : [],
      answer, difficulty, level
    });
    res.json({ message: 'Question uploaded successfully', question: newQuestion });
  } catch (err) {
    console.error('UPLOAD QUESTION ERROR:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;