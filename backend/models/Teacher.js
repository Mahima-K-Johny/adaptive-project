// models/Teacher.js
import mongoose from 'mongoose';

const teacherSchema = new mongoose.Schema({
  name: { type: String, required: true },
  subject: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  gender: { type: String, required: true },
  dob: { type: String, required: true },        // ✅ STRING (important)
  phoneNumber: { type: String, required: true } // ✅ STRING (important)
}, { timestamps: true });

export default mongoose.model('Teacher', teacherSchema);
