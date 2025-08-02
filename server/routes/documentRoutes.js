
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadDocument, getDocuments, deleteDocument } = require('../controllers/documentController');
const { protect } = require('../middleware/userAuthMiddleware');

const upload = multer({ dest: 'uploads/' });

// Upload a new medical document
router.post('/upload', protect, upload.single('file'), uploadDocument);

// Get all medical documents for logged-in user
router.get('/', protect, getDocuments);


// Delete a medical document by public_id
router.delete('/:public_id', protect, deleteDocument);

module.exports = router;
