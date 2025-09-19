import React, { useState } from 'react';

const AgenticLangchainChatbot = ({ userId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setMessages([...messages, { sender: 'user', text: input }]);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/agentic-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, userId }),
      });
      const data = await res.json();
      setMessages((msgs) => [...msgs, { sender: 'bot', text: data.reply }]);
    } catch {
      setMessages((msgs) => [...msgs, { sender: 'bot', text: 'Error! Please try again.' }]);
    }
    setInput('');
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto p-4 bg-white rounded shadow">
      <div className="h-64 overflow-y-auto mb-2 border rounded p-2 bg-gray-50">
        {messages.map((msg, i) => (
          <div key={i} className={msg.sender === 'user' ? 'text-right' : 'text-left'}>
            <span className={msg.sender === 'user' ? 'bg-blue-100 px-2 py-1 rounded' : 'bg-green-100 px-2 py-1 rounded'}>
              {msg.text}
            </span>
          </div>
        ))}
      </div>
      <div className="flex">
        <input
          className="flex-1 border rounded px-2 py-1"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          placeholder="Type your message..."
        />
        <button
          className="ml-2 bg-blue-500 text-white px-4 py-1 rounded"
          onClick={sendMessage}
          disabled={loading}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default AgenticLangchainChatbot;
