import React, { useContext } from 'react';
import useNotificationCount from '../hooks/useNotificationCount';
import useDoctorUnreadMessageCount from '../hooks/useDoctorUnreadMessageCount';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const BellIcon = () => <svg className="w-6 h-6 text-gray-500 hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;

const Navbar = () => {

  const { auth, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [notifCount, setNotifCount] = React.useState(0);
  // Always call the hook, but it will not fetch if no token
  const notifCountHook = useNotificationCount(auth?.token);
  const doctorUnreadMsgCount = useDoctorUnreadMessageCount(auth?.token, auth?.type);
  const unreadMsgCount = auth?.type === 'doctor' ? doctorUnreadMsgCount : 0;

  React.useEffect(() => {
    setNotifCount(auth && auth.token ? notifCountHook : 0);
  }, [notifCountHook, auth]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleBellClick = async (e) => {
    e.preventDefault();
    if (!auth?.token) return;
    try {
      const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}
/api/users/notifications/read-all`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      if (res.ok) {
        setNotifCount(0);
        // Optionally, navigate to notifications page
        navigate('/notifications');
      }
    } catch {}
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <Link to="/" className="text-2xl font-bold text-blue-600">Doctor Connect</Link>
          </div>

          <div className="flex items-center space-x-4">
            {auth ? (
              <>
                <span className="text-gray-700 hidden sm:block">
                  Welcome, <span className="font-semibold">{auth.name}</span>
                </span>
                {auth.type === 'doctor' && (
                  <>
                    <Link to="/doctor/dashboard" className="text-gray-600 hover:text-blue-600 font-medium">Dashboard</Link>
                    <Link to={`/doctor/profile/${auth._id}`} className="text-gray-600 hover:text-blue-600 font-medium">My Profile</Link>
                    <Link to="/doctor/appointments" className="text-gray-600 hover:text-blue-600 font-medium">Appointments</Link>
                    <Link to="/doctor/chat" className="ml-2 flex items-center justify-center relative" title="Chats">
                      <svg className="w-6 h-6 text-gray-500 hover:text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 01-4-.8l-4 1 1-4A8.96 8.96 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      {unreadMsgCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full px-2 py-0.5 text-xs font-bold">{unreadMsgCount}</span>
                      )}
                    </Link>
                    <Link to="/patient-history" className="text-gray-600 hover:text-blue-600 font-medium">My Patient History</Link>
                  </>
                )}
                {auth.type === 'user' && (
                  <>
                    <Link to="/dashboard/patient" className="text-gray-600 hover:text-blue-600 font-medium">My Dashboard</Link>
                    <Link to="/profile/user" className="text-gray-600 hover:text-blue-600 font-medium">My Profile</Link>
                   <Link to="/my-records" className="text-gray-600 hover:text-blue-600 font-medium">My Records</Link>
                    <Link to="/notifications" title="Notifications" className="relative" onClick={handleBellClick}>
                        <BellIcon />
                        {notifCount > 0 && (
                          <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full px-2 py-0.5 text-xs font-bold">{notifCount}</span>
                        )}
                    </Link>
                  </>
                )}
                <button
                  onClick={handleLogout}
                  className="bg-red-500 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-red-600"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login/user" className="text-gray-600 hover:text-blue-600 font-medium">Login as Patient</Link>
                <Link to="/login/doctor" className="bg-blue-500 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-600">
                  Login as Doctor
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
