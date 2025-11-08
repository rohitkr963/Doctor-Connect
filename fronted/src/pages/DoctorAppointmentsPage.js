import React, { useEffect, useState, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DoctorChatBot from '../components/DoctorChatBot';

const DoctorAppointmentsPage = () => {
  const { auth } = useContext(AuthContext);
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      setError('');
      try {
        // Replace with your actual backend API endpoint
        const res = await axios.get(
          `${process.env.REACT_APP_API_BASE_URL}
/api/doctors/${auth._id}/appointments`,
          { headers: { Authorization: `Bearer ${auth.token}` } }
        );
        setAppointments(res.data);
      } catch (err) {
        setError(err.message || 'Failed to fetch appointments');
      } finally {
        setLoading(false);
      }
    };
    if (auth && auth.type === 'doctor') fetchAppointments();
  }, [auth]);

  const handleViewUserProfile = (userId) => {
    navigate(`/doctor/user/${userId}`);
  };

  if (loading) return <div className="text-center p-10 animate-fade-in-up">Loading appointments...</div>;
  if (error) return <div className="text-center p-10 text-red-500 animate-fade-in-up">{error}</div>;

  // Pagination logic
  const totalPages = Math.ceil(appointments.length / pageSize);
  const paginatedAppointments = appointments.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-teal-100 to-white flex items-center justify-center py-10 animate-fade-in-up">
      <DoctorChatBot />
      <div className="w-full max-w-5xl mx-auto p-4 animate-fade-in-up">
        <h1 className="text-4xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-700 mb-10 animate-heading-glow">Your Appointments</h1>
        {appointments.length === 0 ? (
          <div className="text-blue-700 text-center text-lg animate-fade-in-up">No appointments found.</div>
        ) : (
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-blue-100 p-8 animate-fade-in-up animate-float-card">
            <div className="overflow-x-auto">
              <table className="w-full text-blue-900">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-100 to-teal-100 animate-fade-in-up">
                    <th className="p-3 text-left font-bold">User Name</th>
                    <th className="p-3 text-left font-bold">Date</th>
                    <th className="p-3 text-left font-bold">Time</th>
                    <th className="p-3 text-left font-bold">Symptoms/Answers</th>
                    <th className="p-3 text-left font-bold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedAppointments.map((appt, idx) => (
                    <tr key={appt._id} className={`border-b last:border-0 transition-all animate-fade-in-up animate-float-card ${idx % 2 === 0 ? 'bg-white/60' : 'bg-blue-50/60'}`}>
                      <td className="p-3 font-semibold">{appt.user?.name || 'Unknown'}</td>
                      <td className="p-3">{appt.date}</td>
                      <td className="p-3">{appt.time}</td>
                      <td className="p-3 text-sm text-blue-700">{appt.symptoms || '-'}</td>
                      <td className="p-3">
                        <button
                          className="bg-gradient-to-r from-blue-600 to-teal-500 text-white px-4 py-2 rounded-xl shadow-lg hover:scale-105 transition-all animate-pulse-on-hover disabled:bg-blue-300"
                          onClick={() => handleViewUserProfile(appt.user?._id)}
                          disabled={!appt.user?._id}
                        >
                          View Profile
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination Controls */}
            <div className="flex justify-center items-center mt-8 gap-2 animate-fade-in-up">
              <button
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-200 to-teal-200 text-blue-900 font-bold hover:scale-105 transition-all disabled:opacity-50"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Prev
              </button>
              <span className="px-4 text-lg font-semibold">Page {currentPage} of {totalPages}</span>
              <button
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-200 to-teal-200 text-blue-900 font-bold hover:scale-105 transition-all disabled:opacity-50"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
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
      `}</style>
    </div>
  );
};

export default DoctorAppointmentsPage;
