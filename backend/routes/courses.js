//ccourses.js
import express from 'express';
import Course from '../models/Course.js';

const router = express.Router();

// Add a new course
router.post('/add', async (req, res) => {
  const { name, code } = req.body;
  try {
    const course = new Course({ name, code });
    await course.save();
    res.status(200).json({ message: 'Course added successfully', course });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to add course', error: err.message });
  }
});

// Get all courses
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch courses', error: err.message });
  }
});

export default router;
