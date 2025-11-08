const asyncHandler = require('express-async-handler');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const ConversationHistory = require('../models/ConversationHistory');

// Doctor Chatbot Handler: for doctor dashboard chatbot
const doctorChatbot = asyncHandler(async (req, res) => {
    const { message, sessionId } = req.body;
    if (!message) {
        return res.status(400).json({ message: 'Message is required' });
    }

    // Get doctor ID from authenticated request
    const doctorId = req.user?._id || req.doctor?._id;
    
    console.log('🔐 Authentication Debug:', {
        hasReqUser: !!req.user,
        hasReqDoctor: !!req.doctor,
        reqUserType: req.user?.constructor?.modelName,
        extractedDoctorId: doctorId?.toString()
    });
    
    if (!doctorId) {
        console.error('❌ Doctor not authenticated - no ID found');
        return res.status(401).json({ message: 'Doctor not authenticated' });
    }

    // Session management
    const currentSessionId = sessionId || uuidv4();
    
    console.log('👨‍⚕️ Doctor Chatbot Request:', {
        doctorId: doctorId.toString(),
        message,
        sessionId: currentSessionId,
        requestTime: new Date().toISOString()
    });

    // Get or create conversation history
    let conversation = await ConversationHistory.findOne({
        userId: doctorId,
        sessionId: currentSessionId
    });

    if (!conversation) {
        conversation = new ConversationHistory({
            userId: doctorId,
            sessionId: currentSessionId,
            messages: [],
            context: {}
        });
    }

    // Add user message to history (schema expects 'text' and role 'user')
    conversation.messages.push({
        role: 'user',
        text: message,
        timestamp: new Date()
    });

    const lowerMsg = message.toLowerCase();
    let reply = '';
    let data = null;
    let action = null;

    try {
        // ============ INTENT DETECTION ============
        
        // 1. TODAY'S APPOINTMENTS
        // Match variations: "aaj ki", "aaj ke", "today", "kitni appointment", etc.
        const isTodayQuery = lowerMsg.includes('aaj') || 
                            lowerMsg.includes('today') || 
                            lowerMsg.includes('आज') ||
                            (lowerMsg.match(/appointment/i) && !lowerMsg.includes('kal') && !lowerMsg.includes('tomorrow'));
        
        if (isTodayQuery) {
            console.log('📅 Today appointments query detected');
            
            if (lowerMsg.includes('summary') || lowerMsg.includes('stats') || lowerMsg.includes('overview')) {
                // DAILY SUMMARY
                const result = await getDailySummary(doctorId);
                reply = result.reply;
                data = result.data;
                action = 'DAILY_SUMMARY';
            } else {
                // TODAY'S APPOINTMENTS LIST
                const result = await getTodayAppointments(doctorId);
                reply = result.reply;
                data = result.data;
                action = 'TODAY_APPOINTMENTS';
            }
        }
        
        // 2. TOMORROW'S APPOINTMENTS
        else if (lowerMsg.includes('kal') || lowerMsg.includes('tomorrow')) {
            const result = await getTomorrowAppointments(doctorId);
            reply = result.reply;
            data = result.data;
            action = 'TOMORROW_APPOINTMENTS';
        }
        
        // 3. QUEUE MANAGEMENT
        else if (lowerMsg.includes('queue') || lowerMsg.includes('waiting') || lowerMsg.includes('next patient')) {
            const result = await getQueue(doctorId);
            reply = result.reply;
            data = result.data;
            action = 'QUEUE_VIEW';
        }
        
        // 4. PATIENT SEARCH
        else if (lowerMsg.includes('patient') || lowerMsg.includes('search')) {
            // Extract phone number or name
            const phoneMatch = message.match(/\d{10}/);
            const nameMatch = message.match(/(?:patient|search)\s+([a-zA-Z\s]+)/i);
            
            if (phoneMatch) {
                const result = await searchPatientByPhone(phoneMatch[0]);
                reply = result.reply;
                data = result.data;
                action = 'PATIENT_SEARCH';
            } else if (nameMatch) {
                const result = await searchPatientByName(nameMatch[1].trim());
                reply = result.reply;
                data = result.data;
                action = 'PATIENT_SEARCH';
            } else {
                reply = '🔍 Patient search karne ke liye:\n• Phone number: "patient 9876543210"\n• Name: "patient Rohit Kumar"';
            }
        }
        
        // 5. MARK COMPLETE
        else if (lowerMsg.includes('complete') || lowerMsg.includes('finish') || lowerMsg.includes('done')) {
            const appointmentIdMatch = message.match(/[0-9a-f]{24}/);
            if (appointmentIdMatch) {
                const result = await markAppointmentComplete(appointmentIdMatch[0], doctorId);
                reply = result.reply;
                action = 'MARK_COMPLETE';
            } else {
                reply = '⚠️ Appointment ID provide karein:\n"complete <appointmentId>"';
            }
        }
        
        // 6. CONFIRM APPOINTMENT
        else if (lowerMsg.includes('confirm')) {
            const appointmentIdMatch = message.match(/[0-9a-f]{24}/);
            if (appointmentIdMatch) {
                const result = await confirmAppointment(appointmentIdMatch[0], doctorId, req.app.get('io'));
                reply = result.reply;
                action = 'CONFIRM_APPOINTMENT';
            } else {
                // Try to get latest pending appointment
                const result = await confirmLatestPending(doctorId, req.app.get('io'));
                reply = result.reply;
                action = 'CONFIRM_APPOINTMENT';
            }
        }
        
        // 7. RESCHEDULE APPOINTMENT
        else if (lowerMsg.includes('reschedule')) {
            const appointmentIdMatch = message.match(/[0-9a-f]{24}/);
            const timeMatch = message.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)/i) || 
                             message.match(/(\d{1,2})\s*(am|pm)/i);
            const dateMatch = message.match(/(\d{4}-\d{2}-\d{2})/);
            
            if (appointmentIdMatch && (timeMatch || dateMatch)) {
                const result = await rescheduleAppointment(
                    appointmentIdMatch[0], 
                    doctorId, 
                    dateMatch ? dateMatch[1] : null,
                    timeMatch ? message.match(/(\d{1,2}:?\d{0,2}\s*(?:am|pm))/i)[0] : null,
                    req.app.get('io')
                );
                reply = result.reply;
                action = 'RESCHEDULE_APPOINTMENT';
            } else {
                reply = '⚠️ Format: "reschedule <appointmentId> to 2 PM" or "reschedule <id> to 2025-11-10 3 PM"';
            }
        }
        
        // 8. CANCEL APPOINTMENT
        else if (lowerMsg.includes('cancel') || lowerMsg.includes('reject')) {
            const appointmentIdMatch = message.match(/[0-9a-f]{24}/);
            if (appointmentIdMatch) {
                const result = await cancelAppointment(appointmentIdMatch[0], doctorId, req.app.get('io'));
                reply = result.reply;
                action = 'CANCEL_APPOINTMENT';
            } else {
                reply = '⚠️ Appointment ID provide karein:\n"cancel <appointmentId>"';
            }
        }
        
        // 9. PENDING REQUESTS
        else if (lowerMsg.includes('pending') || lowerMsg.includes('request')) {
            const result = await getPendingRequests(doctorId);
            reply = result.reply;
            data = result.data;
            action = 'PENDING_REQUESTS';
        }
        
        // 10. ALL APPOINTMENTS (for debugging)
        else if (lowerMsg.includes('all appointment') || lowerMsg.includes('sab appointment') || lowerMsg.includes('sabhi appointment')) {
            const result = await getAllAppointments(doctorId);
            reply = result.reply;
            data = result.data;
            action = 'ALL_APPOINTMENTS';
        }
        
        // 11. HELP / COMMANDS
        else if (lowerMsg.includes('help') || lowerMsg.includes('command')) {
            reply = getHelpMessage();
            action = 'HELP';
        }
        
        // 8. DEFAULT: AI RESPONSE
        else {
            reply = await getAIResponse(message, doctorId);
            action = 'AI_RESPONSE';
        }

        // Save bot response to history (use role 'bot' and field 'text' to match schema)
        conversation.messages.push({
            role: 'bot',
            text: reply,
            timestamp: new Date()
        });

        await conversation.save();

        return res.json({
            reply,
            data,
            action,
            sessionId: currentSessionId
        });

    } catch (error) {
        console.error('❌ Doctor Chatbot Error:', error);
        return res.status(500).json({
            message: 'Error processing request',
            error: error.message
        });
    }
});

