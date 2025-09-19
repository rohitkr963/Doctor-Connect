// src/pages/ManagePopularDoctorsPage.js
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { getAllDoctorsAPI, setDoctorPopularStatusAPI } from '../api/doctorApi'; // ✅ New APIs import kiye

const ManagePopularDoctorsPage = () => {
    const { auth } = useContext(AuthContext);
    const navigate = useNavigate();

    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [updatingDoctorId, setUpdatingDoctorId] = useState(null); // Kis doctor ko update kar rahe hain

    useEffect(() => {
        const fetchDoctors = async () => {
            // ✅ Only allow if user is logged in as doctor (for simplicity, consider admin check here)
            // if (!auth || auth.type !== 'doctor') { // Ya 'admin' role check karein
            //     navigate('/login/doctor'); // Agar authorized nahi to login par bhej dein
            //     return;
            // }
            setLoading(true);
            try {
                const allDoctors = await getAllDoctorsAPI(); // Saare doctors fetch karein
                setDoctors(allDoctors);
            } catch (err) {
                setError('Doctors ko fetch karne mein dikkat hui.');
                console.error("Error fetching all doctors:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDoctors();
    }, [auth, navigate]); // Dependency: auth status change hone par re-fetch karein

    const handleTogglePopular = async (doctorId, currentStatus) => {
        setUpdatingDoctorId(doctorId);
        setMessage('');
        setError('');
        try {
            // ✅ setDoctorPopularStatusAPI ko call kiya
            const response = await setDoctorPopularStatusAPI(doctorId, !currentStatus, auth.token);
            setMessage(response.message);
            // Frontend list ko update karein
            setDoctors(prevDoctors =>
                prevDoctors.map(doc =>
                    doc._id === doctorId ? { ...doc, isPopular: !currentStatus } : doc
                )
            );
        } catch (err) {
            setError(err.message || 'Popular status update karne mein dikkat hui.');
            console.error("Error updating popular status:", err);
        } finally {
            setUpdatingDoctorId(null);
        }
    };

    if (loading) {
        return <div className="text-center p-10">Doctors list load ho rahi hai...</div>;
    }

    if (error) {
        return <div className="text-center p-10 text-red-600">{error}</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100 p-6 font-sans">
            <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Manage Popular Doctors</h2>
            
            {message && <p className="mt-2 mb-4 text-green-600 text-center">{message}</p>}
            {error && <p className="mt-2 mb-4 text-red-500 text-center">{error}</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {doctors.length === 0 && !loading && !error && (
                    <p className="col-span-full text-center text-gray-600">Koi doctor nahi mila.</p>
                )}
                {doctors.map(doctor => (
                    <div key={doctor._id} className="bg-white rounded-lg shadow-md p-5 flex items-center justify-between">
                        <div className="flex items-center">
                            <img src={doctor.profilePic || "https://via.placeholder.com/60/007bff/FFFFFF?text=Dr"} alt={doctor.name} className="w-16 h-16 rounded-full object-cover mr-4" />
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">{doctor.name}</h3>
                                <p className="text-sm text-gray-600">{doctor.specialization}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleTogglePopular(doctor._id, doctor.isPopular)}
                            className={`px-4 py-2 rounded-full text-sm font-bold transition-colors duration-300 ${doctor.isPopular ? 'bg-yellow-500 text-white hover:bg-yellow-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                            disabled={updatingDoctorId === doctor._id}
                        >
                            {updatingDoctorId === doctor._id ? 'Updating...' : (doctor.isPopular ? 'Unmark Popular' : 'Mark Popular')}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ManagePopularDoctorsPage;