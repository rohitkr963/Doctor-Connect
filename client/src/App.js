import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Components aur Pages ko import karna
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import DoctorLoginPage from './pages/DoctorLoginPage';
import DoctorRegisterPage from './pages/DoctorRegisterPage';
import DoctorDashboard from './pages/DoctorDashboard';
import UserLoginPage from './pages/UserLoginPage';
import UserRegisterPage from './pages/UserRegisterPage';
import DoctorProfilePage from './pages/DoctorProfilePage';
import DoctorProfileEditPage from './pages/DoctorProfileEditPage';
import SpecialtyDoctorsPage from './pages/SpecialtyDoctorsPage';
import PatientDashboard from './pages/PatientDashboard';
import UserProfilePage from './pages/UserProfilePage';
import UserProfileEditPage from './pages/UserProfileEditPage'; // <-- Yeh line
import NotificationsPage from './pages/NotificationsPage';
import PatientHistoryPage from './pages/PatientHistoryPage';
import DoctorAppointmentsPage from './pages/DoctorAppointmentsPage';
import ProtectedRoute from './components/ProtectedRoute';
import ChatPage from './pages/ChatPage';
import DoctorChatPage from './pages/DoctorChatPage';

function App() {
  return (
    <Router>
      <div className="font-sans bg-gray-50 min-h-screen">
        <Navbar />
        <main>
          <Routes>
            {/* Website ke saare routes yahan hain */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login/doctor" element={<DoctorLoginPage />} />
            <Route path="/register/doctor" element={<DoctorRegisterPage />} />
            <Route path="/doctor/dashboard" element={<ProtectedRoute type="doctor"><DoctorDashboard /></ProtectedRoute>} />
            <Route path="/patient-history" element={<ProtectedRoute type="doctor"><PatientHistoryPage /></ProtectedRoute>} />
            <Route path="/login/user" element={<UserLoginPage />} />
            <Route path="/register/user" element={<UserRegisterPage />} />
            <Route path="/doctor/:doctorId" element={<ProtectedRoute><DoctorProfilePage /></ProtectedRoute>} />
            <Route path="/doctor/profile/edit" element={<ProtectedRoute type="doctor"><DoctorProfileEditPage /></ProtectedRoute>} />
            <Route path="/doctor/profile/:doctorId" element={<ProtectedRoute><DoctorProfilePage /></ProtectedRoute>} />
            <Route path="/dashboard/patient" element={
              <ProtectedRoute>
                <PatientDashboard />
              </ProtectedRoute>
            } />
            <Route path="/profile/user" element={
              <ProtectedRoute>
                <UserProfilePage />
              </ProtectedRoute>
            } />
            <Route path="/profile/user/edit" element={
              <ProtectedRoute>
                <UserProfileEditPage />
              </ProtectedRoute>
            } />
            <Route path="/specialty/:specialty" element={<SpecialtyDoctorsPage />} />
            <Route path="/specialty" element={<SpecialtyDoctorsPage />} />
            <Route path="/chat/:doctorId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
            <Route path="/doctor/chat" element={<ProtectedRoute type="doctor"><DoctorChatPage /></ProtectedRoute>} />
            <Route path="/notifications" element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            } />
            <Route path="/doctor/appointments" element={<ProtectedRoute type="doctor"><DoctorAppointmentsPage /></ProtectedRoute>} />
            <Route path="/doctor/user/:userId" element={<ProtectedRoute><UserProfilePage /></ProtectedRoute>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;