// ============ HELPER FUNCTIONS ============

// Get today's appointments
async function getTodayAppointments(doctorId) {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    console.log('\n=== FETCHING TODAY APPOINTMENTS ===');
    console.log('🔍 Doctor ID:', doctorId);
    console.log('📅 Searching for date:', todayStr);
    
    // Get ALL appointments for this doctor first
    const allAppointments = await Appointment.find({ doctor: doctorId })
        .populate('user', 'name phone')
        .sort({ createdAt: -1 });
    
    console.log(`📊 Total appointments in DB: ${allAppointments.length}`);
    
    if (allAppointments.length > 0) {
        console.log('📋 All appointment dates:');
        allAppointments.forEach((apt, idx) => {
            console.log(`  ${idx + 1}. Date: "${apt.date}" | Time: ${apt.time} | Status: ${apt.status} | Patient: ${apt.user?.name}`);
        });
    }
    
    // Try multiple date formats to match
    const dateFormats = [
        todayStr,                                    // YYYY-MM-DD
        today.toLocaleDateString('en-GB'),          // DD/MM/YYYY
        today.toLocaleDateString('en-US'),          // MM/DD/YYYY
        today.toLocaleDateString('en-IN')           // D/M/YYYY
    ];
    
    console.log('🔍 Trying date formats:', dateFormats);
    
    // Try to find with exact date match first
    let appointments = await Appointment.find({
        doctor: doctorId,
        date: { $in: dateFormats }
    })
    .populate('user', 'name phone')
    .sort({ time: 1 });
    
    // If no match, try filtering from all appointments
    if (appointments.length === 0 && allAppointments.length > 0) {
        console.log('⚠️ No exact date match, filtering manually...');
        appointments = allAppointments.filter(apt => {
            return dateFormats.some(format => apt.date === format) ||
                   apt.date?.includes(todayStr) ||
                   apt.date?.includes(today.getDate().toString());
        });
    }

    console.log(`✅ Found ${appointments.length} appointments for TODAY`);
    
    if (appointments.length > 0) {
        console.log('📋 Appointment details:');
        appointments.forEach(apt => {
            console.log(`  - ${apt.user?.name}, ${apt.time}, Status: ${apt.status}`);
        });
    }

    if (appointments.length === 0) {
        // Show a more informative message with total count
        let reply = '📅 Aaj koi appointments nahi hain.\n';
        if (allAppointments.length > 0) {
            reply += `\n📊 Total appointments in system: ${allAppointments.length}\n`;
            reply += `\n📋 Upcoming appointments:\n`;
            const upcoming = allAppointments.slice(0, 3);
            upcoming.forEach((apt, idx) => {
                reply += `${idx + 1}. ${apt.date} at ${apt.time} - ${apt.user?.name}\n`;
            });
        } else {
            reply += '\nAap rest kar sakte hain! 😊';
        }
        return {
            reply,
            data: { appointments: [], total: allAppointments.length }
        };
    }

    // Count by status - include ALL status types
    const completed = appointments.filter(a => a.status === 'Completed' || a.status === 'completed').length;
    const scheduled = appointments.filter(a => 
        a.status === 'Scheduled' || 
        a.status === 'scheduled' || 
        a.status === 'Pending' || 
        a.status === 'Confirmed'
    ).length;
    const cancelled = appointments.filter(a => a.status === 'Cancelled' || a.status === 'cancelled').length;

    let reply = `📅 **Aaj ke Appointments** (${today.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })})\n\n`;
    reply += `📊 **Overview:**\n`;
    reply += `• Total: ${appointments.length}\n`;
    reply += `• ✅ Completed: ${completed}\n`;
    reply += `• ⏰ Scheduled: ${scheduled}\n`;
    if (cancelled > 0) reply += `• ❌ Cancelled: ${cancelled}\n`;
    reply += `\n`;

    // Show ALL appointments (not just scheduled)
    const activeAppts = appointments.filter(a => 
        a.status !== 'Completed' && 
        a.status !== 'completed' && 
        a.status !== 'Cancelled' && 
        a.status !== 'cancelled'
    );
    
    if (activeAppts.length > 0) {
        reply += `**📌 Upcoming:**\n`;
        activeAppts.forEach((apt, idx) => {
            reply += `${idx + 1}. ⏰ ${apt.time} - ${apt.user?.name || 'Patient'}\n`;
            if (apt.symptoms) reply += `   🩺 ${apt.symptoms}\n`;
            reply += `   📱 ${apt.user?.phone || 'N/A'}\n`;
            reply += `   🔖 Status: ${apt.status}\n`;
        });
    }
    
    // Show completed if any
    const completedAppts = appointments.filter(a => 
        a.status === 'Completed' || a.status === 'completed'
    );
    
    if (completedAppts.length > 0) {
        reply += `\n**✅ Completed:**\n`;
        completedAppts.forEach((apt, idx) => {
            reply += `${idx + 1}. ${apt.time} - ${apt.user?.name || 'Patient'}\n`;
        });
    }

    return {
        reply,
        data: { appointments }
    };
}

