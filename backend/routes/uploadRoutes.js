const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');

// Simple image upload for profile pictures (doctor/user)
router.post('/', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded' });
  }
  const url = `/uploads/${req.file.filename}`;
  res.status(201).json({ url });
});

module.exports = router;
