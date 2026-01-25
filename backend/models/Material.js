import mongoose from 'mongoose';

const materialSchema = new mongoose.Schema({
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  subject: { type: String, required: true },
  title: { type: String, required: true },
  fileUrl: { type: String, required: true }, // path to uploaded file
}, { timestamps: true });

export default mongoose.model('Material', materialSchema);
