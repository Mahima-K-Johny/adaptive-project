// AddTeacher.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function AddTeacher() {
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState({
    name: '',
    subject: '',
    email: '',
    password: '',
    gender: '',
    dob: '',
    phoneNumber: ''
  });

  const handleChange = (e) => {
    setTeacher({ ...teacher, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/teachers/add', teacher);
      alert(res.data.message);
      navigate('/admin-dashboard'); // go back to dashboard
    } catch (err) {
  console.error(err.response); // see full error in console
  alert(
    err.response?.data?.message || // backend message
    err.message ||                  // fallback
    'Unknown error'
  );
}

  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Add New Teacher</h2>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem', maxWidth: '400px' }}>
        <input name="name" placeholder="Name" onChange={handleChange} required />
        <input name="subject" placeholder="Subject" onChange={handleChange} required />
        <input name="email" placeholder="Email" type="email" onChange={handleChange} required />
        <input name="password" placeholder="Password" type="password" onChange={handleChange} required />
        <select name="gender" onChange={handleChange} required>
          <option value="">Select Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
        <input name="dob" placeholder="Date of Birth" type="date" onChange={handleChange} required />
        <input name="phoneNumber" placeholder="Phone Number" type="tel" onChange={handleChange} required />
        <button type="submit">Add Teacher</button>
      </form>
    </div>
  );
}
