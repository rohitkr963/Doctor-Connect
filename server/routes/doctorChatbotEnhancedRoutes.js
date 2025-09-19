const express = require('express');
const router = express.Router();
const { doctorChatbot, getAppointmentDetails } = require('../controllers/doctorChatbotControllerEnhanced');
const { protect } = require('../middleware/authMiddleware');

// POST /api/ai/doctor-chat - Enhanced doctor chatbot
router.post('/doctor-chat', protect, doctorChatbot);

// GET /api/ai/appointment-details/:appointmentId - Get specific appointment details
router.get('/appointment-details/:appointmentId', getAppointmentDetails);

module.exports = router;
