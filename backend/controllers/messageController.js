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
    // Validate doctorId is a valid MongoDB ObjectId
    if (!doctorId || !doctorId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid doctorId format. Must be a 24-character hex string.' });
    }

    // Find all messages where doctor is sender or receiver
    const messages = await Message.find({
      $or: [
        { senderId: doctorId },
        { receiverId: doctorId }
      ]
    });
    // Get unique user IDs (not doctor) from messages
    const messagedUserIds = [
      ...new Set(
        messages
          .map(m => m.senderId.toString() === doctorId ? m.receiverId.toString() : m.senderId.toString())
          .filter(id => id !== doctorId)
      )
    ];

    // Get users who have ever booked or queued with the doctor
    const doctor = await require('../models/Doctor').findById(doctorId).populate({
      path: 'queue.patientId',
      select: 'name _id profilePic email'
    });
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    // Get patientHistory if available
    let historyUserIds = [];
    if (doctor && Array.isArray(doctor.patientHistory)) {
      historyUserIds = doctor.patientHistory.map(id => id.toString());
    }
    // Get queued user IDs
    let queuedUserIds = [];
    if (doctor && Array.isArray(doctor.queue)) {
      queuedUserIds = doctor.queue.map(entry => entry.patientId && entry.patientId._id ? entry.patientId._id.toString() : (entry.patientId ? entry.patientId.toString() : null)).filter(Boolean);
    }

    // Combine all user IDs
    const allUserIds = Array.from(new Set([...messagedUserIds, ...queuedUserIds, ...historyUserIds]));

    // Fetch user details (name, _id, profilePic, email)
    let users = [];
    if (allUserIds.length > 0) {
      users = await User.find({ _id: { $in: allUserIds } }, 'name _id profilePic email');
    }
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user list' });
  }
};
const Message = require('../models/Message');

exports.sendMessage = async (req, res) => {
  try {
    const { senderId, receiverId, message, appointmentId } = req.body;
    // Validate required fields
    if (!senderId || !receiverId || (!message && !req.body.imageUrl && !req.body.audioUrl)) {
      return res.status(400).json({ error: 'Missing senderId, receiverId, or message content.' });
    }
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
    console.error('Message send error:', err);
    res.status(500).json({ error: 'Message send failed', details: err.message });
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
