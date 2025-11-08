const express = require('express');
const router = express.Router();
const { doctorChatbot } = require('../controllers/doctorChatbotController');
const { protect } = require('../middleware/authMiddleware');

// POST /api/ai/doctor-chat - Protected route (requires authentication)
router.post('/doctor-chat', protect, doctorChatbot);

module.exports = router;
