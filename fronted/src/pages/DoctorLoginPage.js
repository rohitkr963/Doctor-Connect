import React, { useState, useContext } from 'react'; // useContext ko import karein
import { useNavigate } from 'react-router-dom'; // useNavigate ko import karein
import { loginDoctorAPI } from '../api/doctorApi';
import AuthContext from '../context/AuthContext'; // Hamare AuthContext ko import karein
import DoctorChatBot from '../components/DoctorChatBot';

const DoctorLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext); // login function ko context se nikalna
  const navigate = useNavigate(); // navigate function ko initialize karna

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await loginDoctorAPI(email, password);
      console.log('Login successful:', data);
      
      // YEH HAI NAYA BADLAV:
      // 1. Global state mein user data save karna
      login({ type: 'doctor', ...data }); 
      
      // 2. User ko dashboard par bhejna
      navigate('/doctor/dashboard');

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-teal-100 to-white flex items-center justify-center animate-fade-in-up">
      <DoctorChatBot />
      <div className="w-full max-w-md bg-white/80 backdrop-blur-lg p-10 rounded-3xl shadow-2xl border border-blue-100 animate-fade-in-up animate-float-card">
        <h2 className="text-4xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-700 mb-8 animate-heading-glow">Doctor Login</h2>
        {error && <p className="bg-red-100 text-red-700 p-3 rounded-xl mb-4 text-center animate-fade-in-up">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in-up animate-float-card">
          <div>
            <label htmlFor="email" className="block text-blue-900 font-semibold mb-2">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border rounded-xl bg-white/80 focus:ring-2 focus:ring-blue-400 transition-all"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-blue-900 font-semibold mb-2">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border rounded-xl bg-white/80 focus:ring-2 focus:ring-blue-400 transition-all"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-teal-500 text-white font-bold py-3 rounded-xl shadow-lg hover:scale-105 transition-all animate-pulse-on-hover disabled:bg-blue-300"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className="text-center text-blue-700 mt-8 animate-fade-in-up">
          Don't have an account? <a href="/register/doctor" className="text-blue-600 hover:underline font-bold">Register here</a>
        </p>
      </div>
      <style>{`
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(40px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 1s cubic-bezier(0.23, 1, 0.32, 1) both;
        }
        @keyframes floatCard {
          0% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-10px) scale(1.01); }
          100% { transform: translateY(0) scale(1); }
        }
        .animate-float-card {
          animation: floatCard 6s ease-in-out infinite;
        }
        @keyframes headingGlow {
          0% { text-shadow: 0 0 0px #0ea5e9; }
          50% { text-shadow: 0 0 16px #0ea5e9; }
          100% { text-shadow: 0 0 0px #0ea5e9; }
        }
        .animate-heading-glow {
          animation: headingGlow 2.5s ease-in-out infinite;
        }
        @keyframes pulseOnHover {
          0% { box-shadow: 0 0 0 0 rgba(14,165,233,0.7); }
          70% { box-shadow: 0 0 0 8px rgba(14,165,233,0); }
          100% { box-shadow: 0 0 0 0 rgba(14,165,233,0); }
        }
        .animate-pulse-on-hover:hover {
          animation: pulseOnHover 1s;
        }
      `}</style>
    </div>
  );
};

export default DoctorLoginPage;
