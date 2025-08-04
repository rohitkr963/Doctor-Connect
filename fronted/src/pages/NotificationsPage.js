import React, { useEffect, useState, useContext, useRef } from 'react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

// --- Icon Components ---
const AvailabilityIcon = () => <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" /></svg>;
const QueueIcon = () => <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h8" /></svg>;
const AppointmentIcon = () => <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 3v4M8 3v4" /></svg>;
const BellIcon = () => <svg className="w-8 h-8 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
const ReadTickIcon = () => <svg className="w-5 h-5 text-teal-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>;

const NotificationsPage = () => {
    const { auth, setAuth } = useContext(AuthContext);
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deletingId, setDeletingId] = useState(null);
    // Ensure token is loaded from localStorage if context is empty (fixes 401 after refresh)
    useEffect(() => {
        if (!auth?.token) {
            const storedAuth = localStorage.getItem('auth');
            if (storedAuth) {
                try {
                    const parsed = JSON.parse(storedAuth);
                    if (parsed?.token && setAuth) setAuth(parsed);
                } catch {}
            }
        }
    }, [auth, setAuth]);
    // Delete notification handler with animation
    const handleDelete = async (id) => {
        setDeletingId(id);
        // Wait for animation to finish before removing
        setTimeout(async () => {
            try {
                const res = await fetch(`/api/users/notifications/${id}`, {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${auth?.token}`,
                    },
                });
                if (res.status === 401) {
                    if (setAuth) setAuth(null);
                    navigate('/login');
                    return;
                }
                if (!res.ok) throw new Error('Failed to delete notification');
                setNotifications(notifications.filter(n => n._id !== id));
            } catch (err) {
                setError(err.message);
            } finally {
                setDeletingId(null);
            }
        }, 400); // match animation duration
    };

    const socketRef = useRef(null);

    useEffect(() => {
        if (!auth?.token) {
            navigate('/login');
            return;
        }
        const fetchNotifications = async () => {
            setLoading(true);
            try {
                const res = await fetch('/api/users/notifications', {
                    headers: {
                        Authorization: `Bearer ${auth?.token}`,
                    },
                });
                if (res.status === 401) {
                    if (setAuth) setAuth(null);
                    navigate('/login');
                    return;
                }
                if (!res.ok) throw new Error('Failed to fetch notifications');
                const data = await res.json();
                setNotifications(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchNotifications();

        // Socket.io setup
        if (!socketRef.current) {
            socketRef.current = io(`${process.env.REACT_APP_API_BASE_URL}
`);
            socketRef.current.on('connect', () => {
                // Register userId for targeted notifications
                socketRef.current.emit('register', auth.userId || auth._id);
            });
            socketRef.current.on('newNotification', (notif) => {
                setNotifications(prev => [notif, ...prev]);
            });
        }
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [auth, navigate]);

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-blue-700 text-xl animate-fade-in-up">Loading notifications...</div>;
    if (error) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-red-500 text-xl animate-fade-in-up">Error: {error}</div>;

    return (
        <div className="min-h-screen bg-slate-50 animate-fade-in-up">
            <div className="container mx-auto p-4 sm:p-6 lg:p-8">
                <header className="mb-8 flex items-center space-x-4 animate-fade-in-up">
                    <BellIcon />
                    <div>
                        <h1 className="text-3xl font-bold text-blue-900 animate-heading-glow">Your Notifications</h1>
                        <p className="text-blue-700 mt-1">All your recent updates and alerts will appear here.</p>
                    </div>
                </header>

                {/* Notifications List */}
                <div className="bg-white p-6 rounded-2xl shadow-xl animate-fade-in-up">
                    <div className="space-y-6">
                        {notifications.length === 0 ? (
                            <div className="text-blue-400 animate-fade-in-up">No notifications found.</div>
                        ) : (
                            notifications.map((notif, idx) => {
                                let icon = <BellIcon />;
                                let bg = '';
                                if (notif.type === 'availability') {
                                    icon = <AvailabilityIcon />;
                                    bg = 'bg-green-50';
                                } else if (notif.type === 'queue') {
                                    icon = <QueueIcon />;
                                    bg = 'bg-blue-50';
                                } else if (notif.type === 'appointment') {
                                    icon = <AppointmentIcon />;
                                    bg = 'bg-yellow-50';
                                }
                                const isDeleting = deletingId === notif._id;
                                return (
                                    <div
                                        key={notif._id}
                                        className={`flex items-start p-4 rounded-xl transition-all duration-300 ${bg} ${!notif.isRead ? 'border-l-4 border-teal-400' : ''} animate-fade-in-up animate-float-card hover:scale-[1.025] hover:shadow-2xl ${isDeleting ? 'animate-slide-out' : ''}`}
                                        style={{animationDelay: `${0.1 + idx * 0.07}s`}}
                                    >
                                        {icon}
                                        <img src={notif.doctor?.profileDetails?.profilePicture || '/default-avatar.png'} alt={notif.doctor?.name || 'Doctor'} className="w-12 h-12 rounded-full object-cover ml-4 border"/>
                                        <div className="ml-4 flex-grow">
                                            <div className="flex justify-between items-center">
                                                <p className="font-bold text-blue-900">{notif.doctor?.name || 'Doctor'}</p>
                                                <p className="text-xs text-blue-400">{new Date(notif.createdAt).toLocaleString()}</p>
                                            </div>
                                            <div className="flex justify-between items-end mt-1">
                                                <p className="text-sm text-blue-700">{notif.message}</p>
                                                {notif.isRead && <span className="text-green-500">✓</span>}
                                                <button onClick={() => handleDelete(notif._id)} className="ml-4 text-red-500 hover:text-red-700 font-bold animate-pulse-on-hover">Delete</button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
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
                  0% { text-shadow: 0 0 0px #2563eb; }
                  50% { text-shadow: 0 0 16px #2563eb; }
                  100% { text-shadow: 0 0 0px #2563eb; }
                }
                .animate-heading-glow {
                  animation: headingGlow 2.5s ease-in-out infinite;
                }
                @keyframes pulseOnHover {
                  0% { box-shadow: 0 0 0 0 rgba(239,68,68,0.7); }
                  70% { box-shadow: 0 0 0 8px rgba(239,68,68,0); }
                  100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
                }
                .animate-pulse-on-hover:hover {
                  animation: pulseOnHover 1s;
                }
                @keyframes slideOut {
                  0% { opacity: 1; transform: translateX(0) scale(1); }
                  60% { opacity: 0.8; transform: translateX(60vw) scale(0.98); }
                  100% { opacity: 0; transform: translateX(100vw) scale(0.95); }
                }
                .animate-slide-out {
                  animation: slideOut 0.5s cubic-bezier(0.4,0,0.2,1) both;
                }
            `}</style>
        </div>
    );
};

export default NotificationsPage;
