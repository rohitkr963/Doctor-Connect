const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // ISO date string
  time: { type: String, required: true }, // e.g. '10:00 AM - 10:30 AM'
  status: { type: String, enum: ['Booked', 'Cancelled'], default: 'Booked' },
  fee: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Appointment', appointmentSchema);
