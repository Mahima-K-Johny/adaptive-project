// models/Question.js
import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  type: { type: String, enum: ['MCQ', 'Descriptive'], required: true },
  options: { type: [String] },
  answer: { type: String, required: true },
  difficulty: { type: Number, enum: [-1, 0, 1], required: true },
  level: { type: Number, enum: [1, 2, 3], required: true }
});

export default mongoose.model('Question', questionSchema);
