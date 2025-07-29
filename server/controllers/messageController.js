// Clear all messages between doctor and user
exports.clearChatMessages = async (req, res) => {
  try {
    const { doctorId, userId } = req.params;
    // Delete all messages where doctor and user are sender/receiver
    await Message.deleteMany({
      $or: [
        { senderId: doctorId, receiverId: userId },
        { senderId: userId, receiverId: doctorId }
      ]
    });
    res.json({ success: true, message: 'Chat cleared successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear chat.' });
  }
};
const User = require('../models/User');

// Get all users who have chatted with this doctor
exports.getDoctorChatUsers = async (req, res) => {
  try {
    const doctorId = req.params.doctorId;
    // Find all messages where doctor is sender or receiver
    const messages = await Message.find({
      $or: [
        { senderId: doctorId },
        { receiverId: doctorId }
      ]
    });
    // Get unique user IDs (not doctor)
    const userIds = [
      ...new Set(
        messages
          .map(m => m.senderId.toString() === doctorId ? m.receiverId.toString() : m.senderId.toString())
          .filter(id => id !== doctorId)
      )
    ];
    // Fetch user details (name, _id, profilePic, email)
    const users = await User.find({ _id: { $in: userIds } }, 'name _id profilePic email');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user list' });
  }
};
const Message = require('../models/Message');

exports.sendMessage = async (req, res) => {
  try {
    const { senderId, receiverId, message, appointmentId } = req.body;
    // Detect sender/receiver model
    let senderModel = 'User';
    let receiverModel = 'User';
    if (req.doctor && senderId == req.doctor._id.toString()) senderModel = 'Doctor';
    if (req.doctor && receiverId == req.doctor._id.toString()) receiverModel = 'Doctor';
    if (req.user && senderId == req.user._id.toString()) senderModel = 'User';
    if (req.user && receiverId == req.user._id.toString()) receiverModel = 'User';
    const newMsg = new Message({ senderId, receiverId, senderModel, receiverModel, message, appointmentId, isRead: false });
    await newMsg.save();
    res.status(201).json(newMsg);
  } catch (err) {
    res.status(500).json({ error: 'Message send failed' });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { doctorId, patientId } = req.params;
    // Mark all messages sent to doctor as read
    await Message.updateMany({ senderId: patientId, receiverId: doctorId, isRead: false }, { $set: { isRead: true } });
    const messages = await Message.find({
      $or: [
        { senderId: doctorId, receiverId: patientId },
        { senderId: patientId, receiverId: doctorId }
      ]
    }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch messages' });
  }
};
