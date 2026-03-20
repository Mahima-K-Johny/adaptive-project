// server.js
import 'dotenv/config'; // ✅ Must be FIRST in ESM — loads before other imports evaluate

import express    from 'express';
import mongoose   from 'mongoose';
import cors       from 'cors';
import path       from 'path';

import adminRoutes    from './routes/adminRoutes.js';
import loginRoutes    from './routes/loginRoutes.js';
import courseRoutes   from './routes/courseRoutes.js';
import teacherRoutes  from './routes/teacherRoutes.js';
import materialRoutes from './routes/materialRoutes.js';
import examRoutes     from './routes/examRoutes.js';
import questionRoutes from './routes/questionRoutes.js';
import progressRoutes from './routes/progressRoutes.js';

const app  = express();
const PORT = process.env.PORT || 5000; // ✅ reads from .env

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(path.resolve(), 'uploads')));

// ── Routes ────────────────────────────────────────────────────────────────────
app.get('/', (req, res) => res.send('Backend is running ✅'));

app.use('/api/teachers',  teacherRoutes);
app.use('/api/admin',     adminRoutes);
app.use('/api/auth',      loginRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/courses',   courseRoutes);
app.use('/api/exam',      examRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/progress',  progressRoutes);

// ── MongoDB ───────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI) // ✅ reads from .env instead of hardcoded string
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Error:', err));

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});