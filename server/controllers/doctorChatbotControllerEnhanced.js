const asyncHandler = require('express-async-handler');
const axios = require('axios');
const Appointment = require('../models/Appointment');
const User = require('../models/User');

// Helper function to get today's date in YYYY-MM-DD format
const getTodayDate = () => new Date().toISOString().split('T')[0];

// Helper function to get date range for this week
const getWeekRange = () => {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  
  return {
    start: startOfWeek.toISOString().split('T')[0],
    end: endOfWeek.toISOString().split('T')[0]
  };
};

// Enhanced Doctor Chatbot Handler
const doctorChatbot = asyncHandler(async (req, res) => {
    const { message } = req.body;
    if (!message) {
        return res.status(400).json({ message: 'Message is required' });
    }

    const doctorId = req.doctor?._id || req.doctor?.id;
    if (!doctorId) {
        return res.json({ reply: 'Doctor ID not found in request.' });
    }

    const lowerMsg = message.toLowerCase();
    
    try {
        // 1. Today's appointments count
        if (lowerMsg.includes('aaj') && lowerMsg.includes('appointment') && (lowerMsg.includes('kitni') || lowerMsg.includes('count'))) {
            const today = getTodayDate();
            const count = await Appointment.countDocuments({ 
                date: today, 
                doctor: doctorId 
            });
            return res.json({ 
                reply: `आज आपके ${count} appointments book हुए हैं।`,
                data: { count, date: today }
            });
        }

        // 2. Today's appointments list
        if (lowerMsg.includes('aaj') && lowerMsg.includes('appointment') && (lowerMsg.includes('list') || lowerMsg.includes('show'))) {
            const today = getTodayDate();
            const appointments = await Appointment.find({ 
                date: today, 
                doctor: doctorId 
            }).populate('user', 'name phone').sort({ time: 1 });
            
            if (appointments.length === 0) {
                return res.json({ reply: 'आज कोई appointment नहीं है।' });
            }
            
            const appointmentList = appointments.map((apt, index) => 
                `${index + 1}. ${apt.user.name} - ${apt.time} - ${apt.phone || apt.user.phone}`
            ).join('\n');
            
            return res.json({ 
                reply: `आज के appointments:\n${appointmentList}`,
                data: { appointments: appointments.length }
            });
        }

        // 3. Tomorrow's appointments
        if (lowerMsg.includes('kal') && lowerMsg.includes('appointment')) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowStr = tomorrow.toISOString().split('T')[0];
            
            const count = await Appointment.countDocuments({ 
                date: tomorrowStr, 
                doctor: doctorId 
            });
            
            return res.json({ 
                reply: `कल आपके ${count} appointments हैं।`,
                data: { count, date: tomorrowStr }
            });
        }

        // 4. Pending appointments
        if (lowerMsg.includes('pending') || lowerMsg.includes('scheduled')) {
            const pendingCount = await Appointment.countDocuments({ 
                doctor: doctorId,
                status: 'Scheduled'
            });
            
            return res.json({ 
                reply: `आपके ${pendingCount} pending appointments हैं।`,
                data: { pendingCount }
            });
        }

        // 5. This week's earnings
        if (lowerMsg.includes('earning') || lowerMsg.includes('income') || lowerMsg.includes('kamai')) {
            const weekRange = getWeekRange();
            const appointments = await Appointment.find({
                doctor: doctorId,
                date: { $gte: weekRange.start, $lte: weekRange.end },
                status: { $ne: 'Cancelled' }
            });
            
            const totalEarnings = appointments.reduce((sum, apt) => sum + (apt.fee || 0), 0);
            
            return res.json({ 
                reply: `इस हफ्ते की कुल कमाई: ₹${totalEarnings}`,
                data: { totalEarnings, weekRange }
            });
        }

        // 6. Patient details by name or phone
        const patientMatch = message.match(/patient\s+(.+)/i) || message.match(/user\s+(.+)/i);
        if (patientMatch) {
            const searchTerm = patientMatch[1].trim();
            const patients = await User.find({
                $or: [
                    { name: { $regex: searchTerm, $options: 'i' } },
                    { phone: { $regex: searchTerm, $options: 'i' } }
                ]
            }).limit(5);
            
            if (patients.length === 0) {
                return res.json({ reply: 'कोई patient नहीं मिला।' });
            }
            
            const patientList = patients.map(p => 
                `${p.name} - ${p.phone}${p.age ? ` - Age: ${p.age}` : ''}`
            ).join('\n');
            
            return res.json({ 
                reply: `मिले हुए patients:\n${patientList}`,
                data: { patients: patients.length }
            });
        }

        // 7. Appointment analytics
        if (lowerMsg.includes('analytics') || lowerMsg.includes('report')) {
            const today = getTodayDate();
            const monthStart = today.substring(0, 8) + '01';
            
            const [totalAppointments, completedAppointments, cancelledAppointments, monthlyAppointments] = await Promise.all([
                Appointment.countDocuments({ doctor: doctorId }),
                Appointment.countDocuments({ doctor: doctorId, status: 'Completed' }),
                Appointment.countDocuments({ doctor: doctorId, status: 'Cancelled' }),
                Appointment.countDocuments({ doctor: doctorId, date: { $gte: monthStart } })
            ]);
            
            return res.json({ 
                reply: `📊 Analytics Report:\nकुल appointments: ${totalAppointments}\nपूर्ण हुए: ${completedAppointments}\nरद्द हुए: ${cancelledAppointments}\nइस महीने: ${monthlyAppointments}`,
                data: { totalAppointments, completedAppointments, cancelledAppointments, monthlyAppointments }
            });
        }

        // 8. Default AI response for complex queries
        const prompt = `You are a helpful medical assistant for doctors. Answer queries about appointments, patient information, and medical practice management in Hindi or English as appropriate.

Doctor's query: "${message}"

Provide a helpful, professional response. If it's about appointments, mention you can show lists, counts, or details.`;
        
        try {
            const geminiApiKey = process.env.GEMINI_API_KEY;
            const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`;
            
            const payload = {
                contents: [{
                    role: "user",
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 1,
                    topP: 1,
                    maxOutputTokens: 2048,
                }
            };
            
            const { data } = await axios.post(geminiApiUrl, payload);
            const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
            
            res.json({ 
                reply: aiResponse?.trim() || "माफ़ कीजिए, मैं आपके प्रश्न का उत्तर नहीं दे पा रहा। कृपया स्पष्ट रूप से पूछें।",
                type: 'ai_response'
            });
            
        } catch (error) {
            console.error('Error calling Gemini API:', error.response?.data || error.message);
            res.status(500).json({ 
                message: 'AI सेवा अस्थाय रूप से अनुपलब्ध है। कृपया बाद में प्रयास करें।',
                fallback: true
            });
        }
        
    } catch (error) {
        console.error('Database query error:', error);
        res.status(500).json({ 
            message: 'डेटाबेस क्वेरी में त्रुटि हुई। कृपया बाद में प्रयास करें।',
            error: error.message
        });
    }
});

// Additional endpoint for specific appointment details
const getAppointmentDetails = asyncHandler(async (req, res) => {
    const { appointmentId } = req.params;
    const doctorId = req.doctor?._id || req.doctor?.id;
    
    try {
        const appointment = await Appointment.findById(appointmentId)
            .populate('user', 'name phone email age')
            .populate('doctor', 'name specialization');
            
        if (!appointment || appointment.doctor._id.toString() !== doctorId.toString()) {
            return res.status(404).json({ message: 'Appointment not found or unauthorized' });
        }
        
        res.json({
            appointment: {
                id: appointment._id,
                patientName: appointment.user.name,
                patientPhone: appointment.user.phone,
                patientEmail: appointment.user.email,
                patientAge: appointment.user.age,
                date: appointment.date,
                time: appointment.time,
                symptoms: appointment.symptoms,
                status: appointment.status,
                fee: appointment.fee
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching appointment details' });
    }
});

module.exports = {
    doctorChatbot,
    getAppointmentDetails
};
