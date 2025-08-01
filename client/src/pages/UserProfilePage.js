// src/pages/UserProfilePage.js
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // ✅ useLocation import kiya
import AuthContext from '../context/AuthContext';
import { getUserProfileAPI } from '../api/userApi';

const UserProfilePage = () => {
    const { auth } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation(); // ✅ useLocation hook use kiya

    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            if (auth?.token && auth.type === 'user') {
                try {
                    setLoading(true); // Ensure loading state is true on re-fetch
                    const data = await getUserProfileAPI(auth.token);
                    const profileData = {
                        name: data?.name || "Patient Name",
                        phone: data?.phone || "N/A",
                        isPremiumMember: data?.isPremiumMember || false,
                        profilePic: data?.profilePic || "https://images.unsplash.com/photo-1573496359142-b8d8773400a4?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // Default image if none from API
                        height: data?.height || "5.8 in",
                        weight: data?.weight || "70 kg",
                        age: data?.age || "30",
                        bloodGroup: data?.bloodGroup || "A+",
                        aboutMe: data?.aboutMe || "I am a registered patient looking for convenient healthcare solutions. I appreciate personalized care and quick access to medical information.",
                        familyMembers: data?.familyMembers || [
                            { id: 1, name: "Sonu K.", avatar: "https://via.placeholder.com/50/FF5733/FFFFFF?text=SK" },
                            { id: 2, name: "Monu E.", avatar: "https://via.placeholder.com/50/33FF57/FFFFFF?text=ME" },
                            { id: 3, name: "Chinki A.", avatar: "https://via.placeholder.com/50/3357FF/FFFFFF?text=CA" },
                        ]
                    };
                    setUserProfile(profileData);
                } catch (err) {
                    setError('Could not load your profile.');
                    console.error("Profile fetch error:", err);
                } finally {
                    setLoading(false);
                }
            } else {
                navigate('/login/user');
            }
        };
        fetchProfile();
    }, [auth, navigate, location.key]); // ✅ location.key ko dependency array mein add kiya

    const handleEditProfile = () => {
        navigate('/profile/user/edit');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-xl font-medium text-gray-700">Loading your profile...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-xl font-medium text-red-600">{error}</div>
            </div>
        );
    }

    if (!userProfile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-xl font-medium text-gray-700">No profile data available. Please login.</div>
            </div>
        );
    }

    return (
        // ✅ Key prop add kiya. Jab location.key change hoga, React is div ko naya samjhega aur re-mount karega.
        <div key={location.key} className="min-h-screen font-sans flex items-center justify-center bg-orange-50">
          {/* Warm & Welcoming Soft Background */}
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-amber-100 p-8 pt-16 z-10 animate-fade-in-up relative">
            {/* Top Bar - Header */}
            <div className="bg-indigo-600 text-white p-4 flex justify-between items-center rounded-2xl shadow mb-8 relative z-10">
              <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/20 rounded-full transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-xl font-semibold drop-shadow">Profile</h1>
              <button onClick={handleEditProfile} className="p-2 hover:bg-indigo-100 hover:text-indigo-700 rounded-full transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L15.232 5.232z" />
                </svg>
              </button>
            </div>
            {/* Profile Image */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
              <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-md bg-indigo-100">
                <img
                  src={userProfile.profilePic || "https://via.placeholder.com/128/9CA3AF/FFFFFF?text=User"}
                  alt="User Profile"
                  className="w-full h-full object-cover"
                />
                <span onClick={handleEditProfile} className="absolute bottom-1 right-1 bg-white p-1 rounded-full shadow cursor-pointer hover:bg-blue-100 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L15.232 5.232z" />
                  </svg>
                </span>
              </div>
            </div>
            <div className="text-center mt-4">
              <h2 className="text-2xl font-bold text-gray-800 drop-shadow-lg">{userProfile.name}</h2>
              {userProfile.isPremiumMember && (
                <p className="text-sm text-gray-500 mt-1 inline-flex items-center bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full shadow">
                  Premium Member <span className="ml-1">✨</span>
                </p>
              )}
            </div>
            {/* Metrics Section (Height, Weight, Age, Blood) */}
            <div className="grid grid-cols-4 gap-4 text-center mt-8 p-4 bg-indigo-50 rounded-lg shadow-sm">
              <div className="flex flex-col items-center">
                <img src="https://img.icons8.com/ios/50/000000/height.png" alt="Height" className="h-8 w-8 mb-1" />
                <span className="text-sm text-gray-500">Height</span>
                <span className="font-semibold text-gray-800">{userProfile.height}</span>
              </div>
              <div className="flex flex-col items-center">
                <img src="https://img.icons8.com/ios/50/000000/weight.png" alt="Weight" className="h-8 w-8 mb-1" />
                <span className="text-sm text-gray-500">Weight</span>
                <span className="font-semibold text-gray-800">{userProfile.weight}</span>
              </div>
              <div className="flex flex-col items-center">
                <img src="https://img.icons8.com/ios/50/000000/birthday--v1.png" alt="Age" className="h-8 w-8 mb-1" />
                <span className="text-sm text-gray-500">Age</span>
                <span className="font-semibold text-gray-800">{userProfile.age}</span>
              </div>
              <div className="flex flex-col items-center">
                <img src="https://img.icons8.com/ios/50/000000/blood-bag.png" alt="Blood" className="h-8 w-8 mb-1" />
                <span className="text-sm text-gray-500">Blood</span>
                <span className="font-semibold text-gray-800">{userProfile.bloodGroup}</span>
              </div>
            </div>
            {/* About Me Section */}
            <div className="mt-8">
              <h3 className="text-xl font-bold text-gray-800 mb-3">About Me</h3>
              <p className="text-gray-700 leading-relaxed">
                {userProfile.aboutMe}
              </p>
            </div>
            {/* Family Members Section */}
            <div className="mt-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Family Member</h3>
              <div className="flex space-x-4 overflow-x-auto pb-2">
                {userProfile.familyMembers?.map((member) => (
                  <div key={member.id} className="flex flex-col items-center flex-shrink-0">
                    <img src={member.avatar || "https://via.placeholder.com/50/CCCCCC/FFFFFF?text=FM"} alt={member.name} className="w-16 h-16 rounded-full object-cover border-2 border-gray-200" />
                    <span className="text-sm text-gray-700 mt-2 whitespace-nowrap">{member.name}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Bottom Edit Profile Button */}
            <button
              className="w-full mt-8 bg-indigo-600 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-indigo-700 transition-all disabled:opacity-60"
              onClick={handleEditProfile}
            >
              Edit Profile
            </button>
            {/* Animations */}
            <style>{`
              @keyframes floatSlow {
                0% { transform: translateY(0) scale(1); }
                50% { transform: translateY(-32px) scale(1.04); }
                100% { transform: translateY(0) scale(1); }
              }
              .animate-float-slow {
                animation: floatSlow 7s ease-in-out infinite;
              }
              @keyframes floatSlowRev {
                0% { transform: translateY(0) scale(1); }
                50% { transform: translateY(32px) scale(1.04); }
                100% { transform: translateY(0) scale(1); }
              }
              .animate-float-slow-rev {
                animation: floatSlowRev 8s ease-in-out infinite;
              }
              @keyframes fadeInUp {
                0% { opacity: 0; transform: translateY(40px); }
                100% { opacity: 1; transform: translateY(0); }
              }
              .animate-fade-in-up {
                animation: fadeInUp 1s cubic-bezier(0.23, 1, 0.32, 1) both;
              }
            `}</style>
          </div>
        </div>
    );
};

export default UserProfilePage;