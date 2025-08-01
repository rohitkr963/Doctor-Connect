import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';


const HealthChatBot = () => {
  const navigate = useNavigate();
  // Get auth context for token
  const auth = JSON.parse(localStorage.getItem('auth')) || {};
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hi! Ask me any health-related question.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  // Booking form states
  const [showBooking, setShowBooking] = useState(false);
  const [showBookButton, setShowBookButton] = useState(false);
  // Track last bot message for intent
  useEffect(() => {
    if (messages.length > 1) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.sender === 'bot') {
        const botText = lastMsg.text.toLowerCase();
        if (botText.includes('appointment') || botText.includes('book') || botText.includes('doctor')) {
          setShowBookButton(true);
        }
      }
    }
  }, [messages]);
  const [doctors, setDoctors] = useState([]);
  const [aiDoctors, setAIDoctors] = useState([]); // Gemini-powered doctor suggestions
  const [booking, setBooking] = useState({ doctorId: '', date: '', time: '', symptoms: '' });
  const [bookingStatus, setBookingStatus] = useState('');

  // Fetch doctors for dropdown (only available doctors)
  useEffect(() => {
    if (showBooking && doctors.length === 0) {
      // Use searchDoctorsAPI to get only available doctors
      import('../api/doctorApi').then(({ searchDoctorsAPI }) => {
        searchDoctorsAPI().then(res => {
          setDoctors(res);
        }).catch(() => {
          setDoctors([]);
        });
      });
    }
  }, [showBooking, doctors.length]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages([...messages, { sender: 'user', text: input }]);
    // Detect appointment intent
    const lowerInput = input.toLowerCase();
    if (lowerInput.includes('appointment') || lowerInput.includes('book') || lowerInput.includes('doctor')) {
      setShowBookButton(true);
    }
    setLoading(true);
    try {
      // Prepare chatHistory for backend (convert messages to role/text format)
      const chatHistory = messages.map(msg => ({
        role: msg.sender === 'bot' ? 'assistant' : 'user',
        text: msg.text
      }));
      const res = await axios.post('/api/chatbot/symptom-check', {
        message: input,
        chatHistory
      });
      // Check if Gemini API returned doctor recommendations (assume JSON in reply)
      let reply = res.data.reply || 'Sorry, I could not find an answer.';
      let foundDoctors = [];
      try {
        // If reply contains a JSON array of doctors, parse it
        if (reply.startsWith('{') || reply.startsWith('[')) {
          const parsed = JSON.parse(reply);
          if (Array.isArray(parsed)) {
            foundDoctors = parsed;
          } else if (parsed.doctors && Array.isArray(parsed.doctors)) {
            foundDoctors = parsed.doctors;
          }
        }
      } catch {}
      if (foundDoctors.length > 0) {
        setAIDoctors(foundDoctors);
        setMessages(prev => [...prev, { sender: 'bot', text: 'Here are some doctors you can book:' }]);
      } else {
        setAIDoctors([]);
        setMessages(prev => [...prev, { sender: 'bot', text: reply }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'bot', text: 'Error: Unable to get response.' }]);
      setAIDoctors([]);
    }
    setInput('');
    setLoading(false);
  };

  // Floating animated chat icon
  return (
    <>
      {/* Floating chat icon (ring animation) */}
      {!open && (
        <button
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-teal-500 flex items-center justify-center shadow-lg animate-pulse ring-4 ring-teal-300 hover:scale-110 transition-all duration-200"
          style={{ boxShadow: '0 0 20px 2px #14b8a6' }}
          onClick={() => setOpen(true)}
        >
          {/* Chat icon SVG */}
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-message-circle">
            <path d="M21 11.5a8.38 8.38 0 0 1-1.9 5.4A8.5 8.5 0 0 1 3.4 6.6a8.38 8.38 0 0 1 5.4-1.9h.1A8.5 8.5 0 0 1 21 11.5z"></path>
            <polyline points="8 13 12 17 16 13"></polyline>
          </svg>
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-4 right-4 w-72 max-w-xs z-50">
          <div className="bg-white border border-gray-300 rounded-xl shadow-lg p-2 relative flex flex-col" style={{ minHeight: 320 }}>
            {/* Close button */}
            <button
              className="absolute top-1 right-1 text-gray-400 hover:text-teal-500 text-lg font-bold"
              onClick={() => setOpen(false)}
              aria-label="Close Chat"
              style={{ padding: 0, lineHeight: 1 }}
            >
              &times;
            </button>
            <div className="flex items-center gap-2 mb-1">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-message-circle">
                <path d="M21 11.5a8.38 8.38 0 0 1-1.9 5.4A8.5 8.5 0 0 1 3.4 6.6a8.38 8.38 0 0 1 5.4-1.9h.1A8.5 8.5 0 0 1 21 11.5z"></path>
                <polyline points="8 13 12 17 16 13"></polyline>
              </svg>
              <span className="text-base font-semibold text-teal-600">ChatBot</span>
            </div>
            <div className="h-40 overflow-y-auto mb-1 flex flex-col gap-1">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <span className={`px-2 py-1 rounded-lg text-xs ${msg.sender === 'user' ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-800'}`}>{msg.text}</span>
                </div>
              ))}
              {/* Gemini-powered doctor cards */}
              {aiDoctors.length > 0 && (
                <div className="flex flex-col gap-2 mt-2">
                  {aiDoctors.map(doc => (
                    <div
                      key={doc._id || doc.id || doc.name}
                      className="border rounded-lg p-2 bg-blue-50 flex flex-col cursor-pointer hover:bg-blue-100"
                      onClick={() => {
                        if (doc.profileUrl) {
                          navigate(doc.profileUrl);
                        } else if (doc._id) {
                          navigate(`/doctor/${doc._id}`);
                        }
                      }}
                    >
                      <div className="font-semibold text-teal-700">{doc.name}</div>
                      <div className="text-xs text-gray-700">{doc.specialty || doc.specialisation || 'Doctor'}</div>
                      {doc.experience && <div className="text-xs text-gray-500">Experience: {doc.experience} yrs</div>}
                      {doc.hospital && <div className="text-xs text-gray-500">Hospital: {doc.hospital}</div>}
                      <div className="mt-2 text-xs text-blue-600 underline">View Profile & Book</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <form onSubmit={sendMessage} className="flex gap-1 mt-auto mb-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                className="flex-grow border border-gray-300 rounded-md p-1 text-xs"
                placeholder="Type..."
                disabled={loading}
                style={{ minHeight: 32 }}
              />
              <button
                type="submit"
                className="bg-teal-500 text-white px-2 py-1 rounded hover:bg-teal-600 text-xs"
                disabled={loading}
                style={{ minHeight: 32 }}
              >
                {loading ? '...' : 'Send'}
              </button>
            </form>
            {/* Booking Form */}
            {showBooking && (
              <form
                className="flex flex-col gap-2 mt-2"
                onSubmit={async e => {
                  e.preventDefault();
                  setBookingStatus('');
                  try {
                    await axios.post('/api/appointments/book', booking, {
                      headers: {
                        Authorization: `Bearer ${auth.token}`
                      }
                    });
                    setBookingStatus('Appointment booked successfully!');
                    setBooking({ doctorId: '', date: '', time: '', symptoms: '' });
                  } catch (err) {
                    setBookingStatus('Error booking appointment.');
                  }
                }}
              >
                <select
                  className="border border-gray-300 rounded-md p-1 text-xs"
                  value={booking.doctorId}
                  onChange={e => setBooking(b => ({ ...b, doctorId: e.target.value }))}
                  required
                >
                  <option value="">Select Doctor</option>
                  {doctors.map(doc => (
                    <option key={doc._id} value={doc._id}>{doc.name}</option>
                  ))}
                </select>
                <input
                  type="date"
                  className="border border-gray-300 rounded-md p-1 text-xs"
                  value={booking.date}
                  onChange={e => setBooking(b => ({ ...b, date: e.target.value }))}
                  required
                />
                <input
                  type="time"
                  className="border border-gray-300 rounded-md p-1 text-xs"
                  value={booking.time}
                  onChange={e => setBooking(b => ({ ...b, time: e.target.value }))}
                  required
                />
                <input
                  type="text"
                  className="border border-gray-300 rounded-md p-1 text-xs"
                  value={booking.symptoms}
                  onChange={e => setBooking(b => ({ ...b, symptoms: e.target.value }))}
                  placeholder="Symptoms (optional)"
                />
            
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default HealthChatBot;
