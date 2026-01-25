//adminAuth.js

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Admin = require('../models/Admin');

const JWT_SECRET = 'main_project'; // Use env variable in production

// Admin login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    try {
        const admin = await Admin.findOne({ email });
        if (!admin) return res.status(401).json({ message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: admin._id, role: 'admin' }, JWT_SECRET, { expiresIn: '2h' });
        res.json({ token, admin: { id: admin._id, name: admin.name, email: admin.email } });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
