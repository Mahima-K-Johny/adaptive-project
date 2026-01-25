//adminRoutes.js

import express from 'express';
import Admin from '../models/Admin.js';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';

const router = express.Router();

// CREATE ADMIN (run once)
router.get('/create', async (req, res) => {
  await Admin.create({
    email: 'admin@example.com',
    password: 'admin@123'
  });
  res.send('Admin created');
});

// LOGIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check admin
    const admin = await Admin.findOne({ email, password });
    if (admin) {
      return res.json({ userId: 'admin', email: admin.email, role: 'admin' });
    }

    // Check teacher
    const teacher = await Teacher.findOne({ email, password });
    if (teacher) {
      return res.json({ userId: teacher._id.toString(), email: teacher.email, role: 'teacher' });
    }

    // Check student
    const student = await Student.findOne({ email, password });
    if (student) {
      return res.json({ userId: student._id.toString(), email: student.email, role: 'student' });
    }

    // No match
    res.status(401).json({ message: 'Invalid credentials' });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


router.get('/students/count', async (req, res) => {
  try {
    const count = await Student.countDocuments();
    res.json(count);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET teacher count
router.get('/teachers/count', async (req, res) => {
  try {
    const count = await Teacher.countDocuments();
    res.json(count); // returns number of teachers
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
