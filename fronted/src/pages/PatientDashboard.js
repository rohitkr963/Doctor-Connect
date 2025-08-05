import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const fetchUpcomingAppointments = async (token) => {
  const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/users/my-queues`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Could not fetch upcoming appointments');
  return await res.json();
};

const fetchPastAppointments = async (token) => {
  const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/users/past-appointments`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Could not fetch past appointments');
  return await res.json();
};

const PatientDashboard = () => {
  const { auth } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [pastAppointments, setPastAppointments] = useState([]);
  const [myDoctors, setMyDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!auth?.token) return;
    setLoading(true);
    setError('');
    let intervalId;

    Promise.all([
      fetchUpcomingAppointments(auth.token),
      fetchPastAppointments(auth.token)
    ])
      .then(([upcoming, past]) => {
        setUpcomingAppointments(upcoming);
        setPastAppointments(past);
        const allDoctors = [...upcoming, ...past];
        const doctorMap = {};
        allDoctors.forEach(appt => {
          if (!doctorMap[appt.doctorId]) {
            doctorMap[appt.doctorId] = {
              doctorId: appt.doctorId,
              doctorName: appt.doctorName,
              specialty: appt.specialty
            };
          }
        });
        setMyDoctors(Object.values(doctorMap));
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));

    intervalId = setInterval(() => {
      if (!auth?.token) return;
      fetchUpcomingAppointments(auth.token)
        .then(upcoming => {
          setUpcomingAppointments(upcoming);
        })
        .catch(() => {
          setUpcomingAppointments([]);
        });
    }, 10000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [auth]);

  if (!auth || auth.type !== 'user') {
    return (
      <div className="text-center p-8">
        <p>Access Denied. Please login as a Patient.</p>
        <button onClick={() => navigate('/login/user')} className="mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg">Go to Patient Login</button>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center p-8">Loading your appointments...</div>;
  }
  if (error) {
    return <div className="text-center p-8 text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 animate-fade-in-up">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-blue-900 animate-heading-glow">Welcome, {auth.name}</h1>
          <p className="text-blue-700 mt-1 animate-fade-in-up delay-200">Here are your appointment details.</p>
        </header>

        {/* Tabs */}
        <div className="flex border-b mb-6 animate-fade-in-up delay-300">
          <button onClick={() => setActiveTab('upcoming')} className={`py-2 px-4 font-semibold ${activeTab === 'upcoming' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-blue-400'}`}>
            Upcoming
          </button>
          <button onClick={() => setActiveTab('past')} className={`py-2 px-4 font-semibold ${activeTab === 'past' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-blue-400'}`}>
            Past
          </button>
          <button onClick={() => setActiveTab('doctors')} className={`py-2 px-4 font-semibold ${activeTab === 'doctors' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-blue-400'}`}>
            My Doctors
          </button>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'upcoming' && (
            Array.isArray(upcomingAppointments) && upcomingAppointments.length === 0 ? (
              <div className="text-blue-400 animate-fade-in-up">No upcoming appointments found.</div>
            ) : Array.isArray(upcomingAppointments) ? (
              upcomingAppointments.map((appt, idx) => (
                <div key={appt.doctorId} className="bg-white p-6 rounded-xl shadow-lg border border-blue-100 animate-fade-in-up animate-float-card transition-transform duration-300 hover:scale-105 hover:shadow-2xl" style={{ animationDelay: `${0.1 + idx * 0.07}s` }}>
                  <div className="flex flex-col sm:flex-row justify-between">
                    <div>
                      <p className="font-bold text-xl text-blue-900">{appt.doctorName}</p>
                      <p className="text-blue-700">{appt.specialty}</p>
                    </div>
                    <div className="flex space-x-4 mt-4 sm:mt-0">
                      <div className="text-center">
                        <p className="text-sm text-blue-400">Your Token</p>
                        <p className="text-2xl font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded-lg">#{appt.yourToken}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-blue-400">Serving Now</p>
                        <p className="text-2xl font-bold text-green-600 bg-blue-100 px-3 py-1 rounded-lg">#{appt.currentToken}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-red-500">Error: Appointments data is not an array.</div>
            )
          )}

          {activeTab === 'past' && (
            pastAppointments.length === 0 ? (
              <div className="text-blue-400 animate-fade-in-up">No past appointments found.</div>
            ) : (
              pastAppointments.map((appt, idx) => (
                <div key={appt.doctorId} className="bg-white p-6 rounded-xl shadow-lg border border-blue-100 flex justify-between items-center animate-fade-in-up animate-float-card transition-transform duration-300 hover:scale-105 hover:shadow-2xl" style={{ animationDelay: `${0.1 + idx * 0.07}s` }}>
                  <div>
                    <p className="font-bold text-xl text-blue-900">{appt.doctorName}</p>
                    <p className="text-blue-700">{appt.specialty}</p>
                    <p className="text-sm text-blue-400 mt-1">Visited on: {appt.date}</p>
                  </div>
                  <Link to={`/doctor/${appt.doctorId}`} className="bg-blue-100 text-blue-800 font-semibold py-2 px-4 rounded-lg hover:bg-blue-200 animate-pulse-on-hover">
                    View Profile
                  </Link>
                </div>
              ))
            )
          )}

          {activeTab === 'doctors' && (
            myDoctors.length === 0 ? (
              <div className="text-blue-400 animate-fade-in-up">No doctors found.</div>
            ) : (
              myDoctors.map((doc, idx) => (
                <div key={doc.doctorId} className="bg-white p-6 rounded-xl shadow-lg border border-blue-100 flex justify-between items-center animate-fade-in-up animate-float-card transition-transform duration-300 hover:scale-105 hover:shadow-2xl" style={{ animationDelay: `${0.1 + idx * 0.07}s` }}>
                  <div>
                    <p className="font-bold text-xl text-blue-900">{doc.doctorName}</p>
                    <p className="text-blue-700">{doc.specialty}</p>
                  </div>
                  <Link to={`/doctor/${doc.doctorId}`} className="bg-blue-100 text-blue-800 font-semibold py-2 px-4 rounded-lg hover:bg-blue-200 animate-pulse-on-hover">
                    View Profile
                  </Link>
                </div>
              ))
            )
          )}
        </div>
      </div>

      {/* Styles */}
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
        @keyframes floatCard {
          0% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-10px) scale(1.01); }
          100% { transform: translateY(0) scale(1); }
        }
        .animate-float-card {
          animation: floatCard 6s ease-in-out infinite;
        }
        @keyframes headingGlow {
          0% { text-shadow: 0 0 0px #2563eb; }
          50% { text-shadow: 0 0 16px #2563eb; }
          100% { text-shadow: 0 0 0px #2563eb; }
        }
        .animate-heading-glow {
          animation: headingGlow 2.5s ease-in-out infinite;
        }
        @keyframes pulseOnHover {
          0% { box-shadow: 0 0 0 0 rgba(37,99,235,0.7); }
          70% { box-shadow: 0 0 0 8px rgba(37,99,235,0); }
          100% { box-shadow: 0 0 0 0 rgba(37,99,235,0); }
        }
        .animate-pulse-on-hover:hover {
          animation: pulseOnHover 1s;
        }
      `}</style>
    </div>
  );
};

export default PatientDashboard;