// Get tomorrow's appointments
async function getTomorrowAppointments(doctorId) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    console.log('🔍 Searching tomorrow appointments for doctor:', doctorId);
    console.log('📅 Tomorrow date string:', tomorrowStr);
    
    const appointments = await Appointment.find({
        doctor: doctorId,
        date: tomorrowStr
    })
    .populate('user', 'name phone')
    .sort({ time: 1 });

    console.log(`✅ Found ${appointments.length} appointments for tomorrow`);

    if (appointments.length === 0) {
        return {
            reply: '📅 Kal koi appointments nahi hain.\n\nFree day! 🎉',
            data: { appointments: [] }
        };
    }

    let reply = `📅 **Kal ke Appointments** (${tomorrow.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })})\n\n`;
    reply += `📊 Total: ${appointments.length} patients\n\n`;

    appointments.forEach((apt, idx) => {
        reply += `${idx + 1}. ⏰ ${apt.time} - ${apt.user?.name || 'Patient'}\n`;
        if (apt.symptoms) reply += `   🩺 ${apt.symptoms}\n`;
        reply += `   📱 ${apt.user?.phone || 'N/A'}\n`;
        reply += `   🔖 Status: ${apt.status}\n`;
    });

    return {
        reply,
        data: { appointments }
    };
}

