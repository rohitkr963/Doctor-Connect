const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  fee: { type: Number },
  symptoms: { type: String, default: '' },
  status: { 
    type: String, 
    enum: ['Pending', 'Scheduled', 'Confirmed', 'Rescheduled', 'Cancelled', 'Completed'],
    default: 'Scheduled' 
  },
  // Real-time notification tracking
  socketNotified: { type: Boolean, default: false },  // Doctor notified via socket
  patientNotified: { type: Boolean, default: false }, // Patient notified of status change
  
  // Track who made the last update
  lastUpdatedBy: { 
    type: String, 
    enum: ['doctor', 'patient', 'system'], 
    default: 'patient' 
  },
  
  // Reschedule history
  rescheduleHistory: [{
    fromTime: String,
    toTime: String,
    fromDate: String,
    toDate: String,
    by: { type: String, enum: ['doctor', 'patient'] },
    reason: String,
    timestamp: { type: Date, default: Date.now }
  }],
  
  // Reminder tracking
  reminderSent: { type: Boolean, default: false },
  reminderSentAt: Date
}, { timestamps: true });

// Prevent model overwrite in dev/hot reload
module.exports = mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema);