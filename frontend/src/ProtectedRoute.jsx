// ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const role = localStorage.getItem('role');

  if (!role) {
    // not logged in
    return <Navigate to="/admin-login" />;
  }

  // allow access if role exists (admin / teacher / student)
  return children;
}
