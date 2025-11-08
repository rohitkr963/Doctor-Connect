/**
 * Socket.io Event Handlers and Emitters
 * Centralized Socket.io logic for real-time communication
 */

const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const User = require('../models/User');

// ============================================================================
// EVENT EMITTERS - Functions to emit events to clients
// ============================================================================

/**
 * Notify doctor about new appointment request
 * @param {Object} io - Socket.io instance
 * @param {String} doctorId - Doctor's MongoDB ID
 * @param {Object} appointmentData - Appointment details
 */
const notifyDoctorNewAppointment = (io, doctorId, appointmentData) => {
    const userSockets = io.app?.get('userSockets') || {};
    const doctorSocketId = userSockets[doctorId.toString()];
    
    console.log('📤 Emitting appointmentRequest to doctor:', doctorId.toString());
    console.log('Doctor socket ID:', doctorSocketId);
    
    if (doctorSocketId) {
        io.to(doctorSocketId).emit('appointmentRequest', {
            appointmentId: appointmentData._id,
            patientName: appointmentData.patientName,
            patientPhone: appointmentData.patientPhone,
            date: appointmentData.date,
            time: appointmentData.time,
            symptoms: appointmentData.symptoms,
            fee: appointmentData.fee,
            status: appointmentData.status,
            message: `📅 New appointment request from ${appointmentData.patientName}`
        });
        
        console.log('✅ Notification sent to doctor');
        return true;
    } else {
        console.log('⚠️ Doctor not connected to socket');
        return false;
    }
};

/**
 * Notify patient about appointment status update
 * @param {Object} io - Socket.io instance
 * @param {String} patientId - Patient's MongoDB ID
 * @param {Object} updateData - Update details
 */
const notifyPatientAppointmentUpdate = (io, patientId, updateData) => {
    const userSockets = io.app?.get('userSockets') || {};
    const patientSocketId = userSockets[patientId.toString()];
    
    console.log('📤 Emitting appointmentUpdate to patient:', patientId.toString());
    
    if (patientSocketId) {
        io.to(patientSocketId).emit('appointmentUpdate', {
            appointmentId: updateData.appointmentId,
            status: updateData.status,
            doctorName: updateData.doctorName,
            date: updateData.date,
            time: updateData.time,
            message: updateData.message
        });
        
        console.log('✅ Notification sent to patient');
        return true;
    } else {
        console.log('⚠️ Patient not connected to socket');
        return false;
    }
};

/**
 * Send reminder to both doctor and patient
 * @param {Object} io - Socket.io instance
 * @param {String} doctorId - Doctor's MongoDB ID
 * @param {String} patientId - Patient's MongoDB ID
 * @param {Object} reminderData - Reminder details
 */
const sendReminder = (io, doctorId, patientId, reminderData) => {
    const userSockets = io.app?.get('userSockets') || {};
    
    // Send to doctor
    const doctorSocketId = userSockets[doctorId.toString()];
    if (doctorSocketId) {
        io.to(doctorSocketId).emit('reminder', {
            type: 'doctor',
            appointmentId: reminderData.appointmentId,
            patientName: reminderData.patientName,
            time: reminderData.time,
            message: `⏰ Appointment with ${reminderData.patientName} in 30 minutes`
        });
    }
    
    // Send to patient
    const patientSocketId = userSockets[patientId.toString()];
    if (patientSocketId) {
        io.to(patientSocketId).emit('reminder', {
            type: 'patient',
            appointmentId: reminderData.appointmentId,
            doctorName: reminderData.doctorName,
            time: reminderData.time,
            message: `⏰ Your appointment with Dr. ${reminderData.doctorName} in 30 minutes`
        });
    }
    
    console.log('⏰ Reminders sent to doctor and patient');
};

/**
 * Refresh dashboard data (when chatbot makes changes)
 * @param {Object} io - Socket.io instance
 * @param {String} doctorId - Doctor's MongoDB ID
 */
const refreshDoctorDashboard = (io, doctorId) => {
    const userSockets = io.app?.get('userSockets') || {};
    const doctorSocketId = userSockets[doctorId.toString()];
    
    if (doctorSocketId) {
        io.to(doctorSocketId).emit('refreshAppointments', {
            message: 'Dashboard data updated'
        });
        console.log('🔄 Dashboard refresh triggered for doctor:', doctorId.toString());
    }
};

// ============================================================================
// SOCKET EVENT HANDLERS - Handle incoming socket events
// ============================================================================

