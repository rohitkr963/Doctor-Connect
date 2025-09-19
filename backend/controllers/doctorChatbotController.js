const asyncHandler = require('express-async-handler');
const axios = require('axios');
const Appointment = require('../models/Appointment');
const User = require('../models/User');

// Doctor Chatbot Handler: for doctor dashboard chatbot
const doctorChatbot = asyncHandler(async (req, res) => {
    const { message } = req.body;
    if (!message) {
        return res.status(400).json({ message: 'Message is required' });
    }

    // --- Intent Extraction (Simple) ---
    const lowerMsg = message.toLowerCase();
    // 1. Today's appointments for current doctor
    if (lowerMsg.includes('aaj') && lowerMsg.includes('appointment')) {
        const today = new Date().toISOString().split('T')[0];
        // Doctor ID from JWT (set by auth middleware)
        const doctorId = req.doctor?._id || req.doctor?.id;
        if (!doctorId) {
            return res.json({ reply: 'Doctor ID not found in request.' });
        }
        const count = await Appointment.countDocuments({ date: today, doctorId });
        return res.json({ reply: `Aaj aapke ${count} appointments book hue hain.` });
    }
    // 2. User info (expects: 'user', 'patient', and userId)
    if ((lowerMsg.includes('user') || lowerMsg.includes('patient')) && lowerMsg.match(/\b[0-9a-f]{24}\b/)) {
        const userId = lowerMsg.match(/\b[0-9a-f]{24}\b/)[0];
        const user = await User.findById(userId);
        if (user) {
            return res.json({ reply: `User: ${user.name}, Phone: ${user.phone}, Age: ${user.age || 'N/A'}` });
        } else {
            return res.json({ reply: 'User nahi mila.' });
        }
    }
    // 3. Default: AI reply
    const prompt = `You are a helpful assistant for doctors. Answer queries about appointments, patient info, and medical advice.\n\nDoctor's message: "${message}"\n\nReply concisely and professionally.`;
    try {
        const gemmaApiKey = process.env.GEMINI_API_KEY;
        const gemmaApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemma-3n-e4b-it:generateContent?key=${gemmaApiKey}`;
        const payload = {
            contents: [{
                role: "user",
                parts: [{ text: prompt }]
            }]
        };
        const { data } = await axios.post(gemmaApiUrl, payload);
        const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
        res.json({ reply: aiResponse?.trim() || "Sorry, I couldn't understand your request." });
    } catch (error) {
        console.error('Error calling Gemma API (doctor):', error.response?.data || error.message);
        res.status(500).json({ message: 'Error communicating with the doctor AI assistant.' });
    }
});

module.exports = {
  doctorChatbot
};
