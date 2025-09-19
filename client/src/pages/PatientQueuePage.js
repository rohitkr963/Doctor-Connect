// // src/pages/PatientQueuePage.js
// import React, { useState, useEffect, useContext, useCallback } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import {
//     // getQueueStatusAPI,
//     fetchDoctorReviewsAPI,
//     submitDoctorReviewAPI,
//     editDoctorReviewAPI,
//     deleteDoctorReviewAPI
// } from '../api/userApi';
// import AuthContext from '../context/AuthContext';

// const PatientQueuePage = () => {
//     const { doctorId } = useParams(); // URL se doctorId nikalna
//     const { auth } = useContext(AuthContext);
//     const navigate = useNavigate();

//     const [queueStatus, setQueueStatus] = useState(null);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState('');
//     // Review states
//     const [reviews, setReviews] = useState([]);
//     const [myReview, setMyReview] = useState(null);
//     const [reviewText, setReviewText] = useState('');
//     const [reviewRating, setReviewRating] = useState(5);
//     const [reviewLoading, setReviewLoading] = useState(false);
//     const [reviewError, setReviewError] = useState('');

//     // useCallback ka use kiya hai fetchStatus function ko memoize karne ke liye
//     const fetchStatus = useCallback(async () => {
//         // Auth check yahan bhi zaroori hai agar component direct access ho
//         if (!auth?.token || auth.type !== 'user') {
//             navigate('/login/user'); // Agar user login nahi hai to login page par bhejein
//             return;
//         }
//         if (!doctorId) {
//             setError('Doctor ID missing. Kripya wapas jaakar doctor chunen.');
//             setLoading(false);
//             return;
//         }

//         try {
//             // setLoading(true);
//             // const data = await getQueueStatusAPI(doctorId, auth.token);
//             // setQueueStatus(data);
//             // setError('');
//         } catch (err) {
//             setError(err.message || 'Queue status load karne mein dikkat hui.');
//             setQueueStatus(null);
//             // Console me error bilkul mat print karo (silent)
//         } finally {
//             setLoading(false);
//         }
//     }, [auth, doctorId, navigate]); // Dependencies: auth, doctorId, navigate change hone par re-create karein


//     useEffect(() => {
//         fetchStatus(); // Page load hote hi data fetch karna
//         const interval = setInterval(fetchStatus, 5000);
//         return () => clearInterval(interval);
//     }, [fetchStatus]);

//     // Fetch reviews
//     useEffect(() => {
//         async function loadReviews() {
//             if (!doctorId || !auth?.token) return;
//             try {
//                 const data = await fetchDoctorReviewsAPI(doctorId, auth.token);
//                 setReviews(data);
//                 // Find my review
//                 const mine = data.find(r => r.userId === auth.userId);
//                 setMyReview(mine || null);
//                 if (mine) {
//                     setReviewText(mine.text);
//                     setReviewRating(mine.rating);
//                 } else {
//                     setReviewText('');
//                     setReviewRating(5);
//                 }
//             } catch (e) {
//                 setReviewError('Reviews load nahi ho paayi.');
//             }
//         }
//         loadReviews();
//     }, [doctorId, auth]);

//     useEffect(() => {
//         if (error && error.toLowerCase().includes('queue mein nahi hain')) {
//             navigate('/');
//         }
//     }, [error, navigate]);

//     // Removed unused handleRedirect

//     useEffect(() => {
//         if (error && error.toLowerCase().includes('queue mein nahi hain')) {
//             navigate('/');
//         }
//     }, [error, navigate]);

//     if (loading) {
//         return (
//             <div className="min-h-screen flex items-center justify-center bg-gray-100">
//                 <div className="text-xl font-medium text-gray-700">Queue status load ho raha hai...</div>
//             </div>
//         );
//     }

