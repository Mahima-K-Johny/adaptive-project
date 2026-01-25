import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import adminRoutes from './routes/adminRoutes.js';
import authRoutes from "./routes/authRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import teacherRoutes from './routes/teacherRoutes.js';
import loginRoutes from './routes/loginRoutes.js';
import materialRoutes from './routes/materialRoutes.js';
import path from 'path';
import examRoutes from "./routes/examRoutes.js"
const app = express();
const PORT = 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(path.resolve(), 'uploads')));
app.use("/api/exam", examRoutes);

// MongoDB connection (Atlas)
mongoose.connect(
  'mongodb+srv://mahimainmca2126:mahimaachu@mahima44.yhc0bq4.mongodb.net/adminDB?retryWrites=true&w=majority'
)
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.error('❌ MongoDB Error:', err));

// Test route (IMPORTANT)
app.get('/', (req, res) => {
  res.send('Backend is running');
});
//teacher routes
app.use('/api/teachers', teacherRoutes);

// Admin routes
app.use('/api/admin', adminRoutes);
//app.use("/api/auth", authRoutes);

app.use("/api/auth", loginRoutes);


app.use('/api/materials', materialRoutes);

 
app.use("/api/courses", courseRoutes);
// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
