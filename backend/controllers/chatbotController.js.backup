const asyncHandler = require('express-async-handler');
const axios = require('axios');
const Doctor = require('../models/Doctor');

const symptomChecker = asyncHandler(async (req, res) => {
    const { message, userId } = req.body;
    if (!message) {
        return res.status(400).json({ message: 'Message is required' });
    }
    // --- Agentic AI intent extraction using Gemini ---
    const gemmaApiKey = process.env.GEMINI_API_KEY;
    const gemmaModel = process.env.GEMINI_MODEL || 'gemma-3n-e4b-it';
    const gemmaApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${gemmaModel}:generateContent?key=${gemmaApiKey}`;

    // Prompt for intent extraction
    const intentPrompt = {
        contents: [{
            parts: [{ text: `User message: "${message}"
Intent (book_appointment, get_report, send_notification, find_doctor, unknown):` }]
        }]
    };

    try {
        // Get intent from Gemini
        const intentRes = await axios.post(gemmaApiUrl, intentPrompt);
        const intentText = intentRes.data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
        const intent = intentText.split('\n')[0];

        // --- Agentic tool logic ---
        if (intent === 'book_appointment') {
            // Dummy booking logic
            return res.json({ reply: 'Appointment booked for tomorrow 10am.' });
        }
        if (intent === 'get_report') {
            // Dummy report logic
            return res.json({ reply: 'Your latest report: https://yourapp.com/report/123' });
        }
        if (intent === 'send_notification') {
            // Dummy notification logic
            return res.json({ reply: 'Notification sent!' });
        }
        // --- Doctor search logic (original symptom checker) ---
        // Use original prompt for doctor/symptom matching
        const prompt = `You are a helpful health assistant. Your job is to help users find doctors.\n\nIf the user mentions a symptom like "fever", "headache", "cold", "stomach pain", infer that they need a "General Physician".\n\nUser's message: "${message}"\n\nGive a short helpful reply or suggest a doctor type they should search.`;
        const payload = {
            contents: [{
                role: "user",
                parts: [{ text: prompt }]
            }]
        };
        const { data } = await axios.post(gemmaApiUrl, payload);
        const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

        // Expanded specialty extraction
        let specialtyMatch = aiResponse?.match(/(General Physician|Cardiologist|Dentist|Orthopedic|Dermatologist|Neurologist|Neurology|ENT|Pediatrician|Gynecologist|Oncologist|Psychiatrist|Ophthalmologist|Urologist|Gastroenterologist|Pulmonologist|Endocrinologist|Nephrologist|Rheumatologist|Surgeon|Physiotherapist|Dermatology|Psychology|Medicine|Surgery)/i);
        let specialty = specialtyMatch ? specialtyMatch[0] : null;

        if (specialty) {
            // Search both specialty fields (string and array)
            const query = {
                $or: [
                    { 'profileDetails.specialty': { $regex: specialty, $options: 'i' } },
                    { 'profileDetails.specialties': { $regex: specialty, $options: 'i' } }
                ]
            };
            const doctors = await Doctor.find(query).limit(5).select('name profileDetails city rating numReviews');
            if (doctors.length > 0) {
                return res.json({ reply: aiResponse.trim(), doctors });
            } else {
                return res.json({ reply: aiResponse.trim(), note: `No doctors found for "${specialty}"` });
            }
        }
        res.json({ reply: aiResponse?.trim() || "Sorry, I couldn't understand your request." });
    } catch (error) {
        console.error('Error calling Gemma API:', error.response?.data || error.message);
        res.status(500).json({ message: 'Error communicating with the AI assistant.' });
    }
});

module.exports = {
  symptomChecker
};
