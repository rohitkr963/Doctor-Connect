const express = require('express');
const router = express.Router();
const { chatWithAI } = require('../controllers/aiController');
const { smartChatHandler, doctorSearchHandler } = require('../controllers/chatbotController');
// POST /api/ai/doctor-search
router.post('/doctor-search', doctorSearchHandler);

// POST /api/ai/chat
router.post('/chat', chatWithAI);

// POST /api/ai/smart-chat
router.post('/smart-chat', smartChatHandler);

module.exports = router;
