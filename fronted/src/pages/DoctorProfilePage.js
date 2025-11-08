  import React, { useState, useEffect, useContext } from 'react';
  import { useParams, useNavigate } from 'react-router-dom';
  import { getDoctorByIdAPI } from '../api/doctorApi';
  import { submitDoctorReviewAPI, editDoctorReviewAPI, deleteDoctorReviewAPI, bookAppointmentAPI } from '../api/userApi';
  import axios from 'axios';
  import AuthContext from '../context/AuthContext';
import DoctorChatBot from '../components/DoctorChatBot';



  const DoctorProfilePage = () => {
    console.log('DoctorProfilePage mounted');
    const { doctorId } = useParams();
    const { auth } = useContext(AuthContext);
    const navigate = useNavigate();
    
    const [doctor, setDoctor] = useState(null);
    const [hasActiveAppointment, setHasActiveAppointment] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [refreshKey, setRefreshKey] = useState(0); // Add refresh key

    // Review/rating state (fully restored)
    const [review, setReview] = useState("");
    const [rating, setRating] = useState(0);
    const [submittingReview, setSubmittingReview] = useState(false);
    const [reviewError, setReviewError] = useState("");
    const [reviewSuccess, setReviewSuccess] = useState("");
    const [editingReviewId, setEditingReviewId] = useState(null);
    const [editReviewText, setEditReviewText] = useState("");
    const [editReviewRating, setEditReviewRating] = useState(0);
    const [editError, setEditError] = useState("");
    const [editSuccess, setEditSuccess] = useState("");
    // Clear success message when user types or changes rating
    const handleReviewChange = (e) => {
      setReview(e.target.value);
      if (reviewSuccess) setReviewSuccess("");
    };
    const handleRatingChange = (e) => {
      setRating(Number(e.target.value));
      if (reviewSuccess) setReviewSuccess("");
    };

    // Review submit handler
    const handleReviewSubmit = async (e) => {
      e.preventDefault();
      setReviewError("");
      setReviewSuccess("");
      setSubmittingReview(true);
      try {
        await submitDoctorReviewAPI(doctorId, { comment: review, rating }, auth.token);
        setReviewSuccess("Review submitted successfully!");
        setReview("");
        setRating(0);
        setRefreshKey(prev => prev + 1); // This triggers doctor profile refresh
      } catch (err) {
        setReviewError(err.message || "Failed to submit review.");
      } finally {
        setSubmittingReview(false);
      }
    };

    // Edit review handler
    const handleEditClick = (reviewObj) => {
      setEditingReviewId(reviewObj._id);
      setEditReviewText(reviewObj.comment);
      setEditReviewRating(reviewObj.rating);
      setEditError("");
      setEditSuccess("");
    };

    const handleEditCancel = () => {
      setEditingReviewId(null);
      setEditReviewText("");
      setEditReviewRating(0);
      setEditError("");
      setEditSuccess("");
    };

    const handleEditSave = async (e) => {
      e.preventDefault();
      setEditError("");
      setEditSuccess("");
      try {
        await editDoctorReviewAPI(doctorId, editingReviewId, { comment: editReviewText, rating: editReviewRating }, auth.token);
        setEditSuccess("Review updated successfully!");
        setEditingReviewId(null);
        setEditReviewText("");
        setEditReviewRating(0);
        setRefreshKey(prev => prev + 1);
      } catch (err) {
        setEditError(err.message || "Failed to update review.");
      }
    };

    // Delete review handler
    const handleDeleteReview = async (reviewId) => {
      if (!window.confirm("Are you sure you want to delete this review?")) return;
      setEditError("");
      setEditSuccess("");
      try {
        await deleteDoctorReviewAPI(doctorId, reviewId, auth.token);
        setEditSuccess("Review deleted successfully!");
        setEditingReviewId(null);
        setEditReviewText("");
        setEditReviewRating(0);
        setRefreshKey(prev => prev + 1);
      } catch (err) {
        setEditError(err.message || "Failed to delete review.");
      }
    };
    // ...existing code...

    const fetchDoctorProfile = React.useCallback(async () => {
      try {
        setLoading(true);
        const data = await getDoctorByIdAPI(doctorId);
        setDoctor(data);
        // Check if user has active appointment with this doctor
        if (auth && auth.type === 'user') {
          try {
            const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}
/api/appointments/my`, {
              headers: { Authorization: `Bearer ${auth.token}` }
            });
            // Find appointment with this doctor
            const found = res.data.find(a => a.doctor === doctorId);
            setHasActiveAppointment(!!found);
          } catch {
            setHasActiveAppointment(false);
          }
        } else {
          setHasActiveAppointment(false);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }, [doctorId, auth]);

    useEffect(() => {
      fetchDoctorProfile();
    }, [fetchDoctorProfile, refreshKey]);

    // Manual refresh button for instant update
    const handleManualRefresh = () => {
      setRefreshKey(prev => prev + 1);
    };

    // Popup/modal state for health questions
    const [showPopup, setShowPopup] = useState(false);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingError, setBookingError] = useState("");
    const [bookingSuccess, setBookingSuccess] = useState("");
    const [symptoms, setSymptoms] = useState({ problem: "", duration: "", extra: "" });

    // Booking API call with symptoms
    const handleConfirmBooking = async () => {
    setBookingLoading(true);
    setBookingError("");
    setBookingSuccess("");
    // Validate all required booking details
    const bookingDate = doctor.availability[selectedDay]?.date;
    const bookingTime = selectedTime;
    const userId = auth && auth._id ? auth._id : (auth && auth.userId ? auth.userId : null);
    if (!doctorId || !bookingDate || !bookingTime || !userId) {
      setBookingError("Missing booking details. Please select date, time, and make sure you are logged in.");
      setBookingLoading(false);
      return;
    }
    try {
      await bookAppointmentAPI({
        doctorId,
        doctorName: doctor.name,
        date: bookingDate,
        time: bookingTime,
        userId,
        fee: doctor.profileDetails.consultationFee,
        symptoms: `Dikkat: ${symptoms.problem}, Duration: ${symptoms.duration}, Extra: ${symptoms.extra}`
      }, auth.token);
      setBookingSuccess("Appointment booked successfully!");
      setShowPopup(false);
      setSymptoms({ problem: "", duration: "", extra: "" });
      // Immediately re-fetch appointments to update chat button
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}
/api/appointments/my`, {
          headers: { Authorization: `Bearer ${auth.token}` }
        });
        const found = res.data.find(a => a.doctor === doctorId);
        setHasActiveAppointment(!!found);
      } catch {
        setHasActiveAppointment(false);
      }
      setRefreshKey(prev => prev + 1); // Refresh profile after booking
    } catch (err) {
      setBookingError(err.message || "Booking failed.");
      setShowPopup(false);
    } finally {
      setBookingLoading(false);
    }
    };

    // Book button now opens popup for health questions
    const handleBookAppointment = () => {
      if (!auth) {
        navigate('/login/user');
        return;
      }
      if (!selectedTime) return;
      setShowPopup(true);
    };

    // Move these to the top, after other useState hooks, before any conditional returns
    const [selectedDay, setSelectedDay] = useState(0);
    const [selectedSlot, setSelectedSlot] = useState('Afternoon');
    const [selectedTime, setSelectedTime] = useState(null);



    if (loading) return <div className="text-center p-10">Loading Doctor's Profile...</div>;
    if (error) return <div className="text-center p-10 text-red-500">{error}</div>;
    if (!doctor) return <div className="text-center p-10">Doctor not found.</div>;

    const handleGoToMyProfile = () => {
      if (auth && auth.type === 'doctor') {
        navigate(`/doctor/profile/${auth._id}`);
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-100 via-blue-100 to-white animate-fade-in-up">
        <DoctorChatBot />
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 animate-fade-in-up">
            <button onClick={handleManualRefresh} className="bg-gradient-to-r from-blue-500 to-teal-400 text-white px-5 py-2 rounded-xl shadow-lg font-bold hover:scale-105 transition-all mb-2 sm:mb-0 animate-pulse-on-hover">Refresh Profile</button>
            {auth && auth.type === 'doctor' && auth._id !== doctorId && (
              <button onClick={handleGoToMyProfile} className="bg-gradient-to-r from-teal-500 to-blue-400 text-white px-5 py-2 rounded-xl shadow-lg font-bold hover:scale-105 transition-all animate-pulse-on-hover">Go to My Profile</button>
            )}
          </div>
          {auth && auth.type === 'doctor' && String(auth._id) === String(doctorId) && (
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between animate-fade-in-up">
              <span className="text-green-700 font-semibold mb-2 sm:mb-0 animate-fade-in-up">You are viewing your own profile. Any changes will be instantly reflected here.</span>
              <button
                onClick={() => navigate('/doctor/profile/edit')}
                className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white px-5 py-2 rounded-xl shadow-lg font-bold hover:scale-105 transition-all animate-pulse-on-hover"
              >
                Edit Profile
              </button>
            </div>
          )}
          <div className="relative flex flex-col sm:flex-row items-center space-y-6 sm:space-y-0 sm:space-x-8 bg-white/70 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-blue-100 animate-fade-in-up animate-float-card">
            <div className="relative">
              <img
                className="w-40 h-40 rounded-full border-4 border-teal-400 object-cover shadow-xl animate-profile-pop"
                src={doctor.profileDetails.profilePicture || `https://i.pravatar.cc/150?u=${doctor._id}`}
                alt={doctor.name}
              />
              <span className="absolute bottom-2 right-2 w-5 h-5 rounded-full border-2 border-white bg-green-400 animate-pulse"></span>
            </div>
            <div className="text-center sm:text-left flex-grow">
              <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-700 mb-2 animate-heading-glow">{doctor.name}</h1>
              <p className="text-teal-700 font-semibold text-xl animate-fade-in-up delay-200">{doctor.profileDetails.specialty}</p>
              <p className="text-md text-blue-500 mt-1 animate-fade-in-up delay-300">{doctor.clinicName}, {doctor.city}</p>
              <div className={`text-lg font-bold p-3 rounded-md text-center mt-2 mb-2 animate-fade-in-up delay-400 ${doctor.currentStatus === 'Available' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {doctor.currentStatus}
              </div>
              {(!auth || auth.type !== 'doctor') && (
                <button
                  className="mt-2 bg-gradient-to-r from-teal-500 to-blue-500 text-white px-6 py-2 rounded-xl font-bold shadow-lg hover:scale-105 transition-all animate-fade-in-up delay-500 animate-pulse-on-hover"
                  onClick={() => navigate(`/chat/${doctor._id}`)}
                >
                  Chat
                </button>
              )}
            </div>
            <div className="w-full sm:w-auto">
              {(!auth || auth.type === 'user') && doctor.currentStatus && doctor.currentStatus.toLowerCase() === 'available' && (
                <button onClick={handleBookAppointment} className="w-full bg-gradient-to-r from-teal-500 to-green-400 text-white font-bold py-3 px-8 rounded-2xl shadow-lg hover:scale-105 transition-all animate-fade-in-up delay-600 animate-pulse-on-hover">
                  Book Appointment (₹{doctor.profileDetails.consultationFee})
                </button>
              )}
            </div>
          </div>

          {/* About Section */}
          <div className="bg-white/80 backdrop-blur-lg p-8 rounded-3xl shadow-xl mt-10 border border-blue-100 animate-fade-in-up animate-float-card">
            <h3 className="text-2xl font-bold text-blue-700 mb-4 animate-heading-glow">About</h3>
            <p className="text-blue-900 mb-2 text-lg"><span className="font-semibold">Bio:</span> {doctor.profileDetails.bio || 'No bio provided.'}</p>
            <p className="text-blue-900 text-lg"><span className="font-semibold">Experience:</span> {doctor.profileDetails.experience || 0} years</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10">
            {/* Schedules Section - Show for all users */}
            <div className="lg:col-span-1">
              <div className="bg-white/80 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-blue-100 animate-fade-in-up animate-float-card">
                {/* Doctor's Schedule - Modern UI with weekday and date, fully interactive */}
                <h3 className="text-xl font-bold text-blue-700 mb-4 border-b pb-2 animate-heading-glow">Schedules</h3>
                {doctor.availability && doctor.availability.length > 0 ? (
                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    {/* Interactive Day selector row - show weekday and date, highlight selected */}
                    <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                      {doctor.availability.map((schedule, idx) => {
                        const dateObj = new Date(schedule.date);
                        const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                        const dateStr = schedule.date;
                        return (
                          <button
                            key={schedule._id || idx}
                            className={`flex flex-col items-center px-3 py-2 rounded-xl min-w-[60px] cursor-pointer transition-all duration-200 border-2 ${selectedDay === idx ? 'bg-gradient-to-br from-teal-500 to-blue-500 text-white border-teal-700 scale-110 shadow-lg' : 'bg-gray-100 text-gray-800 border-transparent hover:bg-blue-100 hover:scale-105'}`}
                            onClick={() => { setSelectedDay(idx); setSelectedTime(null); }}
                          >
                            <span className="text-xs font-semibold mb-1">{weekday}</span>
                            <span className="font-bold text-sm">{dateStr}</span>
                          </button>
                        );
                      })}
                    </div>
                    {/* Interactive Time slot selector row */}
                    <div className="flex gap-2 mb-4 bg-gray-100 rounded-full p-1 w-fit mx-auto">
                      {['Morning', 'Afternoon', 'Evening'].map((slot) => (
                        <button
                          key={slot}
                          className={`px-4 py-2 rounded-full font-semibold shadow transition-all duration-200 ${selectedSlot === slot ? 'bg-gradient-to-r from-teal-500 to-blue-500 text-white scale-110' : 'bg-white text-gray-700 hover:bg-blue-100 hover:scale-105'}`}
                          onClick={() => { setSelectedSlot(slot); setSelectedTime(null); }}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                    {/* Time slots for selected day and slot - now clickable */}
                    <div className="bg-white rounded-xl p-4 shadow flex flex-col gap-2 mb-4">
                      <div className="font-semibold text-gray-700 mb-2">{selectedSlot} Slots</div>
                      <div className="flex gap-2 flex-wrap">
                        {doctor.availability[selectedDay] && Array.isArray(doctor.availability[selectedDay].slots) && doctor.availability[selectedDay].slots.length > 0 ? (
                          doctor.availability[selectedDay].slots
                            .filter(s => {
                              // Morning: 5am-12pm, Afternoon: 12pm-5pm, Evening: 5pm-10pm
                              let timeStr = typeof s === 'string' ? s : s.time;
                              if (!timeStr) return false;
                              // Extract hour and period
                              let match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
                              if (!match) return false;
                              let hour = parseInt(match[1], 10);
                              let min = parseInt(match[2], 10);
                              let period = match[3].toUpperCase();
                              // Convert to 24hr
                              if (period === 'PM' && hour !== 12) hour += 12;
                              if (period === 'AM' && hour === 12) hour = 0;
                              let totalMins = hour * 60 + min;
                              if (selectedSlot === 'Morning') return totalMins >= 300 && totalMins < 720; // 5:00-12:00
                              if (selectedSlot === 'Afternoon') return totalMins >= 720 && totalMins < 1020; // 12:00-17:00
                              if (selectedSlot === 'Evening') return totalMins >= 1020 && totalMins < 1320; // 17:00-22:00
                              return false;
                            })
                            .map((s, i) => {
                              const timeStr = typeof s === 'string' ? s : s.time;
                              const isSelected = selectedTime === timeStr;
                              return (
                                <button
                                  key={i}
                                  className={`px-4 py-2 rounded-lg text-center font-semibold text-sm border transition-all duration-150 ${isSelected ? 'bg-gradient-to-r from-teal-600 to-blue-600 text-white border-teal-700 scale-110 shadow-lg' : 'bg-gray-100 text-teal-700 border-gray-300 hover:bg-blue-100 hover:scale-105'} `}
                                  onClick={() => setSelectedTime(isSelected ? null : timeStr)}
                                >
                                  {timeStr}
                                </button>
                              );
                            })
                        ) : (
                          <div className="text-gray-400 text-sm">No slots</div>
                        )}
                      </div>
                    </div>
                    {/* Book Appointment button, only enabled if both date and time selected, moved slightly down */}
                    {(!auth || auth.type === 'user') && doctor.currentStatus && doctor.currentStatus.toLowerCase() === 'available' && (
                      <button
                        onClick={handleBookAppointment}
                        disabled={!selectedTime}
                        className={`w-full font-bold py-4 rounded-xl text-lg mt-6 shadow-lg transition-all duration-150 ${selectedTime ? 'bg-gradient-to-r from-teal-500 to-green-500 text-white hover:scale-105 animate-pulse-on-hover' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                      >
                        Book Appointment (₹{doctor.profileDetails.consultationFee})
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-gray-500 mb-4">No schedules saved yet.</div>
                )}
                {/* Only show edit button for doctor viewing own profile */}
                {auth && auth.type === 'doctor' && String(auth._id) === String(doctorId) && (
                  <button onClick={() => navigate('/doctor/profile/edit')} className="bg-teal-500 text-white px-4 py-2 rounded font-bold mt-2">Edit Schedules</button>
                )}
              </div>
            </div>

            {/* Reviews Section (fully restored) */}
            <div className="lg:col-span-2">
              <div className="bg-white/80 backdrop-blur-lg p-8 rounded-3xl shadow-xl border border-blue-100 animate-fade-in-up animate-float-card">
                <h3 className="text-xl font-bold text-blue-700 mb-4 border-b pb-2 animate-heading-glow">Reviews</h3>
                {/* Show average rating and number of reviews */}
                <div className="mb-4 flex items-center gap-2 animate-fade-in-up">
                  <span className="text-yellow-400 font-bold text-2xl">★</span>
                  <span className="text-xl font-semibold text-blue-900">{doctor.rating?.toFixed(1) || 0} / 5</span>
                  <span className="ml-2 text-blue-400">({doctor.numReviews || 0} reviews)</span>
                </div>
                {/* List of reviews */}
                <div className="space-y-4 mb-6">
                  {doctor.reviews && doctor.reviews.length > 0 ? (
                    doctor.reviews.map((r) => {
                      const isOwnReview = auth && auth.type === 'user' && r.user === auth._id;
                      if (editingReviewId === r._id) {
                        // Edit mode
                        return (
                          <form key={r._id} onSubmit={handleEditSave} className="border-b pb-2 animate-fade-in-up animate-float-card">
                            <div className="flex items-center mb-1 gap-2">
                              <span className="font-bold mr-2 text-blue-900">{r.name}</span>
                              <select value={editReviewRating} onChange={e => setEditReviewRating(Number(e.target.value))} className="border rounded p-1 ml-2">
                                {[1,2,3,4,5].map(star => (
                                  <option key={star} value={star}>{star} Star{star > 1 ? 's' : ''}</option>
                                ))}
                              </select>
                              <span className="ml-2 text-blue-400 text-xs">{new Date(r.createdAt).toLocaleDateString()}</span>
                            </div>
                            <textarea value={editReviewText} onChange={e => setEditReviewText(e.target.value)} className="border rounded p-2 w-full" rows={2} required />
                            {editError && <div className="text-red-500">{editError}</div>}
                            {editSuccess && <div className="text-green-600">{editSuccess}</div>}
                            <div className="flex space-x-2 mt-2">
                              <button type="submit" className="bg-gradient-to-r from-teal-500 to-blue-500 text-white px-3 py-1 rounded font-bold animate-pulse-on-hover">Save</button>
                              <button type="button" onClick={handleEditCancel} className="bg-gray-300 text-gray-800 px-3 py-1 rounded font-bold">Cancel</button>
                            </div>
                          </form>
                        );
                      }
                      return (
                        <div key={r._id} className="border-b pb-2 animate-fade-in-up animate-float-card">
                          <div className="flex items-center mb-1 gap-2">
                            <span className="font-bold mr-2 text-blue-900">{r.name}</span>
                            <span className="text-yellow-400">{'★'.repeat(r.rating)}</span>
                            <span className="ml-2 text-blue-400 text-xs">{new Date(r.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="text-blue-900">{r.comment}</div>
                          {isOwnReview && (
                            <div className="flex space-x-2 mt-2">
                              <button onClick={() => handleEditClick(r)} className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white px-3 py-1 rounded font-bold animate-pulse-on-hover">Edit</button>
                              <button onClick={() => handleDeleteReview(r._id)} className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 rounded font-bold animate-pulse-on-hover">Delete</button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-blue-400">No reviews yet.</div>
                  )}
                </div>
                {/* Review form for users */}
                {auth && auth.type === 'user' && (
                  <form onSubmit={handleReviewSubmit} className="space-y-4 animate-fade-in-up animate-float-card">
                    <div>
                      <label className="block font-semibold mb-1 text-blue-900">Your Rating:</label>
                      <select value={rating} onChange={handleRatingChange} className="border rounded p-2">
                        <option value={0}>Select</option>
                        {[1,2,3,4,5].map(star => (
                          <option key={star} value={star}>{star} Star{star > 1 ? 's' : ''}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold mb-1 text-blue-900">Your Review:</label>
                      <textarea value={review} onChange={handleReviewChange} className="border rounded p-2 w-full" rows={3} required />
                    </div>
                    {reviewError && <div className="text-red-500">{reviewError}</div>}
                    {reviewSuccess && <div className="text-green-600">{reviewSuccess}</div>}
                    <button type="submit" className="bg-gradient-to-r from-teal-500 to-blue-500 text-white px-4 py-2 rounded font-bold animate-pulse-on-hover" disabled={submittingReview}>
                      {submittingReview ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* Popup for health questions before confirming booking */}
          {showPopup && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 animate-fade-in-up">
              <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl p-10 w-full max-w-md mx-auto relative border border-blue-100 animate-fade-in-up animate-float-card">
                <h2 className="text-3xl font-bold mb-6 text-blue-700 animate-heading-glow">Appointment Details</h2>
                <div className="mb-4">
                  <div className="font-semibold text-blue-900">Doctor:</div>
                  <div className="mb-2 text-blue-700">{doctor.name}</div>
                  <div className="font-semibold text-blue-900">Date:</div>
                  <div className="mb-2 text-blue-700">{doctor.availability[selectedDay]?.date}</div>
                  <div className="font-semibold text-blue-900">Time:</div>
                  <div className="mb-2 text-blue-700">{selectedTime}</div>
                  <div className="font-semibold text-blue-900">Fees:</div>
                  <div className="mb-2 text-blue-700">₹{doctor.profileDetails.consultationFee}</div>
                  <label className="block mb-2 mt-4 text-blue-900">Kya dikkat hai?
                    <input type="text" className="border p-2 w-full rounded-lg" value={symptoms.problem} onChange={e => setSymptoms(s => ({ ...s, problem: e.target.value }))} />
                  </label>
                  <label className="block mb-2 text-blue-900">Kitne din se hai?
                    <input type="text" className="border p-2 w-full rounded-lg" value={symptoms.duration} onChange={e => setSymptoms(s => ({ ...s, duration: e.target.value }))} />
                  </label>
                  <label className="block mb-2 text-blue-900">Aur kuch kehna hai?
                    <input type="text" className="border p-2 w-full rounded-lg" value={symptoms.extra} onChange={e => setSymptoms(s => ({ ...s, extra: e.target.value }))} />
                  </label>
                </div>
                {bookingError && <div className="text-red-500 mb-2">{bookingError}</div>}
                {bookingSuccess && <div className="text-green-600 mb-2">{bookingSuccess}</div>}
                <div className="flex gap-4 mt-6">
                  <button
                    onClick={handleConfirmBooking}
                    disabled={bookingLoading || !symptoms.problem.trim() || !symptoms.duration.trim() || !symptoms.extra.trim()}
                    className={`bg-gradient-to-r from-teal-500 to-blue-500 text-white px-6 py-2 rounded-xl font-bold flex-1 shadow-lg hover:scale-105 transition-all animate-pulse-on-hover ${(!symptoms.problem.trim() || !symptoms.duration.trim() || !symptoms.extra.trim()) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {bookingLoading ? "Booking..." : "Confirm"}
                  </button>
                  <button
                    onClick={() => setShowPopup(false)}
                    disabled={bookingLoading}
                    className="bg-gray-300 text-gray-800 px-6 py-2 rounded-xl font-bold flex-1 hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        {/* Chat Modal Integration removed: now handled by dedicated chat page */}
        {/* container div close */}
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
          @keyframes profilePop {
            0% { transform: scale(0.8) rotate(-8deg); opacity: 0; }
            60% { transform: scale(1.05) rotate(2deg); opacity: 1; }
            100% { transform: scale(1) rotate(0deg); opacity: 1; }
          }
          .animate-profile-pop {
            animation: profilePop 1.2s cubic-bezier(0.23, 1, 0.32, 1) both;
          }
        `}</style>
      </div>

    );
  };
export default DoctorProfilePage;
