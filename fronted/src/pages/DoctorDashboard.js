import React, { useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { getDoctorByIdAPI, updateDoctorStatusAPI, getMyQueueAPI, manageQueueAPI, getPatientHistoryAPI } from '../api/doctorApi';
import DoctorChatBot from '../components/DoctorChatBot'
import server from '../environment'; // Adjust the import path as necessary
// Icon Components
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.125-1.273-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.125-1.273.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const TicketIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>;

const DoctorDashboard = () => {
  const { deletePatientHistoryAPI } = require('../api/doctorApi');
  const handleDeleteHistory = async (patientId) => {
    try {
      await deletePatientHistoryAPI(patientId, auth.token);
      fetchData();
    } catch (err) {
      setError('Could not delete patient from history.');
    }
  };
  const { auth, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [queueData, setQueueData] = useState({ queue: [], currentQueueToken: 0, lastTokenIssued: 0 });
  const [patientHistory, setPatientHistory] = useState([]);
  const [doctorProfile, setDoctorProfile] = useState(null);

  const fetchData = useCallback(async () => {
    if (auth?.token) {
      try {
        const [queue, history, profile] = await Promise.all([
          getMyQueueAPI(auth.token),
          getPatientHistoryAPI(auth.token),
          getDoctorByIdAPI(auth._id)
        ]);
        setQueueData(queue);
        setPatientHistory(history);
        setDoctorProfile(profile);
      } catch (err) {
        setError('Could not fetch dashboard data. Please refresh the page.');
      }
    }
  }, [auth]);

  useEffect(() => {
    fetchData();
    // Har 15 second mein data ko automatically refresh karna
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval); // Component unmount hone par interval saaf karna
  }, [fetchData]);

  const handleLogout = () => {
    logout();
    navigate('/login/doctor');
  };

  const handleStatusUpdate = async (newStatus) => {
    setLoading(true);
    setMessage('');
    setError('');
    try {
      // 1. Update availability as before
      let availabilityArr = [];
      if (newStatus === 'Available') {
        const today = new Date().toISOString().split('T')[0];
        availabilityArr = [{ date: today, slots: [{ time: '09:00 AM' }] }];
      }
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`,
        },
      };
      // Update availability
      const response = await fetch(`${server}/api/doctors/availability`, {
        method: 'PUT',
        headers: config.headers,
        body: JSON.stringify({ availability: availabilityArr }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to update availability');
      setDoctorProfile(prev => ({...prev, availability: availabilityArr }));

      // 2. Update currentStatus field as well
      const statusResponse = await fetch(`${server}/api/doctors/status`, {
        method: 'PUT',
        headers: config.headers,
        body: JSON.stringify({ currentStatus: newStatus }),
      });
      const statusResult = await statusResponse.json();
      if (!statusResponse.ok) throw new Error(statusResult.message || 'Failed to update status');
      setDoctorProfile(prev => ({...prev, currentStatus: newStatus }));

      setMessage(`Status successfully updated to ${newStatus}.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQueueAction = async (action) => {
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const data = { action };
      const response = await manageQueueAPI(data, auth.token);
      setMessage(response.message);
      fetchData(); // Data ko turant refresh karna
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!auth || auth.type !== 'doctor' || !doctorProfile) {
    return <div className="text-center p-8">Loading Dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-teal-100 to-white flex items-center justify-center py-8 animate-fade-in-up">
      <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 animate-fade-in-up animate-float-card">
          <div>
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-700 animate-heading-glow">Welcome, {auth.name}</h1>
            <p className="text-blue-900 mt-1 text-lg">Here's your clinic's live status.</p>
          </div>
          <div className="flex items-center space-x-4 mt-4 sm:mt-0">
            <Link to="/doctor/profile/edit" className="bg-gradient-to-r from-blue-600 to-teal-500 text-white font-bold py-2 px-6 rounded-xl shadow-lg hover:scale-105 transition-all animate-pulse-on-hover">Edit Profile</Link>
            <button onClick={handleLogout} className="bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold py-2 px-6 rounded-xl shadow-lg hover:scale-105 transition-all animate-pulse-on-hover">Logout</button>
          </div>
        </header>

        {message && <div className="bg-green-100 text-green-800 p-3 rounded-xl mb-6 text-center shadow animate-fade-in-up">{message}</div>}
        {error && <div className="bg-red-100 text-red-700 p-3 rounded-xl mb-6 text-center shadow animate-fade-in-up">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-lg p-6 rounded-2xl shadow-2xl flex items-center animate-fade-in-up animate-float-card border border-blue-100">
            <ClockIcon />
            <div className="ml-4">
              <p className="text-sm text-blue-700">Currently Serving</p>
              <p className="text-3xl font-extrabold text-blue-900">#{queueData.currentQueueToken}</p>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-lg p-6 rounded-2xl shadow-2xl flex items-center animate-fade-in-up animate-float-card border border-blue-100">
            <UsersIcon />
            <div className="ml-4">
              <p className="text-sm text-green-700">Patients in Queue</p>
              <p className="text-3xl font-extrabold text-green-900">{queueData.queue.length}</p>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-lg p-6 rounded-2xl shadow-2xl flex items-center animate-fade-in-up animate-float-card border border-blue-100">
            <TicketIcon />
            <div className="ml-4">
              <p className="text-sm text-yellow-700">Last Token Issued</p>
              <p className="text-3xl font-extrabold text-yellow-900">#{queueData.lastTokenIssued}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white/80 backdrop-blur-lg p-6 rounded-2xl shadow-2xl animate-fade-in-up animate-float-card border border-blue-100">
              <h2 className="text-2xl font-bold mb-4 text-center text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-700 animate-heading-glow">My Profile</h2>
              <img 
                src={doctorProfile.profileDetails.profilePicture || `https://i.pravatar.cc/150?u=${auth._id}`} 
                alt="Profile" 
                className="w-28 h-28 rounded-full mx-auto border-4 border-blue-200 object-cover animate-profile-float"
              />
              <div className="text-center mt-4">
                <p className="font-bold text-xl text-blue-900">{doctorProfile.name}</p>
                <p className="text-blue-700">{doctorProfile.profileDetails.specialty}</p>
              </div>
              <div className="mt-4 border-t pt-4">
                <p className="text-sm text-blue-700">Experience: <span className="font-semibold text-blue-900">{doctorProfile.profileDetails.experience} years</span></p>
                <p className="text-sm text-blue-700">Fee: <span className="font-semibold text-blue-900">₹{doctorProfile.profileDetails.consultationFee}</span></p>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-lg p-6 rounded-2xl shadow-2xl animate-fade-in-up animate-float-card border border-blue-100">
              <h2 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-teal-500 animate-heading-glow">Manage Availability</h2>
              <div className="space-y-3">
                <button onClick={() => handleStatusUpdate('Available')} disabled={loading} className="w-full bg-gradient-to-r from-green-500 to-teal-400 text-white py-3 rounded-xl font-semibold shadow-lg hover:scale-105 transition-all animate-pulse-on-hover disabled:bg-gray-400">Set to Available</button>
                <button onClick={() => handleStatusUpdate('Not Available')} disabled={loading} className="w-full bg-gradient-to-r from-yellow-500 to-orange-400 text-white py-3 rounded-xl font-semibold shadow-lg hover:scale-105 transition-all animate-pulse-on-hover disabled:bg-gray-400">Set to Not Available</button>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-lg p-6 rounded-2xl shadow-2xl animate-fade-in-up animate-float-card border border-blue-100">
              <h2 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500 animate-heading-glow">Queue Actions</h2>
              <div className="space-y-3">
                <button onClick={() => handleQueueAction('next')} disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-teal-500 text-white py-3 rounded-xl font-semibold shadow-lg hover:scale-105 transition-all animate-pulse-on-hover disabled:bg-gray-400">Call Next Patient</button>
                <button onClick={() => handleQueueAction('reset')} disabled={loading} className="w-full bg-gradient-to-r from-gray-700 to-gray-500 text-white py-3 rounded-xl font-semibold shadow-lg hover:scale-105 transition-all animate-pulse-on-hover disabled:bg-gray-400">Reset Queue</button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white/80 backdrop-blur-lg p-6 rounded-2xl shadow-2xl animate-fade-in-up animate-float-card border border-blue-100">
              <h2 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500 animate-heading-glow">Upcoming Patients</h2>
              <div className="space-y-4">
                {queueData.queue.length > 0 ? (
                  queueData.queue.slice(0, 5).map((patient) => (
                    <div key={patient._id} className="flex justify-between items-center bg-white/70 p-4 rounded-xl shadow animate-fade-in-up animate-float-card">
                      <div>
                        <p className="font-bold text-blue-900">Token #{patient.tokenNumber}</p>
                        <p className="text-sm text-blue-700">{patient.patientName}</p>
                      </div>
                      <span className="text-sm font-semibold text-blue-500 animate-pulse">Waiting...</span>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-blue-500 py-8">No patients in the queue right now.</p>
                )}
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-lg p-6 rounded-2xl shadow-2xl animate-fade-in-up animate-float-card border border-blue-100">
              <h2 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500 animate-heading-glow">My Patient History</h2>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {patientHistory.length > 0 ? (
                  patientHistory.map((patient) => (
                    <div key={patient.patientId} className="flex justify-between items-center bg-white/70 p-3 rounded-xl shadow animate-fade-in-up animate-float-card">
                      <div>
                        <p className="font-semibold text-blue-900">
                          {patient.patientName ? patient.patientName : (patient.phone ? patient.phone : 'Unknown')}
                        </p>
                        {patient.phone && (
                          <p className="text-sm text-blue-700">{patient.phone}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteHistory(patient.patientId)}
                        className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-xl shadow-lg hover:scale-105 transition-all animate-pulse-on-hover"
                      >
                        Delete
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-blue-500 py-4">No patient history found.</p>
                )}
              </div>
            </div>
          </div>
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
      <div className="min-h-screen bg-slate-50 animate-fade-in-up">
      {/* ...existing dashboard code... */}
      <DoctorChatBot />
    </div>
    </div>
  );
};



export default DoctorDashboard;
