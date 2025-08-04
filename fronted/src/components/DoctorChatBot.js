import React, { useState } from 'react';

const DoctorChatBot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sendMessage = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError('');
    const userMsg = { sender: 'doctor', text: input };
    setMessages((prev) => [...prev, userMsg]);
    try {
      const res = await fetch('/api/ai/doctor-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error');
      // If reply is a direct DB answer, highlight it
      let isDbAnswer = false;
      if (data.reply && (data.reply.startsWith('Aaj') || data.reply.startsWith('User:') || data.reply === 'User nahi mila.')) {
        isDbAnswer = true;
      }
      setMessages((prev) => [...prev, { sender: 'bot', text: data.reply, isDbAnswer }]);
      if (data.reply === 'User nahi mila.') setError('User ID galat hai ya user nahi mila.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setInput('');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 max-w-lg mx-auto mt-8 animate-fade-in-up">
      <h2 className="text-2xl font-bold text-blue-900 mb-4">Doctor Chatbot</h2>
      <div className="h-64 overflow-y-auto border rounded-lg p-3 bg-slate-50 mb-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`mb-2 flex ${msg.sender === 'doctor' ? 'justify-end' : 'justify-start'}`}>
            <div className={`px-4 py-2 rounded-xl ${msg.sender === 'doctor' ? 'bg-blue-100 text-blue-900' : msg.isDbAnswer ? 'bg-yellow-100 text-yellow-900 font-bold' : 'bg-teal-100 text-teal-900'}`}>{msg.text}</div>
          </div>
        ))}
        {loading && <div className="text-blue-400">Bot is typing...</div>}
      </div>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <div className="flex">
        <input
          type="text"
          className="flex-grow border rounded-l-lg px-3 py-2 focus:outline-none"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask something..."
          disabled={loading}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
        />
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-r-lg font-bold hover:bg-blue-700"
          onClick={sendMessage}
          disabled={loading}
        >Send</button>
      </div>
      <style>{`
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(40px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 1s cubic-bezier(0.23, 1, 0.32, 1) both;
        }
      `}</style>
    </div>
  );
};

export default DoctorChatBot;
