// src/api/doctorApi.js
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/doctors'; // Backend doctor APIs ka base URL

// Helper function to set authorization header
const getConfig = (token = null) => { // token optional banaya
    return {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }), // Agar token hai to add karo
        },
    };
};

/**
 * Doctors ko search karne ke liye backend API ko call karta hai.
 */
export const searchDoctorsAPI = async (city, name, specialty) => {
    try {
        const params = new URLSearchParams();
        if (city) params.append('city', city);
        if (name) params.append('name', name);
        if (specialty) params.append('specialty', specialty);
        const searchUrl = `${API_URL}/search?${params.toString()}`;
        const response = await axios.get(searchUrl);
        return response.data;
    } catch (error) {
        console.error('Error fetching doctors:', error.response ? error.response.data : error.message);
        throw new Error('Could not fetch doctors. Please try again later.');
    }
};

/**
 * Saare unique specializations ki list laata hai.
 */
export const getSpecializationsAPI = async () => {
    try {
        const response = await axios.get(`${API_URL}/specializations`);
        return response.data;
    } catch (error) {
        console.error('Error fetching specializations:', error.response ? error.response.data : error.message);
        throw new Error('Could not fetch specializations.');
    }
};

/**
 * Doctor ko login karne ke liye API call karta hai.
 */
export const loginDoctorAPI = async (email, password) => {
    try {
        const config = { headers: { 'Content-Type': 'application/json' } };
        const response = await axios.post(`${API_URL}/login`, { email, password }, config);
        return response.data;
    } catch (error) {
        console.error('Error logging in doctor:', error.response ? error.response.data : error.message);
        throw new Error(error.response?.data?.message || 'Login failed. Please check your credentials.');
    }
};

/**
 * Naye doctor ko register karne ke liye API call karta hai.
 */
export const registerDoctorAPI = async (doctorData) => {
    try {
        const config = { headers: { 'Content-Type': 'application/json' } };
        const response = await axios.post(`${API_URL}/register`, doctorData, config);
        return response.data;
    } catch (error) {
        console.error('Error registering doctor:', error.response ? error.response.data : error.message);
        throw new Error(error.response?.data?.message || 'Registration failed. Please try again.');
    }
};

/**
 * Doctor ke status ko update karne ke liye API call karta hai.
 */
export const updateDoctorStatusAPI = async (statusData, token) => {
    try {
        const config = getConfig(token);
        const response = await axios.put(`${API_URL}/status`, statusData, config);
        return response.data;
    } catch (error) {
        console.error('Error updating status:', error.response ? error.response.data : error.message);
        throw new Error(error.response?.data?.message || 'Failed to update status.');
    }
};

/**
 * Logged-in doctor ki queue details laata hai.
 */
export const getMyQueueAPI = async (token) => {
    try {
        const config = getConfig(token);
        const response = await axios.get(`${API_URL}/queue/my`, config);
        return response.data;
    } catch (error) {
        console.error('Error fetching queue:', error.response ? error.response.data : error.message);
        throw new Error(error.response?.data?.message || 'Failed to fetch queue.');
    }
};

/**
 * Doctor ki queue ko manage karta hai (e.g., call next).
 */
export const manageQueueAPI = async (actionData, token) => {
    try {
        const config = getConfig(token);
        const response = await axios.put(`${API_URL}/queue/manage`, actionData, config);
        return response.data;
    } catch (error) {
        console.error('Error managing queue:', error.response ? error.response.data : error.message);
        throw new Error(error.response?.data?.message || 'Failed to manage queue.');
    }
};

/**
 * Logged-in doctor ki patient history laata hai.
 */
export const getPatientHistoryAPI = async (token) => {
    try {
        const config = getConfig(token);
        const response = await axios.get(`${API_URL}/patients/history`, config);
        return response.data;
    } catch (error) {
        console.error('Error fetching patient history:', error.response ? error.response.data : error.message);
        throw new Error(error.response?.data?.message || 'Failed to fetch patient history.');
    }
};

/**
 * Ek doctor ki poori profile details laata hai.
 */
export const getDoctorByIdAPI = async (doctorId) => {
    try {
        const response = await axios.get(`${API_URL}/${doctorId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching doctor profile:', error.response ? error.response.data : error.message);
        throw new Error(error.response?.data?.message || 'Failed to fetch doctor profile.');
    }
};

/**
 * Doctor ki profile details update karta hai.
 */
export const updateDoctorProfileAPI = async (profileData, token) => {
    try {
        const config = getConfig(token);
        const response = await axios.put(`${API_URL}/profile`, profileData, config);
        return response.data;
    } catch (error) {
        console.error('Error updating doctor profile:', error.response ? error.response.data : error.message);
        throw new Error(error.response?.data?.message || 'Failed to update profile.');
    }
};

// ✅ Naya Function: Popular Doctors ko fetch karna
/**
 * Homepage par dikhane ke liye popular doctors ki list laata hai.
 */
export const getPopularDoctorsAPI = async () => {
    try {
        const response = await axios.get(`${API_URL}/popular`);
        return response.data;
    } catch (error) {
        console.error('Error fetching popular doctors:', error.response ? error.response.data : error.message);
        throw error;
    }
};

// ✅ Naya Function: Doctor ko Popular set/unset karna (Admin ya authorized user ke liye)
/**
 * Ek doctor ki 'isPopular' status ko update karta hai.
 */
export const setDoctorPopularStatusAPI = async (doctorId, isPopularStatus, token) => {
    try {
        const config = getConfig(token);
        const response = await axios.put(`${API_URL}/${doctorId}/set-popular`, { isPopular: isPopularStatus }, config);
        return response.data;
    } catch (error) {
        console.error('Error setting doctor popularity status:', error.response ? error.response.data : error.message);
        throw error;
    }
};

// ✅ Naya Function: Saare doctors ko fetch karna (ManagePopularDoctorsPage ke liye)
/**
 * Saare doctors ko fetch karta hai (admin panel jaise use cases ke liye).
 */
export const getAllDoctorsAPI = async (token) => { // Token is optional for public access, but good for admin
    try {
        const config = getConfig(token);
        const response = await axios.get(API_URL, config); // API_URL is '/api/doctors'
        return response.data;
    } catch (error) {
        console.error('Error fetching all doctors (for admin):', error.response ? error.response.data : error.message);
        throw error;
    }
};

/**
 * Logged-in doctor ki patient history se ek patient ko delete karne ke liye API call karta hai.
 */
export const deletePatientHistoryAPI = async (patientId, token) => {
    try {
        const config = getConfig(token);
        const response = await axios.delete(`${API_URL}/patients/history/${patientId}`, config);
        return response.data;
    } catch (error) {
        console.error('Error deleting patient from history:', error.response ? error.response.data : error.message);
        throw new Error(error.response?.data?.message || 'Failed to delete patient from history.');
    }
};