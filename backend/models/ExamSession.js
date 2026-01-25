// models/ExamSession.js
import mongoose from 'mongoose';

const examSessionSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  ability: { type: Number, default: 0 },        // θ (theta)
  currentLevel: { type: Number, default: 1 },   // Level 1,2,3
  questionsAttempted: [
    {
      questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
      answer: String,
      correct: Boolean,
      thetaAfter: Number
    }
  ],
  completed: { type: Boolean, default: false },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date }
});

export default mongoose.model('ExamSession', examSessionSchema);
