// models/ExamSession.js
import mongoose from 'mongoose';

const examSessionSchema = new mongoose.Schema({
  studentId:    { type: String, required: true },  // ✅ changed from ObjectId to String
  subject:      { type: String, required: true },  // ✅ added
  ability:      { type: Number, default: 0 },
  currentLevel: { type: Number, default: 1 },
  questionsAttempted: [
    {
      questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
      answer:     String,
      correct:    Boolean,
      thetaAfter: Number,
    }
  ],
  completed: { type: Boolean, default: false },
  startTime: { type: Date, default: Date.now },
  endTime:   { type: Date },
});

export default mongoose.model('ExamSession', examSessionSchema);