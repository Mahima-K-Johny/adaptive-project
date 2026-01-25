// routes/teacherRoutes.js
import express from 'express';
import Teacher from '../models/Teacher.js';
import Question from '../models/Question.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

/**
 * ADD TEACHER
 */
router.post('/add', async (req, res) => {
  const { name, subject, email, password, gender, dob, phoneNumber } = req.body;

  if (!name || !subject || !email || !password || !gender || !dob || !phoneNumber) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const existing = await Teacher.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Teacher with this email already exists' });

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    const teacher = await Teacher.create({
      name,
      subject,
      email,
      password: hashedPassword,
      gender,
      dob,
      phoneNumber
    });

    return res.status(201).json({
      message: 'Teacher added successfully',
      teacher: {
        _id: teacher._id,
        name: teacher.name,
        subject: teacher.subject,
        email: teacher.email,
        gender: teacher.gender,
        dob: teacher.dob,
        phoneNumber: teacher.phoneNumber,
        createdAt: teacher.createdAt,
        updatedAt: teacher.updatedAt
      }
    });

  } catch (err) {
    console.error('ADD TEACHER ERROR:', err);
    if (err.code === 11000) {
      return res.status(400).json({ message: `Teacher with this ${Object.keys(err.keyValue)[0]} already exists` });
    }
    return res.status(400).json({ message: err.message || 'MongoDB error' });
  }
});


/**
 * UPLOAD QUESTION
 */
router.post("/uploadQuestion", async (req,res) => {
  try{
    const { text, type, options, answer, difficulty, level } = req.body;

    const newQuestion = await Question.create({
      text,
      type,
      options: type === "MCQ" ? options : [], // save empty array for descriptive
      answer,
      difficulty, // -1 easy, 0 medium, 1 hard
      level
    });

    res.json({ message: "Question uploaded successfully", question: newQuestion });
  } catch(err) {
    console.error('UPLOAD QUESTION ERROR:', err);
    res.status(500).json({ message: "Server error" });
  }
});


export default router;
