// middleware/authMiddleware.js
// Usage: import { protect, requireRole } from '../middleware/authMiddleware.js';
//
// Protect any route:
//   router.get('/my-route', protect, myHandler)
//
// Protect + restrict to a role:
//   router.get('/teacher-only', protect, requireRole('teacher'), myHandler)

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key_change_in_production';

// ── Verify token and attach decoded user to req.user ─────────────────────────
export const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided. Please log in.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { userId, role, email, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token. Please log in again.' });
  }
};

// ── Optional role guard — use after protect ───────────────────────────────────
export const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({ message: `Access denied. Required role: ${roles.join(' or ')}` });
  }
  next();
};