// Get daily summary
async function getDailySummary(doctorId) {
    const today = new Date().toISOString().split('T')[0];
    
    console.log('📊 Getting daily summary for:', doctorId, 'Date:', today);
    
    const appointments = await Appointment.find({
        doctor: doctorId,
        date: today
    });

    console.log(`✅ Found ${appointments.length} total appointments for summary`);

    const completed = appointments.filter(a => 
        a.status === 'Completed' || a.status === 'completed'
    );
    const scheduled = appointments.filter(a => 
        a.status === 'Scheduled' || 
        a.status === 'scheduled' || 
        a.status === 'Pending' || 
        a.status === 'Confirmed'
    ).length;
    const cancelled = appointments.filter(a => 
        a.status === 'Cancelled' || a.status === 'cancelled'
    ).length;
    const totalRevenue = completed.reduce((sum, apt) => sum + (apt.fee || 0), 0);

    let reply = `📊 **Aaj ka Summary**\n\n`;
    reply += `📅 Date: ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}\n\n`;
    reply += `📈 **Statistics:**\n`;
    reply += `• Total Appointments: ${appointments.length}\n`;
    reply += `• ✅ Completed: ${completed.length}\n`;
    reply += `• ⏰ Scheduled/Pending: ${scheduled}\n`;
    if (cancelled > 0) reply += `• ❌ Cancelled: ${cancelled}\n`;
    reply += `• 💰 Revenue: ₹${totalRevenue}\n`;

    if (completed.length > 0) {
        const avgTime = Math.round(appointments.length > 0 ? (8 * 60 / appointments.length) : 0); // Rough estimate
        reply += `• ⏱️ Avg consultation: ~${avgTime} mins\n`;
    }

    return {
        reply,
        data: {
            total: appointments.length,
            completed: completed.length,
            scheduled,
            cancelled,
            revenue: totalRevenue
        }
    };
}

// Get queue
async function getQueue(doctorId) {
    const doctor = await Doctor.findById(doctorId).select('queue');
    
    if (!doctor || !doctor.queue || doctor.queue.length === 0) {
        return {
            reply: '🚶 Queue khali hai!\n\nKoi patient waiting nahi hai.',
            data: { queue: [] }
        };
    }

    const queue = await Promise.all(
        doctor.queue.map(async (item) => {
            const user = await User.findById(item.patientId).select('name phone');
            return {
                ...item.toObject(),
                userName: user?.name || 'Patient',
                userPhone: user?.phone || 'N/A'
            };
        })
    );

    let reply = `🚶 **Current Queue** (${queue.length} patients)\n\n`;
    
    queue.forEach((item, idx) => {
        reply += `${idx + 1}. ${item.userName}\n`;
        reply += `   📱 ${item.userPhone}\n`;
        reply += `   ⏰ Joined: ${new Date(item.joinedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}\n`;
    });

    return {
        reply,
        data: { queue }
    };
}

