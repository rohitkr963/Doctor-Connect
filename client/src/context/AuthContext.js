import React, { createContext, useState, useEffect } from 'react';

// 1. Context banana
const AuthContext = createContext();

// 2. Provider Component banana (ye hamare global state ko hold karega)
export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(null); // Shuru mein koi login nahi hai

  // Ye check karega ki kya browser ki memory mein pehle se koi user hai
  useEffect(() => {
    const storedUser = localStorage.getItem('userInfo');
    if (storedUser) {
      setAuth(JSON.parse(storedUser));
    }
  }, []);

  // Login function
  const login = (userData) => {
    setAuth(userData);
    localStorage.setItem('userInfo', JSON.stringify(userData));
  };

  // Logout function
  const logout = () => {
    setAuth(null);
    localStorage.removeItem('userInfo');
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
