import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Student from './models/Student.js';

// Connect to your MongoDB
mongoose.connect(
  'mongodb+srv://mahimainmca2126:mahimaachu@mahima44.yhc0bq4.mongodb.net/adminDB?retryWrites=true&w=majority'
)
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.error('❌ MongoDB Error:', err));

async function createTestStudent() {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash('student123', 10);

    // Create student document
    const student = new Student({
      name: 'Test Student',
      email: 'student@example.com',
      password: hashedPassword
    });

    await student.save();
    console.log('✅ Test student created successfully');
    mongoose.connection.close();
  } catch (err) {
    console.error('❌ Error creating test student:', err);
  }
}

createTestStudent();
