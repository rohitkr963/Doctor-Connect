const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');
const { optionalAuth } = require('../middleware/authMiddleware');

// POST /api/chatbot/symptom-check - Optional auth (login required only for booking, not searching)
router.post('/symptom-check', optionalAuth, chatbotController.symptomChecker);

module.exports = router;