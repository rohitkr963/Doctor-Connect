import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

export default function useNotificationCount(token) {
  const [count, setCount] = useState(0);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token || typeof token !== 'string' || token.trim() === '') return;
    let userId = null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.id || payload._id;
    } catch {}

    const fetchCount = async () => {
      try {
        const res = await fetch('/api/users/notifications', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.status === 401) {
          setCount(0);
          return;
        }
        if (!res.ok) return;
        const data = await res.json();
        const unread = data.filter(n => !n.isRead).length;
        setCount(unread);
      } catch {
        setCount(0);
      }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 10000);

    if (!socketRef.current) {
      socketRef.current = io(`${process.env.REACT_APP_API_BASE_URL}
`);
      socketRef.current.on('connect', () => {
        if (userId) socketRef.current.emit('register', userId);
      });
      socketRef.current.on('newNotification', () => {
        fetchCount();
      });
    }
    return () => {
      clearInterval(interval);
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [token]);

  return count;
}
