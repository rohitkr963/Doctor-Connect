const asyncHandler = require('express-async-handler');
const cloudinary = require('cloudinary').v2;
const User = require('../models/User');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload medical document
exports.uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  const docType = req.body.docType || '';
  const result = await cloudinary.uploader.upload(req.file.path, {
    folder: 'medical-records',
    resource_type: 'auto',
  });
  const user = await User.findById(req.user._id);
  user.medicalRecords.push({
    public_id: result.public_id,
    url: result.secure_url,
    fileName: req.file.originalname,
    docType,
    uploadedAt: new Date(),
  });
  await user.save();

  // --- Save PDF to local reports folder for Q&A ---
  const fs = require('fs');
  const path = require('path');
  const userId = req.user._id.toString();
  const reportsDir = path.join(__dirname, `../uploads/reports/${userId}`);
  // Only copy if PDF
  if (req.file.mimetype === 'application/pdf') {
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    const destPath = path.join(reportsDir, req.file.originalname);
    try {
      fs.copyFileSync(req.file.path, destPath);
    } catch (err) {
      console.error('Error copying PDF to reports folder:', err);
    }
  }

  res.json({ message: 'File uploaded', record: user.medicalRecords[user.medicalRecords.length - 1] });
});

// Get all medical documents for logged-in user
exports.getDocuments = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ records: user.medicalRecords });
});


// Delete a medical document
exports.deleteDocument = asyncHandler(async (req, res) => {
  const public_id = req.params.public_id;
  if (!public_id) {
    return res.status(400).json({ message: 'No public_id provided' });
  }
  // Remove from Cloudinary
  try {
    await cloudinary.uploader.destroy(public_id);
  } catch (err) {
    return res.status(500).json({ message: 'Cloudinary deletion failed', error: err.message });
  }
  // Remove from user's medicalRecords
  const user = await User.findById(req.user._id);
  const initialLength = user.medicalRecords.length;
  user.medicalRecords = user.medicalRecords.filter(doc => doc.public_id !== public_id);
  if (user.medicalRecords.length === initialLength) {
    return res.status(404).json({ message: 'Document not found in user records' });
  }
  await user.save();
  res.json({ message: 'Document deleted successfully', public_id });
});

