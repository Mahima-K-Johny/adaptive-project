// models/Teacher.js
import mongoose from 'mongoose';

const teacherSchema = new mongoose.Schema({
  name:        { type: String,   required: true },
  subjects:    { type: [String], required: true },  // array of subjects
  email:       { type: String,   required: true, unique: true },
  password:    { type: String,   required: true },
  gender:      { type: String,   required: true },
  dob:         { type: String,   required: true },
  phoneNumber: { type: String,   required: true }
}, { timestamps: true });

export default mongoose.model('Teacher', teacherSchema);