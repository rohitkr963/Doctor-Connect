import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const UserProfileForDoctor = () => {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [records, setRecords] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImg, setModalImg] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/users/${userId}`);
        setProfile(res.data);
      } catch (err) {
        setError('User profile not found');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId]);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const res = await axios.get(`/api/users/${userId}/documents`);
        setRecords(res.data.records || []);
      } catch {
        setRecords([]);
      }
    };
    fetchRecords();
  }, [userId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-100 text-xl">Loading profile...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center bg-gray-100 text-xl text-red-600">{error}</div>;
  if (!profile) return null;

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start p-4 bg-gradient-to-br from-teal-100 via-blue-50 to-indigo-100 animate-bg-fade">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-amber-100 p-8 pt-16 z-10 animate-fade-in-up relative mb-10">
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
          <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-md bg-indigo-100">
            <img src={profile.profilePic} alt="User Profile" className="w-full h-full object-cover" />
          </div>
        </div>
        <div className="text-center mt-4">
          <h2 className="text-2xl font-bold text-gray-800 drop-shadow-lg">{profile.name}</h2>
          {profile.isPremiumMember && (
            <p className="text-sm text-gray-500 mt-1 inline-flex items-center bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full shadow">Premium Member <span className="ml-1">✨</span></p>
          )}
        </div>
        <div className="grid grid-cols-4 gap-4 text-center mt-8 p-4 bg-indigo-50 rounded-lg shadow-sm">
          <div className="flex flex-col items-center">
            <img src="https://img.icons8.com/ios/50/000000/height.png" alt="Height" className="h-8 w-8 mb-1" />
            <span className="text-sm text-gray-500">Height</span>
            <span className="font-semibold text-gray-800">{profile.height}</span>
          </div>
          <div className="flex flex-col items-center">
            <img src="https://img.icons8.com/ios/50/000000/weight.png" alt="Weight" className="h-8 w-8 mb-1" />
            <span className="text-sm text-gray-500">Weight</span>
            <span className="font-semibold text-gray-800">{profile.weight}</span>
          </div>
          <div className="flex flex-col items-center">
            <img src="https://img.icons8.com/ios/50/000000/birthday--v1.png" alt="Age" className="h-8 w-8 mb-1" />
            <span className="text-sm text-gray-500">Age</span>
            <span className="font-semibold text-gray-800">{profile.age}</span>
          </div>
          <div className="flex flex-col items-center">
            <img src="https://img.icons8.com/ios/50/000000/blood-bag.png" alt="Blood" className="h-8 w-8 mb-1" />
            <span className="text-sm text-gray-500">Blood</span>
            <span className="font-semibold text-gray-800">{profile.bloodGroup}</span>
          </div>
        </div>
        <div className="mt-8">
          <h3 className="text-xl font-bold text-gray-800 mb-3">About</h3>
          <p className="text-gray-700 leading-relaxed">{profile.aboutMe}</p>
        </div>
        <div className="mt-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Family Members</h3>
          <div className="flex space-x-4 overflow-x-auto pb-2">
            {profile.familyMembers?.map((member, idx) => (
              <div key={idx} className="flex flex-col items-center flex-shrink-0">
                <img src={member.avatar} alt={member.name} className="w-16 h-16 rounded-full object-cover border-2 border-gray-200" />
                <span className="text-sm text-gray-700 mt-2 whitespace-nowrap">{member.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* My Records Section */}
      <div className="w-full max-w-5xl mx-auto bg-white/40 rounded-3xl shadow-2xl p-6 mt-2 backdrop-blur-md animate-fade-in-up">
        <h3 className="text-xl font-bold mb-6 text-indigo-700 tracking-wide animate-fade-in-up">My Records</h3>
        {records.length === 0 ? (
          <div className="text-gray-500">No records found.</div>
        ) : (
          <div className="flex flex-wrap justify-center gap-10">
            {records.map((record, idx) => (
              <div
                key={record.public_id}
                className="flex flex-col items-center bg-white/70 rounded-2xl shadow-2xl border border-indigo-100 p-6 w-64 transition-transform duration-300 hover:scale-105 cursor-pointer animate-fade-in-up glass-card"
                style={{ animationDelay: `${idx * 80}ms` }}
                onClick={() => { setModalImg(record.url); setModalOpen(true); }}
              >
                <img
                  src={record.url}
                  alt={record.fileName}
                  className="w-44 h-44 object-cover rounded-xl mb-4 border-2 border-indigo-200 shadow-lg animate-zoom-in"
                  style={{ animationDelay: `${idx * 80 + 100}ms` }}
                />
                <span className="block text-xs text-indigo-500 mb-1 font-semibold">{record.docType ? record.docType : 'No type specified'}</span>
                <span className="text-xs text-gray-700 mt-2 font-medium">{record.uploadedAt ? new Date(record.uploadedAt).toLocaleDateString() : ''}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Modal for big image view */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-indigo-900/80 via-blue-900/70 to-teal-800/80 animate-fade-in" onClick={() => setModalOpen(false)}>
          <div className="bg-white/90 rounded-3xl shadow-2xl p-6 relative flex flex-col items-center animate-modal-pop glass-card" onClick={e => e.stopPropagation()}>
            <img src={modalImg} alt="Document" className="w-[400px] h-[400px] object-contain rounded-2xl mb-4 animate-zoom-in" />
            <button className="absolute top-2 right-2 text-gray-700 text-2xl font-bold hover:text-red-500 bg-white/70 rounded-full px-3 py-1 shadow" onClick={() => setModalOpen(false)}>&times;</button>
          </div>
          <style>{`
            @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
            @keyframes zoom-in { from { transform: scale(0.8); opacity: 0.7; } to { transform: scale(1); opacity: 1; } }
            @keyframes fade-in-up { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
            @keyframes modal-pop { from { transform: scale(0.85); opacity: 0.7; } to { transform: scale(1); opacity: 1; } }
            @keyframes bg-fade { from { background-position: 0% 50%; } to { background-position: 100% 50%; }
            .animate-fade-in { animation: fade-in 0.3s; }
            .animate-zoom-in { animation: zoom-in 0.4s cubic-bezier(0.4,0,0.2,1); }
            .animate-fade-in-up { animation: fade-in-up 0.5s cubic-bezier(0.4,0,0.2,1) both; }
            .animate-modal-pop { animation: modal-pop 0.35s cubic-bezier(0.4,0,0.2,1); }
            .animate-bg-fade { animation: bg-fade 8s ease-in-out infinite alternate; background-size: 200% 200%; }
            .glass-card { backdrop-filter: blur(8px) saturate(1.2); background: rgba(255,255,255,0.7); }
          `}</style>
        </div>
      )}
    </div>
  );
};

export default UserProfileForDoctor;
