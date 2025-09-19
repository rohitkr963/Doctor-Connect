import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

// Usage: <ProtectedRoute><YourComponent /></ProtectedRoute>
export default function ProtectedRoute({ children, type, redirectTo }) {
  const { auth } = useContext(AuthContext);
  // If not logged in, redirect
  if (!auth || !auth.token) {
    return <Navigate to={redirectTo || "/login/user"} replace />;
  }
  // If doctor route, check type
  if (type === 'doctor' && auth.type !== 'doctor') {
    return <Navigate to={redirectTo || "/"} replace />;
  }
  // If user route, check type
  if (type === 'user' && auth.type !== 'user') {
    return <Navigate to={redirectTo || "/"} replace />;
  }
  return children;
}
