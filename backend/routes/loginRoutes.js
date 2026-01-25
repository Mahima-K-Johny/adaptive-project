import express from 'express';
import bcrypt from 'bcryptjs';
import Teacher from '../models/Teacher.js';
import Student from '../models/Student.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1️⃣ Check if Admin (hardcoded)
    if (email === 'admin@example.com' && password === 'admin@123') {
      return res.json({ message: 'Login successful', role: 'admin', userId: 'admin' });
    }

    // 2️⃣ Check Teacher
    let user = await Teacher.findOne({ email });
    if (user) {
      // Compare hashed password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ message: 'Invalid password' });
      return res.json({ message: 'Login successful', role: 'teacher', userId: user._id });
    }

    // 3️⃣ Check Student
    user = await Student.findOne({ email });
    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ message: 'Invalid password' });
      return res.json({ message: 'Login successful', role: 'student', userId: user._id });
    }

    // 4️⃣ If not found
    return res.status(404).json({ message: 'Email not found' });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
