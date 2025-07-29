const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'senderModel' },
  receiverId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'receiverModel' },
  senderModel: { type: String, required: true, enum: ['User', 'Doctor'] },
  receiverModel: { type: String, required: true, enum: ['User', 'Doctor'] },
  isRead: { type: Boolean, default: false },
  message: { type: String, required: false },
  imageUrl: { type: String },
  audioUrl: { type: String },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', MessageSchema);
