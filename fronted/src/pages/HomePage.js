import React, { useState, useEffect, useContext } from 'react';
import ChatModal from '../components/ChatModal';
import HealthChatBot from '../components/HealthChatBot';
import { useNavigate, Link } from 'react-router-dom';
import { searchDoctorsAPI, getSpecializationsAPI } from '../api/doctorApi';
import AuthContext from '../context/AuthContext';

// --- Icon Components ---
const BrainIcon = () => <svg className="w-10 h-10 mb-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.5 13a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM19.5 13a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM12 13a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM14.5 8a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 21.5c-4.142 0-7.5-3.358-7.5-7.5 0-2.836 1.57-5.333 3.857-6.618M12 21.5c4.142 0 7.5-3.358 7.5-7.5 0-2.836-1.57-5.333-3.857-6.618m-3.643 13.236A7.5 7.5 0 0012 21.5m3.643-6.618A7.5 7.5 0 0112 21.5m0-18C7.858 3.5 4.5 6.858 4.5 11c0 2.836 1.57 5.333 3.857 6.618m3.643-13.236A7.5 7.5 0 0112 3.5m3.643 6.618A7.5 7.5 0 0012 3.5" /></svg>;
const HeartIcon = () => <svg className="w-10 h-10 mb-2 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 016.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" /></svg>;
const BoneIcon = () => <svg className="w-10 h-10 mb-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v16m8-8H4" /></svg>;
const SkinIcon = () => <svg className="w-10 h-10 mb-2 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 11c0 3.517-1.009 6.78-2.73 9.268C7.12 18.01 5 14.35 5 11c0-3.866 3.134-7 7-7s7 3.134 7 7-2.12 7.01-4.27 9.268C13.009 17.78 12 14.517 12 11z" /></svg>;
const StarIcon = () => <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>;


