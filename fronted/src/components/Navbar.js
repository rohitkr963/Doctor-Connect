import React, { useContext } from 'react';
import useNotificationCount from '../hooks/useNotificationCount';
import useDoctorUnreadMessageCount from '../hooks/useDoctorUnreadMessageCount';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const BellIcon = () => (
  <svg className="w-6 h-6 text-gray-500 hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const Navbar = () => {
  const { auth, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [notifCount, setNotifCount] = React.useState(0);
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
      const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/users/notifications/read-all`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      if (res.ok) {
        setNotifCount(0);
        navigate('/notifications');
      }
    } catch {}
  };

  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <nav className="bg-white shadow-md py-2 px-2 sm:px-4 sticky top-0 z-40 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <Link to={auth?.type === 'doctor' ? '/doctor/dashboard' : '/'} className="font-bold text-lg sm:text-xl text-teal-600">DoctorConnect</Link>
          </div>
          {/* Doctor chat icon always visible in navbar; notification bell for user always visible in navbar */}
          {auth && (
            <>
              {/* Doctor chat icon only visible in mobile (responsive) navbar, not in desktop */}
              {/* No chat icon for doctor in main navbar */}
              {auth.type === 'user' && (
                <Link to="/notifications" title="Notifications" className="relative mx-2 flex items-center justify-center sm:hidden" onClick={handleBellClick}>
                  <BellIcon />
                  {notifCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full px-2 py-0.5 text-xs font-bold">{notifCount}</span>
                  )}
                </Link>
              )}
            </>
          )}
          {/* Hamburger for mobile + doctor chat icon next to it */}
          <div className="sm:hidden flex items-center">
            <button
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-teal-600 focus:outline-none"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
            {auth?.type === 'doctor' && (
              <Link to="/doctor/chat" className="ml-3 flex items-center justify-center relative font-bold text-teal-600" title="Chats">
                <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 01-4-.8l-4 1 1-4A8.96 8.96 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {unreadMsgCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full px-2 py-0.5 text-xs font-bold">{unreadMsgCount}</span>
                )}
                <span className="ml-2 hidden sm:inline">Chats</span>
              </Link>
            )}
          </div>
          {/* Desktop menu */}
          <div className="hidden sm:flex items-center space-x-4">
            {auth ? (
              <>
                <span className="text-gray-700 hidden md:block">
                  Welcome, <span className="font-semibold">{auth.name}</span>
                </span>
                {auth.type === 'doctor' && (
                  <>
                    <Link to="/doctor/dashboard" className="text-gray-600 hover:text-blue-600 font-medium">Dashboard</Link>
                    <Link to={`/doctor/profile/${auth._id}`} className="text-gray-600 hover:text-blue-600 font-medium">My Profile</Link>
                    <Link to="/doctor/appointments" className="text-gray-600 hover:text-blue-600 font-medium">Appointments</Link>
                    <Link to="/doctor/chat" className="ml-2 flex items-center justify-center relative font-bold text-teal-600" title="Chats">
                      <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 01-4-.8l-4 1 1-4A8.96 8.96 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      {unreadMsgCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full px-2 py-0.5 text-xs font-bold">{unreadMsgCount}</span>
                      )}
                      <span className="ml-2">Chats</span>
                    </Link>
                    <Link to="/patient-history" className="text-gray-600 hover:text-blue-600 font-medium">My Patient History</Link>
                  </>
                )}
                {auth.type === 'user' && (
                  <>
                <Link to="/dashboard/patient" className="text-gray-600 hover:text-blue-600 font-medium">My Dashboard</Link>
                <Link to="/profile/user" className="text-gray-600 hover:text-blue-600 font-medium">My Profile</Link>
                <Link to="/my-records" className="text-gray-600 hover:text-blue-600 font-medium">My Records</Link>
                <Link to="/notifications" title="Notifications" className="relative mx-2 flex items-center justify-center" onClick={handleBellClick}>
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
        {/* Mobile menu dropdown */}
        {menuOpen && (
          <div className="sm:hidden flex flex-col items-start space-y-2 py-2 animate-fade-in-up">
            {auth ? (
              <>
                <span className="text-gray-700 mb-2">
                  Welcome, <span className="font-semibold">{auth.name}</span>
                </span>
                {/* Doctor mobile menu */}
                {auth.type === 'doctor' && (
                  <>
                    <Link to="/doctor/dashboard" className="text-gray-600 hover:text-blue-600 font-medium w-full">Dashboard</Link>
                    <Link to={`/doctor/profile/${auth._id}`} className="text-gray-600 hover:text-blue-600 font-medium w-full">My Profile</Link>
                    <Link to="/doctor/appointments" className="text-gray-600 hover:text-blue-600 font-medium w-full">Appointments</Link>
                    <Link to="/doctor/chat" className="flex items-center justify-start relative w-full font-bold text-teal-600" title="Chats">
                      <svg className="w-6 h-6 text-teal-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 01-4-.8l-4 1 1-4A8.96 8.96 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      {unreadMsgCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full px-2 py-0.5 text-xs font-bold">{unreadMsgCount}</span>
                      )}
                      <span className="ml-2">Chats</span>
                    </Link>
                    <Link to="/patient-history" className="text-gray-600 hover:text-blue-600 font-medium w-full">My Patient History</Link>
                  </>
                )}
                {/* User mobile menu, notification bell is already in navbar above */}
                {auth.type === 'user' && (
                  <>
                <Link to="/dashboard/patient" className="text-gray-600 hover:text-blue-600 font-medium w-full">My Dashboard</Link>
                <Link to="/profile/user" className="text-gray-600 hover:text-blue-600 font-medium w-full">My Profile</Link>
                <Link to="/my-records" className="text-gray-600 hover:text-blue-600 font-medium w-full">My Records</Link>
                <Link to="/notifications" title="Notifications" className="relative flex items-center w-full" onClick={handleBellClick}>
                  <BellIcon />
                  {notifCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full px-2 py-0.5 text-xs font-bold">{notifCount}</span>
                  )}
                  <span className="ml-2">Notifications</span>
                </Link>
                  </>
                )}
                <button
                  onClick={handleLogout}
                  className="bg-red-500 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-red-600 w-full"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login/user" className="text-gray-600 hover:text-blue-600 font-medium w-full">Login as Patient</Link>
                <Link to="/login/doctor" className="bg-blue-500 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-600 w-full">
                  Login as Doctor
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;