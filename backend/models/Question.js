// models/Question.js — updated with subject field
import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  subject:    { type: String, required: true },              // e.g. "React", "SQL"
  text:       { type: String, required: true },
  type:       { type: String, enum: ['MCQ', 'Descriptive', 'MAQ'], required: true },
  options:    { type: [String] },
  answer:     { type: mongoose.Schema.Types.Mixed, required: true },
  difficulty: { type: Number, enum: [-1, 0, 1], required: true },
  level:      { type: Number, enum: [1, 2, 3], required: true },
}, { timestamps: true });

export default mongoose.model('Question', questionSchema);