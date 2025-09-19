// routes/recordsRoutes.js

const express = require('express');
const router = express.Router();
const { askMyRecords } = require('../controllers/recordsController');
// Assuming you have an auth middleware to protect routes
const { protect } = require('../middleware/authMiddleware');

router.post('/ask', protect, askMyRecords);

module.exports = router;