const express = require('express');
const router = express.Router();

const { symptomChecker } = require('../controllers/chatbotController');

// Chatbot ke liye ek hi route hoga (public access)
router.post('/symptom-check', symptomChecker);

module.exports = router;
