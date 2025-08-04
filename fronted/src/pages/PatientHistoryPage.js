import React, { useEffect, useState, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import server from '../environment'; // Adjust the import path as necessary

const PatientHistoryPage = () => {
  const { auth } = useContext(AuthContext);
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (!auth || auth.type !== 'doctor') {
      navigate('/login');
      return;
    }
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const config = { headers: { Authorization: `Bearer ${auth.token}` } };
        const res = await axios.get(`${server}/api/doctors/patients/history`, config);
        setPatients(res.data);
      } catch (err) {
        setError('Could not load patient history.');
      }
      setLoading(false);
    };
    fetchHistory();
  }, [auth, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-teal-100 to-white flex items-center justify-center py-12 animate-fade-in-up">
      <div className="w-full max-w-3xl mx-auto animate-fade-in-up">
        <h1 className="text-4xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-700 mb-10 animate-heading-glow">My Patient History</h1>
        {error && <div className="text-red-500 mb-4 text-center animate-fade-in-up">{error}</div>}
        {loading ? (
          <div className="text-blue-700 text-center animate-fade-in-up">Loading...</div>
        ) : patients.length === 0 ? (
          <div className="text-blue-500 text-center animate-fade-in-up">No patient history found.</div>
        ) : (
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-blue-100 p-8 animate-fade-in-up animate-float-card">
            <ul className="divide-y divide-blue-100">
              {patients.map((patient, idx) => {
                const id = patient.patientId || patient._id || idx;
                return (
                  <li
                    key={id}
                    className={`flex items-center py-5 animate-fade-in-up animate-float-card transition-all duration-500 ${deletingId === id ? 'animate-slide-out-left opacity-0 pointer-events-none' : ''}`}
                    onAnimationEnd={e => {
                      if (deletingId === id && e.animationName.includes('slideOutLeft')) {
                        setPatients(prev => prev.filter(p => (p.patientId || p._id || idx) !== id));
                        setDeletingId(null);
                      }
                    }}
                  >
                    <img src={patient.profilePic || '/default-avatar.png'} alt={patient.patientName || 'Patient'} className="w-16 h-16 rounded-full object-cover mr-6 border-4 border-teal-200 shadow" />
                    <div className="flex-1">
                      <div className="font-bold text-xl text-blue-900 mb-1">{patient.patientName || patient.name || 'Unknown'}</div>
                      <div className="text-md text-blue-700">Phone: {patient.phone || 'N/A'}</div>
                    </div>
                    <button
                      className="ml-4 bg-gradient-to-r from-red-500 to-pink-500 text-white px-5 py-2 rounded-xl font-bold shadow-lg hover:scale-105 transition-all animate-pulse-on-hover"
                      disabled={deletingId === id}
                      onClick={async () => {
                        setDeletingId(id);
                        try {
                          const config = { headers: { Authorization: `Bearer ${auth.token}` } };
                          await axios.delete(`${server}/api/doctors/patients/history/${id}`, config);
                        } catch {
                          setError('Delete nahi ho paaya.');
                          setDeletingId(null);
                        }
                      }}
                    >Delete</button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
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
      @keyframes slideOutLeft {
        0% { opacity: 1; transform: translateX(0); }
        100% { opacity: 0; transform: translateX(-120px) scale(0.95); }
      }
      .animate-slide-out-left {
        animation: slideOutLeft 0.5s cubic-bezier(0.4,0,0.2,1) both;
      }
      `}</style>
    </div>
  );
};

export default PatientHistoryPage;