//     return (
//         <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 font-sans">
//             <div className="w-full max-w-lg bg-white p-8 rounded-xl shadow-lg text-center">
//                 {error ? (
//                     <>
//                         <h2 className="text-2xl font-bold text-red-600 mb-4">Oops! Kuch galat ho gaya.</h2>
//                         <p className="text-gray-600 mb-6">{error}</p>
//                         <button
//                             onClick={() => navigate('/')}
//                             className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition"
//                         >
//                             Homepage par wapas jaayen
//                         </button>
//                     </>
//                 ) : queueStatus ? (
//                     <>
//                         <h2 className="text-3xl font-bold text-gray-800 mb-6">Live Queue Status</h2>
//                         <p className="text-lg text-gray-700 mb-4">
//                             <span className="font-semibold text-teal-600">{queueStatus.doctorName}</span> ke liye
//                         </p>
//                         {/* Modern Rating UI */}
//                         {/* Premium Card-style Rating UI  */}
//                         <div className="flex items-center justify-center mb-6">
//                             <div className="bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-500 shadow-lg rounded-2xl px-6 py-4 flex flex-col items-center w-64 animate-fade-in">
//                                 <span className="text-white text-lg font-semibold mb-2 flex items-center gap-2">
//                                     Doctor Rating
//                                     <span className="text-2xl">{queueStatus.rating >= 4.5 ? '🌟' : queueStatus.rating >= 3.5 ? '👍' : '🙂'}</span>
//                                 </span>
//                                 <span className="text-5xl font-extrabold text-white drop-shadow-lg mb-1">{queueStatus.rating ? queueStatus.rating.toFixed(1) : 'N/A'}</span>
//                                 <span className="text-white text-sm font-medium">/ 5.0</span>
//                                 <div className="w-full mt-3">
//                                     <div className="h-2 bg-white bg-opacity-30 rounded-full">
//                                         <div
//                                             className="h-2 rounded-full bg-white bg-opacity-80 transition-all duration-700"
//                                             style={{ width: `${(queueStatus.rating ? queueStatus.rating : 0) * 20}%` }}
//                                         ></div>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                         {/* Review Section */}
//                         <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
//                             <h3 className="text-lg font-bold text-gray-700 mb-2">Aapka Review</h3>
//                             {reviewError && <div className="text-red-500 mb-2">{reviewError}</div>}
//                             {myReview ? (
//                                 <div className="mb-2">
//                                     <div className="flex items-center gap-2 mb-1">
//                                         <span className="font-semibold text-yellow-600">Rating: {myReview.rating}/5</span>
//                                         <span className="text-gray-500 text-xs">{new Date(myReview.updatedAt || myReview.createdAt).toLocaleString()}</span>
//                                     </div>
//                                     <div className="mb-2 text-gray-700">{myReview.text}</div>
//                                     <button
//                                         className="bg-blue-500 text-white px-3 py-1 rounded mr-2 hover:bg-blue-600"
//                                         onClick={() => {
//                                             setReviewText(myReview.text);
//                                             setReviewRating(myReview.rating);
//                                             setMyReview(null); // Switch to edit mode
//                                         }}
//                                     >Edit</button>
//                                     <button
//                                         className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
//                                         onClick={async () => {
//                                             setReviewLoading(true);
//                                             setReviewError('');
//                                             try {
//                                                 await deleteDoctorReviewAPI(doctorId, myReview._id, auth.token);
//                                                 setMyReview(null);
//                                                 setReviewText('');
//                                                 setReviewRating(5);
//                                                 // Reload reviews
//                                                 const data = await fetchDoctorReviewsAPI(doctorId, auth.token);
//                                                 setReviews(data);
//                                             } catch (e) {
//                                                 setReviewError('Review delete nahi ho paaya.');
//                                             }
//                                             setReviewLoading(false);
//                                         }}
//                                         disabled={reviewLoading}
//                                     >Delete</button>
//                                 </div>
//                             ) : (
//                                 <form
//                                     className="flex flex-col gap-2"
//                                     onSubmit={async e => {
//                                         e.preventDefault();
//                                         setReviewLoading(true);
//                                         setReviewError('');
//                                         try {
//                                             console.log('Review submit data:', { comment: reviewText, rating: reviewRating });
//                                             let apiRes;
//                                             if (myReview) {
//                                                 apiRes = await editDoctorReviewAPI(doctorId, myReview._id, { comment: reviewText, rating: reviewRating }, auth.token);
//                                                 console.log('Edit review API response:', apiRes);
//                                             } else {
//                                                 apiRes = await submitDoctorReviewAPI(doctorId, { comment: reviewText, rating: reviewRating }, auth.token);
//                                                 console.log('Submit review API response:', apiRes);
//                                             }
//                                             // Reload reviews
//                                             const data = await fetchDoctorReviewsAPI(doctorId, auth.token);
//                                             console.log('Fetched reviews after submit:', data);
//                                             // Find my review by user field (ObjectId)
//                                             const mine = data.find(r => r.user && r.user.toString() === auth.userId);
//                                             console.log('My review after submit:', mine);
//                                             setMyReview(mine || null);
//                                             setReviewText(mine ? mine.comment : '');
//                                             setReviewRating(mine ? mine.rating : 5);
//                                         } catch (e) {
//                                             console.error('Review submit/edit error:', e);
//                                             setReviewError('Review submit/edit nahi ho paaya.');
//                                         }
//                                         setReviewLoading(false);
//                                     }}
//                                 >
//                                     <label className="font-medium text-gray-600">Rating:</label>
//                                     <select
//                                         value={reviewRating}
//                                         onChange={e => setReviewRating(Number(e.target.value))}
//                                         className="border rounded px-2 py-1 w-24"
//                                     >
//                                         {[5,4,3,2,1].map(r => (
//                                             <option key={r} value={r}>{r}</option>
//                                         ))}
//                                     </select>
//                                     <label className="font-medium text-gray-600">Review:</label>
//                                     <textarea
//                                         value={reviewText}
//                                         onChange={e => setReviewText(e.target.value)}
//                                         className="border rounded px-2 py-1 w-full"
//                                         rows={2}
//                                         required
//                                     />
//                                     <button
//                                         type="submit"
//                                         className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mt-2"
//                                         disabled={reviewLoading}
//                                     >{myReview ? 'Update Review' : 'Submit Review'}</button>
//                                 </form>
//                             )}
//                         </div>
//                         {/* Show all reviews */}
//                         <div className="bg-white rounded-xl p-4 mb-6 text-left border">
//                             <h3 className="text-lg font-bold text-gray-700 mb-2">Sabhi Reviews</h3>
//                             {reviews.length === 0 ? (
//                                 <div className="text-gray-500">Abhi koi review nahi hai.</div>
//                             ) : (
//                                 <div className="space-y-2">
//                                     {reviews.map(r => (
//                                         <div key={r._id} className="border-b pb-2">
//                                             <div className="flex items-center gap-2">
//                                                 <span className="font-semibold text-yellow-600">{r.rating}/5</span>
//                                                 <span className="text-gray-500 text-xs">{new Date(r.updatedAt || r.createdAt).toLocaleString()}</span>
//                                             </div>
//                                             <div className="text-gray-700">{r.text}</div>
//                                         </div>
//                                     ))}
//                                 </div>
//                             )}
//                         </div>
//                         {/* ...existing code... */}
//                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
//                             <div className="bg-blue-50 p-4 rounded-lg shadow-sm">
//                                 <p className="text-sm text-gray-600">Aapka Token Number:</p>
//                                 <p className="text-4xl font-extrabold text-blue-700 mt-2">#{queueStatus.yourTokenNumber}</p>
//                             </div>
//                             <div className="bg-green-50 p-4 rounded-lg shadow-sm">
//                                 <p className="text-sm text-gray-600">Abhi Chal Raha Hai:</p>
//                                 <p className="text-4xl font-extrabold text-green-700 mt-2">#{queueStatus.currentServingToken}</p>
//                             </div>
//                         </div>
//                         <div className="bg-yellow-50 p-4 rounded-lg shadow-sm mb-6">
//                             <p className="text-sm text-gray-600">Aapke Aage Patients:</p>
//                             <p className="text-3xl font-extrabold text-yellow-700 mt-2">{queueStatus.patientsAhead}</p>
//                         </div>
//                         {queueStatus.patientsAhead === 0 && queueStatus.yourTokenNumber === queueStatus.currentServingToken ? (
//                             <div className="bg-green-100 text-green-800 p-4 rounded-lg font-semibold text-lg animate-pulse">
//                                 Aapki baari hai! Kripya doctor se milein.
//                             </div>
//                         ) : queueStatus.patientsAhead > 0 ? (
//                             <div className="bg-blue-100 text-blue-800 p-4 rounded-lg font-semibold text-lg">
//                                 Thoda intezaar karein. Aapki baari jald aayegi.
//                             </div>
//                         ) : (
//                             <div className="bg-gray-100 text-gray-600 p-4 rounded-lg font-semibold text-lg">
//                                 Aapki baari ka intezaar hai.
//                             </div>
//                         )}
//                         <p className="text-xs text-gray-400 mt-8">Yeh page har 5 seconds mein automatically refresh hoga.</p>
//                         <button
//                             onClick={() => navigate('/dashboard/patient')}
//                             className="w-full mt-8 bg-gray-600 text-white font-bold py-3 rounded-lg hover:bg-gray-700 transition-colors duration-300"
//                         >
//                             Apne Dashboard par wapas jaayen
//                         </button>
//                     </>
//                 ) : null}
//             </div>
//         </div>
//     );
// }

// export default PatientQueuePage;