// Search patient by phone
async function searchPatientByPhone(phone) {
    const user = await User.findOne({ phone });
    
    if (!user) {
        return {
            reply: `❌ Patient nahi mila with phone: ${phone}`,
            data: null
        };
    }

    const appointments = await Appointment.find({ user: user._id })
        .sort({ date: -1 })
        .limit(5);

    let reply = `👤 **Patient Found**\n\n`;
    reply += `Name: ${user.name}\n`;
    reply += `Phone: ${user.phone}\n`;
    reply += `Age: ${user.age || 'N/A'}\n`;
    reply += `Gender: ${user.gender || 'N/A'}\n\n`;
    
    if (appointments.length > 0) {
        reply += `📋 **Recent Appointments:**\n`;
        appointments.slice(0, 3).forEach((apt, idx) => {
            reply += `${idx + 1}. ${apt.date} - ${apt.status}\n`;
            if (apt.symptoms) reply += `   ${apt.symptoms}\n`;
        });
    } else {
        reply += `📋 No previous appointments`;
    }

    return {
        reply,
        data: { user, appointments }
    };
}

// Search patient by name
async function searchPatientByName(name) {
    const users = await User.find({
        name: { $regex: name, $options: 'i' }
    }).limit(5);

    if (users.length === 0) {
        return {
            reply: `❌ Patient nahi mila with name: ${name}`,
            data: null
        };
    }

    let reply = `🔍 **Search Results** (${users.length} found)\n\n`;
    
    users.forEach((user, idx) => {
        reply += `${idx + 1}. ${user.name}\n`;
        reply += `   📱 ${user.phone}\n`;
        reply += `   Age: ${user.age || 'N/A'}, ${user.gender || 'N/A'}\n`;
    });

    return {
        reply,
        data: { users }
    };
}

// Mark appointment complete
async function markAppointmentComplete(appointmentId, doctorId) {
    const appointment = await Appointment.findOne({
        _id: appointmentId,
        doctor: doctorId
    }).populate('user', 'name');

    if (!appointment) {
        return { reply: '❌ Appointment nahi mila' };
    }

    if (appointment.status === 'Completed') {
        return { reply: '⚠️ Ye appointment already complete hai' };
    }

    appointment.status = 'Completed';
    await appointment.save();

    let reply = `✅ **Appointment Completed!**\n\n`;
    reply += `Patient: ${appointment.user?.name || 'Patient'}\n`;
    reply += `Date: ${appointment.date}\n`;
    reply += `Time: ${appointment.time}\n`;
    reply += `Fee: ₹${appointment.fee || 0}\n`;

    return { reply };
}

// Confirm appointment
async function confirmAppointment(appointmentId, doctorId, io) {
    const { notifyPatientAppointmentUpdate, refreshDoctorDashboard } = require('../utils/socketEvents');
    
    const appointment = await Appointment.findOne({
        _id: appointmentId,
        doctor: doctorId
    }).populate('user', 'name phone').populate('doctor', 'name');

    if (!appointment) {
        return { reply: '❌ Appointment nahi mila' };
    }

    if (appointment.status === 'Confirmed') {
        return { reply: '⚠️ Ye appointment already confirmed hai' };
    }

    appointment.status = 'Confirmed';
    appointment.lastUpdatedBy = 'doctor';
    appointment.socketNotified = true;
    await appointment.save();

    // Notify patient via socket
    if (io) {
        notifyPatientAppointmentUpdate(io, appointment.user._id, {
            appointmentId: appointment._id,
            status: 'Confirmed',
            doctorName: appointment.doctor?.name || 'Doctor',
            date: appointment.date,
            time: appointment.time,
            message: `✅ Dr. ${appointment.doctor?.name || 'Doctor'} has confirmed your appointment`
        });
        
        refreshDoctorDashboard(io, doctorId);
    }

    let reply = `✅ **Appointment Confirmed!**\n\n`;
    reply += `Patient: ${appointment.user?.name || 'Patient'}\n`;
    reply += `Phone: ${appointment.user?.phone || 'N/A'}\n`;
    reply += `Date: ${appointment.date}\n`;
    reply += `Time: ${appointment.time}\n`;
    reply += `Fee: ₹${appointment.fee || 0}\n\n`;
    reply += `📱 Patient has been notified via app`;

    return { reply };
}

