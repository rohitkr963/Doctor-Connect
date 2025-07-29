// Reset notification count for doctor when chat is opened

const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    getMyActiveQueues,
    getUserProfile,
    updateUserProfile,
    addFamilyMember,   // ✅ Naya function import kiya
    removeFamilyMember, // ✅ Naya function import kiya
    getUserNotifications // Notification fetch karne wala function
    ,getPastAppointments // Past appointments controller
} = require('../controllers/userController');
const { protectUser } = require('../middleware/userAuthMiddleware'); // Aapka existing security guard
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware'); // Multer upload middleware
const Notification = require('../models/Notification');
// Mark all notifications as read for the logged-in user

router.patch('/notifications/reset', protect, async (req, res) => {
  try {
    const userId = req.user ? req.user._id : (req.doctor ? req.doctor._id : null);
    if (!userId) return res.status(401).json({ error: 'No user or doctor found' });
    await Notification.updateMany({ user: userId, isRead: false }, { $set: { isRead: true } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.put('/notifications/read-all', protectUser, async (req, res) => {
    try {
        await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
        res.json({ message: 'All notifications marked as read.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// --- Public Routes ---
router.post('/register', registerUser);
router.post('/login', loginUser);

// --- Private Routes (User ka token chahiye) ---
router.get('/my-queues', protectUser, getMyActiveQueues);

// Past Appointments Route
router.get('/past-appointments', protectUser, getPastAppointments);

// User Profile Routes
router.get('/profile', protectUser, getUserProfile);
router.put('/profile', protectUser, upload.single('profilePic'), updateUserProfile);

// ✅ Family Member Routes
router.post('/family-members', protectUser, addFamilyMember); // Family member add karne ke liye
router.delete('/family-members/:memberId', protectUser, removeFamilyMember); // Family member remove karne ke liye

// Notification Route (ensure only logged-in user's notifications are fetched)
router.get('/notifications', protect, async (req, res) => {
    try {
        // Support both doctor and user tokens
        const userId = req.user ? req.user._id : (req.doctor ? req.doctor._id : null);
        if (!userId) return res.status(401).json({ error: 'No user or doctor found' });
        const notifications = await Notification.find({ user: userId }).sort({ createdAt: -1 });
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Mark Notification as Read Route
router.put('/notifications/:id/read', protectUser, async (req, res) => {
    try {
        const notif = await Notification.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            { isRead: true },
            { new: true }
        );
        if (!notif) {
            return res.status(404).json({ message: 'Notification not found or not yours.' });
        }
        res.json({ message: 'Notification marked as read.', notification: notif });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete Notification Route (extra validation)
router.delete('/notifications/:id', protectUser, async (req, res) => {
    try {
        const notif = await Notification.findOne({ _id: req.params.id });
        if (!notif || notif.user.toString() !== req.user._id.toString()) {
            return res.status(404).json({ message: 'Notification not found or not yours.' });
        }
        await Notification.deleteOne({ _id: req.params.id });
        res.json({ message: 'Notification deleted successfully.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Test Notification Route (for debugging)
const mongoose = require('mongoose');
router.get('/test-notification/:userId', async (req, res) => {
    try {
        const notif = await Notification.create({
            user: new mongoose.Types.ObjectId(req.params.userId),
            message: 'Test notification',
            type: 'availability'
        });
        res.json(notif);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Public route for doctor to view user profile by userId (read-only)
const { getUserProfileById } = require('../controllers/userController');
router.get('/:userId', getUserProfileById);

module.exports = router;