const express = require('express');
const router = express.Router();
const { doctorChatbot } = require('../controllers/doctorChatbotController');

// POST /api/ai/doctor-chat
router.post('/doctor-chat', doctorChatbot);

module.exports = router;
