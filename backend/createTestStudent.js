import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Student from './models/Student.js';


.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.error('❌ MongoDB Error:', err));

async function createTestStudent() {
  try {
    const hashedPassword = await bcrypt.hash('student123', 10);

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
