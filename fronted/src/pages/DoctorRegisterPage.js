import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // useNavigate ko import karein
import { registerDoctorAPI } from '../api/doctorApi';
import DoctorChatBot from '../components/DoctorChatBot';

const DoctorRegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    clinicName: '',
    city: '',
    address: '',
    specialty: 'Neurology',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate(); // useNavigate ko initialize karein

  const { name, email, password, clinicName, city, address, specialty } = formData;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await registerDoctorAPI(formData);
      console.log('Registration successful:', data);
      alert('Registration Successful! Welcome Dr. ' + data.name + '. Please login to continue.');
      
      // YEH HAI NAYA BADLAV: User ko login page par bhejna
      navigate('/login/doctor'); 

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-teal-100 to-white flex items-center justify-center py-12 animate-fade-in-up">
      <DoctorChatBot />
      <div className="w-full max-w-lg bg-white/80 backdrop-blur-lg p-10 rounded-3xl shadow-2xl border border-blue-100 animate-fade-in-up animate-float-card">
        <h2 className="text-4xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-700 mb-8 animate-heading-glow">Doctor Registration</h2>
        {error && <p className="bg-red-100 text-red-700 p-3 rounded-xl mb-4 text-center animate-fade-in-up">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in-up animate-float-card">
          <input type="text" name="name" value={name} onChange={handleChange} placeholder="Full Name" required className="w-full p-3 border rounded-xl bg-white/80 focus:ring-2 focus:ring-blue-400 transition-all" />
          <input type="email" name="email" value={email} onChange={handleChange} placeholder="Email Address" required className="w-full p-3 border rounded-xl bg-white/80 focus:ring-2 focus:ring-blue-400 transition-all" />
          <input type="password" name="password" value={password} onChange={handleChange} placeholder="Password" required className="w-full p-3 border rounded-xl bg-white/80 focus:ring-2 focus:ring-blue-400 transition-all" />
          <input type="text" name="clinicName" value={clinicName} onChange={handleChange} placeholder="Clinic Name" required className="w-full p-3 border rounded-xl bg-white/80 focus:ring-2 focus:ring-blue-400 transition-all" />
          <input type="text" name="city" value={city} onChange={handleChange} placeholder="City" required className="w-full p-3 border rounded-xl bg-white/80 focus:ring-2 focus:ring-blue-400 transition-all" />
          <input type="text" name="address" value={address} onChange={handleChange} placeholder="Clinic Address" className="w-full p-3 border rounded-xl bg-white/80 focus:ring-2 focus:ring-blue-400 transition-all" />
          <select name="specialty" value={specialty} onChange={handleChange} className="w-full p-3 border rounded-xl bg-white/80 focus:ring-2 focus:ring-blue-400 transition-all">
            <option>Neurology</option>
            <option>Cardiology</option>
            <option>Orthopedics</option>
            <option>Dermatology</option>
          </select>
          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-teal-500 text-white font-bold py-3 rounded-xl shadow-lg hover:scale-105 transition-all animate-pulse-on-hover disabled:bg-blue-300">
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <p className="text-center text-blue-700 mt-8 animate-fade-in-up">
          Already have an account? <Link to="/login/doctor" className="text-blue-600 hover:underline font-bold">Login here</Link>
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

export default DoctorRegisterPage;
