import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import ChatModal from '../components/ChatModal';
import axios from 'axios';

const DoctorChatPage = () => {
  const { auth } = useContext(AuthContext);
  const navigate = useNavigate();
  const [userList, setUserList] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [userUnreadCounts, setUserUnreadCounts] = useState({});

  useEffect(() => {
    if (!auth || auth.type !== 'doctor') {
      navigate('/login/doctor');
      return;
    }
    // Validate doctorId is a valid MongoDB ObjectId
    const doctorId = auth._id;
    if (!doctorId || !doctorId.match(/^[0-9a-fA-F]{24}$/)) {
      setDoctor(null);
      setUserList([]);
      return;
    }
    axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/doctors/${doctorId}`)
      .then(res => setDoctor({ ...res.data, isCurrentDoctor: true, token: auth.token }))
      .catch(() => setDoctor(null));

    axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/messages/users/${doctorId}`, {
      headers: { Authorization: `Bearer ${auth.token}` }
    })
      .then(async res => {
        setUserList(res.data);
        // Fetch unread count for each user
        const counts = {};
        for (const user of res.data) {
          try {
            const resp = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/messages/unread-count/${doctorId}/${user._id}`, {
              headers: { Authorization: `Bearer ${auth.token}` }
            });
            counts[user._id] = resp.data.count || 0;
          } catch {
            counts[user._id] = 0;
          }
        }
        setUserUnreadCounts(counts);
      })
      .catch(() => setUserList([]));
  }, [auth, navigate]);

  if (!auth || auth.type !== 'doctor') return null;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-blue-100 via-teal-100 to-white animate-fade-in-up">
      {/* Sidebar: User list - responsive */}
      <div className="w-full md:w-1/3 lg:w-1/4 bg-white/60 backdrop-blur-2xl border-r border-blue-100 h-[40vh] md:h-auto overflow-y-auto shadow-2xl animate-fade-in-up animate-float-card rounded-tr-3xl rounded-br-3xl">
        <div className="p-4 sm:p-6 font-extrabold text-xl sm:text-2xl border-b bg-gradient-to-r from-teal-600 to-blue-600 text-white animate-heading-glow rounded-tr-3xl">Chats</div>
        {userList.length === 0 ? (
          <div className="p-6 sm:p-8 text-blue-400 text-center animate-fade-in-up text-base sm:text-lg">No messages yet.</div>
        ) : (
          <ul className="divide-y divide-blue-50">
            {userList.map(user => (
              <li key={user._id}>
                <button
                  className={`w-full flex items-center gap-2 sm:gap-4 px-3 sm:px-5 py-3 sm:py-4 group text-left transition-all duration-300 rounded-2xl hover:bg-gradient-to-r hover:from-teal-100 hover:to-blue-50 hover:scale-[1.03] shadow-md ${selectedUser && selectedUser._id === user._id ? 'bg-gradient-to-r from-teal-200 to-blue-100 scale-[1.04] shadow-lg' : 'bg-white/60'}`}
                  style={{ boxShadow: selectedUser && selectedUser._id === user._id ? '0 4px 24px 0 rgba(13, 148, 136, 0.12)' : undefined }}
                  onClick={async () => {
                    setSelectedUser(user);
                    // ...existing code...
                  }}
                >
                  <div className={`relative w-10 h-10 sm:w-14 sm:h-14 flex-shrink-0 rounded-full border-4 ${selectedUser && selectedUser._id === user._id ? 'border-teal-400' : 'border-blue-100'} shadow-lg transition-all`}>
                    <img src={user.profilePicture || `https://i.pravatar.cc/150?u=${user._id}`} alt={user.name} className="w-full h-full rounded-full object-cover animate-profile-float" />
                    {userUnreadCounts[user._id] > 0 && (
                      <span className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full px-2 py-1 text-xs font-bold shadow animate-fade-in-up border-2 border-white">{userUnreadCounts[user._id]}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-blue-900 truncate group-hover:text-teal-700 transition-colors text-base sm:text-lg">{user.name}</div>
                    <div className="text-xs text-blue-700 truncate group-hover:text-blue-500 transition-colors">{user.email}</div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {/* Main chat area - responsive */}
      <div className="flex-1 flex flex-col bg-gradient-to-br from-white via-blue-50 to-teal-50 animate-fade-in-up px-2 sm:px-0" style={{ minHeight: 0 }}>
        {selectedUser && doctor ? (
          <>
            {/* Chat header - responsive */}
            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg flex flex-col sm:flex-row items-center gap-2 sm:gap-4 px-4 sm:px-8 py-3 sm:py-4 border-b border-blue-100 shadow-xl animate-fade-in-up animate-float-card">
              <img src={selectedUser.profilePicture || `https://i.pravatar.cc/150?u=${selectedUser._id}`} alt={selectedUser.name} className="w-10 h-10 sm:w-14 sm:h-14 rounded-full border-4 border-teal-300 object-cover animate-profile-float" />
              <div className="flex flex-col items-center sm:items-start">
                <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-700 text-base sm:text-lg animate-heading-glow">{selectedUser.name}</span>
                <span className="text-teal-700 text-xs font-semibold animate-fade-in-up">{selectedUser.email}</span>
              </div>
              <button className="ml-auto text-blue-500 text-xl sm:text-2xl font-bold hover:text-teal-600 transition-all animate-pulse-on-hover" onClick={() => setSelectedUser(null)} title="Back">&larr;</button>
            </div>
            {/* Chat body - responsive */}
            <div className="flex-1 flex flex-col w-full max-w-full sm:max-w-3xl mx-auto animate-fade-in-up" style={{ minHeight: 0 }}>
              <ChatModal doctor={{ ...doctor, isCurrentDoctor: true }} patient={{ ...selectedUser, isCurrentUser: false }} appointmentId={null} />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-blue-400 text-base sm:text-2xl animate-fade-in-up">Select a user to start chatting</div>
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

export default DoctorChatPage;
