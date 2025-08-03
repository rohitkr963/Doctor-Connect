
const asyncHandler = require('express-async-handler');
const axios = require('axios');
const Doctor = require('../models/Doctor');


// Smart chat handler: forwards to Python LangChain service
// Doctor Search Handler: finds logged-in doctors by name, specialty, or cit

const symptomChecker = asyncHandler(async (req, res) => {
    const { message } = req.body;
    if (!message) {
        return res.status(400).json({ message: 'Message is required' });
    }
    const prompt = `You are a helpful health assistant. Your job is to help users find doctors.\n\nIf the user mentions a symptom like "fever", "headache", "cold", "stomach pain", infer that they need a "General Physician".\n\nUser's message: "${message}"\n\nGive a short helpful reply or suggest a doctor type they should search.`;
    try {
        // Use GEMINI_API_KEY for Gemma endpoint (Google uses same API key for both)
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
            console.log('[symptomChecker] Specialty:', specialty);
            console.log('[symptomChecker] Query:', JSON.stringify(query, null, 2));
            const doctors = await Doctor.find(query).limit(5).select('name profileDetails city rating numReviews');
            console.log('[symptomChecker] Found doctors:', doctors.length);

            if (doctors.length > 0) {
                return res.json({
                    reply: aiResponse.trim(),
                    doctors
                });
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