// Confirm latest pending appointment
async function confirmLatestPending(doctorId, io) {
    const appointment = await Appointment.findOne({
        doctor: doctorId,
        status: { $in: ['Pending', 'Scheduled'] }
    })
    .populate('user', 'name phone')
    .populate('doctor', 'name')
    .sort({ createdAt: -1 });

    if (!appointment) {
        return { reply: '❌ Koi pending appointment nahi hai' };
    }

    return confirmAppointment(appointment._id.toString(), doctorId, io);
}

// Reschedule appointment
async function rescheduleAppointment(appointmentId, doctorId, newDate, newTime, io) {
    const { notifyPatientAppointmentUpdate, refreshDoctorDashboard } = require('../utils/socketEvents');
    
    const appointment = await Appointment.findOne({
        _id: appointmentId,
        doctor: doctorId
    }).populate('user', 'name').populate('doctor', 'name');

    if (!appointment) {
        return { reply: '❌ Appointment nahi mila' };
    }

    // Save reschedule history
    appointment.rescheduleHistory.push({
        fromDate: appointment.date,
        fromTime: appointment.time,
        toDate: newDate || appointment.date,
        toTime: newTime || appointment.time,
        by: 'doctor',
        reason: 'Doctor requested reschedule',
        timestamp: new Date()
    });

    // Update appointment
    if (newDate) appointment.date = newDate;
    if (newTime) appointment.time = newTime;
    appointment.status = 'Rescheduled';
    appointment.lastUpdatedBy = 'doctor';
    await appointment.save();

    // Notify patient
    if (io) {
        notifyPatientAppointmentUpdate(io, appointment.user._id, {
            appointmentId: appointment._id,
            status: 'Rescheduled',
            doctorName: appointment.doctor?.name || 'Doctor',
            date: appointment.date,
            time: appointment.time,
            message: `📅 Dr. ${appointment.doctor?.name} rescheduled to ${appointment.date} at ${appointment.time}`
        });
        
        refreshDoctorDashboard(io, doctorId);
    }

    let reply = `🔄 **Appointment Rescheduled!**\n\n`;
    reply += `Patient: ${appointment.user?.name || 'Patient'}\n`;
    reply += `New Date: ${appointment.date}\n`;
    reply += `New Time: ${appointment.time}\n\n`;
    reply += `📱 Patient has been notified`;

    return { reply };
}

// Get ALL appointments (for debugging/overview)
async function getAllAppointments(doctorId) {
    const appointments = await Appointment.find({ doctor: doctorId })
        .populate('user', 'name phone')
        .sort({ date: 1, time: 1 })
        .limit(20);

    if (appointments.length === 0) {
        return {
            reply: '❌ Koi appointments nahi hain database mein.\n\nPehle patient ko book karna hoga!',
            data: { appointments: [] }
        };
    }

    let reply = `📋 **All Appointments** (${appointments.length} total)\n\n`;

    // Group by date
    const groupedByDate = {};
    appointments.forEach(apt => {
        if (!groupedByDate[apt.date]) {
            groupedByDate[apt.date] = [];
        }
        groupedByDate[apt.date].push(apt);
    });

    Object.keys(groupedByDate).forEach(date => {
        const appts = groupedByDate[date];
        reply += `📅 **${date}** (${appts.length})\n`;
        appts.forEach((apt, idx) => {
            reply += `${idx + 1}. ${apt.time} - ${apt.user?.name || 'Patient'}\n`;
            reply += `   📱 ${apt.user?.phone || 'N/A'}\n`;
            reply += `   🔖 ${apt.status}\n`;
        });
        reply += `\n`;
    });

    return {
        reply,
        data: { appointments }
    };
}

