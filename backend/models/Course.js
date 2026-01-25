// models/Course.js
import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true } // Changed from description to course code
}, { timestamps: true });

export default mongoose.model('Course', courseSchema);
