import React, { useState, useRef, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom';
import AuthContext from '../context/AuthContext';


const BotIcon = () => (
  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M12 5V3m0 18v-2M8 8.5a.5.5 0 10-1 0 .5.5 0 001 0zM17 8.5a.5.5 0 10-1 0 .5.5 0 001 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12a4 4 0 110-8 4 4 0 010 8z" /></svg>
);

const DoctorChatBot = () => {
  const { auth } = useContext(AuthContext);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: '👨‍⚕️ **Namaste Doctor!**\n\nMain aapka practice assistant hoon.\n\nType "help" to see commands.', action: null, data: null }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    if (!auth || !auth.token) {
      setError('Please login to use doctor assistant');
      return;
    }
    
    setLoading(true);
    setError('');
    const userMsg = { sender: 'doctor', text: input, action: null, data: null };
    setMessages((prev) => [...prev, userMsg]);
    
    const currentInput = input;
    setInput('');
    
    try {
      console.log('📤 Sending to doctor AI:', { message: currentInput, sessionId });
      
      const res = await fetch(`${process.env.REACT_APP_API_BASE_URL || ''}/api/ai/doctor-chat`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        },
        body: JSON.stringify({ 
          message: currentInput,
          sessionId 
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Error communicating with AI');
      }
      
      console.log('📥 Received from doctor AI:', data);
      
      // Save sessionId
      if (data.sessionId) {
        setSessionId(data.sessionId);
      }
      
      setMessages((prev) => [...prev, { 
        sender: 'bot', 
        text: data.reply,
        action: data.action,
        data: data.data
      }]);
      
    } catch (err) {
      console.error('❌ Error:', err);
      setError(err.message);
      setMessages((prev) => [...prev, { 
        sender: 'bot', 
        text: '❌ Sorry, I encountered an error. Please try again.',
        action: null,
        data: null
      }]);
    } finally {
      setLoading(false);
    }
  };

  const ui = (
    <>
      {isOpen && (
        <div className="fixed bottom-24 right-4 sm:right-8 w-[90%] max-w-sm h-[70vh] bg-white rounded-2xl shadow-2xl flex flex-col z-50 animate-fade-in-up">
          <div className="p-4 border-b flex justify-between items-center bg-gradient-to-r from-blue-500 to-blue-600 rounded-t-2xl">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                <BotIcon />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">Practice Assistant</h3>
                <p className="text-xs text-blue-100">{auth?.name || 'Doctor'} • Online</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1 rounded-full hover:bg-white/20 transition">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="flex-grow p-4 overflow-y-auto">
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div key={idx}>
                  <div className={`flex items-end gap-2 ${msg.sender === 'doctor' ? 'justify-end' : 'justify-start'}`}>
                    {msg.sender === 'bot' && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-md">
                        <BotIcon />
                      </div>
                    )}
                    <div className={`px-4 py-2 rounded-2xl max-w-sm ${msg.sender === 'doctor' ? 'bg-gradient-to-r from-green-500 to-green-600 text-white rounded-br-none shadow-md' : 'bg-gray-100 text-gray-800 rounded-bl-none border border-gray-200'}`}>
                      <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: formatMessage(msg.text) }} />
                      
                      {/* Show appointments if data available */}
                      {msg.data && msg.data.appointments && msg.data.appointments.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {msg.data.appointments.slice(0, 5).map((apt, aptIdx) => (
                            <AppointmentCard key={aptIdx} appointment={apt} />
                          ))}
                        </div>
                      )}
                      
                      {/* Show queue if data available */}
                      {msg.data && msg.data.queue && msg.data.queue.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {msg.data.queue.map((item, qIdx) => (
                            <QueueCard key={qIdx} item={item} position={qIdx + 1} />
                          ))}
                        </div>
                      )}
                      
                      {/* Show patient search results */}
                      {msg.data && msg.data.user && (
                        <PatientCard patient={msg.data.user} appointments={msg.data.appointments} />
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex items-end gap-2 justify-start">
                  <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0"><BotIcon /></div>
                  <div className="px-4 py-2 rounded-2xl max-w-xs break-words bg-gray-200 text-gray-800 rounded-bl-none">
                    <span className="animate-pulse">...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          </div>
          <div className="p-4 border-t flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Ask something..."
              className="flex-grow p-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500"
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 rounded-full text-white hover:from-blue-600 hover:to-blue-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
            </button>
          </div>
        </div>
      )}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="fixed bottom-32 right-4 sm:right-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white w-16 h-16 rounded-full shadow-2xl flex items-center justify-center z-50 hover:scale-110 transition-transform duration-200"
        title="Doctor Assistant"
      >
        <BotIcon />
      </button>
      
      {error && (
        <div className="fixed bottom-52 right-4 sm:right-8 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in">
          ❌ {error}
        </div>
      )}
    </>
  );

  // Render into document.body so fixed positioning isn't clipped by page containers
  if (typeof window === 'undefined' || !document || !document.body) return null;
  return createPortal(ui, document.body);
};

// Helper function to format message text
function formatMessage(text) {
  if (!text) return '';
  
  // Convert markdown-style formatting to HTML
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
    .replace(/\n/g, '<br />') // Line breaks
    .replace(/•/g, '&bull;') // Bullets
    .replace(/(\d+\.)/g, '<strong>$1</strong>'); // Number lists
}

// Appointment Card Component
const AppointmentCard = ({ appointment }) => (
  <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 text-sm">
    <div className="flex items-center justify-between mb-1">
      <span className="font-semibold text-gray-800">⏰ {appointment.time}</span>
      <span className={`text-xs px-2 py-1 rounded-full ${
        appointment.status === 'Completed' ? 'bg-green-100 text-green-800' :
        appointment.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
        'bg-blue-100 text-blue-800'
      }`}>
        {appointment.status}
      </span>
    </div>
    <div className="text-gray-700">
      <div className="font-medium">👤 {appointment.user?.name || 'Patient'}</div>
      {appointment.symptoms && (
        <div className="text-xs text-gray-600 mt-1">🩺 {appointment.symptoms}</div>
      )}
      {appointment.user?.phone && (
        <div className="text-xs text-gray-500 mt-1">📱 {appointment.user.phone}</div>
      )}
    </div>
  </div>
);

// Queue Card Component
const QueueCard = ({ item, position }) => (
  <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 text-sm">
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
        {position}
      </div>
      <div className="flex-grow">
        <div className="font-medium text-gray-800">{item.userName}</div>
        <div className="text-xs text-gray-500">📱 {item.userPhone}</div>
        {item.joinedAt && (
          <div className="text-xs text-gray-400">
            ⏰ {new Date(item.joinedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
    </div>
  </div>
);

// Patient Card Component
const PatientCard = ({ patient, appointments }) => (
  <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 text-sm mt-3">
    <div className="font-semibold text-gray-800 mb-2">👤 {patient.name}</div>
    <div className="space-y-1 text-xs text-gray-600">
      <div>📱 {patient.phone}</div>
      <div>Age: {patient.age || 'N/A'} • {patient.gender || 'N/A'}</div>
    </div>
    {appointments && appointments.length > 0 && (
      <div className="mt-2 pt-2 border-t border-gray-200">
        <div className="text-xs font-medium text-gray-700 mb-1">Recent Visits:</div>
        {appointments.slice(0, 2).map((apt, idx) => (
          <div key={idx} className="text-xs text-gray-600">
            • {apt.date} - {apt.status}
          </div>
        ))}
      </div>
    )}
  </div>
);

export default DoctorChatBot;
