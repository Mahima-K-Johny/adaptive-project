// routes/loginRoutes.js
import express from 'express';
import bcrypt  from 'bcryptjs';
import jwt     from 'jsonwebtoken';
import Teacher from '../models/Teacher.js';
import Student from '../models/Student.js';

const router     = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'eduadapt_super_secret_jwt_key_2024';
const signToken  = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1️⃣ Admin (hardcoded)
    if (email === 'admin@example.com' && password === 'admin@123') {
      const token = signToken({ userId: 'admin', role: 'admin', email });
      return res.json({ message: 'Login successful', token, role: 'admin', userId: 'admin' });
    }

    // 2️⃣ Teacher
    let user = await Teacher.findOne({ email });
    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ message: 'Invalid password' });
      const token = signToken({ userId: user._id.toString(), role: 'teacher', email: user.email });
      return res.json({ message: 'Login successful', token, role: 'teacher', userId: user._id, email: user.email, name: user.name });
    }

    // 3️⃣ Student
    user = await Student.findOne({ email });
    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ message: 'Invalid password' });
      const token = signToken({ userId: user._id.toString(), role: 'student', email: user.email });
      return res.json({ message: 'Login successful', token, role: 'student', userId: user._id, email: user.email });
    }

    return res.status(404).json({ message: 'Email not found' });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── POST /api/auth/register ───────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Basic validation
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required.' });

    if (password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });

    // Check duplicate email across Student and Teacher
    const existingStudent = await Student.findOne({ email });
    const existingTeacher = await Teacher.findOne({ email });

    if (existingStudent || existingTeacher)
      return res.status(409).json({ message: 'This email is already registered.' });

    // Hash password — MUST use bcrypt so login's bcrypt.compare works
    const hashedPassword = await bcrypt.hash(password, 10);

    const newStudent = new Student({ email, password: hashedPassword });
    await newStudent.save();

    res.status(201).json({ message: 'Registration successful.' });

  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error during registration.' });
  }
});

export default router;