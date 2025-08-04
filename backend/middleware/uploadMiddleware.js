// middleware/uploadMiddleware.js
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // Node.js's file system module

// Ensure 'uploads' directory exists
const uploadDir = './uploads/';
if (!fs.existsSync(uploadDir)) {
    console.log('Uploads directory does not exist. Creating it now...');
    fs.mkdirSync(uploadDir);
    console.log('Uploads directory created successfully.');
} else {
    console.log('Uploads directory already exists.');
}

// Set storage engine
const storage = multer.diskStorage({
    destination: function(req, file, cb){
        console.log('Multer: Setting destination for file:', file.originalname);
        cb(null, uploadDir); // Folder where images will be saved
    },
    filename: function(req, file, cb){
        const filename = file.fieldname + '-' + Date.now() + path.extname(file.originalname);
        console.log('Multer: Setting filename to:', filename);
        cb(null, filename);
    }
});

// Check file type
function checkFileType(file, cb){
    console.log('Multer: Checking file type for:', file.originalname);
    // Allowed ext (images + audio + webm)
    const filetypes = /jpeg|jpg|png|gif|mp3|wav|m4a|webm/;
    // Check ext
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check mime
    const mimetype = (
        filetypes.test(file.mimetype) ||
        file.mimetype === 'audio/webm' // Allow webm audio mimetype
    );

    if(mimetype && extname){
        console.log('Multer: File type is valid.');
        return cb(null,true);
    } else {
        console.log('Multer: File type is INVALID. Mimetype:', mimetype, 'Extname:', extname);
        cb('Error: Images/Audio Only!'); // Agar file type galat hoga to ye error aayegi
    }
}

// Init upload
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function(req, file, cb){
        checkFileType(file, cb);
    }
});

module.exports = upload;