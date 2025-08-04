import axios from 'axios';

const API_URL = `${process.env.REACT_APP_API_BASE_URL}/api/chatbot`;

/**
 * AI chatbot se baat karne ke liye API call karta hai.
 * @param {string} message - User ka naya message.
 * @param {Array} chatHistory - Purani chat history.
 * @param {string} token - User ka authentication token.
 * @returns {Promise<Object>} - AI ka poora jawab (reply ya tool_response).
 */
export const askChatbotAPI = async (message, chatHistory, token) => {
    try {
        const config = {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        };
        const body = { message, chatHistory };
        const { data } = await axios.post(`${API_URL}/symptom-check`, body, config);
        return data; // Poora response object bhejna
    } catch (error) {
        console.error('Error communicating with chatbot API:', error.response ? error.response.data : error.message);
        throw new Error(error.response?.data?.message || 'Failed to get response from chatbot.');
    }
};