/**
 * Setup all socket event handlers
 * @param {Object} io - Socket.io instance
 * @param {Object} socket - Individual socket connection
 */
const setupSocketHandlers = (io, socket) => {
    
    // Handle doctor/patient registration
    socket.on('register', (userId) => {
        const userSockets = io.app?.get('userSockets') || {};
        userSockets[userId] = socket.id;
        io.app?.set('userSockets', userSockets);
        console.log(`✅ User registered: ${userId} -> ${socket.id}`);
    });
    
    // Handle doctor confirming appointment via socket (optional direct method)
    socket.on('confirmAppointment', async (data) => {
        try {
            const { appointmentId, doctorId } = data;
            
            const appointment = await Appointment.findOne({
                _id: appointmentId,
                doctor: doctorId
            }).populate('user', 'name').populate('doctor', 'name');
            
            if (!appointment) {
                socket.emit('error', { message: 'Appointment not found' });
                return;
            }
            
            appointment.status = 'Confirmed';
            appointment.lastUpdatedBy = 'doctor';
            appointment.patientNotified = false; // Will notify now
            await appointment.save();
            
            // Notify patient
            notifyPatientAppointmentUpdate(io, appointment.user._id, {
                appointmentId: appointment._id,
                status: 'Confirmed',
                doctorName: appointment.doctor.name,
                date: appointment.date,
                time: appointment.time,
                message: `✅ Dr. ${appointment.doctor.name} has confirmed your appointment`
            });
            
            // Refresh doctor dashboard
            refreshDoctorDashboard(io, doctorId);
            
            socket.emit('appointmentConfirmed', {
                success: true,
                message: 'Appointment confirmed successfully'
            });
            
            console.log('✅ Appointment confirmed via socket:', appointmentId);
            
        } catch (error) {
            console.error('Socket confirmAppointment error:', error);
            socket.emit('error', { message: 'Failed to confirm appointment' });
        }
    });
    
    // Handle appointment reschedule via socket
    socket.on('rescheduleAppointment', async (data) => {
        try {
            const { appointmentId, doctorId, newDate, newTime, reason } = data;
            
            const appointment = await Appointment.findOne({
                _id: appointmentId,
                doctor: doctorId
            }).populate('user', 'name').populate('doctor', 'name');
            
            if (!appointment) {
                socket.emit('error', { message: 'Appointment not found' });
                return;
            }
            
            // Save to reschedule history
            appointment.rescheduleHistory.push({
                fromDate: appointment.date,
                fromTime: appointment.time,
                toDate: newDate,
                toTime: newTime,
                by: 'doctor',
                reason: reason || 'Doctor requested',
                timestamp: new Date()
            });
            
            // Update appointment
            appointment.date = newDate;
            appointment.time = newTime;
            appointment.status = 'Rescheduled';
            appointment.lastUpdatedBy = 'doctor';
            await appointment.save();
            
            // Notify patient
            notifyPatientAppointmentUpdate(io, appointment.user._id, {
                appointmentId: appointment._id,
                status: 'Rescheduled',
                doctorName: appointment.doctor.name,
                date: newDate,
                time: newTime,
                message: `📅 Dr. ${appointment.doctor.name} has rescheduled your appointment to ${newDate} at ${newTime}`
            });
            
            // Refresh doctor dashboard
            refreshDoctorDashboard(io, doctorId);
            
            socket.emit('appointmentRescheduled', {
                success: true,
                message: 'Appointment rescheduled successfully'
            });
            
            console.log('🔄 Appointment rescheduled via socket:', appointmentId);
            
        } catch (error) {
            console.error('Socket rescheduleAppointment error:', error);
            socket.emit('error', { message: 'Failed to reschedule appointment' });
        }
    });
    
    // Handle disconnect
    socket.on('disconnect', () => {
        const userSockets = io.app?.get('userSockets') || {};
        for (const [userId, socketId] of Object.entries(userSockets)) {
            if (socketId === socket.id) {
                delete userSockets[userId];
                console.log(`❌ User disconnected: ${userId}`);
                break;
            }
        }
        io.app?.set('userSockets', userSockets);
    });
};

module.exports = {
    // Emitters
    notifyDoctorNewAppointment,
    notifyPatientAppointmentUpdate,
    sendReminder,
    refreshDoctorDashboard,
    
    // Handlers
    setupSocketHandlers
};
