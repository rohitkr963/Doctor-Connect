const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');

// POST /api/chatbot/symptom-check
router.post('/symptom-check', chatbotController.symptomChecker);

module.exports = router;