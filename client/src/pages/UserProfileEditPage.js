// src/pages/UserProfileEditPage.js
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { getUserProfileAPI, updateUserProfileAPI, addFamilyMemberAPI, removeFamilyMemberAPI } from '../api/userApi';

const UserProfileEditPage = () => {
    const { auth } = useContext(AuthContext);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        height: '',
        weight: '',
        age: '',
        bloodGroup: '',
        aboutMe: '',
    });
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [profilePictureFile, setProfilePictureFile] = useState(null);

    const [showAddFamilyMemberModal, setShowAddFamilyMemberModal] = useState(false);
    const [newFamilyMemberName, setNewFamilyMemberName] = useState('');
    const [newFamilyMemberAvatar, setNewFamilyMemberAvatar] = useState('');
    const [familyMemberError, setFamilyMemberError] = useState('');

    useEffect(() => {
        const fetchUserProfile = async () => {
            if (auth?.token && auth.type === 'user') {
                try {
                    const data = await getUserProfileAPI(auth.token);
                    setFormData({
                        name: data.name || '',
                        phone: data.phone || '',
                        height: data.height || '',
                        weight: data.weight || '',
                        age: data.age || '',
                        bloodGroup: data.bloodGroup || '',
                        aboutMe: data.aboutMe || '',
                    });
                    setUserProfile(data);
                } catch (err) {
                    setError('Could not load profile for editing.');
                    console.error("Fetch profile for edit error:", err);
                } finally {
                    setLoading(false);
                }
            } else {
                navigate('/login/user');
            }
        };
        fetchUserProfile();
    }, [auth, navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setProfilePictureFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        setSuccess('');

        console.log("handleSubmit: Form submission started."); // Debugging log 1

        try {
            const dataToSend = new FormData();
            for (const key in formData) {
                dataToSend.append(key, formData[key]);
            }
            if (profilePictureFile) {
                dataToSend.append('profilePic', profilePictureFile);
                console.log("handleSubmit: Profile picture file added to FormData."); // Debugging log 2
            } else {
                console.log("handleSubmit: No new profile picture selected."); // Debugging log 3
            }

            console.log("handleSubmit: Calling updateUserProfileAPI..."); // Debugging log 4
            const response = await updateUserProfileAPI(dataToSend, auth.token);
            
            console.log("handleSubmit: updateUserProfileAPI call successful. Response:", response); // Debugging log 5
            setSuccess('Profile updated successfully!');
            
            console.log("handleSubmit: Navigating to /profile/user..."); // Debugging log 6
            navigate('/profile/user'); // Navigate back to the UserProfilePage

        } catch (err) {
            console.error("handleSubmit: Error caught during submission:", err.response?.data || err.message); // Debugging log 7
            setError(err.response?.data?.message || 'Failed to update profile.');
        } finally {
            console.log("handleSubmit: Submission process finished."); // Debugging log 8
            setSubmitting(false);
        }
    };

    const handleAddFamilyMember = async () => {
        setFamilyMemberError('');
        if (!newFamilyMemberName.trim()) {
            setFamilyMemberError('Family member ka naam zaroori hai.');
            return;
        }
        try {
            const response = await addFamilyMemberAPI({ name: newFamilyMemberName, avatar: newFamilyMemberAvatar }, auth.token);
            setSuccess('Family member added successfully!');
            setUserProfile(prevProfile => ({
                ...prevProfile,
                familyMembers: response.familyMembers
            }));
            setNewFamilyMemberName('');
            setNewFamilyMemberAvatar('');
            setShowAddFamilyMemberModal(false);
        } catch (err) {
            setFamilyMemberError(err.response?.data?.message || 'Failed to add family member.');
            console.error("Add family member error:", err.response?.data || err.message);
        }
    };

    const handleRemoveFamilyMember = async (memberId) => {
        if (window.confirm('Kya aap is family member ko hatana chahte hain?')) {
            try {
                const response = await removeFamilyMemberAPI(memberId, auth.token);
                setSuccess('Family member removed successfully!');
                setUserProfile(prevProfile => ({
                    ...prevProfile,
                    familyMembers: response.familyMembers
                }));
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to remove family member.');
                console.error("Remove family member error:", err.response?.data || err.message);
            }
        }
    };

    const currentProfilePicUrl = profilePictureFile
        ? URL.createObjectURL(profilePictureFile)
        : (userProfile?.profilePic || "https://via.placeholder.com/150/9CA3AF/FFFFFF?text=Upload");

    if (loading) {
        return <div className="text-center p-10">Loading profile for editing...</div>;
    }

    return (
      <div className="min-h-screen font-sans flex items-center justify-center bg-orange-50 overflow-hidden">
        {/* Warm & Welcoming Soft Background with Subtle Animated Blobs */}
        <div className="pointer-events-none select-none absolute inset-0 z-0">
          <div className="absolute top-[-80px] left-[-60px] w-[260px] h-[220px] bg-orange-100 rounded-full blur-2xl opacity-60 animate-float-slow" style={{filter:'blur(40px)'}}></div>
          <div className="absolute bottom-[-60px] right-[-80px] w-[220px] h-[220px] bg-indigo-100 rounded-full blur-2xl opacity-50 animate-float-slow-rev" style={{filter:'blur(40px)'}}></div>
        </div>
        <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-amber-100 p-8 pt-14 z-10 animate-fade-in-up relative">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-8 drop-shadow-lg">Edit My Profile</h2>
          {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-center shadow">{error}</div>}
          {success && <div className="bg-green-100 text-green-700 p-3 rounded-lg mb-4 text-center shadow">{success}</div>}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Picture Upload */}
            <div className="text-center mb-6 animate-float-avatar">
              <label htmlFor="profilePicUpload" className="cursor-pointer group inline-block">
                <div className="relative w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-white shadow-md bg-indigo-100">
                  <img
                    src={currentProfilePicUrl}
                    alt="Profile Preview"
                    className="w-full h-full object-cover group-hover:opacity-80 transition"
                  />
                  <span className="absolute bottom-2 right-2 bg-white p-1 rounded-full shadow cursor-pointer group-hover:bg-indigo-100 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L15.232 5.232z" />
                    </svg>
                  </span>
                </div>
                <p className="mt-2 text-blue-600 hover:underline">Change Profile Photo</p>
              </label>
              <input
                type="file"
                id="profilePicUpload"
                name="profilePic"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
            {/* Basic Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up delay-200">
              <div>
                <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">Name:</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full p-3 rounded-xl border border-amber-100 bg-white focus:ring-2 focus:ring-indigo-300 shadow transition"
                  required
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-gray-700 text-sm font-bold mb-2">Phone Number:</label>
                <input
                  type="text"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full p-3 rounded-xl border border-amber-100 bg-white focus:ring-2 focus:ring-indigo-300 shadow transition"
                />
              </div>
            </div>
            {/* Metrics Fields */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in-up delay-300">
              <div>
                <label htmlFor="height" className="block text-gray-700 text-sm font-bold mb-2">Height:</label>
                <input
                  type="text"
                  id="height"
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                  className="w-full p-3 rounded-xl border border-amber-100 bg-white focus:ring-2 focus:ring-indigo-300 shadow transition"
                />
              </div>
              <div>
                <label htmlFor="weight" className="block text-gray-700 text-sm font-bold mb-2">Weight:</label>
                <input
                  type="text"
                  id="weight"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  className="w-full p-3 rounded-xl border border-amber-100 bg-white focus:ring-2 focus:ring-indigo-300 shadow transition"
                />
              </div>
              <div>
                <label htmlFor="age" className="block text-gray-700 text-sm font-bold mb-2">Age:</label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  className="w-full p-3 rounded-xl border border-amber-100 bg-white focus:ring-2 focus:ring-indigo-300 shadow transition"
                />
              </div>
              <div>
                <label htmlFor="bloodGroup" className="block text-gray-700 text-sm font-bold mb-2">Blood Group:</label>
                <input
                  type="text"
                  id="bloodGroup"
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleChange}
                  className="w-full p-3 rounded-xl border border-white/40 bg-white/60 focus:ring-2 focus:ring-indigo-300 shadow transition"
                />
              </div>
            </div>
            {/* About Me */}
            <div className="animate-fade-in-up delay-400">
              <label htmlFor="aboutMe" className="block text-gray-700 text-sm font-bold mb-2">About Me:</label>
              <textarea
                id="aboutMe"
                name="aboutMe"
                value={formData.aboutMe}
                onChange={handleChange}
                rows="4"
                className="w-full p-3 rounded-xl border border-amber-100 bg-white focus:ring-2 focus:ring-indigo-300 shadow transition resize-none"
              ></textarea>
            </div>
            <button
              type="submit"
              className={`w-full bg-indigo-600 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-indigo-700 transition-all disabled:opacity-60 animate-fade-in-up delay-500 ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={submitting}
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/profile/user')}
              className="w-full mt-4 bg-gray-300 text-gray-800 font-bold py-3 rounded-xl hover:bg-gray-400 transition-colors duration-300 animate-fade-in-up delay-600"
            >
              Cancel
            </button>
          </form>
          {/* Family Members Section - Edit View */}
          <div className="mt-8 border-t pt-6 animate-fade-in-up delay-700">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Family Members</h3>
            <div className="space-y-4">
              {userProfile?.familyMembers?.length > 0 ? (
                userProfile.familyMembers.map((member) => (
                  <div key={member._id} className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg shadow-sm">
                    <div className="flex items-center">
                      <img src={member.avatar || "https://via.placeholder.com/50/CCCCCC/FFFFFF?text=FM"} alt={member.name} className="w-12 h-12 rounded-full object-cover mr-4 border-2 border-gray-200" />
                      <span className="font-semibold text-gray-700">{member.name}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveFamilyMember(member._id)}
                      className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors duration-200"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center">Koi family member nahi hai.</p>
              )}
            </div>
            <button
              onClick={() => setShowAddFamilyMemberModal(true)}
              className="w-full mt-6 bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors duration-300"
            >
              Add New Family Member
            </button>
          </div>
          {/* Add Family Member Modal */}
          {showAddFamilyMemberModal && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md relative animate-fade-in-up delay-800">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Add Family Member</h3>
                {familyMemberError && <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-center shadow">{familyMemberError}</div>}
                <div className="mb-4">
                  <label htmlFor="newMemberName" className="block text-gray-700 text-sm font-bold mb-2">Name:</label>
                  <input
                    type="text"
                    id="newMemberName"
                    value={newFamilyMemberName}
                    onChange={(e) => setNewFamilyMemberName(e.target.value)}
                    className="w-full p-3 rounded-xl border border-amber-100 bg-white focus:ring-2 focus:ring-indigo-300 shadow transition"
                    required
                  />
                </div>
                <div className="mb-6">
                  <label htmlFor="newMemberAvatar" className="block text-gray-700 text-sm font-bold mb-2">Avatar URL (Optional):</label>
                  <input
                    type="text"
                    id="newMemberAvatar"
                    value={newFamilyMemberAvatar}
                    onChange={(e) => setNewFamilyMemberAvatar(e.target.value)}
                    className="w-full p-3 rounded-xl border border-amber-100 bg-white focus:ring-2 focus:ring-indigo-300 shadow transition"
                    placeholder="e.g., https://example.com/avatar.jpg"
                  />
                </div>
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowAddFamilyMemberModal(false)}
                    className="bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-xl hover:bg-gray-400 transition-colors duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddFamilyMember}
                    className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-xl hover:bg-indigo-700 transition-colors duration-300"
                  >
                    Add Member
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* Animations */}
          <style>{`
            @keyframes floatSlow {
              0% { transform: translateY(0) scale(1); }
              50% { transform: translateY(-24px) scale(1.03); }
              100% { transform: translateY(0) scale(1); }
            }
            .animate-float-slow {
              animation: floatSlow 7s ease-in-out infinite;
            }
            @keyframes floatSlowRev {
              0% { transform: translateY(0) scale(1); }
              50% { transform: translateY(24px) scale(1.03); }
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
            .delay-200 { animation-delay: 0.2s; }
            .delay-300 { animation-delay: 0.3s; }
            .delay-400 { animation-delay: 0.4s; }
            .delay-500 { animation-delay: 0.5s; }
            .delay-600 { animation-delay: 0.6s; }
            .delay-700 { animation-delay: 0.7s; }
            .delay-800 { animation-delay: 0.8s; }
            @keyframes floatAvatar {
              0% { transform: translateY(0) scale(1); }
              50% { transform: translateY(-12px) scale(1.04); }
              100% { transform: translateY(0) scale(1); }
            }
            .animate-float-avatar {
              animation: floatAvatar 5s ease-in-out infinite;
            }
          `}</style>
        </div>
      </div>
    );
};

export default UserProfileEditPage;