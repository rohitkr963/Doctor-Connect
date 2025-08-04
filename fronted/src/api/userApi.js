import axios from 'axios';
/**
 * Logged-in user ki notifications laata hai.
 */
export const fetchNotificationsAPI = async (token) => {
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const response = await axios.get('http://localhost:5000/api/users/notifications', config);
    return response.data;
};
// Review APIs (axios based)
export const fetchDoctorReviewsAPI = async (doctorId, token) => {
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.get(`http://localhost:5000/api/doctors/${doctorId}/reviews`, config);
    return response.data;
};

export const submitDoctorReviewAPI = async (doctorId, review, token) => {
    const config = {
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        }
    };
    const response = await axios.post(`http://localhost:5000/api/doctors/${doctorId}/reviews`, review, config);
    return response.data;
};

export const editDoctorReviewAPI = async (doctorId, reviewId, review, token) => {
    const config = {
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        }
    };
    const response = await axios.put(`http://localhost:5000/api/doctors/${doctorId}/reviews/${reviewId}`, review, config);
    return response.data;
};

export const deleteDoctorReviewAPI = async (doctorId, reviewId, token) => {
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.delete(`http://localhost:5000/api/doctors/${doctorId}/reviews/${reviewId}`, config);
    return response.data;
};

// User ke liye backend server ka base URL
const USER_API_URL = 'http://localhost:5000/api/users';
const DOCTOR_API_URL = 'http://localhost:5000/api/doctors';

// Helper function to set authorization header and content type
const getConfig = (token, isFormData = false) => {
    const headers = {
        Authorization: `Bearer ${token}`,
    };
    if (!isFormData) {
        headers['Content-Type'] = 'application/json';
    }
    return { headers };
};

/**
 * User ko login karne ke liye API call karta hai.
 */
export const loginUserAPI = async (phone, password) => {
    try {
        const config = { headers: { 'Content-Type': 'application/json' } };
        const response = await axios.post(`${USER_API_URL}/login`, { phone, password }, config);
        return response.data;
    } catch (error) {
        console.error('Error logging in user:', error.response ? error.response.data : error.message);
        throw new Error(error.response?.data?.message || 'Login failed. Please check your credentials.');
    }
};

/**
 * Naye user ko register karne ke liye API call karta hai.
 */
export const registerUserAPI = async (userData) => {
    try {
        const config = { headers: { 'Content-Type': 'application/json' } };
        const response = await axios.post(`${USER_API_URL}/register`, userData, config);
        return response.data;
    } catch (error) {
        console.error('Error registering user:', error.response ? error.response.data : error.message);
        throw new Error(error.response?.data?.message || 'Registration failed. Please try again.');
    }
};

/**
 * Patient ko doctor ki queue mein join karwata hai.
 */


/**
 * Patient ke liye live queue status laata hai.
 */


/**
 * Doctor ke liye naya review submit karta hai.
 */
export const createReviewAPI = async (doctorId, reviewData, token) => {
    try {
        const config = getConfig(token);
        const response = await axios.post(`${DOCTOR_API_URL}/${doctorId}/reviews`, reviewData, config);
        return response.data;
    } catch (error) {
        console.error('Error submitting review:', error.response ? error.response.data : error.message);
        throw new Error(error.response?.data?.message || 'Failed to submit review.');
    }
};

/**
 * Ek review ko update karta hai.
 */
export const updateReviewAPI = async (doctorId, reviewId, reviewData, token) => {
    try {
        const config = getConfig(token);
        const response = await axios.put(`${DOCTOR_API_URL}/${doctorId}/reviews/${reviewId}`, reviewData, config);
        return response.data;
    } catch (error) {
        console.error('Error updating review:', error.response ? error.response.data : error.message);
        throw new Error(error.response?.data?.message || 'Failed to update review.');
    }
};

/**
 * Ek review ko delete karta hai.
 */
export const deleteReviewAPI = async (doctorId, reviewId, token) => {
    try {
        const config = getConfig(token);
        const response = await axios.delete(`${DOCTOR_API_URL}/${doctorId}/reviews/${reviewId}`, config);
        return response.data;
    } catch (error) {
        console.error('Error deleting review:', error.response ? error.response.data : error.message);
        throw new Error(error.response?.data?.message || 'Failed to delete review.');
    }
};

/**
 * Logged-in user ki profile details laata hai.
 */
export const getUserProfileAPI = async (token) => {
    try {
        const config = getConfig(token);
        const response = await axios.get(`${USER_API_URL}/profile`, config);
        return response.data;
    } catch (error) {
        console.error('Error fetching user profile:', error.response ? error.response.data : error.message);
        throw new Error(error.response?.data?.message || 'Failed to fetch profile.');
    }
};

/**
 * Logged-in user ki profile details update karta hai (photo upload ke saath).
 * userData is expected to be a FormData object when handling file uploads.
 */
export const updateUserProfileAPI = async (userData, token) => {
    try {
        const config = getConfig(token, true); // true indicates it's FormData, sets appropriate headers
        const response = await axios.put(`${USER_API_URL}/profile`, userData, config);
        return response.data;
    } catch (error) {
        console.error('Error updating user profile:', error.response ? error.response.data : error.message);
        throw new Error(error.response?.data?.message || 'Failed to update profile.');
    }
};

/**
 * Logged-in user ke profile mein naya family member add karta hai.
 */
export const addFamilyMemberAPI = async (familyMemberData, token) => {
    try {
        const config = getConfig(token);
        const response = await axios.post(`${USER_API_URL}/family-members`, familyMemberData, config);
        return response.data;
    } catch (error) {
        console.error('Error adding family member:', error.response ? error.response.data : error.message);
        throw new Error(error.response?.data?.message || 'Failed to add family member.');
    }
};

/**
 * Logged-in user ke profile se family member remove karta hai.
 */
export const removeFamilyMemberAPI = async (memberId, token) => {
    try {
        const config = getConfig(token);
        const response = await axios.delete(`${USER_API_URL}/family-members/${memberId}`, config);
        return response.data;
    } catch (error) {
        console.error('Error removing family member:', error.response ? error.response.data : error.message);
        throw new Error(error.response?.data?.message || 'Failed to remove family member.');
    }
};

/**
 * Book an appointment with a doctor.
 */
export const bookAppointmentAPI = async ({ doctorId, date, time, fee, symptoms }, token) => {
    const config = {
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        }
    };
    const response = await axios.post(
        `http://localhost:5000/api/doctors/${doctorId}/book-appointment`,
        { date, time, fee, symptoms },
        config
    );
    return response.data;
};