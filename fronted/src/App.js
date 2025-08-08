import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Components aur Pages ko import karna
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import SearchResultsPage from './pages/SearchResultsPage';
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
import UserDocumentsPage from './pages/UserDocumentsPage';
// import UserProfileForDoctor from './pages/UserProfileForDoctor'; // Removed unused import

function App() {
  return (
    <Router>
      <div className="font-sans bg-gray-50 min-h-screen">
        <Navbar />
        <main>
          <Routes>
            {/* Website ke saare routes yahan hain */}
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchResultsPage />} />
            <Route path="/login/doctor" element={<DoctorLoginPage />} />
            <Route path="/register/doctor" element={<DoctorRegisterPage />} />
                <Route path="/doctor/dashboard" element={<ProtectedRoute type="doctor" redirectTo="/"> <DoctorDashboard /> </ProtectedRoute>} />
                <Route path="/patient-history" element={<ProtectedRoute type="doctor" redirectTo="/"> <PatientHistoryPage /> </ProtectedRoute>} />
            <Route path="/login/user" element={<UserLoginPage />} />
            <Route path="/register/user" element={<UserRegisterPage />} />
            <Route path="/doctor/:doctorId" element={<ProtectedRoute><DoctorProfilePage /></ProtectedRoute>} />
            <Route path="/doctor/profile/edit" element={<ProtectedRoute type="doctor"><DoctorProfileEditPage /></ProtectedRoute>} />
            <Route path="/doctor/profile/:doctorId" element={<ProtectedRoute><DoctorProfilePage /></ProtectedRoute>} />
            <Route path="/dashboard/patient" element={
              <ProtectedRoute redirectTo="/">
                <PatientDashboard />
              </ProtectedRoute>
            } />
            <Route path="/profile/user" element={
              <ProtectedRoute redirectTo="/">
                <UserProfilePage />
              </ProtectedRoute>
            } />
            <Route path="/profile/user/edit" element={
              <ProtectedRoute redirectTo="/">
                <UserProfileEditPage />
              </ProtectedRoute>
            } />
           <Route path="/my-records" element={<ProtectedRoute redirectTo="/"><UserDocumentsPage /></ProtectedRoute>} />
                <Route path="/specialty/:specialty" element={<ProtectedRoute redirectTo="/"> <SpecialtyDoctorsPage /> </ProtectedRoute>} />
                <Route path="/specialty" element={<ProtectedRoute redirectTo="/"> <SpecialtyDoctorsPage /> </ProtectedRoute>} />
            <Route path="/chat/:doctorId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
            <Route path="/doctor/chat" element={<ProtectedRoute type="doctor"><DoctorChatPage /></ProtectedRoute>} />
            <Route path="/notifications" element={
              <ProtectedRoute redirectTo="/">
                <NotificationsPage />
              </ProtectedRoute>
            } />
                <Route path="/doctor/appointments" element={<ProtectedRoute type="doctor" redirectTo="/"> <DoctorAppointmentsPage /> </ProtectedRoute>} />
                <Route path="/doctor/user/:userId" element={<ProtectedRoute type="doctor" redirectTo="/"> <UserProfilePage hideEdit={true} /> </ProtectedRoute>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;