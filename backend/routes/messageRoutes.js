
const express = require('express');
const router = express.Router();
const { getMessages, sendMessage, getDoctorChatUsers } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');
// const { protectUser } = require('../middleware/userAuthMiddleware');
const Message = require('../models/Message');
const upload = require('../middleware/uploadMiddleware');

// Audio upload in chat (voice message)
router.post('/upload-audio', protect, upload.single('audio'), async (req, res) => {
  try {
    const { senderId, receiverId, senderModel, receiverModel, appointmentId } = req.body;
    if (!req.file) {
      return res.status(400).json({ error: 'No audio uploaded' });
    }
    // Save message with audio URL
    const audioUrl = `/uploads/${req.file.filename}`;
    const Message = require('../models/Message');
    let msgData = {
      senderId,
      receiverId,
      senderModel,
      receiverModel,
      message: '', // message empty, audio only
      audioUrl,
      isRead: false
    };
    if (appointmentId && appointmentId !== 'null' && appointmentId !== '' && appointmentId !== null) {
      msgData.appointmentId = appointmentId;
    }
    const msg = new Message(msgData);
    await msg.save();
    res.status(201).json(msg);
  } catch (err) {
    console.error('AUDIO UPLOAD ERROR:', err);
    res.status(500).json({ error: 'Audio upload failed' });
  }
});

// Image upload in chat
router.post('/upload', protect, upload.single('image'), async (req, res) => {
  // doctor or user can upload
  try {
    console.log('UPLOAD DEBUG req.file:', req.file);
    console.log('UPLOAD DEBUG req.body:', req.body);
    const { senderId, receiverId, senderModel, receiverModel, appointmentId } = req.body;
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }
    // Save message with image URL
    const imageUrl = `/uploads/${req.file.filename}`;
    const Message = require('../models/Message');
    // Only set appointmentId if valid
    let msgData = {
      senderId,
      receiverId,
      senderModel,
      receiverModel,
      message: '', // message empty, image only
      imageUrl,
      isRead: false
    };
    if (appointmentId && appointmentId !== 'null' && appointmentId !== '' && appointmentId !== null) {
      msgData.appointmentId = appointmentId;
    }
    const msg = new Message(msgData);
    await msg.save();
    res.status(201).json(msg);
  } catch (err) {
    console.error('UPLOAD ERROR:', err);
    res.status(500).json({ error: 'Image upload failed' });
  }
});




// Clear all messages between doctor and user
router.delete('/clear/:doctorId/:userId', protect, async (req, res) => {
  // Doctor or user can clear chat
  // protect middleware will set req.doctor or req.user
  // Only allow if logged-in user matches doctorId or userId
  const { doctorId, userId } = req.params;
  if (
    (req.doctor && req.doctor._id.toString() === doctorId) ||
    (req.user && req.user._id.toString() === userId)
  ) {
    return require('../controllers/messageController').clearChatMessages(req, res);
  } else {
    return res.status(403).json({ error: 'Not authorized to clear this chat.' });
  }
});

// Get unread message count for a specific chat (doctor-user)
router.get('/unread-count/:doctorId/:userId', protect, async (req, res) => {
  try {
    const { doctorId, userId } = req.params;
    const count = await Message.countDocuments({ receiverId: doctorId, senderId: userId, isRead: false });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Mark all messages as read for a specific chat (doctor-user)


router.put('/mark-read/:doctorId/:userId', protect, async (req, res) => {
  try {
    const { doctorId, userId } = req.params;
    await Message.updateMany({ receiverId: doctorId, senderId: userId, isRead: false }, { $set: { isRead: true } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all users who have chatted with this doctor
router.get('/users/:doctorId', getDoctorChatUsers);
// Get unread message count for doctor
router.get('/doctor/unread-count', protect, async (req, res) => {
  try {
    const doctorId = req.doctor._id;
    const count = await Message.countDocuments({ receiverId: doctorId, isRead: false });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get unread message count for user
router.get('/user/unread-count', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const count = await Message.countDocuments({ receiverId: userId, isRead: false });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Get all messages between doctor and patient
// Get all messages between doctor and patient
router.get('/:doctorId/:patientId', protect, getMessages);
// Send a new message
router.post('/', protect, sendMessage);

module.exports = router;
