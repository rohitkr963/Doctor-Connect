import React, { useState, useRef, useEffect } from 'react';


const BotIcon = () => (
  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M12 5V3m0 18v-2M8 8.5a.5.5 0 10-1 0 .5.5 0 001 0zM17 8.5a.5.5 0 10-1 0 .5.5 0 001 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12a4 4 0 110-8 4 4 0 010 8z" /></svg>
);


const DoctorChatBot = () => {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Namaste Doctor! Sawal poochhiye, main madad karunga.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    <>
      {isOpen && (
        <div className="fixed bottom-24 right-4 sm:right-8 w-[90%] max-w-sm h-[70vh] bg-white rounded-2xl shadow-2xl flex flex-col z-50 animate-fade-in-up">
          <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
            <h3 className="font-bold text-lg text-gray-800">Doctor Chatbot</h3>
            <button onClick={() => setIsOpen(false)} className="p-1 rounded-full hover:bg-gray-200">
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="flex-grow p-4 overflow-y-auto">
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div key={idx}>
                  <div className={`flex items-end gap-2 ${msg.sender === 'doctor' ? 'justify-end' : 'justify-start'}`}>
                    {msg.sender === 'bot' && <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0"><BotIcon /></div>}
                    <div className={`px-4 py-2 rounded-2xl max-w-xs break-words ${msg.sender === 'doctor' ? 'bg-teal-500 text-white rounded-br-none' : msg.isDbAnswer ? 'bg-yellow-100 text-yellow-900 font-bold rounded-bl-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'}`}>
                      {msg.text}
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
              className="bg-teal-500 p-3 rounded-full text-white hover:bg-teal-600 transition shadow"
              disabled={loading}
            >Send</button>
          </div>
        </div>
      )}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="fixed bottom-32 right-4 sm:right-8 bg-teal-500 text-white w-16 h-16 rounded-full shadow-2xl flex items-center justify-center z-50"
      >
        <BotIcon />
      </button>
    </>
  );
};

export default DoctorChatBot;
