// backend/routes/agentRoutes.js
const express = require('express');
const { agenticChatbot } = require('../controllers/agenticChatController');
const router = express.Router();

router.post('/agent-chat', agenticChatbot);

module.exports = router;
