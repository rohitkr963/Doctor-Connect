import React, { createContext, useState, useEffect } from 'react';

// 1. Context banana
const AuthContext = createContext();

// 2. Provider Component banana (ye hamare global state ko hold karega)
export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(null); // Shuru mein koi login nahi hai
  const [loading, setLoading] = useState(true); // Naya loading state

  // Ye check karega ki kya browser ki memory mein pehle se koi user hai
  useEffect(() => {
    const storedUser = localStorage.getItem('userInfo');
    if (storedUser) {
      setAuth(JSON.parse(storedUser));
    }
    setLoading(false); // Auth check ho gaya
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

  if (loading) {
    // Loading spinner ya null jab tak auth check nahi hota
    return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f3f4f6'}}><span style={{fontSize:24,color:'#6366f1'}}>Loading...</span></div>;
  }

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
