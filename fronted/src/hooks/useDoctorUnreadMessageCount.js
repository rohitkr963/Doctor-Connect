import { useEffect, useState } from 'react';


export default function useDoctorUnreadMessageCount(token, userType) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!token || userType !== 'doctor') {
      setCount(0);
      return;
    }
    const endpoint = `${process.env.REACT_APP_API_BASE_URL}
/api/messages/doctor/unread-count`;
    const fetchCount = async () => {
      try {
        const res = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setCount(data.count || 0);
        } else {
          setCount(0);
        }
      } catch {
        setCount(0);
      }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 10000);
    return () => clearInterval(interval);
  }, [token, userType]);

  return count;
}
