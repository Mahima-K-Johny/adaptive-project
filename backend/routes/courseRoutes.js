//courseRoutes.js
import express from "express";
import Course from "../models/Course.js";

const router = express.Router();

// Add a course
router.post("/add", async (req, res) => {
  const { name, code } = req.body;

  if (!name || !code) return res.status(400).json({ message: "All fields required" });

  try {
    const existing = await Course.findOne({ code });
    if (existing) return res.status(400).json({ message: "Course code already exists" });

    const course = await Course.create({ name, code });
    res.status(201).json({ message: "Course added", course });
  } catch (err) {
    res.status(500).json({ message: "Failed to add course", error: err.message });
  }
});

// Fetch all courses
router.get("/all", async (req, res) => {
  try {
    const courses = await Course.find({});
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch courses", error: err.message });
  }
});

// Delete a course
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Course.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Course not found" });
    res.json({ message: "Course deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete", error: err.message });
  }
});

export default router;