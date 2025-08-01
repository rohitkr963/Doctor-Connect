import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { searchDoctorsAPI } from '../api/doctorApi';
import AuthContext from '../context/AuthContext';

const StarIcon = () => <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>;

const SpecialtyDoctorsPage = () => {
  const { specialty } = useParams();
  const { auth } = useContext(AuthContext);
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchDoctors = async () => {
      setLoading(true);
      try {
        const results = await searchDoctorsAPI('', '', specialty);
        setDoctors(results);
      } catch (err) {
        setError('Could not load doctors.');
      }
      setLoading(false);
    };
    fetchDoctors();
  }, [specialty]);

  // Removed queue join logic. Users should book appointments via doctor profile/modal.

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 bg-white min-h-screen">
      <h1 className="text-3xl font-extrabold text-teal-700 mb-8 animate-fade-in-up animate-heading-glow">Top Doctors in {specialty}</h1>
      {message && <div className="text-green-600 mb-4 animate-fade-in-up delay-200">{message}</div>}
      {error && <div className="text-red-500 mb-4 animate-fade-in-up delay-200">{error}</div>}
      {loading ? (
        <div className="animate-fade-in-up">Loading...</div>
      ) : doctors.length === 0 ? (
        <div className="text-gray-500 animate-fade-in-up">No doctors found in {specialty}.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {doctors.map((doctor, idx) => (
            <div
              key={doctor._id}
              className="bg-teal-50 rounded-3xl shadow-xl border border-gray-100 overflow-hidden flex flex-col animate-fade-in-up animate-float-card transition-transform duration-300 hover:scale-105 hover:shadow-2xl group"
              style={{animationDelay: `${0.1 + idx * 0.07}s`}}
            >
              <img src={doctor.profileDetails?.profilePicture || `https://i.pravatar.cc/400?u=${doctor._id}`} alt={doctor.name} className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"/>
              <div className="p-6 flex-grow flex flex-col">
                <h3 className="text-xl font-bold text-gray-900 animate-fade-in-up">{doctor.name}</h3>
                <p className="text-teal-600 font-semibold animate-fade-in-up delay-200">{doctor.profileDetails?.specialty || doctor.specialization}</p>
                <p className="text-sm text-gray-500 mt-1 animate-fade-in-up delay-300">{doctor.city}</p>
                {/* User can view doctor profile */}
                {auth && auth.type === 'user' && (
                  <button
                    onClick={() => navigate(`/doctor/${doctor._id}`)}
                    className="w-full mt-2 mb-2 bg-teal-500 text-white font-bold py-2 rounded-lg hover:bg-teal-600 transition-all animate-fade-in-up delay-400 animate-pulse-on-hover"
                  >
                    View Profile
                  </button>
                )}
                <div className="flex-grow"></div>
                <div className={`mt-4 text-sm font-semibold p-2 rounded-md text-center ${doctor.currentStatus && doctor.currentStatus.trim().toLowerCase() === 'available' ? 'bg-gray-100 text-teal-700' : 'bg-gray-100 text-red-700'} animate-fade-in-up delay-500`}>
                  {doctor.currentStatus && doctor.currentStatus.trim().toLowerCase() === 'available' ? 'Available' : 'Not Available'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <style>{`
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(40px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 1s cubic-bezier(0.23, 1, 0.32, 1) both;
        }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }
        .delay-500 { animation-delay: 0.5s; }
        @keyframes floatCard {
          0% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-10px) scale(1.01); }
          100% { transform: translateY(0) scale(1); }
        }
        .animate-float-card {
          animation: floatCard 6s ease-in-out infinite;
        }
        @keyframes headingGlow {
          0% { text-shadow: 0 0 0px #14b8a6; }
          50% { text-shadow: 0 0 16px #14b8a6; }
          100% { text-shadow: 0 0 0px #14b8a6; }
        }
        .animate-heading-glow {
          animation: headingGlow 2.5s ease-in-out infinite;
        }
        @keyframes pulseOnHover {
          0% { box-shadow: 0 0 0 0 rgba(20,184,166,0.7); }
          70% { box-shadow: 0 0 0 8px rgba(20,184,166,0); }
          100% { box-shadow: 0 0 0 0 rgba(20,184,166,0); }
        }
        .animate-pulse-on-hover:hover {
          animation: pulseOnHover 1s;
        }
      `}</style>
    </div>
  );
};

export default SpecialtyDoctorsPage;
