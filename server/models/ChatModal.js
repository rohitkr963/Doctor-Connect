import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

const SOCKET_URL = 'http://localhost:5000';

const ChatModal = ({ doctor, open, onClose }) => {
  const { auth } = useContext(AuthContext);
  
  // Saare hooks component ke shuru mein
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Ye patient object hum 'auth' se banayenge
  const patient = auth; 

  useEffect(() => {
    if (open && auth?.token) {
      socketRef.current = io(SOCKET_URL);
      socketRef.current.emit('join_room', auth._id);

      socketRef.current.on('new_message', (message) => {
        setMessages((prev) => [...prev, message]);
      });

      // Purane messages ko fetch karna
      const fetchMessages = async () => {
        try {
          const config = { headers: { Authorization: `Bearer ${auth.token}` } };
          const { data } = await axios.get(`http://localhost:5000/api/messages/${doctor._id}`, config);
          if (Array.isArray(data)) {
            setMessages(data);
          }
        } catch (error) {
          console.error("Failed to fetch messages:", error);
        }
      };
      fetchMessages();

      return () => {
        socketRef.current.disconnect();
      };
    }
  }, [open, auth, doctor._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !auth?.token) return;

    const messageData = {
      receiverId: doctor._id,
      content: input,
    };
    
    // Real-time mein message bhejna
    socketRef.current.emit('send_message', messageData);

    // Database mein message save karna
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`,
        },
      };
      const { data } = await axios.post('http://localhost:5000/api/messages', messageData, config);
      setMessages((prev) => [...prev, data]);
      setInput('');
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg flex flex-col" style={{ height: '70vh' }}>
        <header className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">Chat with {doctor.name}</h2>
          <button onClick={onClose} className="text-2xl">&times;</button>
        </header>
        <main className="flex-grow p-4 overflow-y-auto bg-gray-50">
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.sender.toString() === auth._id.toString() ? 'justify-end' : 'justify-start'}`}>
                <div className={`px-4 py-2 rounded-2xl max-w-xs break-words shadow text-sm ${msg.sender.toString() === auth._id.toString() ? 'bg-teal-500 text-white' : 'bg-white text-gray-800'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </main>
        <footer className="p-4 border-t flex">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            className="flex-grow p-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button onClick={sendMessage} className="bg-teal-500 text-white px-6 py-2 rounded-r-lg font-semibold hover:bg-teal-600">
            Send
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ChatModal;
