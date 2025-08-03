import React, { useState, useEffect, useContext, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { askChatbotAPI } from '../api/chatbotApi';
import AuthContext from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

// --- Icon Components ---
const BotIcon = () => <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M12 5V3m0 18v-2M8 8.5a.5.5 0 10-1 0 .5.5 0 001 0zM17 8.5a.5.5 0 10-1 0 .5.5 0 001 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12a4 4 0 110-8 4 4 0 010 8z" /></svg>;
const CloseIcon = () => <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
const SendIcon = () => <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>;

const HealthChatBot = () => {
    const { auth } = useContext(AuthContext);
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'model', text: "Hello! I'm your health assistant. Ask me about your symptoms or find a doctor." }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatEndRef = useRef(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async () => {
        if (!input.trim()) return;
        if (!auth) {
            alert("Please login first to use the chatbot.");
            navigate('/login/user');
            return;
        }

        const userMessageText = input;
        const userMessage = { role: 'user', text: userMessageText };
        
        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        setInput('');
        setIsLoading(true);

        try {
            const chatHistoryForApi = updatedMessages.map(msg => ({ role: msg.role, text: msg.text }));
            const botReply = await askChatbotAPI(userMessageText, chatHistoryForApi, auth.token);

            if (botReply.tool_response && botReply.tool_response.tool === 'find_doctors') {
                const doctors = botReply.tool_response.data;
                const botMessage = { 
                    role: 'model', 
                    text: 'I found some doctors who might be able to help:',
                    doctors: doctors // Doctor list ko message ke saath jodna
                };
                setMessages(prev => [...prev, botMessage]);
            } else {
                const botMessage = { role: 'model', text: botReply.reply };
                setMessages(prev => [...prev, botMessage]);
            }

        } catch (error) {
            const errorMessage = { role: 'model', text: "Sorry, I'm having trouble connecting. Please try again later." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const symptomQuestions = [
      {
        question: "Aapko kis tarah ka dard hai? (tez ya halka)",
        key: "type"
      },
      {
        question: "Kya aapko chakkar bhi aa rahe hain? (haan ya nahi)",
        key: "dizziness"
      },
      {
        question: "Kya aapko bukhar bhi hai? (haan ya nahi)",
        key: "fever"
      }
    ];
    
    const [symptomStep, setSymptomStep] = useState(0);
    const [symptomAnswers, setSymptomAnswers] = useState({});
    
    const handleSymptomAnalysis = async () => {
        if (symptomStep < symptomQuestions.length) {
            setSymptomAnswers(prev => ({ ...prev, [symptomQuestions[symptomStep].key]: input }));
            setTimeout(() => {
                setMessages(prev => [...prev, { role: 'model', text: symptomQuestions[symptomStep].question }]);
                setSymptomStep(symptomStep + 1);
                setIsLoading(false);
                setInput('');
            }, 700);
            return;
        }
        
        if (symptomStep === symptomQuestions.length) {
            const summary = `Summary: Patient ke symptoms - Dard: ${symptomAnswers.type || ''}, Chakkar: ${symptomAnswers.dizziness || ''}, Bukhar: ${symptomAnswers.fever || ''}.`;
            setTimeout(() => {
                setMessages(prev => [...prev, { role: 'model', text: summary }]);
                setSymptomStep(symptomStep + 1);
                setIsLoading(false);
                setInput('');
            }, 700);
            return;
        }
    };

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                        className="fixed bottom-24 right-4 sm:right-8 w-[90%] max-w-sm h-[70vh] bg-white rounded-2xl shadow-2xl flex flex-col z-50"
                    >
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
                            <h3 className="font-bold text-lg text-gray-800">Health Assistant</h3>
                            <button onClick={() => setIsOpen(false)} className="p-1 rounded-full hover:bg-gray-200"><CloseIcon /></button>
                        </div>

                        <div className="flex-grow p-4 overflow-y-auto">
                            <div className="space-y-4">
                                {messages.map((msg, index) => (
                                    <div key={index}>
                                        <div className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0"><BotIcon /></div>}
                                            <div className={`px-4 py-2 rounded-2xl max-w-xs break-words ${msg.role === 'user' ? 'bg-teal-500 text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'}`}>
                                                {msg.text}
                                            </div>
                                        </div>
                                        {msg.doctors && (
                                            <div className="mt-2 space-y-2">
                                                {msg.doctors.map(doc => (
                                                    <div key={doc._id} className="bg-gray-100 p-2 rounded-lg ml-10">
                                                        <p className="font-bold text-sm">{doc.name}</p>
                                                        <p className="text-xs text-gray-600">{doc.profileDetails.specialty}, {doc.city}</p>
                                                        <Link to={`/doctor/${doc._id}`} className="text-xs text-teal-600 font-semibold hover:underline">View Profile & Book</Link>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {isLoading && (
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
                                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                                placeholder={auth ? "Ask a health question..." : "Please login to chat"}
                                className="flex-grow p-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500"
                                disabled={!auth || isLoading}
                            />
                            <button onClick={handleSendMessage} className="bg-teal-500 p-3 rounded-full text-white hover:bg-teal-600 transition shadow" disabled={!auth || isLoading}>
                                <SendIcon />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(prev => !prev)}
                className="fixed bottom-6 right-4 sm:right-8 bg-teal-500 text-white w-16 h-16 rounded-full shadow-2xl flex items-center justify-center z-50"
            >
                <BotIcon />
            </motion.button>
        </>
    );
};

export default HealthChatBot;
