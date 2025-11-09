const asyncHandler = require('express-async-handler');
const axios = require('axios');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const ConversationHistory = require('../models/ConversationHistory');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { v4: uuidv4 } = require('uuid');

// Emergency keywords detection
const EMERGENCY_KEYWORDS = [
    'emergency', 'urgent', 'chest pain', 'heart attack', 'accident',
    'bleeding', 'unconscious', 'seizure', 'stroke', 'breathing problem',
    'jaan khatre me', 'serious', 'critical', 'immediate help'
];

const detectEmergency = (message) => {
    const lowerMsg = message.toLowerCase();
    return EMERGENCY_KEYWORDS.some(keyword => lowerMsg.includes(keyword));
};

const symptomChecker = asyncHandler(async (req, res) => {
    const { message, userId, sessionId, chatHistory } = req.body;
    if (!message) {
        return res.status(400).json({ message: 'Message is required' });
    }

    // Emergency detection
    const isEmergency = detectEmergency(message);
    if (isEmergency) {
        return res.json({
            reply: '🚨 EMERGENCY DETECTED! Please call 108 (Ambulance) immediately or visit the nearest hospital!',
            emergency: true,
            emergencyContacts: {
                ambulance: '108',
                police: '100',
                fire: '101'
            }
        });
    }

    // Current user and session
    const currentUserId = userId || req.user?._id;
    const currentSessionId = sessionId || uuidv4();
    
    // Debug log
    console.log('🔐 Auth Status:', {
        hasReqUser: !!req.user,
        userId: currentUserId,
        userName: req.user?.name || 'Guest'
    });

    // Prepare conversation context
    let conversationContext = '';
    if (chatHistory && chatHistory.length > 0) {
        const recentHistory = chatHistory.slice(-5);
        conversationContext = recentHistory.map(msg => `${msg.role}: ${msg.text}`).join('\n');
    }

    // --- Agentic AI intent extraction using Gemini ---
    const gemmaApiKey = process.env.GEMINI_API_KEY;
    const gemmaModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const gemmaApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${gemmaModel}:generateContent?key=${gemmaApiKey}`;

    // Enhanced prompt for intent extraction with context
    const intentPrompt = {
        contents: [{
            parts: [{ 
                text: `You are an AI assistant for a doctor appointment booking system. User messages can be in English, Hindi, or Hinglish (mix).

Conversation History:
${conversationContext || 'No previous context'}

Current User message: "${message}"

Analyze the user's intent and respond with ONLY ONE of these intents:

- find_doctor (user searching/finding doctors, mentioning specialty, symptoms, OR just doctor name alone)
  Examples: "neurologist dhundo", "doctor find krna h", "mujhe fever hai", "migraine", "prince", "hhhhhh", "kajal"
  
- book_appointment (user says "appointment book krna h" WITHOUT specific time or doctor)
  Examples: "appointment book krna h", "mujhe appointment chahiye", "booking karni h"

- confirm_booking (user wants to book with specific doctor AND time/date mentioned)
  Examples: "hhhhhh ke sath kal 10 AM pe book karo", "prince se appointment book karo kal"
  Note: Must have BOTH doctor AND time/date to be confirm_booking

- unknown (greeting or unclear intent)
  Examples: "hi", "hello", "kaise ho"

Respond with ONLY the intent name, nothing else.

Intent:` 
            }]
        }]
    };

    try {
        // Get intent from Gemini with retry logic
        let intentRes;
        let retries = 3;
        while (retries > 0) {
            try {
                intentRes = await axios.post(gemmaApiUrl, intentPrompt, {
                    timeout: 10000, // 10 second timeout
                });
                break; // Success, exit loop
            } catch (apiError) {
                retries--;
                // Log detailed Gemini API error
                console.error(`Gemini API error (${retries} retries left):`, apiError.message);
                if (apiError.response) {
                    console.error('Gemini API response data:', apiError.response.data);
                }
                if (apiError.config) {
                    console.error('Gemini API request config:', apiError.config);
                }
                if (retries === 0) {
                    // In development, send error details to frontend for debugging
                    if (process.env.NODE_ENV !== 'production') {
                        return res.status(500).json({
                            message: 'Gemini API error',
                            error: apiError.message,
                            response: apiError.response?.data,
                        });
                    }
                    throw apiError;
                }
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
            }
        }
        
        const intentText = intentRes.data.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toLowerCase() || '';
        const intent = intentText.split('\n')[0].trim();

        // =================================================================
        // CHECK AVAILABILITY - Show available dates and slots
        // =================================================================
        const lowerMessage = message.toLowerCase();
        const isAvailabilityCheck = lowerMessage.match(/\bavailability\b|\bavailable\b|\bslot\b|\bslots\b/i) ||
                                    lowerMessage.match(/\bschedule\b|\btiming\b|\btimings\b/i) ||
                                    lowerMessage.match(/free.*h|free.*hai|kb.*free|kab.*free|kab.*milenge|kb.*milenge/i) ||
                                    lowerMessage.match(/shi date|sahi date|konse.*date|kaunse.*date/i) ||
                                    lowerMessage.match(/batao|btao|dikha|dikhao|bata.*do|dikha.*do/i) && 
                                    (lowerMessage.includes('schedule') || lowerMessage.includes('date') || lowerMessage.includes('time') || lowerMessage.includes('slot') || lowerMessage.includes('free'));
        
        if (isAvailabilityCheck) {
            console.log('🔍 Availability check triggered for message:', message);
            
            const conversation = await ConversationHistory.findOne({
                userId: currentUserId,
                sessionId: currentSessionId
            }).sort({ updatedAt: -1 });
            
            let doctorId = null;
            let doctorName = null;
            
            // First, try to extract doctor name from the message itself
            const doctorNamePatterns = [
                /doctor\s+([a-z]+)\s+ka/i,     // "doctor hhhhhh ka schedule"
                /doctor\s+([a-z]+)\s+ki/i,     // "doctor hhhhhh ki availability"
                /dr\.?\s+([a-z]+)\s+ka/i,      // "dr hhhhhh ka"
                /dr\.?\s+([a-z]+)\s+ki/i,      // "dr hhhhhh ki"
                /([a-z]+)\s+ka\s+schedule/i,   // "hhhhhh ka schedule"
                /([a-z]+)\s+ki\s+availability/i, // "hhhhhh ki availability"
            ];
            
            for (const pattern of doctorNamePatterns) {
                const match = message.match(pattern);
                if (match && match[1]) {
                    const extractedName = match[1].toLowerCase().trim();
                    console.log('🔎 Extracted doctor name from message:', extractedName);
                    
                    // Search in context first
                    if (conversation?.context?.lastDoctors && conversation.context.lastDoctors[extractedName]) {
                        doctorId = conversation.context.lastDoctors[extractedName];
                        const doc = await Doctor.findById(doctorId).select('name');
                        if (doc) {
                            doctorName = doc.name;
                            console.log('✅ Found doctor in context:', doctorName);
                            break;
                        }
                    }
                    
                    // Fuzzy search in context
                    if (!doctorId && conversation?.context?.lastDoctors) {
                        for (const [savedName, savedId] of Object.entries(conversation.context.lastDoctors)) {
                            if (savedName.includes(extractedName) || extractedName.includes(savedName)) {
                                const doc = await Doctor.findById(savedId).select('name');
                                if (doc) {
                                    doctorId = savedId;
                                    doctorName = doc.name;
                                    console.log('✅ Found doctor via fuzzy match:', doctorName);
                                    break;
                                }
                            }
                        }
                    }
                    
                    // Search in database
                    if (!doctorId) {
                        const doc = await Doctor.findOne({ name: { $regex: extractedName, $options: 'i' } }).select('name');
                        if (doc) {
                            doctorId = doc._id;
                            doctorName = doc.name;
                            console.log('✅ Found doctor in database:', doctorName);
                            break;
                        }
                    }
                    
                    if (doctorId) break;
                }
            }
            
            // If no doctor found in message, use context
            if (!doctorId) {
                // Priority 1: If pending booking exists, use that doctor (highest priority)
                if (conversation?.context?.pendingBooking && conversation?.context?.selectedDoctorId) {
                    doctorId = conversation.context.selectedDoctorId;
                    doctorName = conversation.context.selectedDoctorName;
                    console.log('📅 Using pending booking doctor for availability:', doctorName);
                }
                // Priority 2: Use selected doctor from context
                else if (conversation?.context?.selectedDoctorId) {
                    doctorId = conversation.context.selectedDoctorId;
                    doctorName = conversation.context.selectedDoctorName;
                    console.log('📅 Using selected doctor from context:', doctorName);
                }
                // Priority 3: Try to find doctor from last search
                else if (conversation?.context?.lastDoctors) {
                    const doctorIds = Object.values(conversation.context.lastDoctors);
                    if (doctorIds.length > 0) {
                        doctorId = doctorIds[0]; // Use first doctor from last search
                        console.log('📅 Using last searched doctor for availability');
                    }
                }
            }
            
            if (doctorId) {
                const doctor = await Doctor.findById(doctorId).select('name availability city profileDetails');
                if (doctor && doctor.availability) {
                    const today = new Date();
                    const availableDates = [];
                    
                    // Check next 14 days
                    for (let i = 0; i < 14; i++) {
                        const checkDate = new Date(today);
                        checkDate.setDate(today.getDate() + i);
                        const dateStr = checkDate.toISOString().split('T')[0];
                        const dayAvail = doctor.availability.find(a => a.date === dateStr);
                        
                        if (dayAvail && dayAvail.slots) {
                            const freeSlots = dayAvail.slots.filter(s => !s.isBooked);
                            if (freeSlots.length > 0) {
                                availableDates.push({
                                    date: dateStr,
                                    displayDate: checkDate.toLocaleDateString('en-IN', { 
                                        weekday: 'short', 
                                        day: 'numeric', 
                                        month: 'short',
                                        year: 'numeric'
                                    }),
                                    slots: freeSlots.map(s => s.time)
                                });
                            }
                        }
                    }
                    
                    if (availableDates.length > 0) {
                        let replyText = `📅 **Dr. ${doctor.name} ki Availability:**\n\n`;
                        
                        availableDates.slice(0, 5).forEach((day, idx) => {
                            replyText += `**${day.displayDate}**\n`;
                            replyText += `⏰ ${day.slots.slice(0, 5).join(', ')}`;
                            if (day.slots.length > 5) replyText += ` +${day.slots.length - 5} more`;
                            replyText += `\n\n`;
                        });
                        
                        replyText += `💡 **Appointment book karne ke liye sirf time boliye:**\n`;
                        replyText += `"${availableDates[0].slots[0]}" ya "${availableDates[0].displayDate} ko ${availableDates[0].slots[0]}"`;
                        
                        // Keep the pending booking context
                        await ConversationHistory.findOneAndUpdate(
                            { userId: currentUserId, sessionId: currentSessionId },
                            {
                                $set: {
                                    'context.selectedDoctorId': doctorId,
                                    'context.selectedDoctorName': doctor.name,
                                    'context.pendingBooking': true
                                }
                            },
                            { upsert: true }
                        );
                        
                        return res.json({
                            reply: replyText,
                            sessionId: currentSessionId,
                            availability: availableDates,
                            doctorId: doctorId,
                            action: 'SHOW_AVAILABILITY'
                        });
                    } else {
                        return res.json({
                            reply: `😔 Dr. ${doctor.name} ke paas next 14 days mein koi slots available nahi hain.\n\nKripya kisi aur doctor ko try karein.`,
                            sessionId: currentSessionId
                        });
                    }
                }
            }
            
            return res.json({
                reply: 'Pehle doctor select karein!\n\n• "migraine" - Symptoms search\n• "Neurology doctor" - Specialty search',
                sessionId: currentSessionId
            });
        }
        
        // =================================================================
        // CONFIRM BOOKING - Full flow with queue & notifications
        // =================================================================
        const hasBookKeyword = lowerMessage.includes('book') || lowerMessage.includes('appointment');
        const hasTime = message.match(/\d{1,2}:\d{2}|\d{1,2}\s*(am|pm)|\bkal\b|\btomorrow\b|\btoday\b|\baaj\b|\bparso\b/i);
        const hasDoctorInMessage = message.match(/doctor\s+([a-z]+)\s+(ke?\s+sath|ka|ki|se)|dr\.?\s+([a-z]+)\s+(ke?\s+sath|ka|ki|se)|([a-z]{3,})\s+ke?\s+sath/i);
        
        // Check if there's a pending booking in context
        let hasPendingBooking = false;
        if (currentUserId) {
            const pendingCheck = await ConversationHistory.findOne({
                userId: currentUserId,
                sessionId: currentSessionId
            }).sort({ updatedAt: -1 });
            hasPendingBooking = pendingCheck?.context?.pendingBooking || false;
        }
        
        // Trigger booking flow if:
        // 1. AI intent is booking/confirm
        // 2. User explicitly uses book keyword
        // 3. User provides time while having pending booking (like "Kal 10 AM" after bot asked for time)
        console.log('🔍 Booking Flow Check:', {
            intent,
            hasBookKeyword,
            hasTime: !!hasTime,
            hasDoctorInMessage: !!hasDoctorInMessage,
            hasPendingBooking,
            message
        });
        
        if (intent.includes('confirm') || intent.includes('booking') || 
            (hasBookKeyword && (hasTime || hasDoctorInMessage)) ||
            (hasPendingBooking && hasTime && !lowerMessage.includes('schedule') && !lowerMessage.includes('availability'))) {
            
            console.log('✅ Booking flow TRIGGERED');
            
            if (!currentUserId) {
                return res.json({ 
                    reply: 'Appointment book karne ke liye pehle login karein.',
                    sessionId: currentSessionId 
                });
            }
            
            // Get doctor from context
            const conversation = await ConversationHistory.findOne({
                userId: currentUserId,
                sessionId: currentSessionId
            }).sort({ updatedAt: -1 });
            
            let doctorId = conversation?.context?.selectedDoctorId;
            let doctorName = conversation?.context?.selectedDoctorName;
            const isPendingBooking = conversation?.context?.pendingBooking;
            
            console.log('📋 Booking Context:', {
                hasDoctorInContext: !!doctorId,
                doctorName: doctorName,
                isPendingBooking: isPendingBooking,
                hasTime: !!hasTime,
                hasDoctorInMsg: !!hasDoctorInMessage,
                message: message
            });
            
            // PRIORITY FIX: If pending booking exists + message has time but no doctor name
            // This handles slot button clicks like "Sun, 9 Nov, 2025 ko 11:00Am"
            if (isPendingBooking && hasTime && !hasDoctorInMessage && doctorId) {
                console.log('🎯 SLOT CLICK DETECTED - Using doctor from pending context:', doctorName);
                // Skip doctor extraction from message, use context directly
            } else {
                // Try to extract doctor ID from message
                const doctorIdMatch = message.match(/[0-9a-f]{24}/);
                if (doctorIdMatch) {
                    doctorId = doctorIdMatch[0];
                    console.log('📌 Found doctor ID in message:', doctorId);
                }
            }
            
            // Fuzzy doctor name matching from message (only if not using context)
            if (!doctorId && !isPendingBooking) {
                const namePatterns = [
                    /dr\.?\s+([a-z]+)\s+se/i,
                    /doctor\s+([a-z]+)\s+se/i,
                    /([a-z]+)\s+ke?\s+sath/i,
                    /([a-z]+)\s+inke?\s+sath/i,
                ];
                
                for (const pattern of namePatterns) {
                    const match = message.match(pattern);
                    if (match && match[1]) {
                        const extractedName = match[1].toLowerCase().trim();
                        
                        // Check in context with fuzzy matching
                        if (conversation?.context?.lastDoctors) {
                            if (conversation.context.lastDoctors[extractedName]) {
                                doctorId = conversation.context.lastDoctors[extractedName];
                                doctorName = match[1];
                                break;
                            }
                            // Fuzzy match
                            for (const [savedName, savedId] of Object.entries(conversation.context.lastDoctors)) {
                                if (savedName.includes(extractedName) || extractedName.includes(savedName)) {
                                    const doc = await Doctor.findById(savedId).select('name');
                                    if (doc) {
                                        doctorId = savedId;
                                        doctorName = doc.name;
                                        break;
                                    }
                                }
                            }
                            if (doctorId) break;
                        }
                        
                        // Search database
                        const foundDoctor = await Doctor.findOne({
                            name: { $regex: extractedName, $options: 'i' }
                        });
                        
                        if (foundDoctor) {
                            doctorId = foundDoctor._id;
                            doctorName = foundDoctor.name;
                            break;
                        }
                    }
                }
            }
            
            // Final check: If still no doctor found
            if (!doctorId) {
                console.log('❌ Doctor not found in message or context');
                
                // If pending booking but user didn't provide time, ask for time
                if (isPendingBooking && conversation?.context?.selectedDoctorName && !hasTime) {
                    return res.json({
                        reply: `Aap Dr. ${conversation.context.selectedDoctorName} ke saath appointment book kar rahe the.\n\n📅 Kripya date aur time bataiye:\n• "Kal 10 AM"\n• "Aaj 3 PM"\n• "11:00 AM"`,
                        sessionId: currentSessionId
                    });
                }
                
                // No doctor found at all
                return res.json({
                    reply: 'Kripya doctor ka naam clearly bataiye. Jaise:\n• "raja ke sath kal 10 AM pe book karo"\n• "hhhhhh ke sath book karo"',
                    sessionId: currentSessionId
                });
            }
            
            console.log('✅ Doctor confirmed:', { doctorId, doctorName });
            
            // Extract date and time using AI
            const extractPrompt = {
                contents: [{
                    parts: [{ 
                        text: `Extract date and time from this message: "${message}"\n\nToday is ${new Date().toISOString().split('T')[0]}\n\nExamples:
- "2025-11-09 ko 11:00 AM pe book karo" → DATE: 2025-11-09, TIME: 11:00 AM
- "kal 10 AM" → DATE: (tomorrow's date), TIME: 10:00 AM
- "Sun, 9 Nov, 2025 ko 3 PM" → DATE: 2025-11-09, TIME: 03:00 PM

Respond in this EXACT format:
DATE: YYYY-MM-DD
TIME: HH:MM AM/PM

If date/time not clear, respond: UNCLEAR` 
                    }]
                }]
            };
            
            const extractRes = await axios.post(gemmaApiUrl, extractPrompt);
            const extractedText = extractRes.data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
            
            const dateMatch = extractedText.match(/DATE:\s*([\d-]+)/);
            const timeMatch = extractedText.match(/TIME:\s*([\d:]+ (?:AM|PM))/);
            
            if (extractedText.includes('UNCLEAR') || !dateMatch || !timeMatch) {
                // Save doctor in context and show real available slots
                await ConversationHistory.findOneAndUpdate(
                    { userId: currentUserId, sessionId: currentSessionId },
                    {
                        $set: { 
                            'context.selectedDoctorId': doctorId,
                            'context.selectedDoctorName': doctorName,
                            'context.pendingBooking': true
                        }
                    },
                    { upsert: true }
                );
                
                // Fetch doctor with full details including availability
                const doctorForSlots = await Doctor.findById(doctorId).select('name profileDetails availability city');
                const fee = doctorForSlots?.profileDetails?.consultationFee;
                const feeText = (fee === undefined || fee === null) ? 'Not Set' : (fee === 0 ? 'Free' : `₹${fee}`);
                
                // Get real available slots for next 14 days
                const today = new Date();
                const availableDates = [];
                
                if (doctorForSlots && doctorForSlots.availability) {
                    for (let i = 0; i < 14; i++) {
                        const checkDate = new Date(today);
                        checkDate.setDate(today.getDate() + i);
                        const dateStr = checkDate.toISOString().split('T')[0];
                        const dayAvail = doctorForSlots.availability.find(a => a.date === dateStr);
                        
                        if (dayAvail && dayAvail.slots) {
                            const freeSlots = dayAvail.slots.filter(s => !s.isBooked);
                            if (freeSlots.length > 0) {
                                availableDates.push({
                                    date: dateStr,
                                    displayDate: checkDate.toLocaleDateString('en-IN', { 
                                        weekday: 'short', 
                                        day: 'numeric', 
                                        month: 'short',
                                        year: 'numeric'
                                    }),
                                    slots: freeSlots.map(s => s.time)
                                });
                            }
                        }
                    }
                }
                
                // If slots available, show them
                if (availableDates.length > 0) {
                    let replyText = `✅ **Dr. ${doctorName} ke saath appointment book karenge!**\n\n`;
                    replyText += `💰 **Consultation Fee:** ${feeText}\n`;
                    replyText += `📍 **Location:** ${doctorForSlots.city}\n\n`;
                    replyText += `📅 **Available Slots:**\n\n`;
                    
                    // Show first 5 dates
                    availableDates.slice(0, 5).forEach((day, idx) => {
                        replyText += `**${day.displayDate}**\n`;
                        replyText += `⏰ ${day.slots.slice(0, 6).join(', ')}`;
                        if (day.slots.length > 6) replyText += ` +${day.slots.length - 6} more`;
                        replyText += `\n\n`;
                    });
                    
                    replyText += `💡 **Kisi bhi slot ko select karke appointment book karein:**\n`;
                    replyText += `"${availableDates[0].slots[0]}" ya "${availableDates[0].displayDate} ko ${availableDates[0].slots[0]}"`;
                    
                    return res.json({
                        reply: replyText,
                        sessionId: currentSessionId,
                        doctorId: doctorId,
                        doctorName: doctorName,
                        fee: fee,
                        availability: availableDates,
                        action: 'SHOW_SLOTS_FOR_BOOKING',
                        needsTime: true
                    });
                } else {
                    // No slots available
                    return res.json({
                        reply: `😔 **Sorry!** Dr. ${doctorName} ke paas next 14 days mein koi slots available nahi hain.\n\n📋 Kripya:\n• Kisi aur doctor ko try karein\n• Ya baad mein dobara check karein`,
                        sessionId: currentSessionId,
                        doctorId: doctorId,
                        doctorName: doctorName
                    });
                }
            }
            
            const bookingDate = dateMatch[1];
            const bookingTime = timeMatch[1];
            
            // Get doctor details
            const doctor = await Doctor.findById(doctorId);
            if (!doctor) {
                return res.json({
                    reply: 'Doctor nahi mila. Please dobara try karein.',
                    sessionId: currentSessionId
                });
            }
            
            // Validate slot exists and is available - CASE INSENSITIVE
            const dayAvailability = doctor.availability?.find(a => a.date === bookingDate);
            if (!dayAvailability) {
                return res.json({
                    reply: `❌ Sorry! ${bookingDate} ke liye koi slots available nahi hain.\n\nKripya availability check karke sahi date chunein.`,
                    sessionId: currentSessionId
                });
            }
            
            // Normalize time format: remove spaces, convert to uppercase
            const normalizeTime = (time) => time.replace(/\s+/g, '').toUpperCase();
            const normalizedBookingTime = normalizeTime(bookingTime);
            
            console.log('🕐 Time Comparison:', {
                userTime: bookingTime,
                normalized: normalizedBookingTime,
                dbSlots: dayAvailability.slots.map(s => ({ time: s.time, normalized: normalizeTime(s.time), isBooked: s.isBooked }))
            });
            
            const slot = dayAvailability.slots.find(s => normalizeTime(s.time) === normalizedBookingTime && !s.isBooked);
            if (!slot) {
                const availableTimesForDate = dayAvailability.slots.filter(s => !s.isBooked).map(s => s.time);
                if (availableTimesForDate.length > 0) {
                    return res.json({
                        reply: `❌ "${bookingTime}" slot available nahi hai ${bookingDate} ko.\n\n✅ Available slots:\n${availableTimesForDate.join(', ')}\n\nIn mein se koi exact time choose karein.`,
                        sessionId: currentSessionId
                    });
                } else {
                    return res.json({
                        reply: `❌ ${bookingDate} ke liye koi bhi slot available nahi hai.\n\nKripya koi aur date try karein.`,
                        sessionId: currentSessionId
                    });
                }
            }
            
            // Create appointment with exact slot time
            const actualSlotTime = slot.time;
            const newAppointment = new Appointment({
                doctor: doctorId,
                user: currentUserId,
                date: bookingDate,
                time: actualSlotTime,
                fee: doctor.profileDetails?.consultationFee || 0,
                symptoms: '',
                status: 'Scheduled'
            });
            
            await newAppointment.save();
            
            // Update doctor's availability
            if (doctor.availability) {
                const dayAvail = doctor.availability.find(a => a.date === bookingDate);
                if (dayAvail) {
                    const slotToBook = dayAvail.slots.find(s => s.time === actualSlotTime);
                    if (slotToBook) {
                        slotToBook.isBooked = true;
                        slotToBook.bookedBy = currentUserId;
                    }
                }
            }
            
            // 🔥 NOTIFY DOCTOR VIA SOCKET.IO
            try {
                const io = req.app.get('io');
                if (io) {
                    const { notifyDoctorNewAppointment } = require('../utils/socketEvents');
                    const user = await User.findById(currentUserId).select('name phone');
                    
                    notifyDoctorNewAppointment(io, doctorId, {
                        _id: newAppointment._id,
                        patientName: user?.name || 'Patient',
                        patientPhone: user?.phone || 'N/A',
                        date: bookingDate,
                        time: actualSlotTime,
                        symptoms: '',
                        fee: doctor.profileDetails?.consultationFee || 0,
                        status: 'Scheduled'
                    });
                    
                    console.log('📤 Socket notification sent to doctor');
                    
                    // Mark as notified
                    newAppointment.socketNotified = true;
                    await newAppointment.save();
                }
            } catch (socketError) {
                console.error('⚠️ Socket notification failed:', socketError.message);
                // Don't fail the appointment booking if socket fails
            }
            
            // ADD USER TO QUEUE
            const alreadyInQueue = doctor.queue.find(p => p.patientId.toString() === currentUserId.toString());
            if (!alreadyInQueue) {
                const user = await User.findById(currentUserId);
                const newTokenNumber = doctor.lastTokenIssued + 1;
                const newPatient = {
                    patientId: currentUserId,
                    patientName: user?.name || 'Patient',
                    tokenNumber: newTokenNumber,
                };
                doctor.queue.push(newPatient);
                doctor.lastTokenIssued = newTokenNumber;
            }
            
            await doctor.save();
            
            // CREATE NOTIFICATION
            try {
                await Notification.create({
                    user: currentUserId,
                    doctor: doctorId,
                    message: `Aapne Dr. ${doctor.name} ke sath ${bookingDate} ko ${actualSlotTime} par appointment book kiya hai. Aap queue mein bhi jud gaye hain!`,
                    type: 'queue',
                });
                console.log(`Notification sent to user ${currentUserId} for appointment with Dr. ${doctor.name}.`);
            } catch (err) {
                console.error('Notification creation error on chatbot booking:', err);
            }
            
            // Save to conversation history
            await ConversationHistory.findOneAndUpdate(
                { userId: currentUserId, sessionId: currentSessionId },
                {
                    $push: {
                        messages: [
                            { role: 'user', text: message, intent: 'confirm_booking' },
                            { 
                                role: 'bot', 
                                text: `Appointment successfully booked with Dr. ${doctor.name}`,
                                intent: 'confirm_booking',
                                metadata: { appointmentId: newAppointment._id }
                            }
                        ]
                    },
                    $set: { 'context.lastIntent': 'confirm_booking', 'context.pendingBooking': false }
                },
                { upsert: true, new: true }
            );
            
            const actualFee = doctor.profileDetails?.consultationFee;
            const feeDisplay = (actualFee === undefined || actualFee === null) ? 'Not Set' : (actualFee === 0 ? 'Free (₹0)' : `₹${actualFee}`);
            
            return res.json({
                reply: `✅ Appointment Successfully Booked!\n\n👨‍⚕️ Doctor: Dr. ${doctor.name}\n🏥 Specialty: ${doctor.profileDetails?.specialty || 'N/A'}\n📅 Date: ${bookingDate}\n⏰ Time: ${actualSlotTime}\n💰 Consultation Fee: ${feeDisplay}\n📍 Location: ${doctor.city}\n\n🎫 Appointment ID: ${newAppointment._id}\n\n✅ Booking confirmed! Aap queue mein add ho gaye hain aur notification bhej diya gaya hai.\n\nDhanyavaad! 🙏`,
                sessionId: currentSessionId,
                appointment: newAppointment,
                success: true,
                bookingDetails: {
                    doctorName: doctor.name,
                    date: bookingDate,
                    time: actualSlotTime,
                    fee: actualFee !== undefined ? actualFee : 0
                }
            });
        }

        // =================================================================
        // FIND DOCTOR - Search by symptoms or specialty
        // =================================================================
        if (intent.includes('find_doctor') || intent.includes('appointment')) {
            // Comprehensive symptom-to-specialty mapping
        const specialtyKeywords = [
            // Neurology - Brain, Nerves, Spinal Cord
            { 
                keywords: ['neurologist', 'neurology', 'neuro', 'brain', 'nerve', 'spinal', 
                          'headache', 'migraine', 'dizziness', 'balance problem', 'chakkar',
                          'numbness', 'tingling', 'muscle weakness', 'paralysis', 'laqwa',
                          'memory loss', 'confusion', 'bhool jana', 'yaad nahi',
                          'speech problem', 'vision problem', 'seizure', 'fits', 'daura',
                          'tremor', 'shaking hands', 'kaapna', 'coordination', 'sleep disorder'],
                specialty: 'Neurology' 
            },
            // Cardiology - Heart & Blood Circulation
            { 
                keywords: ['cardiologist', 'cardiology', 'heart', 'dil', 'cardiac',
                          'chest pain', 'chest pressure', 'seene me dard',
                          'shortness of breath', 'breathless', 'saans', 
                          'irregular heartbeat', 'palpitation', 'dil ki dhadkan',
                          'fatigue', 'weakness', 'kamzori', 'thakaan',
                          'swelling', 'soojan', 'legs swelling', 'ankles swelling',
                          'arm pain', 'jaw pain', 'back pain radiating',
                          'fainting', 'behoshi', 'blood pressure', 'bp', 'hypertension',
                          'sweating', 'nausea', 'physical activity problem'],
                specialty: 'Cardiology' 
            },
            // Orthopedics - Bones, Joints & Muscles
            { 
                keywords: ['orthopedic', 'ortho', 'bone', 'haddi', 'joint', 'jodo',
                          'joint pain', 'knee pain', 'ghutno me dard', 'shoulder pain',
                          'muscle pain', 'muscle stiffness', 'maans me dard',
                          'swelling joint', 'redness joint', 'sujan jodo me',
                          'difficulty walking', 'difficulty moving', 'chalne me taklif',
                          'back pain', 'kamar dard', 'neck pain', 'gardan dard',
                          'fracture', 'bone break', 'haddi tootna', 'injury', 'chot',
                          'arthritis', 'joint inflammation', 'gathiya',
                          'numbness limbs', 'spinal', 'lifting pain', 'bending pain',
                          'posture', 'alignment'],
                specialty: 'Orthopedic' 
            },
            // Dermatology - Skin, Hair & Nails
            { 
                keywords: ['dermatologist', 'dermatology', 'skin', 'twacha', 'chamdi',
                          'skin rash', 'itching', 'khujli', 'rashes',
                          'acne', 'pimple', 'muhase', 'daag',
                          'hair loss', 'hair fall', 'baal girna', 'ganjapan',
                          'dandruff', 'rusi', 'dry skin', 'oily skin',
                          'fungal infection', 'bacterial infection', 'skin infection',
                          'allergic reaction', 'allergy', 'skin allergy',
                          'redness', 'blister', 'hives', 'phunsiya',
                          'nail problem', 'nail discoloration', 'nail breakage',
                          'dark spots', 'pigmentation', 'dag dhaba',
                          'eczema', 'psoriasis'],
                specialty: 'Dermatology' 
            },
            // ENT - Ear, Nose, Throat
            { 
                keywords: ['ent', 'ear', 'nose', 'throat', 'kaan', 'naak', 'gala',
                          'ear pain', 'kaan dard', 'hearing problem', 'sunai nahi',
                          'nose block', 'naak band', 'sinus', 'sinusitis',
                          'throat pain', 'gale me dard', 'tonsil', 'tonsillitis',
                          'voice problem', 'awaz ki samasya', 'hoarseness'],
                specialty: 'ENT' 
            },
            // Gynecology - Women's Health
            { 
                keywords: ['gynecologist', 'gynecology', 'women', 'mahila', 'female',
                          'pregnancy', 'garbh', 'pregnant', 'periods', 'menstrual',
                          'mc', 'pcos', 'pcod', 'ovarian', 'uterus', 'fertility'],
                specialty: 'Gynecology' 
            },
            // Pediatrics - Children
            { 
                keywords: ['pediatric', 'pediatrician', 'child', 'bachcha', 'baby', 
                          'infant', 'newborn', 'vaccination', 'teeka', 'child doctor'],
                specialty: 'Pediatrics' 
            },
            // Dentist - Teeth, Oral
            { 
                keywords: ['dentist', 'dental', 'teeth', 'daant', 'tooth',
                          'toothache', 'daant dard', 'cavity', 'gum', 'gum pain',
                          'wisdom tooth', 'root canal', 'muh', 'oral'],
                specialty: 'Dentist' 
            },
            // General Physician - Common symptoms
            { 
                keywords: ['physician', 'general doctor', 'gp',
                          'fever', 'bukhar', 'cold', 'sardi', 'cough', 'khansi',
                          'flu', 'viral', 'infection', 'body pain', 'badan dard',
                          'diabetes', 'sugar', 'thyroid', 'vitamin'],
                specialty: 'General Physician' 
            },
        ];

            let specialtyMatch = null;
            const lowerMsg = message.toLowerCase();
            
            // Check message for symptoms/specialty keywords
            for (const group of specialtyKeywords) {
                for (const keyword of group.keywords) {
                    const regex = new RegExp(`\\b${keyword.replace(/\s+/g, '\\s+')}`, 'i');
                    if (regex.test(lowerMsg)) {
                        specialtyMatch = group.specialty;
                        break;
                    }
                }
                if (specialtyMatch) break;
            }
            
            let specialty = specialtyMatch;

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
                    // Save doctors in context
                    if (currentUserId) {
                        const doctorMap = {};
                        doctors.forEach(doc => {
                            doctorMap[doc.name.toLowerCase()] = doc._id.toString();
                        });
                        
                        await ConversationHistory.findOneAndUpdate(
                            { userId: currentUserId, sessionId: currentSessionId },
                            {
                                $set: { 
                                    'context.lastDoctors': doctorMap,
                                    'context.lastSearchQuery': specialty
                                }
                            },
                            { upsert: true }
                        );
                    }
                    
                    // Return simplified text + doctor objects for frontend to render as cards
                    return res.json({
                        reply: `✅ ${doctors.length} ${specialty} doctors mil gaye hain!`,
                        doctors: doctors,  // Frontend will render these as clickable cards
                        sessionId: currentSessionId,
                        action: 'SHOW_DOCTOR_CARDS',
                        message: 'Click on any doctor card to view profile or book appointment'
                    });
                } else {
                    return res.json({
                        reply: `😔 Sorry, "${specialty}" ke doctors abhi available nahi hain.\n\n✅ Try karein:\n• "Neurology doctors dikha"\n• "Cardiologist chahiye"\n• "General Physician dhundo"`,
                        sessionId: currentSessionId
                    });
                }
            }
        }
        
        // =================================================================
        // VIEW DOCTOR PROFILE - Show detailed profile
        // =================================================================
        const profileKeywords = ['profile', 'profil', 'detail', 'dikha', 'dikhao', 'batao', 'btao', 'information', 'info', 'ke bare me', 'about'];
        const hasProfileRequest = profileKeywords.some(keyword => lowerMessage.includes(keyword));
        
        if (hasProfileRequest || message.match(/\bunka\b|\bunke\b|\biske\b|\buske\b/i)) {
            // Get last searched doctors from context
            const conversation = await ConversationHistory.findOne({
                userId: currentUserId,
                sessionId: currentSessionId
            }).sort({ updatedAt: -1 });
            
            if (conversation?.context?.lastDoctors) {
                const doctorIds = Object.values(conversation.context.lastDoctors);
                if (doctorIds.length > 0) {
                    // Get all doctors with full details
                    const doctors = await Doctor.find({ 
                        _id: { $in: doctorIds } 
                    }).select('name profileDetails city rating numReviews clinicName timings availability');
                    
                    if (doctors.length > 0) {
                        let profileText = `👨‍⚕️ **Doctors Profile Details:**\n\n`;
                        
                        doctors.forEach((doc, idx) => {
                            const fee = doc.profileDetails?.consultationFee;
                            const feeText = (fee === undefined || fee === null) ? 'Not Set' : (fee === 0 ? 'Free' : `₹${fee}`);
                            
                            profileText += `**${idx + 1}. Dr. ${doc.name}**\n`;
                            profileText += `   🏥 Specialty: ${doc.profileDetails?.specialty || 'N/A'}\n`;
                            profileText += `   📍 Location: ${doc.city}\n`;
                            profileText += `   🏢 Clinic: ${doc.clinicName || 'N/A'}\n`;
                            profileText += `   💰 Fee: ${feeText}\n`;
                            profileText += `   ⭐ Rating: ${doc.rating || '0'} (${doc.numReviews || 0} reviews)\n`;
                            profileText += `   🎓 Experience: ${doc.profileDetails?.experience || 0} years\n`;
                            
                            // Show timings if available
                            if (doc.timings && doc.timings.length > 0) {
                                const openDays = doc.timings.filter(t => t.isOpen);
                                if (openDays.length > 0) {
                                    const timing = openDays[0];
                                    profileText += `   🕐 Timings: ${timing.startTime} - ${timing.endTime}\n`;
                                }
                            }
                            
                            // Check if slots are available
                            const today = new Date();
                            let hasSlots = false;
                            if (doc.availability) {
                                for (let i = 0; i < 7; i++) {
                                    const checkDate = new Date(today);
                                    checkDate.setDate(today.getDate() + i);
                                    const dateStr = checkDate.toISOString().split('T')[0];
                                    const dayAvail = doc.availability.find(a => a.date === dateStr);
                                    if (dayAvail && dayAvail.slots && dayAvail.slots.some(s => !s.isBooked)) {
                                        hasSlots = true;
                                        break;
                                    }
                                }
                            }
                            profileText += `   📅 Slots: ${hasSlots ? '✅ Available' : '❌ Not Available'}\n`;
                            profileText += `\n`;
                        });
                        
                        profileText += `\n💡 **Next Steps:**\n`;
                        profileText += `• Appointment book karne ke liye: "${doctors[0].name.split(' ')[1] || doctors[0].name} ke sath kal 10 AM pe book karo"\n`;
                        profileText += `• Availability dekhne ke liye: "${doctors[0].name.split(' ')[1] || doctors[0].name} ki availability dikha"`;
                        
                        return res.json({
                            reply: profileText,
                            doctors: doctors,
                            sessionId: currentSessionId,
                            action: 'SHOW_PROFILES'
                        });
                    }
                }
            }
            
            // If no doctors in context
            return res.json({
                reply: "Pehle doctor search karein!\n\n• Symptoms bataiye (jaise: 'migraine', 'chest pain')\n• Specialty search karein (jaise: 'Neurology doctor dikha')",
                sessionId: currentSessionId
            });
        }
        
        // Default: Generic AI response for greetings/unclear
        res.json({ 
            reply: "Hi! Main aapki kaise help kar sakta hoon?\n\n• Symptoms bataiye (jaise: migraine, chest pain)\n• Doctor dhundho\n• Appointment book karo",
            sessionId: currentSessionId
        });
    } catch (error) {
        console.error('❌ Chatbot Error:', error.response?.data || error.message);
        console.error('Error details:', error.code, error.errno);
        
        // Provide helpful fallback response
        const errorMessage = error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT'
            ? 'AI service temporarily unavailable. Please try again or:\n\n• Search: "Neurology doctor"\n• Book: "prince ke sath kal 10 AM"\n• Profile: "unka profile dikha"'
            : 'Error communicating with the AI assistant. Please try again.';
            
        res.json({ 
            reply: errorMessage,
            sessionId: currentSessionId,
            error: true
        });
    }
});

module.exports = {
  symptomChecker
};