const HomePage = () => {
  const { auth } = useContext(AuthContext);
  const navigate = useNavigate();
  const [doctorsToDisplay, setDoctorsToDisplay] = useState([]);
  const [searchCity, setSearchCity] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [title, setTitle] = useState('Popular Doctors');
  const [chatOpen, setChatOpen] = useState(false);
  const [chatDoctor, setChatDoctor] = useState(null);

  useEffect(() => {
    const fetchPopularDoctors = async () => {
      setLoading(true);
      try {
        const popDocs = await searchDoctorsAPI("Mumbai", "", "");
        setDoctorsToDisplay(popDocs.slice(0, 6));
      } catch (err) {
        setError("Could not load popular doctors.");
      } finally {
        setLoading(false);
      }
    };
    fetchPopularDoctors();
  }, []);
  
  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    setTitle(`Results for "${searchQuery || searchCity}"`);
    try {
      const results = await searchDoctorsAPI(searchCity, searchQuery, "");
      setDoctorsToDisplay(results);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSpecialtySearch = async (specialty) => {
    setLoading(true);
    setError('');
    setMessage('');
    setTitle(`Top Doctors in ${specialty}`);
    try {
      const results = await searchDoctorsAPI("", "", specialty);
      setDoctorsToDisplay(results);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Removed queue join logic. Users should book appointments via doctor profile/modal.

  // --- Infinite Testimonials Array ---
  const testimonials = [
    { img: 'https://randomuser.me/api/portraits/women/44.jpg', name: 'Priya Sharma', text: '"Booking an appointment was so easy and the doctor was very professional. Highly recommend!"', city: 'Patient, Mumbai' },
    { img: 'https://randomuser.me/api/portraits/men/32.jpg', name: 'Rahul Verma', text: '"I got instant support and my online consultation was smooth. Great experience!"', city: 'Patient, Delhi' },
    { img: 'https://randomuser.me/api/portraits/women/65.jpg', name: 'Anjali Mehta', text: '"The platform is user-friendly and the doctors are very knowledgeable. Loved it!"', city: 'Patient, Bangalore' },
    { img: 'https://randomuser.me/api/portraits/men/45.jpg', name: 'Amit Singh', text: '"Very convenient and the doctors are top-notch. Will use again!"', city: 'Patient, Lucknow' },
    { img: 'https://randomuser.me/api/portraits/women/22.jpg', name: 'Sneha Patil', text: '"Easy to book and great follow-up care. Loved the experience!"', city: 'Patient, Pune' },
    { img: 'https://randomuser.me/api/portraits/men/78.jpg', name: 'Vikram Joshi', text: '"The online consultation saved me so much time. Highly recommended!"', city: 'Patient, Jaipur' },
    { img: 'https://randomuser.me/api/portraits/women/33.jpg', name: 'Ritu Agarwal', text: '"Doctors are very friendly and professional. 5 stars!"', city: 'Patient, Kolkata' },
    { img: 'https://randomuser.me/api/portraits/men/23.jpg', name: 'Suresh Kumar', text: '"Great platform for quick appointments. Support team is awesome!"', city: 'Patient, Chennai' },
  ];
  // Repeat 4 times for infinite effect
  const repeatedTestimonials = Array(4).fill(testimonials).flat();

  return (
    <div className="min-h-screen font-sans relative overflow-x-hidden bg-gradient-to-br from-[#f3e7fa] via-[#e3eafc] to-[#c7bfff] transition-all duration-700">
      {/* Skiper UI Animated Glassmorphism Background Shapes */}
      <div className="pointer-events-none select-none">
        {/* Top Left Floating Glass Shape */}
        <div className="fixed top-[-120px] left-[-120px] w-[420px] h-[420px] bg-gradient-to-br from-[#a78bfa]/40 to-[#3b82f6]/10 rounded-full blur-3xl opacity-60 animate-float-slow z-0" style={{filter:'blur(60px)'}}></div>
        {/* Bottom Right Floating Glass Shape */}
        <div className="fixed bottom-[-120px] right-[-120px] w-[420px] h-[420px] bg-gradient-to-br from-[#c7bfff]/40 to-[#b6e0ff]/10 rounded-full blur-3xl opacity-60 animate-float-slow-rev z-0" style={{filter:'blur(60px)'}}></div>
        {/* Center Animated Gradient Glass Panel */}
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] bg-white/10 rounded-3xl blur-2xl border border-white/20 shadow-2xl animate-fade-in-up opacity-30 z-0" style={{boxShadow:'0 8px 48px 0 #a78bfa22'}}></div>
        {/* Extra Skiper UI floating glass shapes for more depth */}
        <div className="fixed top-[20%] left-[-80px] w-[220px] h-[220px] bg-gradient-to-br from-[#a78bfa]/30 to-[#3b82f6]/10 rounded-full blur-2xl opacity-40 animate-float z-0" style={{filter:'blur(40px)'}}></div>
        <div className="fixed bottom-[10%] right-[-80px] w-[180px] h-[180px] bg-gradient-to-br from-[#c7bfff]/30 to-[#b6e0ff]/10 rounded-full blur-2xl opacity-40 animate-float-slow-rev z-0" style={{filter:'blur(40px)'}}></div>
      </div>
      {/* Hero Section - Skiper UI Glassmorphism & Animation */}
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto py-20 px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center gap-12">
          {/* Left: Text & Search */}
          <div className="flex-1 min-w-[320px] animate-fade-in-up">
            <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 drop-shadow mb-4">
              Find & Book the <span className="text-indigo-600 bg-white/40 px-2 rounded-xl shadow">Best Doctors</span> Near You
            </h1>
            <p className="mt-4 text-2xl text-gray-700 font-medium bg-white/40 rounded-xl px-3 py-2 shadow mb-2">With over 1000+ doctors and specialists, we provide the best healthcare services.</p>
            <form onSubmit={handleSearch} className="mt-8 bg-white/60 backdrop-blur-lg p-4 rounded-2xl shadow-2xl flex flex-col md:flex-row gap-2 border border-white/30 animate-fade-in-up delay-100">
              <input type="text" value={searchCity} onChange={(e) => setSearchCity(e.target.value)} placeholder="City (Optional)" className="flex-grow p-3 border border-gray-200 rounded-md bg-white/80 focus:ring-2 focus:ring-indigo-300 transition" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Doctor name or specialty" className="flex-grow p-3 border border-gray-200 rounded-md bg-white/80 focus:ring-2 focus:ring-indigo-300 transition" />
              <button type="submit" className="bg-gradient-to-br from-indigo-500 to-teal-400 text-white font-bold p-3 rounded-md shadow hover:scale-105 hover:from-indigo-600 hover:to-teal-500 transition-all">Search</button>
            </form>
          </div>
          {/* Right: Doctor Illustration with Glassmorphism */}
          <div className="flex-1 flex justify-center items-end relative animate-float-slow">
            <div className="absolute -top-8 -right-8 w-40 h-40 bg-gradient-to-br from-[#a78bfa]/40 to-[#3b82f6]/10 rounded-full blur-2xl opacity-50 z-0 animate-float"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-[#c7bfff]/40 to-[#b6e0ff]/10 rounded-full blur-2xl opacity-50 z-0 animate-float-slow-rev"></div>
            <div className="relative w-[340px] h-[420px] flex items-end justify-center">
              <div className="absolute inset-0 rounded-3xl bg-white/30 backdrop-blur-2xl border border-white/30 shadow-2xl"></div>
              <img src="https://www.freepnglogos.com/uploads/doctor-png/doctor-bulk-billing-doctors-chapel-hill-health-care-medical-3.png" alt="Doctor" className="w-full h-full object-contain object-bottom rounded-3xl z-10"/>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Specialties Section - Skiper UI Glass Cards */}
        <div className="text-center mb-12 animate-fade-in-up">
          <h2 className="text-3xl font-extrabold text-gray-900 drop-shadow">Browse by Specialty</h2>
          <p className="mt-2 text-lg text-gray-600">Find the right specialist for your needs.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 animate-fade-in-up delay-100">
          <div
            onClick={() => navigate('/specialty/Neurology')}
            className="text-center p-6 rounded-2xl bg-white/20 backdrop-blur-lg border border-white/20 shadow-lg cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl group animate-fade-in-up"
            style={{ boxShadow: '0 4px 32px 0 #a78bfa22' }}
          >
            <span className="inline-block mb-2 group-hover:scale-110 transition-transform duration-200"><BrainIcon/></span>
            <h3 className="mt-2 font-bold text-gray-900 group-hover:text-indigo-600 transition-colors duration-200">Neurology</h3>
          </div>
          <div
            onClick={() => navigate('/specialty/Cardiology')}
            className="text-center p-6 rounded-2xl bg-white/20 backdrop-blur-lg border border-white/20 shadow-lg cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl group animate-fade-in-up delay-100"
            style={{ boxShadow: '0 4px 32px 0 #f472b622' }}
          >
            <span className="inline-block mb-2 group-hover:scale-110 transition-transform duration-200"><HeartIcon/></span>
            <h3 className="mt-2 font-bold text-gray-900 group-hover:text-pink-600 transition-colors duration-200">Cardiology</h3>
          </div>
          <div
            onClick={() => navigate('/specialty/Orthopedics')}
            className="text-center p-6 rounded-2xl bg-white/20 backdrop-blur-lg border border-white/20 shadow-lg cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl group animate-fade-in-up delay-200"
            style={{ boxShadow: '0 4px 32px 0 #6b728022' }}
          >
            <span className="inline-block mb-2 group-hover:scale-110 transition-transform duration-200"><BoneIcon/></span>
            <h3 className="mt-2 font-bold text-gray-900 group-hover:text-gray-700 transition-colors duration-200">Orthopedics</h3>
          </div>
          <div
            onClick={() => navigate('/specialty/Dermatology')}
            className="text-center p-6 rounded-2xl bg-white/20 backdrop-blur-lg border border-white/20 shadow-lg cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl group animate-fade-in-up delay-300"
            style={{ boxShadow: '0 4px 32px 0 #fb923c22' }}
          >
            <span className="inline-block mb-2 group-hover:scale-110 transition-transform duration-200"><SkinIcon/></span>
            <h3 className="mt-2 font-bold text-gray-900 group-hover:text-orange-500 transition-colors duration-200">Dermatology</h3>
          </div>
        </div>

      {/* Modern Feature Section (Skiper UI Glassmorphism) */}
      <div className="mt-20 mb-12 animate-fade-in-up delay-200">
        <div className="rounded-3xl bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl px-4 py-12 lg:py-16 lg:px-12 flex flex-col lg:flex-row gap-12 items-center relative overflow-hidden transition-all duration-500">
          {/* Glowing background shapes */}
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-gradient-to-br from-[#a78bfa]/40 to-[#3b82f6]/10 rounded-full blur-3xl opacity-60 z-0 animate-pulse"></div>
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-gradient-to-br from-[#c7bfff]/40 to-[#b6e0ff]/10 rounded-full blur-3xl opacity-60 z-0 animate-pulse"></div>
          {/* Left: Phone Mockup with glass panel and floating animation */}
          <div className="flex-1 flex justify-center z-10">
            <div className="relative w-[320px] h-[420px] flex items-center justify-center animate-float">
              <div className="absolute inset-0 rounded-3xl bg-white/20 backdrop-blur-2xl border border-white/30 shadow-2xl"></div>
              <img
                src="https://th.bing.com/th/id/OIP.g7OqCcK3sZpnvQs8b1HSqgHaF7?w=238&h=191&c=7&r=0&o=7&dpr=2&pid=1.7&rm=3"
                alt="Doctor video call mockup"
                className="rounded-2xl w-[220px] h-[370px] object-cover border-4 border-white shadow-2xl z-10"
                style={{ boxShadow: '0 0 32px 8px #a78bfa55, 0 8px 32px 0 #23243a55' }}
              />
              {/* Floating call action buttons with bounce */}
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-20">
                <button className="bg-white/80 shadow-xl rounded-full w-12 h-12 flex items-center justify-center text-indigo-500 text-xl border border-white/30 hover:scale-110 hover:bg-indigo-100 transition-transform duration-200 animate-bounce-slow"><svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 16.92V19a2 2 0 0 1-2.18 2A19.72 19.72 0 0 1 3 5.18 2 2 0 0 1 5 3h2.09a2 2 0 0 1 2 1.72c.13 1.05.37 2.07.7 3.06a2 2 0 0 1-.45 2.11l-.27.27a16 16 0 0 0 6.29 6.29l.27-.27a2 2 0 0 1 2.11-.45c.99.33 2.01.57 3.06.7A2 2 0 0 1 22 16.92z"/></svg></button>
                <button className="bg-gradient-to-br from-red-400 to-red-600 shadow-xl rounded-full w-12 h-12 flex items-center justify-center text-white text-xl border border-white/30 hover:scale-110 transition-transform duration-200 animate-bounce-slow delay-150"><svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18.36 6.64a9 9 0 1 0 0 12.72M15 9v6M9 9v6"/></svg></button>
                <button className="bg-white/80 shadow-xl rounded-full w-12 h-12 flex items-center justify-center text-gray-700 text-xl border border-white/30 hover:scale-110 hover:bg-gray-200 transition-transform duration-200 animate-bounce-slow delay-300"><svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8 15h8M9 9h.01M15 9h.01"/></svg></button>
              </div>
            </div>
          </div>
          {/* Right: Features and Stats with animated cards */}
          <div className="flex-1 flex flex-col gap-10 z-10">
            {/* Feature Cards */}
            <div className="flex flex-col gap-6">
              {/* 01 Virtual consultations */}
              <div className="flex items-start gap-4 group transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl animate-fade-in-up">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 text-white flex items-center justify-center font-bold text-lg shadow-lg group-hover:scale-110 transition-transform duration-200">01</div>
                <div>
                  <div className="text-2xl font-extrabold text-white mb-1 drop-shadow">Virtual consultations</div>
                  <div className="text-gray-300 text-sm mb-2 max-w-md">Patients can connect with healthcare providers for consultations from the comfort of their own homes, without having to travel to an office or clinic.</div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-[#c7bfff] to-[#b6e0ff] text-indigo-500 text-xl shadow-lg"><svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4l2-3 2 3h4a2 2 0 0 1 2 2z"/></svg></span>
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-900 text-white text-xl shadow-lg"><svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 16.92V19a2 2 0 0 1-2.18 2A19.72 19.72 0 0 1 3 5.18 2 2 0 0 1 5 3h2.09a2 2 0 0 1 2 1.72c.13 1.05.37 2.07.7 3.06a2 2 0 0 1-.45 2.11l-.27.27a16 16 0 0 0 6.29 6.29l.27-.27a2 2 0 0 1 2.11-.45c.99.33 2.01.57 3.06.7A2 2 0 0 1 22 16.92z"/></svg></span>
                  </div>
                </div>
              </div>
              {/* 02 Remote patient monitoring */}
              <div className="flex items-start gap-4 group transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl animate-fade-in-up delay-100">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 text-white flex items-center justify-center font-bold text-lg shadow-lg group-hover:scale-110 transition-transform duration-200">02</div>
                <div>
                  <div className="text-2xl font-extrabold text-white mb-1 drop-shadow">Remote patient monitoring</div>
                  <div className="text-gray-300 text-sm mb-2 max-w-md">Patients can use wearables or devices to collect and send health data to healthcare providers for monitoring.</div>
                </div>
              </div>
              {/* 03 Mental health services */}
              <div className="flex items-start gap-4 group transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl animate-fade-in-up delay-200">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 text-white flex items-center justify-center font-bold text-lg shadow-lg group-hover:scale-110 transition-transform duration-200">03</div>
                <div>
                  <div className="text-2xl font-extrabold text-white mb-1 drop-shadow">Mental health services <span className='font-normal text-gray-400'>with licensed therapists or psychiatrists</span></div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-indigo-300 text-sm font-semibold cursor-pointer flex items-center hover:underline">See More <svg className="ml-1" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg></span>
                  </div>
                </div>
              </div>
            </div>
            {/* Stats and Doctor Card Row */}
            <div className="flex flex-wrap gap-6 mt-8">
              {/* Stat: Doctor and Specialist */}
              <div className="flex-1 min-w-[120px] bg-white/20 backdrop-blur-lg rounded-2xl flex flex-col items-center justify-center p-6 border border-white/20 shadow-lg hover:scale-105 transition-transform duration-200 animate-fade-in-up delay-300">
                <div className="text-4xl font-extrabold text-white drop-shadow">325</div>
                <div className="text-gray-200 text-sm mt-1">Doctor and Specialist</div>
              </div>
              {/* Stat: Patient in case */}
              <div className="flex-1 min-w-[120px] bg-gradient-to-br from-[#3b82f6]/80 to-[#a78bfa]/80 rounded-2xl flex flex-col items-center justify-center p-6 shadow-lg hover:scale-105 transition-transform duration-200 animate-fade-in-up delay-400">
                <div className="text-4xl font-extrabold text-white drop-shadow">20K</div>
                <div className="text-white text-sm mt-1">Patient in case</div>
              </div>
              {/* Doctor Card with Slider */}
              <div className="flex-1 min-w-[220px] bg-white/20 backdrop-blur-lg rounded-2xl flex flex-col items-center justify-center p-6 relative overflow-hidden border border-white/20 shadow-lg hover:scale-105 transition-transform duration-200 animate-fade-in-up delay-500">
                <div className="flex items-center gap-4 w-full">
                  <img src="https://randomuser.me/api/portraits/women/68.jpg" alt="dr. Sarah Efina" className="w-16 h-16 rounded-full border-2 border-white shadow-lg" />
                  <div>
                    <div className="font-bold text-lg text-white drop-shadow">dr. Sarah Efina</div>
                    <div className="text-xs text-indigo-200 font-semibold">Psychiatrists</div>
                    <div className="text-xs text-gray-300">Experience 6 Years</div>
                  </div>
                </div>
                <button className="absolute right-4 bottom-4 flex items-center gap-1 bg-white/80 px-4 py-2 rounded-full shadow font-semibold text-gray-700 text-xs hover:bg-white transition animate-pulse"><span>SLIDE</span><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg></button>
              </div>
            </div>
          </div>
        </div>
        {/* Skiper UI inspired animations */}
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
          @keyframes float {
            0% { transform: translateY(0); }
            50% { transform: translateY(-16px); }
            100% { transform: translateY(0); }
          }
          .animate-float {
            animation: float 3s ease-in-out infinite;
          }
          @keyframes fadeInUp {
            0% { opacity: 0; transform: translateY(40px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in-up {
            animation: fadeInUp 1s cubic-bezier(0.23, 1, 0.32, 1) both;
          }
          .animate-fade-in-up.delay-100 { animation-delay: 0.1s; }
          .animate-fade-in-up.delay-200 { animation-delay: 0.2s; }
          .animate-fade-in-up.delay-300 { animation-delay: 0.3s; }
          .animate-fade-in-up.delay-400 { animation-delay: 0.4s; }
          .animate-fade-in-up.delay-500 { animation-delay: 0.5s; }
          @keyframes bounceSlow {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
          }
          .animate-bounce-slow {
            animation: bounceSlow 2.2s infinite;
          }
          .animate-bounce-slow.delay-150 { animation-delay: 0.15s; }
          .animate-bounce-slow.delay-300 { animation-delay: 0.3s; }
          /* Skiper UI shimmer effect */
          @keyframes shimmer {
            0% { background-position: -400px 0; }
            100% { background-position: 400px 0; }
          }
          .skiper-shimmer {
            background: linear-gradient(90deg, #f3e7fa 25%, #e3eafc 50%, #f3e7fa 75%);
            background-size: 800px 100%;
            animation: shimmer 2.5s infinite linear;
          }
        `}</style>
      </div>
      {/* Modern Feature Grid Section - Skiper UI Glass Cards */}
      <div className="mt-20 mb-12 animate-fade-in-up delay-300">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* 99% Certified */}
          <div className="rounded-3xl bg-white shadow p-8 flex flex-col justify-between min-h-[220px]">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-5xl font-extrabold text-gray-900">99%</span>
                <span className="ml-2 px-2 py-1 text-xs bg-gray-100 rounded-full font-semibold text-gray-500">Guaranteed</span>
              </div>
              <div className="text-2xl font-semibold text-gray-900 mb-1">Our Doctor certified</div>
              <div className="text-gray-500 text-sm">Don't worry, our doctorates are guaranteed with certificates and degrees.</div>
            </div>
          </div>
          {/* Connection with Doctors */}
          <div className="rounded-3xl bg-white shadow p-8 flex flex-col justify-between min-h-[220px]">
            <div className="flex flex-col h-full">
              <div className="flex-1 flex items-center justify-center mb-4">
                <div className="flex -space-x-4">
                  <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="doctor1" className="w-12 h-12 rounded-full border-2 border-white shadow" />
                  <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="doctor2" className="w-12 h-12 rounded-full border-2 border-white shadow" />
                  <img src="https://randomuser.me/api/portraits/men/45.jpg" alt="doctor3" className="w-12 h-12 rounded-full border-2 border-white shadow" />
                  <img src="https://randomuser.me/api/portraits/women/65.jpg" alt="doctor4" className="w-12 h-12 rounded-full border-2 border-white shadow" />
                </div>
              </div>
              <div className="text-2xl font-semibold text-gray-900 mb-1">Connection with our Doctors</div>
              <div className="text-gray-500 text-sm">Connect with our professional doctors who are ready to help you manage your health with expertise and dedication.</div>
            </div>
          </div>
          {/* Fast and Accurate Service */}
          <div className="rounded-3xl bg-white shadow p-8 flex flex-col justify-between min-h-[220px]">
            <div>
              <div className="text-2xl font-semibold text-gray-900 mb-2">Very fast and accurate service with us</div>
              <div className="text-gray-500 text-sm mb-4">We are ready to serve you with pleasure and fast response</div>
              <div className="flex flex-col gap-1 text-sm">
                <div className="flex items-center gap-2"><span className="font-bold text-gray-900">90%</span> Satisfying treatment</div>
                <div className="flex items-center gap-2"><span className="font-bold text-gray-900">90%</span> Happy customer</div>
                <div className="flex items-center gap-2"><span className="font-bold text-gray-900">100%</span> Fast response</div>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <img src="https://randomuser.me/api/portraits/women/22.jpg" alt="doctor" className="w-16 h-16 rounded-full border-2 border-white shadow" />
            </div>
          </div>
          {/* Real-time Consultations */}
          <div className="rounded-3xl bg-white shadow p-8 flex flex-col justify-between min-h-[220px]">
            <div>
              <div className="text-2xl font-semibold text-gray-900 mb-2">Realtime consultations</div>
              <div className="text-gray-500 text-sm mb-4">Connect with our professional doctors who are ready to help you manage your health.</div>
              <div className="flex gap-3 mt-2">
                <div className="rounded-xl bg-gradient-to-br from-[#f3e7fa] to-[#e3eafc] px-4 py-2 shadow text-xs font-semibold text-gray-700">Booking your consultation</div>
                <div className="rounded-xl bg-gradient-to-br from-[#e3eafc] to-[#f3e7fa] px-4 py-2 shadow text-xs font-semibold text-gray-700">Check schedule doctors</div>
              </div>
            </div>
          </div>
          {/* Get all the benefits now */}
          <div className="col-span-1 md:col-span-2 lg:col-span-3 rounded-3xl bg-gradient-to-br from-[#f3e7fa] to-[#e3eafc] p-8 flex flex-col md:flex-row items-center justify-between mt-2">
            <div className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">Get all the benefits now</div>
            <button className="bg-gray-900 text-white px-8 py-3 rounded-full font-semibold shadow hover:bg-gray-800 transition">Book now</button>
          </div>
        </div>
      </div>

        {/* About Us Section (Skiper UI Glassmorphism) */}
        <div className="mt-20 flex flex-col lg:flex-row items-center gap-12 animate-fade-in-up delay-400">
          {/* Left: Text Content */}
          <div className="flex-1 min-w-[320px]">
            <p className="text-indigo-600 font-semibold mb-2">About Us</p>
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4 leading-tight">Who We Are and What We Stand For</h2>
            <p className="text-gray-600 mb-6">TrustCare accepts most major health insurance plans and providers to ensure you get quality care at a cost that fits within your budget.</p>
            <ul className="mb-8 space-y-3">
              <li className="flex items-center gap-2 text-lg text-gray-800"><span className="inline-block w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mr-2">✔</span>TrustCare is health care, but easy</li>
              <li className="flex items-center gap-2 text-lg text-gray-800"><span className="inline-block w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mr-2">✔</span>Top-searched specialties</li>
              <li className="flex items-center gap-2 text-lg text-gray-800"><span className="inline-block w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mr-2">✔</span>24/7 Open Support</li>
            </ul>
            <button className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold shadow hover:bg-indigo-700 transition">More about Us</button>
          </div>
          {/* Right: Images Collage */}
          <div className="flex-1 flex flex-col gap-6 items-center">
            <div className="relative w-[320px] h-[200px] rounded-2xl overflow-hidden shadow-lg">
              <img src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80" alt="Doctor consulting" className="w-full h-full object-cover" />
              <div className="absolute top-4 left-4 bg-white rounded-lg shadow px-4 py-2 flex items-center gap-2">
                <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h2l.4 2M7 13h10l4-8H5.4M7 13l-1.35 2.7A2 2 0 007.48 19h9.04a2 2 0 001.83-1.3L17 13M7 13V6h13" /></svg>
                <div>
                  <div className="text-xs font-bold text-gray-700">24/7 Service</div>
                  <div className="text-xs text-gray-500">We are available</div>
                </div>
              </div>
            </div>
            <div className="relative w-[220px] h-[180px] rounded-2xl overflow-hidden shadow-lg ml-12">
              <img src="https://images.unsplash.com/photo-1550831107-1553da8c8464?auto=format&fit=crop&w=400&q=80" alt="Doctor with patient" className="w-full h-full object-cover" />
              <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow px-4 py-2 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zm0 10c-4.418 0-8-1.79-8-4V6c0-2.21 3.582-4 8-4s8 1.79 8 4v8c0 2.21-3.582 4-8 4z" /></svg>
                <div>
                  <div className="text-xs font-bold text-gray-700">15+ Years Experience</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works Section - Skiper UI Glassmorphism & Animation */}
        <div className="mt-24 mb-8 animate-fade-in-up delay-500">
          <h2 className="text-4xl font-extrabold text-center text-gray-900 mb-12 drop-shadow-lg">How It Works</h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-12">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center max-w-xs bg-white/30 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl border border-white/30 transition-all duration-300 hover:scale-105 hover:shadow-[0_8px_32px_0_#a78bfa55] group animate-fade-in-up" style={{boxShadow:'0 4px 32px 0 #a78bfa22'}}>
              <div className="bg-gradient-to-br from-teal-200 via-white to-indigo-100 rounded-full p-6 mb-5 shadow-lg group-hover:scale-110 transition-transform duration-200 border-2 border-white/60">
                <svg className="w-12 h-12 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <h3 className="font-bold text-xl mb-2 text-gray-900 group-hover:text-indigo-600 transition-colors duration-200">Book Appointment</h3>
              <p className="text-gray-700 text-base">Choose your doctor and book your appointment online in seconds.</p>
            </div>
            {/* Step 2 */}
            <div className="flex flex-col items-center text-center max-w-xs bg-white/30 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl border border-white/30 transition-all duration-300 hover:scale-105 hover:shadow-[0_8px_32px_0_#a78bfa55] group animate-fade-in-up delay-100" style={{boxShadow:'0 4px 32px 0 #a78bfa22'}}>
              <div className="bg-gradient-to-br from-indigo-200 via-white to-teal-100 rounded-full p-6 mb-5 shadow-lg group-hover:scale-110 transition-transform duration-200 border-2 border-white/60">
                <svg className="w-12 h-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zm0 10c-4.418 0-8-1.79-8-4V6c0-2.21 3.582-4 8-4s8 1.79 8 4v8c0 2.21-3.582 4-8 4z" /></svg>
              </div>
              <h3 className="font-bold text-xl mb-2 text-gray-900 group-hover:text-indigo-600 transition-colors duration-200">Visit Clinic or Online</h3>
              <p className="text-gray-700 text-base">Meet your doctor at the clinic or consult online from anywhere.</p>
            </div>
            {/* Step 3 */}
            <div className="flex flex-col items-center text-center max-w-xs bg-white/30 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl border border-white/30 transition-all duration-300 hover:scale-105 hover:shadow-[0_8px_32px_0_#a78bfa55] group animate-fade-in-up delay-200" style={{boxShadow:'0 4px 32px 0 #a78bfa22'}}>
              <div className="bg-gradient-to-br from-yellow-100 via-white to-indigo-100 rounded-full p-6 mb-5 shadow-lg group-hover:scale-110 transition-transform duration-200 border-2 border-white/60">
                <svg className="w-12 h-12 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2a4 4 0 018 0v2m-4-4a4 4 0 00-4-4V7a4 4 0 018 0v2a4 4 0 00-4 4z" /></svg>
              </div>
              <h3 className="font-bold text-xl mb-2 text-gray-900 group-hover:text-indigo-600 transition-colors duration-200">Get Care & Support</h3>
              <p className="text-gray-700 text-base">Receive expert care, follow-ups, and 24/7 support from our team.</p>
            </div>
          </div>
        </div>


        {/* Doctors List Section - Skiper UI Glassmorphism */}
        <div className="mt-20 rounded-3xl bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl px-4 py-12 transition-all duration-500 animate-fade-in-up delay-600" style={{ boxShadow: '0 8px 48px 0 #a78bfa22' }}>
      {/* Testimonials Section - Skiper UI Card Swiper Placeholder */}
      <div className="max-w-5xl mx-auto mt-24 mb-20 animate-fade-in-up delay-700">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-gray-900 drop-shadow">What Our Users Say</h2>
          <p className="mt-2 text-lg text-gray-600">Real stories from our patients</p>
        </div>
        {/* Animated infinite right-to-left testimonials row */}
        <div className="rounded-3xl bg-white/30 backdrop-blur-2xl border border-white/20 shadow-2xl px-4 py-10 relative overflow-hidden">
          <div className="testimonial-infinite-row flex gap-8 pb-4" style={{width:'max-content'}}>
            {repeatedTestimonials.slice(0, 12).map((t, idx) => (
              <div
                key={idx}
                className="testimonial-card min-w-[320px] max-w-[320px] bg-white/70 rounded-2xl shadow-lg p-6 flex flex-col items-center border border-white/30 backdrop-blur-xl transition-transform duration-300 will-change-transform"
                style={{ boxShadow: '0 4px 32px 0 #a78bfa22' }}
              >
                <img src={t.img} alt={t.name} className="w-20 h-20 rounded-full border-4 border-white shadow mb-4 transition-transform duration-300" />
                <div className="text-lg font-bold text-gray-900 mb-1">{t.name}</div>
                <div className="text-sm text-gray-500 mb-2">{t.city}</div>
                <div className="text-gray-700 text-base italic mb-2">{t.text}</div>
                <div className="flex gap-1 mt-2">
                  <span className="text-yellow-400">★</span>
                  <span className="text-yellow-400">★</span>
                  <span className="text-yellow-400">★</span>
                  <span className="text-yellow-400">★</span>
                  <span className="text-yellow-400">★</span>
                </div>
              </div>
            ))}
          </div>
          {/* Animation styles */}
          <style>{`
            @keyframes testimonial-infinite-scroll {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            .testimonial-infinite-row {
              animation: testimonial-infinite-scroll 40s linear infinite;
              width: 200%;
            }
            .testimonial-card {
              cursor: pointer;
              transition: transform 0.35s cubic-bezier(.23,1.02,.32,1), box-shadow 0.3s;
            }
            .testimonial-card:hover {
              transform: scale(1.08) translateY(-8px) rotateZ(-1deg);
              z-index: 2;
              /* Lightning/reflective border effect using gradient and glow */
              box-shadow: 0 8px 32px 0 #a78bfa55, 0 8px 32px 0 #23243a33, 0 0 0 6px #e0e7ffcc, 0 0 24px 6px #a78bfa, 0 0 40px 10px #fff8ff99;
              border: 2.5px solid transparent;
              background-image: linear-gradient(white, white), linear-gradient(90deg, #c4b5fd, #a78bfa 40%, #f3e7fa 60%, #a78bfa 100%);
              background-origin: border-box;
              background-clip: padding-box, border-box;
              /* Simulates a reflective, electric border */
            }
            .testimonial-card:active {
              transform: scale(1.04) translateY(-2px);
            }
          `}</style>
        </div>
      </div>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900">{title}</h2>
            {message && <p className="mt-2 text-green-600">{message}</p>}
            {error && <p className="mt-2 text-red-500">{error}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.isArray(doctorsToDisplay) ? (
              doctorsToDisplay.map(doctor => (
                <div
                  key={doctor._id}
                  className="rounded-2xl bg-white/20 backdrop-blur-lg border border-white/20 shadow-lg overflow-hidden flex flex-col transition-all duration-300 hover:scale-105 hover:shadow-2xl group animate-fade-in-up"
                  style={{ boxShadow: '0 4px 32px 0 #a78bfa22' }}
                >
                  <Link to={`/doctor/${doctor._id}`}> 
                    <img src={doctor.profileDetails.profilePicture || `https://i.pravatar.cc/400?u=${doctor._id}`} alt={doctor.name} className="w-full h-56 object-cover rounded-t-2xl"/>
                  </Link>
                  <div className="p-6 flex-grow flex flex-col">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors duration-200">{doctor.name}</h3>
                    <p className="text-teal-600 font-semibold">{doctor.profileDetails.specialty}</p>
                    <div className="flex items-center mt-2">
                      <StarIcon />
                      <span className="text-gray-600 text-sm font-semibold ml-1">
                        {doctor.rating ? doctor.rating.toFixed(1) : 'No ratings'} ({doctor.numReviews || 0} reviews)
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{doctor.city}</p>
                    <div className="flex-grow"></div>
                    <div className={`mt-4 text-sm font-semibold p-2 rounded-md text-center ${doctor.currentStatus === 'Available' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {doctor.currentStatus}
                    </div>
                    <button
                      className="mt-4 bg-teal-500 text-white px-4 py-2 rounded-full font-semibold shadow hover:bg-teal-600 transition-all duration-200 group-hover:scale-105"
                      onClick={() => { setChatDoctor(doctor); setChatOpen(true); }}
                      disabled={!auth?.user}
                    >
                      Chat
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-red-500">Error: Doctors data is not an array.</div>
            )}
          </div>
        </div>
      </div>
    {/* Chat Modal Integration */}
    {chatOpen && chatDoctor && auth?.user && (
      <ChatModal
        doctor={chatDoctor}
        patient={auth.user}
        appointmentId={null}
        open={chatOpen}
        onClose={() => setChatOpen(false)}
      />
    )}

    {/* Health ChatBot Integration */}
    <HealthChatBot />

    {/* About Us Section */}
    <section className="mt-20 mb-8 px-4 py-12 bg-gradient-to-r from-blue-50 via-teal-50 to-white rounded-3xl shadow-2xl max-w-5xl mx-auto animate-fade-in-up">
      <h2 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-teal-600 mb-4 text-center">About Us</h2>
      <p className="text-lg text-gray-700 text-center max-w-3xl mx-auto">
        We are a passionate team of technologists, designers, and healthcare enthusiasts dedicated to making a real difference in people’s lives. Our mission is to bridge the gap between technology and healthcare, making quality care accessible and simple for everyone.<br className="hidden sm:block" />
        <span className="font-semibold text-blue-600">Driven by empathy, powered by innovation.</span>
      </p>
      <div className="flex flex-wrap justify-center gap-8 mt-8">
        <div className="flex flex-col items-center max-w-xs">
          <span className="inline-block bg-blue-100 p-4 rounded-full mb-2"><HeartIcon /></span>
          <span className="font-bold text-blue-700">Our Mission</span>
          <p className="text-gray-600 text-center mt-2">To empower every individual with easy access to trusted healthcare and support, using the best of technology and human touch.</p>
        </div>
        <div className="flex flex-col items-center max-w-xs">
          <span className="inline-block bg-teal-100 p-4 rounded-full mb-2"><BrainIcon /></span>
          <span className="font-bold text-teal-700">Our Team</span>
          <p className="text-gray-600 text-center mt-2">A diverse group of engineers, designers, and healthcare professionals working together to build a better, healthier future for all.</p>
        </div>
        <div className="flex flex-col items-center max-w-xs">
          <span className="inline-block bg-yellow-100 p-4 rounded-full mb-2"><StarIcon /></span>
          <span className="font-bold text-yellow-600">Our Values</span>
          <p className="text-gray-600 text-center mt-2">Empathy, trust, and innovation guide everything we do. We believe in putting people first and always striving for excellence.</p>
        </div>
      </div>
    </section>

    {/* Enhanced Footer Section */}
    <footer className="relative mt-16 bg-gradient-to-br from-blue-200/80 via-white/60 to-teal-200/80 backdrop-blur-xl py-10 px-4 rounded-t-3xl shadow-2xl border-t border-blue-200 overflow-hidden">
      {/* Glassmorphism effect */}
      <div className="absolute inset-0 bg-white/30 backdrop-blur-2xl rounded-t-3xl pointer-events-none" aria-hidden="true"></div>
      <div className="relative max-w-5xl mx-auto flex flex-col items-center gap-6 z-10">
        <div className="text-center">
          <h3 className="text-2xl font-extrabold text-teal-700 mb-2 drop-shadow-lg">Let's Connect & Collaborate</h3>
          <p className="text-gray-700 text-lg font-medium mb-4">Empowering healthcare, one connection at a time.</p>
        </div>
        <div className="flex gap-8 text-3xl items-center justify-center">
          <a href="https://wa.me/919999999999" target="_blank" rel="noopener noreferrer" className="group hover:scale-110 transition-transform" title="WhatsApp">
            <span className="sr-only">WhatsApp</span>
            <svg fill="currentColor" viewBox="0 0 24 24" className="w-10 h-10 text-green-500 group-hover:text-green-600 drop-shadow-xl"><path d="M20.52 3.48A12 12 0 0 0 3.48 20.52l-1.32 4.84a1 1 0 0 0 1.22 1.22l4.84-1.32A12 12 0 1 0 20.52 3.48zm-8.52 17a10 10 0 1 1 10-10 10 10 0 0 1-10 10zm5.2-7.6c-.28-.14-1.65-.81-1.9-.9s-.44-.14-.62.14-.72.9-.88 1.08-.32.21-.6.07a8.18 8.18 0 0 1-2.4-1.48 9.1 9.1 0 0 1-1.68-2.08c-.18-.31 0-.48.13-.62.13-.13.28-.34.42-.51a.56.56 0 0 0 .08-.6c-.07-.14-.62-1.5-.85-2.06-.22-.54-.45-.47-.62-.48h-.53a1.06 1.06 0 0 0-.77.36 3.22 3.22 0 0 0-1 2.41c0 1.42 1 2.8 2.1 3.8a11.6 11.6 0 0 0 4.1 2.5c.57.18 1.1.16 1.5.1a3.1 3.1 0 0 0 2.1-1.5c.14-.23.14-.43.1-.6s-.25-.18-.53-.32z"/></svg>
          </a>
          <a href="https://www.linkedin.com/in/your-linkedin" target="_blank" rel="noopener noreferrer" className="group hover:scale-110 transition-transform" title="LinkedIn">
            <span className="sr-only">LinkedIn</span>
            <svg fill="currentColor" viewBox="0 0 24 24" className="w-10 h-10 text-blue-700 group-hover:text-blue-800 drop-shadow-xl"><path d="M19 0h-14c-2.76 0-5 2.24-5 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5v-14c0-2.76-2.24-5-5-5zm-11 19h-3v-9h3v9zm-1.5-10.28c-.97 0-1.75-.79-1.75-1.75s.78-1.75 1.75-1.75 1.75.79 1.75 1.75-.78 1.75-1.75 1.75zm13.5 10.28h-3v-4.5c0-1.08-.02-2.47-1.5-2.47-1.5 0-1.73 1.17-1.73 2.39v4.58h-3v-9h2.88v1.23h.04c.4-.75 1.38-1.54 2.84-1.54 3.04 0 3.6 2 3.6 4.59v4.72z"/></svg>
          </a>
          <a href="tel:+919999999999" className="group hover:scale-110 transition-transform" title="Call">
            <span className="sr-only">Call</span>
            <svg fill="currentColor" viewBox="0 0 24 24" className="w-10 h-10 text-teal-600 group-hover:text-teal-700 drop-shadow-xl"><path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1-.24 11.36 11.36 0 0 0 3.58.57 1 1 0 0 1 1 1v3.61a1 1 0 0 1-1 1A17 17 0 0 1 3 5a1 1 0 0 1 1-1h3.61a1 1 0 0 1 1 1 11.36 11.36 0 0 0 .57 3.58 1 1 0 0 1-.24 1z"/></svg>
          </a>
          <a href="mailto:info@doctorconnect.com" className="group hover:scale-110 transition-transform" title="Email">
            <span className="sr-only">Email</span>
            <svg fill="currentColor" viewBox="0 0 24 24" className="w-10 h-10 text-red-500 group-hover:text-red-600 drop-shadow-xl"><path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 2v.01L12 13 4 6.01V6h16zM4 20v-9.99l7.99 7.99a1 1 0 0 0 1.42 0L20 10.01V20H4z"/></svg>
          </a>
        </div>
        <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="mt-6 px-6 py-2 bg-gradient-to-r from-teal-400 to-blue-500 text-white font-bold rounded-full shadow-lg hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-blue-400">Back to Top</button>
        <div className="text-center text-gray-500 text-sm mt-6">&copy; {new Date().getFullYear()} Doctor Connect. All rights reserved.</div>
      </div>
    </footer>
  </div>
  );
};

export default HomePage;
