import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

// Usage: <ProtectedRoute><YourComponent /></ProtectedRoute>
export default function ProtectedRoute({ children }) {
  const { auth } = useContext(AuthContext);
  if (!auth || !auth.token) {
    return <Navigate to="/login/user" replace />;
  }
  return children;
}
