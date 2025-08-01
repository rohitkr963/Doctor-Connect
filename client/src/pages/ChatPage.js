

import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import ChatModal from '../components/ChatModal';
import axios from 'axios';

const ChatPage = () => {
  const { doctorId } = useParams();
  const { auth } = useContext(AuthContext);
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const patient = auth.user || auth;

  useEffect(() => {
    // Fetch doctor details for profile info
    const fetchDoctor = async ( ) => {
      try {
        const res = await axios.get(`/api/doctors/${doctorId}`);
        setDoctor(res.data);
      } catch (err) {
        setDoctor({ name: 'Doctor', profileDetails: {} });
      }
    };
    fetchDoctor();
  }, [doctorId]);

  if (!auth || !auth.token) {
    navigate('/login/user');
    return null;
  }

  if (!doctor) {
    return <div className="flex items-center justify-center min-h-screen">Loading chat...</div>;
  }

  // Premium animated chat background
  const bgPattern = {
    background: 'linear-gradient(135deg, #e0f2fe 0%, #ccfbf1 100%)',
    minHeight: '100vh',
    position: 'relative',
    overflow: 'hidden',
  };

  return (
    <div className="min-h-screen flex flex-col animate-fade-in-up" style={bgPattern}>
      {/* Animated glassmorphism chat header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg flex items-center gap-4 px-8 py-4 border-b border-blue-100 shadow-xl animate-fade-in-up animate-float-card">
        <button
          className="text-blue-500 text-2xl font-bold hover:text-teal-600 mr-2 transition-all animate-pulse-on-hover"
          onClick={() => navigate(-1)}
          title="Back"
        >
          &larr;
        </button>
        <img
          src={doctor.profileDetails?.profilePicture || `https://i.pravatar.cc/150?u=${doctor._id}`}
          alt={doctor.name}
          className="w-14 h-14 rounded-full border-4 border-teal-300 object-cover animate-profile-float"
        />
        <div className="flex flex-col">
          <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-700 text-lg animate-heading-glow">{doctor.name}</span>
          <span className="text-teal-700 text-xs font-semibold animate-fade-in-up">{doctor.profileDetails?.specialty || ''}</span>
        </div>
      </div>
      {/* Chat body, full width, no box */}
      <div className="flex-1 flex flex-col w-full max-w-3xl mx-auto animate-fade-in-up" style={{ minHeight: 0 }}>
        <div className="flex-1 flex flex-col">
          <ChatModal
            doctor={doctor}
            patient={patient}
            appointmentId={null}
            open={true}
            onClose={() => navigate(-1)}
            noBox={true}
          />
        </div>
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
        @keyframes profileFloat {
          0% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
          100% { transform: translateY(0); }
        }
        .animate-profile-float {
          animation: profileFloat 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default ChatPage;