// Get pending appointment requests
async function getPendingRequests(doctorId) {
    const appointments = await Appointment.find({
        doctor: doctorId,
        status: { $in: ['Pending', 'Scheduled'] }
    })
    .populate('user', 'name phone')
    .sort({ createdAt: -1 })
    .limit(10);

    if (appointments.length === 0) {
        return {
            reply: '✅ Koi pending requests nahi hain.\n\nAll caught up!',
            data: { appointments: [] }
        };
    }

    let reply = `📋 **Pending Appointment Requests** (${appointments.length})\n\n`;

    appointments.forEach((apt, idx) => {
        reply += `**${idx + 1}. ${apt.user?.name || 'Patient'}**\n`;
        reply += `   📅 ${apt.date} at ${apt.time}\n`;
        reply += `   📱 ${apt.user?.phone || 'N/A'}\n`;
        if (apt.symptoms) reply += `   🩺 ${apt.symptoms}\n`;
        reply += `   🆔 ${apt._id}\n`;
        reply += `\n`;
    });

    reply += `💡 Reply "confirm" to accept latest request\n`;
    reply += `Or "confirm <id>" for specific appointment`;

    return {
        reply,
        data: { appointments }
    };
}

// Cancel appointment
async function cancelAppointment(appointmentId, doctorId, io) {
    const { notifyPatientAppointmentUpdate, refreshDoctorDashboard } = require('../utils/socketEvents');
    
    const appointment = await Appointment.findOne({
        _id: appointmentId,
        doctor: doctorId
    }).populate('user', 'name phone').populate('doctor', 'name');

    if (!appointment) {
        return { reply: '❌ Appointment nahi mila' };
    }

    if (appointment.status === 'Cancelled') {
        return { reply: '⚠️ Ye appointment already cancelled hai' };
    }

    appointment.status = 'Cancelled';
    appointment.lastUpdatedBy = 'doctor';
    await appointment.save();

    // Notify patient
    if (io) {
        notifyPatientAppointmentUpdate(io, appointment.user._id, {
            appointmentId: appointment._id,
            status: 'Cancelled',
            doctorName: appointment.doctor?.name || 'Doctor',
            date: appointment.date,
            time: appointment.time,
            message: `❌ Dr. ${appointment.doctor?.name} has cancelled your appointment`
        });
        
        refreshDoctorDashboard(io, doctorId);
    }

    let reply = `❌ **Appointment Cancelled**\n\n`;
    reply += `Patient: ${appointment.user?.name || 'Patient'}\n`;
    reply += `Phone: ${appointment.user?.phone}\n`;
    reply += `Date: ${appointment.date}\n`;
    reply += `Time: ${appointment.time}\n\n`;
    reply += `📱 Patient has been notified`;

    return { reply };
}

// Get help message
function getHelpMessage() {
    return `🤖 **Doctor Assistant Commands**\n\n` +
        `📅 **Appointments:**\n` +
        `• "aaj ke appointments" - Today's schedule\n` +
        `• "kal ke appointments" - Tomorrow's schedule\n` +
        `• "all appointments" - View ALL appointments\n` +
        `• "today ki summary" - Daily stats\n` +
        `• "pending requests" - View new requests\n\n` +
        `✅ **Manage Appointments:**\n` +
        `• "confirm" - Confirm latest pending\n` +
        `• "confirm <id>" - Confirm specific\n` +
        `• "reschedule <id> to 2 PM" - Change time\n` +
        `• "cancel <id>" - Cancel appointment\n` +
        `• "complete <id>" - Mark as done\n\n` +
        `👥 **Patients:**\n` +
        `• "patient 9876543210" - Search by phone\n` +
        `• "patient Rohit Kumar" - Search by name\n\n` +
        `🚶 **Queue:**\n` +
        `• "queue dikha" - View waiting patients\n\n` +
        `💡 Type naturally! I'll understand Hindi & English.`;
}

// AI response using Gemini
async function getAIResponse(message, doctorId) {
    const prompt = `You are a helpful assistant for doctors on their dashboard. ` +
        `Answer queries about appointments, patient management, and medical practice. ` +
        `Be concise and professional. Use Hindi and English mix if appropriate.\n\n` +
        `Doctor's message: "${message}"\n\n` +
        `Reply in a helpful, professional tone.`;

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || 'gemini-2.5-flash'}:generateContent?key=${apiKey}`;
        
        const payload = {
            contents: [{
                parts: [{ text: prompt }]
            }]
        };

        const { data } = await axios.post(apiUrl, payload);
        const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        return aiResponse?.trim() || "Sorry, I couldn't process that. Try 'help' for available commands.";
    } catch (error) {
        console.error('AI Error:', error.response?.data || error.message);
        return "I'm having trouble right now. Try specific commands like 'aaj ke appointments' or 'help'.";
    }
}

module.exports = {
    doctorChatbot
};
