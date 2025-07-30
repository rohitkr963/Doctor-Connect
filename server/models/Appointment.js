// const mongoose = require('mongoose');

// const appointmentSchema = new mongoose.Schema({
//   doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
//   user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   date: { type: String, required: true },
//   time: { type: String, required: true },
//   fee: { type: Number },
//   symptoms: { type: String, default: '' }, // <-- Default empty string for safety
//   status: { type: String, default: 'Scheduled' }
// }, { timestamps: true });

// // Prevent model overwrite in dev/hot reload
// module.exports = mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema);