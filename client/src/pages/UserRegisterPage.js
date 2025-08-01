import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUserAPI } from '../api/userApi';
import AuthContext from '../context/AuthContext';

const UserRegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const { name, phone, password } = formData;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await registerUserAPI(formData);
      // Register karne ke baad user ko seedha login kar dena
      login({ type: 'user', ...data });
      // Aur homepage par bhej dena
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f3e7fa] via-[#e3eafc] to-[#c7bfff] flex items-center justify-center relative overflow-hidden">
      {/* Skiper UI Glassmorphism Floating Shapes */}
      <div className="pointer-events-none select-none absolute inset-0 z-0">
        <div className="absolute top-[-100px] left-[-100px] w-[320px] h-[320px] bg-gradient-to-br from-[#a78bfa]/40 to-[#3b82f6]/10 rounded-full blur-3xl opacity-60 animate-float-slow" style={{filter:'blur(60px)'}}></div>
        <div className="absolute bottom-[-100px] right-[-100px] w-[320px] h-[320px] bg-gradient-to-br from-[#c7bfff]/40 to-[#b6e0ff]/10 rounded-full blur-3xl opacity-60 animate-float-slow-rev" style={{filter:'blur(60px)'}}></div>
      </div>
      <div className="w-full max-w-md bg-white/30 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/30 p-10 z-10 animate-fade-in-up" style={{boxShadow:'0 8px 48px 0 #a78bfa22'}}>
        <h2 className="text-4xl font-extrabold text-center text-gray-900 mb-8 drop-shadow-lg">Create Patient Account</h2>
        {error && <p className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-center shadow">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <input type="text" name="name" value={name} onChange={handleChange} placeholder="Full Name" required className="w-full p-3 rounded-xl border border-white/40 bg-white/60 focus:ring-2 focus:ring-indigo-300 shadow transition" />
          <input type="tel" name="phone" value={phone} onChange={handleChange} placeholder="10-digit Phone Number" required className="w-full p-3 rounded-xl border border-white/40 bg-white/60 focus:ring-2 focus:ring-indigo-300 shadow transition" />
          <input type="password" name="password" value={password} onChange={handleChange} placeholder="Password" required className="w-full p-3 rounded-xl border border-white/40 bg-white/60 focus:ring-2 focus:ring-indigo-300 shadow transition" />
          <button type="submit" disabled={loading} className="w-full bg-gradient-to-br from-indigo-500 to-teal-400 text-white font-bold py-3 rounded-xl shadow-lg hover:scale-105 hover:from-indigo-600 hover:to-teal-500 transition-all disabled:opacity-60">
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>
        <p className="text-center text-gray-700 mt-8">
          Already have an account? <Link to="/login/user" className="text-indigo-600 font-semibold hover:underline">Login here</Link>
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

export default UserRegisterPage;
