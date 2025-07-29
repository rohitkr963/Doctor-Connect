            const express = require('express');
            const router = express.Router();
            const { 
            registerDoctor, 
            loginDoctor, 
            updateDoctorStatus,
            searchDoctors,
            updateDoctorProfile,
            joinQueue,
            getMyQueue,
            manageQueue,
            getSpecializations,
            getQueueStatusForPatient,
            getPatientHistory,
            getDoctorById,
            createDoctorReview,
            updateDoctorReview, // <-- Naya function import karein
            deleteDoctorReview  // <-- Naya function import karein
            } = require('../controllers/doctorController');

            const { protect } = require('../middleware/authMiddleware'); // Doctor wala guard
            const { protectUser } = require('../middleware/userAuthMiddleware'); // User wala guard

// --- Public Routes ---
router.get('/specializations', getSpecializations);
router.get('/search', searchDoctors);
router.get('/grouped-by-specialty', require('../controllers/doctorController').getDoctorsGroupedBySpecialty);
router.post('/register', registerDoctor);
router.post('/login', loginDoctor);
router.get('/:id', getDoctorById);
// Doctor profile view (only for logged-in users)
router.get('/:id', protectUser, getDoctorById);

            // --- Doctor's Private Routes (Doctor ka token chahiye) ---
            router.put('/status', protect, updateDoctorStatus);
            router.put('/profile', protect, updateDoctorProfile);
            router.get('/queue/my', protect, getMyQueue);
            router.put('/queue/manage', protect, manageQueue);
            router.get('/patients/history', protect, getPatientHistory);
           

// Delete patient from doctor's history
router.delete('/patients/history/:patientId', protect, require('../controllers/doctorController').deletePatientHistory);

// Doctor sets availability
router.put('/availability', protect, require('../controllers/doctorController').setDoctorAvailability);

            // --- User's Private Routes (User ka token chahiye) ---
            router.post('/:id/join-queue', protectUser, joinQueue);
// Join queue (only for logged-in users)
router.post('/queue/join', protectUser, joinQueue);
            router.get('/:id/queue-status', protectUser, getQueueStatusForPatient);
            router.post('/:id/reviews', protectUser, createDoctorReview);
            router.put('/:id/reviews/:reviewId', protectUser, updateDoctorReview); // <-- YEH NAYI LINE ADD KAREIN
            router.delete('/:id/reviews/:reviewId', protectUser, deleteDoctorReview); // <-- YEH NAYI LINE ADD KAREIN
           
           // User books appointment
           router.post('/:id/book-appointment', protectUser, require('../controllers/doctorController').bookAppointment);

           // Doctor gets all booked appointments
           router.get('/:id/appointments', protect, require('../controllers/doctorController').getDoctorAppointments);

            module.exports = router;
