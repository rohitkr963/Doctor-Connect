const asyncHandler = require('express-async-handler');
const axios = require('axios');
const Doctor = require('../models/Doctor');

const symptomChecker = asyncHandler(async (req, res) => {
    const { message, chatHistory } = req.body;

    if (!message) {
        res.status(400);
        throw new Error('Message is required');
    }

    // Gemini ko clear prompt do: Always suggest doctors for symptoms, reply in JSON array
    const doctorPrompt = `You are a medical assistant chatbot for a doctor booking app. When a user asks about symptoms or wants to book a doctor, always call the function find_doctors and reply with a JSON array of available doctors (name, specialty, experience, hospital, _id, profileUrl). If you don't know, ask for more info. Never reply with medical advice. Example output:
    [
      { "_id": "123", "name": "Dr. Rohit Kumar", "specialty": "General Physician", "experience": 10, "hospital": "Apollo", "profileUrl": "/doctor/123" },
      { "_id": "456", "name": "Dr. Priya Singh", "specialty": "Pediatrician", "experience": 8, "hospital": "Fortis", "profileUrl": "/doctor/456" }
    ]
    `;
    const geminiHistory = [
        { role: "user", parts: [{ text: doctorPrompt }] },
        ...chatHistory.map(entry => ({
            role: entry.role === 'user' ? 'user' : 'model',
            parts: [{ text: entry.text }]
        })),
        { role: "user", parts: [{ text: message }] }
    ];

    const payload = {
        contents: geminiHistory,
        tools: [{
            functionDeclarations: [{
                name: "find_doctors",
                description: "Finds doctors based on name or specialty and returns their details to show to the user.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        name: { type: "STRING", description: "The name of the doctor." },
                        specialty: { type: "STRING", description: "The specialty of the doctor." }
                    }
                }
            }]
        }]
    };

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

        const { data: result } = await axios.post(apiUrl, payload);

        const candidate = result.candidates?.[0];
        if (candidate?.content?.parts?.[0]?.functionCall) {
            const functionCall = candidate.content.parts[0].functionCall;
            if (functionCall.name === 'find_doctors') {
                const { name, specialty, city, symptom } = functionCall.args;
                // Symptom to specialty mapping
                const symptomMap = {
                  fever: 'General Physician',
                  cough: 'General Physician',
                  cold: 'General Physician',
                  diabetes: 'Endocrinologist',
                  asthma: 'Pulmonologist',
                  "heart attack": 'Cardiologist',
                  "chest pain": 'Cardiologist',
                  "skin rash": 'Dermatologist',
                  "child": 'Pediatrician',
                  "pregnancy": 'Gynecologist',
                  "eye": 'Ophthalmologist',
                  "bone": 'Orthopedic',
                  "cancer": 'Oncologist',
                  "mental": 'Psychiatrist',
                  "tooth": 'Dentist',
                  "ear": 'ENT',
                  "nose": 'ENT',
                  "throat": 'ENT',
                  "stomach": 'Gastroenterologist',
                  "kidney": 'Nephrologist',
                  "liver": 'Gastroenterologist',
                  "thyroid": 'Endocrinologist',
                  "neurology": 'Neurologist',
                  "brain": 'Neurologist',
                  "eye problem": 'Ophthalmologist',
                  "skin": 'Dermatologist',
                  "joint pain": 'Orthopedic',
                  "back pain": 'Orthopedic',
                  "pregnant": 'Gynecologist',
                  "child specialist": 'Pediatrician',
                  "psychiatry": 'Psychiatrist',
                  "depression": 'Psychiatrist',
                  "anxiety": 'Psychiatrist',
                };
                let finalSpecialty = specialty;
                if (!finalSpecialty && symptom) {
                  const key = Object.keys(symptomMap).find(k => symptom.toLowerCase().includes(k));
                  if (key) finalSpecialty = symptomMap[key];
                }
                // Database mein doctor dhoondhna
                const query = {};
                if (name) query.name = { $regex: name, $options: 'i' };
                if (finalSpecialty) query['profileDetails.specialty'] = { $regex: finalSpecialty, $options: 'i' };
                if (city) query['profileDetails.city'] = { $regex: city, $options: 'i' };
                // Doctor list ko frontend ke liye JSON array format mein bhejo, include profileUrl
                const doctors = await Doctor.find(query).limit(5).select('name profileDetails.specialty profileDetails.experience profileDetails.hospital profileDetails.city _id');
                const doctorList = doctors.map(doc => ({
                    _id: doc._id,
                    name: doc.name,
                    specialty: doc.profileDetails?.specialty || '',
                    experience: doc.profileDetails?.experience || '',
                    hospital: doc.profileDetails?.hospital || '',
                    city: doc.profileDetails?.city || '',
                    profileUrl: `/doctor/${doc._id}`
                }));
                if (doctorList.length > 0) {
                    res.json({ reply: JSON.stringify(doctorList) });
                } else {
                    // Always return a sample doctor list if none found, so frontend always shows cards
                    const sampleDoctors = [
                      { _id: 'demo1', name: 'Dr. Rohit Kumar', specialty: finalSpecialty || 'General Physician', experience: 10, hospital: 'Apollo', city: city || 'Delhi', profileUrl: '/doctor/demo1' },
                      { _id: 'demo2', name: 'Dr. Priya Singh', specialty: finalSpecialty || 'Pediatrician', experience: 8, hospital: 'Fortis', city: city || 'Mumbai', profileUrl: '/doctor/demo2' }
                    ];
                    res.json({ reply: JSON.stringify(sampleDoctors) });
                }
            }
        } else if (candidate?.content?.parts?.[0]?.text) {
            // Normal text jawab
            const aiResponse = candidate.content.parts[0].text;
            res.json({ reply: aiResponse.trim() });
        } else {
            console.error("Gemini API Response Error:", result);
            res.status(500).json({ message: 'Could not get a response from the AI assistant.' });
        }
    } catch (error) {
        console.error('Error calling Gemini API:', error.response ? error.response.data : error.message);
        res.status(500).json({ message: 'Error communicating with the AI assistant.' });
    }
});

module.exports = {
    symptomChecker,
};
