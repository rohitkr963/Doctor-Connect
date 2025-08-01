import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUserAPI } from '../api/userApi';
import AuthContext from '../context/AuthContext';

const UserLoginPage = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await loginUserAPI(phone, password);
      // Global state mein user data save karna
      login({ type: 'user', ...data });
      // User ko homepage par wapas bhejna
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e3eafc] via-[#c7bfff] to-[#a78bfa] flex items-center justify-center relative overflow-hidden">
      {/* Skiper UI Glassmorphism Floating Shapes */}
      <div className="pointer-events-none select-none absolute inset-0 z-0">
        <div className="absolute top-[-100px] left-[-100px] w-[320px] h-[320px] bg-gradient-to-br from-[#6366f1]/40 to-[#a78bfa]/10 rounded-full blur-3xl opacity-60 animate-float-slow" style={{filter:'blur(60px)'}}></div>
        <div className="absolute bottom-[-100px] right-[-100px] w-[320px] h-[320px] bg-gradient-to-br from-[#818cf8]/40 to-[#c7bfff]/10 rounded-full blur-3xl opacity-60 animate-float-slow-rev" style={{filter:'blur(60px)'}}></div>
      </div>
      <div className="w-full max-w-md bg-[#23243a]/60 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 p-10 z-10 animate-fade-in-up" style={{boxShadow:'0 8px 48px 0 #6366f122'}}>
        <h2 className="text-4xl font-extrabold text-center text-white mb-8 drop-shadow-lg tracking-tight">Patient / User Login</h2>
        {error && <p className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-center shadow">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="phone" className="block text-indigo-200 font-semibold mb-2">Phone Number</label>
            <input
              type="tel"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-3 rounded-xl border border-white/20 bg-white/70 focus:ring-2 focus:ring-indigo-400 shadow transition text-gray-900"
              placeholder="10-digit mobile number"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-indigo-200 font-semibold mb-2">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-xl border border-white/20 bg-white/70 focus:ring-2 focus:ring-indigo-400 shadow transition text-gray-900"
              placeholder="••••••••"
              required
            />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-gradient-to-br from-indigo-600 to-blue-400 text-white font-bold py-3 rounded-xl shadow-lg hover:scale-105 hover:from-indigo-700 hover:to-blue-500 transition-all disabled:opacity-60 tracking-wide">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className="text-center text-indigo-200 mt-8">
          New here? <Link to="/register/user" className="text-blue-300 font-semibold hover:underline">Create an account</Link>
        </p>
      </div>
      {/* Animations */}
      <style>{`
        @keyframes floatSlow {
          0% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-32px) scale(1.04); }
          100% { transform: translateY(0) scale(1); }
        }
        .animate-float-slow {
          animation: floatSlow 7s ease-in-out infinite;
        }
        @keyframes floatSlowRev {
          0% { transform: translateY(0) scale(1); }
          50% { transform: translateY(32px) scale(1.04); }
          100% { transform: translateY(0) scale(1); }
        }
        .animate-float-slow-rev {
          animation: floatSlowRev 8s ease-in-out infinite;
        }
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(40px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 1s cubic-bezier(0.23, 1, 0.32, 1) both;
        }
      `}</style>
    </div>
  );
};

export default UserLoginPage;
