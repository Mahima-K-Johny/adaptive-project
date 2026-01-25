//authRoutes.js
import express from 'express';
import bcrypt from 'bcryptjs';
import Student from '../models/Student.js';

const router = express.Router();

// ✅ STUDENT REGISTER
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  try {
    const existingStudent = await Student.findOne({ email });
    if (existingStudent) {
      return res.status(400).json({ message: 'Student already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const student = new Student({
      email,
      password: hashedPassword
    });

    await student.save();

    res.status(201).json({ message: 'Registration successful' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ STUDENT LOGIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const student = await Student.findOne({ email });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    res.json({ message: 'Login successful', studentId: student._id });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
