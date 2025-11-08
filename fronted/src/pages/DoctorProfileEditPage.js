import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { getDoctorByIdAPI, updateDoctorProfileAPI } from '../api/doctorApi';
import DoctorChatBot from '../components/DoctorChatBot';

const allowedSpecialties = ['Neurology', 'Cardiology', 'Orthopedics', 'Dermatology'];

const DoctorProfileEditPage = () => {
  const { auth } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    bio: '',
    experience: 0,
    consultationFee: 0,
    specialty: '',
    clinicName: '',
    city: '',
    address: '',
    profilePicture: '',
    timings: [],
    availability: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef();

  useEffect(() => {
    const loadProfile = async () => {
      if (auth?.token) {
        try {
          const doctor = await getDoctorByIdAPI(auth._id);
          setFormData({
            bio: doctor.profileDetails.bio || '',
            experience: doctor.profileDetails.experience || 0,
            consultationFee: doctor.profileDetails.consultationFee || 0,
            specialty: doctor.profileDetails.specialty || '',
            clinicName: doctor.clinicName || '',
            city: doctor.city || '',
            address: doctor.address || '',
            profilePicture: doctor.profileDetails.profilePicture || '',
            timings: doctor.timings || [],
            availability: doctor.availability || [],
          });
        } catch (err) {
          setError('Could not load profile data.');
        } finally {
          setLoading(false);
        }
      }
    };
    loadProfile();
  }, [auth]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle profile picture file upload
  const handleProfilePicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const formDataObj = new FormData();
      formDataObj.append('image', file);
      // Use the correct backend endpoint for image upload
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${auth.token}` },
        body: formDataObj
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      // The backend returns the full message object, but we want the imageUrl
      if (data.imageUrl) {
        setFormData(prev => ({ ...prev, profilePicture: data.imageUrl }));
      } else if (data.url) {
        setFormData(prev => ({ ...prev, profilePicture: data.url }));
      } else {
        setError('Image upload failed.');
      }
    } catch (err) {
      setError('Image upload failed.');
    }
    setUploading(false);
  };

  // Timings and availability handlers
  const handleTimingChange = (idx, field, value) => {
    const newTimings = [...formData.timings];
    newTimings[idx][field] = value;
    setFormData({ ...formData, timings: newTimings });
  };
  const addTiming = () => {
    setFormData({ ...formData, timings: [...formData.timings, { day: '', startTime: '', endTime: '', isOpen: true }] });
  };
  const removeTiming = (idx) => {
    const newTimings = formData.timings.filter((_, i) => i !== idx);
    setFormData({ ...formData, timings: newTimings });
  };

  // Availability handlers
  const handleAvailabilityChange = (idx, field, value) => {
    const newAvailability = [...formData.availability];
    newAvailability[idx][field] = value;
    setFormData({ ...formData, availability: newAvailability });
  };
  const addAvailability = () => {
    setFormData({ ...formData, availability: [...formData.availability, { date: '', slots: [] }] });
  };
  const removeAvailability = (idx) => {
    const newAvailability = formData.availability.filter((_, i) => i !== idx);
    setFormData({ ...formData, availability: newAvailability });
  };
  const handleSlotChange = (availIdx, slotIdx, field, value) => {
    const newAvailability = [...formData.availability];
    newAvailability[availIdx].slots[slotIdx][field] = value;
    setFormData({ ...formData, availability: newAvailability });
  };
  const addSlot = (availIdx) => {
    const newAvailability = [...formData.availability];
    newAvailability[availIdx].slots.push({ time: '', isBooked: false });
    setFormData({ ...formData, availability: newAvailability });
  };
  const removeSlot = (availIdx, slotIdx) => {
    const newAvailability = [...formData.availability];
    newAvailability[availIdx].slots = newAvailability[availIdx].slots.filter((_, i) => i !== slotIdx);
    setFormData({ ...formData, availability: newAvailability });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const dataToUpdate = {
        profileDetails: {
          bio: formData.bio,
          experience: formData.experience,
          consultationFee: formData.consultationFee,
          specialty: formData.specialty,
          profilePicture: formData.profilePicture,
        },
        clinicName: formData.clinicName,
        city: formData.city,
        address: formData.address,
        timings: formData.timings,
        availability: formData.availability,
      };
      await updateDoctorProfileAPI(dataToUpdate, auth.token);
      setMessage('Profile updated successfully!');
      // Redirect to DoctorProfilePage to show updated info
      setTimeout(() => navigate(`/doctor/profile/${auth._id}`), 1500); // Redirect to profile after edit
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p className="text-center p-10">Loading...</p>;

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12">
      <DoctorChatBot />
      <div className="w-full max-w-lg bg-white p-8 rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Edit Your Profile</h2>
        {error && <p className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-center">{error}</p>}
        {message && <p className="bg-green-100 text-green-700 p-3 rounded-lg mb-4 text-center">{message}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="bio" className="block font-semibold">About Me</label>
            <textarea name="bio" value={formData.bio} onChange={handleChange} rows="4" className="w-full p-3 border rounded-lg mt-1"></textarea>
          </div>
          <div>
            <label htmlFor="specialty" className="block font-semibold">Specialty</label>
            <select name="specialty" value={formData.specialty} onChange={handleChange} className="w-full p-3 border rounded-lg mt-1">
              <option value="">Select Specialty</option>
              {allowedSpecialties.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="clinicName" className="block font-semibold">Clinic Name</label>
            <input type="text" name="clinicName" value={formData.clinicName} onChange={handleChange} className="w-full p-3 border rounded-lg mt-1" />
          </div>
          <div>
            <label htmlFor="city" className="block font-semibold">City</label>
            <input type="text" name="city" value={formData.city} onChange={handleChange} className="w-full p-3 border rounded-lg mt-1" />
          </div>
          <div>
            <label htmlFor="address" className="block font-semibold">Address</label>
            <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full p-3 border rounded-lg mt-1" />
          </div>
          <div>
            <label htmlFor="profilePicture" className="block font-semibold">Profile Picture</label>
            <div className="flex items-center gap-4 mt-1">
              {formData.profilePicture && (
                <img src={formData.profilePicture} alt="Profile Preview" className="w-16 h-16 rounded-full object-cover border-2 border-teal-400 shadow" />
              )}
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleProfilePicUpload}
                className="block"
                disabled={uploading}
              />
            </div>
            <input type="text" name="profilePicture" value={formData.profilePicture} onChange={handleChange} className="w-full p-3 border rounded-lg mt-2" placeholder="Or paste image URL" />
            {uploading && <div className="text-blue-500 text-sm mt-1">Uploading...</div>}
          </div>
          <div>
            <label htmlFor="experience" className="block font-semibold">Experience (in years)</label>
            <input type="number" name="experience" value={formData.experience} onChange={handleChange} className="w-full p-3 border rounded-lg mt-1" />
          </div>
          <div>
            <label htmlFor="consultationFee" className="block font-semibold">Consultation Fee (INR)</label>
            <input type="number" name="consultationFee" value={formData.consultationFee} onChange={handleChange} className="w-full p-3 border rounded-lg mt-1" />
          </div>
          <div>
            <label className="block font-semibold">Clinic Timings</label>
            {formData.timings.map((timing, idx) => (
              <div key={idx} className="flex space-x-2 items-center mb-2">
                <select value={timing.day} onChange={e => handleTimingChange(idx, 'day', e.target.value)} className="p-2 border rounded">
                  <option value="">Day</option>
                  {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map(day => <option key={day} value={day}>{day}</option>)}
                </select>
                <input type="time" value={timing.startTime} onChange={e => handleTimingChange(idx, 'startTime', e.target.value)} className="p-2 border rounded" />
                <input type="time" value={timing.endTime} onChange={e => handleTimingChange(idx, 'endTime', e.target.value)} className="p-2 border rounded" />
                <label className="ml-2"><input type="checkbox" checked={timing.isOpen} onChange={e => handleTimingChange(idx, 'isOpen', e.target.checked)} /> Open</label>
                <button type="button" onClick={() => removeTiming(idx)} className="text-red-500 ml-2">Remove</button>
              </div>
            ))}
            <button type="button" onClick={addTiming} className="bg-blue-100 text-blue-700 px-3 py-1 rounded">Add Timing</button>
          </div>
          <div>
            <label className="block font-semibold">Availability (Appointment Slots)</label>
            {formData.availability.map((avail, availIdx) => (
              <div key={availIdx} className="border p-2 mb-2 rounded">
                <input type="date" value={avail.date} onChange={e => handleAvailabilityChange(availIdx, 'date', e.target.value)} className="p-2 border rounded mr-2" />
                <button type="button" onClick={() => removeAvailability(availIdx)} className="text-red-500 ml-2">Remove Date</button>
                <div className="ml-4">
                  {avail.slots.map((slot, slotIdx) => (
                    <div key={slotIdx} className="flex space-x-2 items-center mb-1">
                      <input type="text" value={slot.time} onChange={e => handleSlotChange(availIdx, slotIdx, 'time', e.target.value)} placeholder="Time (e.g. 09:00 AM)" className="p-2 border rounded" />
                      <button type="button" onClick={() => removeSlot(availIdx, slotIdx)} className="text-red-500">Remove Slot</button>
                    </div>
                  ))}
                  <button type="button" onClick={() => addSlot(availIdx)} className="bg-blue-100 text-blue-700 px-2 py-1 rounded">Add Slot</button>
                </div>
              </div>
            ))}
            <button type="button" onClick={addAvailability} className="bg-blue-100 text-blue-700 px-3 py-1 rounded">Add Date</button>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 disabled:bg-blue-300">
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default DoctorProfileEditPage;
