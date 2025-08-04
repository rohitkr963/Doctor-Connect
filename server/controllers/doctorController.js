const User = require('../models/User');
const sendSms = require('../utils/sms');
const Doctor = require('../models/Doctor');
const Notification = require('../models/Notification');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler'); // ✅ Express-async-handler import kiya

// Get all appointments for a doctor (with symptoms)
// @route   GET /api/doctors/:id/appointments
// @access  Private (Doctor)
const Appointment = require('../models/Appointment');
const getDoctorAppointments = asyncHandler(async (req, res) => {
    const doctorId = req.params.id;
    // Optionally, check if req.doctor._id === doctorId for security
    if (req.doctor && req.doctor._id.toString() !== doctorId) {
        res.status(403);
        throw new Error('Not authorized');
    }
    const appointments = await Appointment.find({ doctor: doctorId })
        .populate('user', 'name email')
        .sort({ date: 1, time: 1 });
    res.status(200).json(appointments);
});

const getDoctorsGroupedBySpecialty = asyncHandler(async (req, res) => {
    // Define the main specialties
    const mainSpecialties = [
        'Neurology',
        'Cardiology',
        'Orthopedics',
        'Dermatology'
    ];

    // Find doctors for each specialty
    const grouped = {};
    for (const specialty of mainSpecialties) {
        grouped[specialty] = await Doctor.find({ 'profileDetails.specialty': specialty }).select('-password');
    }
    res.json(grouped);
});

// Helper function to generate JWT token
const generateToken = (id) => {
    return jwt.sign({ id, type: 'doctor' }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register a new doctor
// @route   POST /api/doctors/register
// @access  Public
const registerDoctor = asyncHandler(async (req, res) => { // ✅ asyncHandler se wrap kiya
    let { name, email, password, clinicName, city, address, specialty } = req.body;
    // Normalize specialty: if user enters 'Dermatologist', save as 'Dermatology'
    if (specialty && specialty.trim().toLowerCase() === 'dermatologist') {
        specialty = 'Dermatology';
    }
    // Only allow these specialties
    const allowedSpecialties = ['Neurology', 'Cardiology', 'Orthopedics', 'Dermatology'];
    if (!allowedSpecialties.includes(specialty)) {
        res.status(400);
        throw new Error('Specialty must be one of: Neurology, Cardiology, Orthopedics, Dermatology');
    }
    if (!name || !email || !password || !clinicName || !city || !specialty) { // specialty bhi required kiya
        res.status(400); // ✅ Error status set kiya
        throw new Error('Kripya sabhi zaroori fields bharein'); // ✅ Error throw kiya
    }
    const doctorExists = await Doctor.findOne({ email });
    if (doctorExists) {
        res.status(400); // ✅ Error status set kiya
        throw new Error('Is email se doctor pehle se registered hai'); // ✅ Error throw kiya
    }

    // Password hashing Doctor model ke pre-save hook mein hota hai
    const doctor = await Doctor.create({
        name,
        email,
        password, // Plain password yahan se jayega, hash model mein hoga
        clinicName,
        city,
        address,
        profileDetails: {
            specialty,
            experience: 0,
            consultationFee: 0,
            bio: '',
            profilePicture: ''
        },
        // isPopular, profilePic, isAvailable, queue, etc. default values lenge
    });

    if (doctor) {
        res.status(201).json({
            _id: doctor._id,
            name: doctor.name,
            email: doctor.email,
            token: generateToken(doctor._id),
            type: 'doctor',
        });
    } else {
        res.status(400); // ✅ Error status set kiya
        throw new Error('Invalid doctor data'); // ✅ Error throw kiya
    }
});

// @desc    Authenticate a doctor (login)
// @route   POST /api/doctors/login
// @access  Public
const loginDoctor = asyncHandler(async (req, res) => { // ✅ asyncHandler se wrap kiya
    const { email, password } = req.body;
    const doctor = await Doctor.findOne({ email });

    // bcrypt.compare ko direct use kiya, jaisa aapke code mein tha
    if (doctor && (await bcrypt.compare(password, doctor.password))) {
        res.json({
            _id: doctor._id,
            name: doctor.name,
            email: doctor.email,
            token: generateToken(doctor._id),
            type: 'doctor',
        });
    } else {
        res.status(401); // ✅ Error status set kiya
        throw new Error('Invalid email or password'); // ✅ Error throw kiya
    }
});

// @desc    Update doctor's status
// @route   PUT /api/doctors/status
// @access  Private (Doctor)
const updateDoctorStatus = asyncHandler(async (req, res) => { // ✅ asyncHandler se wrap kiya
    const { currentStatus, statusMessage } = req.body;
    const doctor = await Doctor.findById(req.doctor._id); // req.doctor._id protect middleware se aata hai

    if (doctor) {
        doctor.currentStatus = currentStatus; // Use correct schema field
        doctor.statusMessage = statusMessage !== undefined ? statusMessage : doctor.statusMessage;
        doctor.lastUpdated = Date.now(); // lastUpdated field schema mein hona chahiye

        const updatedDoctor = await doctor.save();
        res.json({
            _id: updatedDoctor._id,
            name: updatedDoctor.name,
            currentStatus: updatedDoctor.currentStatus, // Correct field for frontend compatibility
            statusMessage: updatedDoctor.statusMessage,
            lastUpdated: updatedDoctor.lastUpdated,
        });
    } else {
        res.status(404); // ✅ Error status set kiya
        throw new Error('Doctor not found'); // ✅ Error throw kiya
    }
});


// @desc    Update doctor's profile and timings
// @route   PUT /api/doctors/profile
// @access  Private (Doctor)
const updateDoctorProfile = asyncHandler(async (req, res) => { // ✅ asyncHandler se wrap kiya
    const doctor = await Doctor.findById(req.doctor._id);
    if (doctor) {
        // Accepts frontend structure: profileDetails, clinicName, city, address, timings, availability
        const { profileDetails, clinicName, city, address, timings, availability } = req.body;
        // Validate specialty if provided
        const allowedSpecialties = ['Neurology', 'Cardiology', 'Orthopedics', 'Dermatology'];
        if (profileDetails && profileDetails.specialty && !allowedSpecialties.includes(profileDetails.specialty)) {
            res.status(400);
            throw new Error('Specialty must be one of: Neurology, Cardiology, Orthopedics, Dermatology');
        }
        // Update profileDetails fields
        if (profileDetails) {
            doctor.profileDetails.bio = profileDetails.bio ?? doctor.profileDetails.bio;
            doctor.profileDetails.experience = profileDetails.experience ?? doctor.profileDetails.experience;
            doctor.profileDetails.consultationFee = profileDetails.consultationFee ?? doctor.profileDetails.consultationFee;
            doctor.profileDetails.specialty = profileDetails.specialty ?? doctor.profileDetails.specialty;
            doctor.profileDetails.profilePicture = profileDetails.profilePicture ?? doctor.profileDetails.profilePicture;
        }
        // Update other fields
        doctor.clinicName = clinicName ?? doctor.clinicName;
        doctor.city = city ?? doctor.city;
        doctor.address = address ?? doctor.address;
        // Only set timings if it is a valid array and every entry has a 'day' property
        if (Array.isArray(timings) && timings.length > 0 && timings.every(t => t.day)) {
            doctor.timings = timings;
        }
        // If timings is empty or invalid, do not set it (prevents validation error)
        if (Array.isArray(availability)) doctor.availability = availability;
        const updatedDoctor = await doctor.save();
        res.json(updatedDoctor);
    } else {
        res.status(404);
        throw new Error('Doctor not found');
    }
});

// @desc    Search for doctors
// @route   GET /api/doctors/search
// @access  Public
const searchDoctors = asyncHandler(async (req, res) => { // ✅ asyncHandler se wrap kiya
    const query = {};
    if (req.query.city) {
        query.city = { $regex: req.query.city, $options: 'i' };
    }
    if (req.query.name) {
        query.name = { $regex: req.query.name, $options: 'i' };
    }
    if (req.query.specialty) {
        // Use correct path for specialty
        query['profileDetails.specialty'] = { $regex: req.query.specialty, $options: 'i' };
    }
    // Show all doctors, not just available ones
    const doctors = await Doctor.find(query).select('-password');
    res.json(doctors);
});

// @desc    Join a doctor's queue
// @route   POST /api/doctors/:id/join-queue
// @access  Private (User)
const joinQueue = asyncHandler(async (req, res) => { // ✅ asyncHandler se wrap kiya
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
        res.status(404); // ✅ Error status set kiya
        throw new Error('Doctor not found'); // ✅ Error throw kiya
    }
    // Schema mein 'currentStatus' hai
    if (doctor.currentStatus !== 'Available') {
        res.status(400); // ✅ Error status set kiya
        throw new Error('Doctor abhi available nahi hain, aap queue join nahi kar sakte'); // ✅ Error throw kiya
    }
    const alreadyInQueue = doctor.queue.find(p => p.patientId.toString() === req.user._id.toString());
    if (alreadyInQueue) {
        res.status(400); // ✅ Error status set kiya
        throw new Error('Aap pehle se hi queue mein hain'); // ✅ Error throw kiya
    }
    const newTokenNumber = doctor.lastTokenIssued + 1;
    const newPatient = {
        patientId: req.user._id,
        patientName: req.user.name, // Assuming req.user has name from userAuthMiddleware
        tokenNumber: newTokenNumber,
    };
    doctor.queue.push(newPatient);
    doctor.lastTokenIssued = newTokenNumber;
    // patientHistory field schema mein hona chahiye
    // const isPatientInHistory = doctor.patientHistory.includes(req.user._id); // Assuming patientHistory is array of ObjectIDs
    // if (!isPatientInHistory) {
    //     doctor.patientHistory.push(req.user._id);
    // }
    await doctor.save();
    // Create notification for user
    try {
        await Notification.create({
            user: req.user._id,
            doctor: doctor._id,
            message: `Aap Dr. ${doctor.name} ki queue mein jud gaye hain! Aapka token number hai ${newTokenNumber}.`,
            type: 'queue',
            doctorProfile: doctor.profileDetails || {},
        });
        console.log(`Notification sent to user ${req.user._id} for joining queue of Dr. ${doctor.name}.`);
    } catch (err) {
        console.error('Notification creation error on queue join:', err);
    }
    res.status(200).json({
        message: 'Aap successfully queue mein jud gaye hain!',
        tokenNumber: newTokenNumber,
        doctorName: doctor.name,
    });
});

// @desc    Get the logged-in doctor's own queue
// @route   GET /api/doctors/queue/my
// @access  Private (Doctor)
const getMyQueue = asyncHandler(async (req, res) => { // ✅ asyncHandler se wrap kiya
    const doctor = await Doctor.findById(req.doctor._id);
    if (!doctor) {
        res.status(404); // ✅ Error status set kiya
        throw new Error('Doctor not found'); // ✅ Error throw kiya
    }
    res.status(200).json({
        queue: doctor.queue,
        currentQueueToken: doctor.currentQueueToken,
        lastTokenIssued: doctor.lastTokenIssued,
    });
});

// @desc    Manage the queue (call next patient, reset queue)
// @route   PUT /api/doctors/queue/manage
// @access  Private (Doctor)
const manageQueue = asyncHandler(async (req, res) => { // ✅ asyncHandler se wrap kiya
    const { action } = req.body;
    const doctor = await Doctor.findById(req.doctor._id);
    if (!doctor) {
        res.status(404); // ✅ Error status set kiya
        throw new Error('Doctor not found'); // ✅ Error throw kiya
    }
    if (action === 'next') {
        const nextToken = doctor.currentQueueToken + 1;
        // Find patient in queue (assuming queue is ordered by tokenNumber)
        // Or simply shift the first patient if the queue is always FIFO
        if (doctor.queue.length === 0) {
            res.status(400);
            throw new Error('Queue mein aur patients nahi hain');
        }
        // Find the first patient in queue (FIFO)
        let servedPatientIndex = doctor.queue.findIndex(p => !p.servedAt);
        if (servedPatientIndex === -1) {
            res.status(400);
            throw new Error('No patient to serve');
        }
        const servedPatient = doctor.queue[servedPatientIndex];
        
           // --- YEH NAYA CODE ADD KAREIN ---
        // Jiska number aaya hai, use SMS bhejna
        try {
            const currentPatient = await User.findById(servedPatient.patientId);
            if (currentPatient && currentPatient.phone) {
                const message = `Update from Dr. ${doctor.name}'s clinic: It's your turn now. Please proceed to the room. Your token is #${servedPatient.tokenNumber}.`;
                await sendSms(currentPatient.phone, message);
            }
        } catch (smsError) {
            console.error("SMS sending failed for current patient:", smsError);
        }
        
        doctor.currentQueueToken = servedPatient.tokenNumber;
        servedPatient.servedAt = new Date();

        // Add to patientHistory if not already present
        if (!doctor.patientHistory.some(id => id.toString() === servedPatient.patientId.toString())) {
            doctor.patientHistory.push(servedPatient.patientId);
        }

        // Remove the served patient from the queue
        doctor.queue.splice(servedPatientIndex, 1);

        // Remove only the appointment slot for this user
        outer: for (const avail of doctor.availability) {
            for (const slot of avail.slots) {
                if (slot.isBooked && slot.bookedBy && slot.bookedBy.toString() === servedPatient.patientId.toString()) {
                    slot.isBooked = false;
                    slot.bookedBy = undefined;
                    break outer;
                }
            }
        }

        // Remove the appointment for this patient and doctor
        await Appointment.deleteOne({ doctor: doctor._id, user: servedPatient.patientId });

        await doctor.save();

        // Notify the patient whose turn is up
        await Notification.create({
            user: servedPatient.patientId,
            doctor: doctor._id,
            message: `Doctor ${doctor.name} ne aapko bula liya hai. Apna token number ${servedPatient.tokenNumber} lekar doctor ke paas pahunch jaayein.`,
            type: 'called'
        });
        console.log(`Notification sent to user ${servedPatient.patientId} for being called in Dr. ${doctor.name}'s queue.`);
        res.status(200).json({
            message: `Token number ${servedPatient.tokenNumber} ko bulaaya gaya hai aur usi user ka appointment list se hata diya gaya hai.`,
            currentQueueToken: doctor.currentQueueToken,
            queue: doctor.queue,
        });
    } else if (action === 'reset') {
        // Collect all users whose appointments will be cancelled
        const cancelledUserIds = [];
        for (const avail of doctor.availability) {
            for (const slot of avail.slots) {
                if (slot.isBooked && slot.bookedBy) {
                    cancelledUserIds.push(slot.bookedBy.toString());
                    slot.isBooked = false;
                    slot.bookedBy = undefined;
                }
            }
        }
        doctor.queue = [];
        doctor.currentQueueToken = 0;
        doctor.lastTokenIssued = 0;

        // Remove all appointments for this doctor
        await Appointment.deleteMany({ doctor: doctor._id });

        await doctor.save();
        // Send notification to all affected users
        for (const userId of cancelledUserIds) {
            await Notification.create({
                user: userId,
                doctor: doctor._id,
                message: `Aapka appointment Dr. ${doctor.name} ke sath cancel ho gaya hai. Kripya dobara appointment book karein.`,
                type: 'appointment-cancel',
            });
        }
        res.status(200).json({ message: 'Queue and appointment list have been reset. All affected users notified.' });
    } else {
        res.status(400); // ✅ Error status set kiya
        throw new Error('Invalid action'); // ✅ Error throw kiya
    }
});

// @desc    Get all unique specializations
// @route   GET /api/doctors/specializations
// @access  Public
const getSpecializations = asyncHandler(async (req, res) => { // ✅ asyncHandler se wrap kiya
    // Use correct path for specialty
    const specializations = await Doctor.distinct('profileDetails.specialty');
    res.status(200).json(specializations || []);
});

// @desc    Get queue status for a logged-in patient for a specific doctor
// @route   GET /api/doctors/:id/queue-status
// @access  Private (User)
const getQueueStatusForPatient = asyncHandler(async (req, res) => { // ✅ asyncHandler se wrap kiya
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
        res.status(404); // ✅ Error status set kiya
        throw new Error('Doctor not found'); // ✅ Error throw kiya
    }
    const patientInQueue = doctor.queue.find(p => p.patientId.toString() === req.user._id.toString());
    if (!patientInQueue) {
        res.status(404); // ✅ Error status set kiya
        throw new Error("Aap is doctor ki queue mein nahi hain."); // ✅ Error throw kiya
    }
    res.status(200).json({
        yourTokenNumber: patientInQueue.tokenNumber,
        currentServingToken: doctor.currentQueueToken,
        patientsAhead: doctor.queue.filter(p => p.tokenNumber < patientInQueue.tokenNumber).length,
        doctorName: doctor.name
    });
});

// @desc    Get the logged-in doctor's patient history
// @route   GET /api/doctors/patients/history
// @access  Private (Doctor)
const getPatientHistory = asyncHandler(async (req, res) => {
    // Return all patients in doctor.patientHistory with name/profilePic
    const doctor = await Doctor.findById(req.doctor._id).populate({
        path: 'patientHistory',
        select: 'name profilePic phone'
    });
    if (!doctor) {
        res.status(404);
        throw new Error('Doctor not found');
    }
    // patientHistory is an array of User objects now
    const history = doctor.patientHistory.map(user => ({
        patientId: user._id,
        patientName: user.name ? user.name : undefined,
        profilePic: user.profilePic ? user.profilePic : undefined,
        phone: user.phone ? user.phone : undefined
    }));
    res.status(200).json(history);
});

// @desc    Delete a patient from doctor's history
// @route   DELETE /api/doctors/patients/history/:patientId
// @access  Private (Doctor)
const deletePatientHistory = asyncHandler(async (req, res) => {
    const doctor = await Doctor.findById(req.doctor._id);
    if (!doctor) {
        res.status(404);
        throw new Error('Doctor not found');
    }
    const { patientId } = req.params;
    const initialLength = doctor.patientHistory.length;
    doctor.patientHistory = doctor.patientHistory.filter(
        id => id.toString() !== patientId
    );
    if (doctor.patientHistory.length === initialLength) {
        res.status(404);
        throw new Error('Patient not found in history');
    }
    await doctor.save();
    res.json({ message: 'Patient removed from history', patientHistory: doctor.patientHistory });
});

// @desc    Get a single doctor's profile by ID
// @route   GET /api/doctors/:id
// @access  Public
const getDoctorById = asyncHandler(async (req, res) => { // ✅ asyncHandler se wrap kiya
    const doctor = await Doctor.findById(req.params.id).select('-password');
    if (doctor) {
        // Only send relevant fields, including only availability (schedule)
        res.json({
            _id: doctor._id,
            name: doctor.name,
            email: doctor.email,
            clinicName: doctor.clinicName,
            city: doctor.city,
            address: doctor.address,
            profileDetails: doctor.profileDetails,
            availability: Array.isArray(doctor.availability) && doctor.availability.length > 0 ? doctor.availability : [],
            reviews: doctor.reviews,
            rating: doctor.rating,
            numReviews: doctor.numReviews,
            isPopular: doctor.isPopular,
            currentStatus: doctor.currentStatus,
            statusMessage: doctor.statusMessage,
            // add any other fields you want to expose
        });
    } else {
        res.status(404); // ✅ Error status set kiya
        throw new Error('Doctor not found'); // ✅ Error throw kiya
    }
});

// @desc    Create a new review for a doctor
// @route   POST /api/doctors/:id/reviews
// @access  Private (User)
const createDoctorReview = asyncHandler(async (req, res) => { // ✅ asyncHandler se wrap kiya
    const { rating, comment } = req.body;
    const doctor = await Doctor.findById(req.params.id);

    if (doctor) {
        // If already reviewed, update it instead of error
        const alreadyReviewed = doctor.reviews.find(
            (r) => r.user.toString() === req.user._id.toString()
        );
        if (alreadyReviewed) {
            alreadyReviewed.rating = Number(rating);
            alreadyReviewed.comment = comment;
            alreadyReviewed.name = req.user.name;
            // Recalculate overall rating
            doctor.rating = doctor.reviews.reduce((acc, item) => item.rating + acc, 0) / doctor.reviews.length;
            await doctor.save();
            return res.status(200).json({ message: 'Review updated successfully' });
        }
        const review = {
            name: req.user.name,
            rating: Number(rating),
            comment,
            user: req.user._id,
        };
        doctor.reviews.push(review);
        doctor.numReviews = doctor.reviews.length;
        doctor.rating = doctor.reviews.reduce((acc, item) => item.rating + acc, 0) / doctor.reviews.length;
        await doctor.save();
        res.status(201).json({ message: 'Review added successfully' });
    } else {
        res.status(404);
        throw new Error('Doctor not found');
    }
});

// @desc    Update a doctor's review
// @route   PUT /api/doctors/:id/reviews/:reviewId
// @access  Private (User)
const updateDoctorReview = asyncHandler(async (req, res) => { // ✅ asyncHandler se wrap kiya
    const { rating, comment } = req.body;
    const { id: doctorId, reviewId } = req.params;

    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
        res.status(404);
        throw new Error('Doctor not found');
    }

    const reviewToUpdate = doctor.reviews.find(
        (r) => r._id.toString() === reviewId && r.user.toString() === req.user._id.toString()
    );

    if (!reviewToUpdate) {
        res.status(404);
        throw new Error('Review not found or not authorized to update this review');
    }

    reviewToUpdate.rating = Number(rating) || reviewToUpdate.rating;
    reviewToUpdate.comment = comment || reviewToUpdate.comment;

    // Recalculate overall rating
    doctor.rating = doctor.reviews.reduce((acc, item) => item.rating + acc, 0) / doctor.reviews.length;

    await doctor.save();
    res.json({ message: 'Review updated successfully', review: reviewToUpdate });
});

// @desc    Delete a doctor's review
// @route   DELETE /api/doctors/:id/reviews/:reviewId
// @access  Private (User)
const deleteDoctorReview = asyncHandler(async (req, res) => { // ✅ asyncHandler se wrap kiya
    const { id: doctorId, reviewId } = req.params;

    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
        res.status(404);
        throw new Error('Doctor not found');
    }

    const initialReviewCount = doctor.reviews.length;
    doctor.reviews = doctor.reviews.filter(
        (r) => r._id.toString() !== reviewId || r.user.toString() !== req.user._id.toString()
    );

    if (doctor.reviews.length === initialReviewCount) {
        res.status(404);
        throw new Error('Review not found or not authorized to delete this review');
    }

    // Recalculate overall rating
    doctor.numReviews = doctor.reviews.length;
    doctor.rating = doctor.reviews.length > 0
        ? doctor.reviews.reduce((acc, item) => item.rating + acc, 0) / doctor.reviews.length
        : 0;

    await doctor.save();
    res.json({ message: 'Review deleted successfully' });
});

// @desc    Get a list of popular doctors
// @route   GET /api/doctors/popular
// @access  Public
const getPopularDoctors = asyncHandler(async (req, res) => { // ✅ asyncHandler se wrap kiya
    const popularDoctors = await Doctor.find({ isPopular: true }).limit(10); // Example: sirf 10 popular doctors

    if (!popularDoctors || popularDoctors.length === 0) {
        return res.status(200).json({ message: 'No popular doctors found at the moment.' });
    }

    res.status(200).json(popularDoctors);
});

// @desc    Set/Unset a doctor as popular (Admin only)
// @route   PUT /api/doctors/:id/set-popular
// @access  Private (Admin) - This route will need admin authentication later
const setDoctorPopularStatus = asyncHandler(async (req, res) => { // ✅ asyncHandler se wrap kiya
    const { isPopular } = req.body;
    const doctor = await Doctor.findById(req.params.id);

    if (doctor) {
        doctor.isPopular = isPopular;
        const updatedDoctor = await doctor.save();
        res.json({
            _id: updatedDoctor._id,
            name: updatedDoctor.name,
            isPopular: updatedDoctor.isPopular,
            message: `Doctor ${updatedDoctor.name} popularity status set to ${isPopular}`
        });
    } else {
        res.status(404);
        throw new Error('Doctor not found');
    }
});

// @desc    Doctor sets available slots for appointments
// @route   PUT /api/doctors/availability
// @access  Private (Doctor)
const setDoctorAvailability = asyncHandler(async (req, res) => {
    if (!req.doctor || !req.doctor._id) {
        console.error('Doctor authentication failed: req.doctor missing or invalid');
        return res.status(401).json({ message: 'Doctor authentication failed' });
    }
    const doctor = await Doctor.findById(req.doctor._id);
    if (!doctor) {
        console.error('Doctor not found in database:', req.doctor._id);
        return res.status(404).json({ message: 'Doctor not found' });
    }
    // Expect: [{ date: '2025-07-25', slots: [{ time: '09:00 AM' }, ...] }, ...]
    const { availability } = req.body;
    if (!Array.isArray(availability)) {
        res.status(400);
        throw new Error('Availability must be an array');
    }
    // Always replace the schedule atomically
    doctor.availability = Array.isArray(availability) && availability.length > 0 ? availability : [];
    await doctor.save();
    // Determine status message
    let statusMsg = 'Doctor is now available.';
    if (!availability || availability.length === 0) {
        statusMsg = 'Doctor is now NOT available.';
    }
    // Notify all users in the system
    try {
        const allUsers = await require('../models/User').find({});
        if (!allUsers || allUsers.length === 0) {
            console.error('No users found to notify.');
        }
        // Access Socket.io instance
        const io = req.app.get('io');
        const userSockets = req.app.get('userSockets');
        for (const user of allUsers) {
            try {
                const notif = await Notification.create({
                    user: user._id,
                    doctor: doctor._id,
                    message: `Dr. ${doctor.name} ${statusMsg}`,
                    type: 'availability'
                });
                // Emit real-time notification if user is connected
                if (io && userSockets && userSockets[user._id]) {
                    io.to(userSockets[user._id]).emit('newNotification', notif);
                }
                console.log(`Notification created for user ${user._id}: Dr. ${doctor.name} ${statusMsg}`);
            } catch (err) {
                console.error(`Notification creation error for user ${user._id}:`, err);
            }
        }
        console.log('All notifications processed for doctor availability update.');
        console.log('Notification sent to notification page for all users.');
    } catch (err) {
        console.error('Error in notification creation block:', err);
    }
    res.status(200).json({ message: 'Availability updated', availability: doctor.availability });
});

// @desc    Book an appointment slot with a doctor
// @route   POST /api/doctors/:id/book-appointment
// @access  Private (User)
const bookAppointment = asyncHandler(async (req, res) => {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
        res.status(404);
        throw new Error('Doctor not found');
    }
    const { date, time, fee, symptoms } = req.body;
    if (!date || !time) {
        res.status(400);
        throw new Error('Date and time required');
    }

    // Prevent double booking: check if user already has an active appointment with this doctor
    const today = new Date();
    const alreadyBooked = doctor.availability.some(avail => {
        // Only check for today or future dates
        const availDate = new Date(avail.date);
        if (availDate >= today) {
            return avail.slots.some(slot =>
                slot.isBooked &&
                slot.bookedBy?.toString() === req.user._id.toString()
            );
        }
        return false;
    });
    if (alreadyBooked) {
        res.status(400);
        throw new Error('Aapke paas already ek active appointment hai is doctor ke sath.');
    }

    // Find the date entry
    const dateEntry = doctor.availability.find(a => a.date === date);
    if (!dateEntry) {
        res.status(400);
        throw new Error('No availability for this date');
    }
    // Find the slot
    const slot = dateEntry.slots.find(s => s.time === time);
    if (!slot) {
        res.status(400);
        throw new Error('Slot not available');
    }
    // Mark slot as booked and set bookedBy so it appears in doctor's appointment list
    if (!slot.isBooked) {
        slot.isBooked = true;
        slot.bookedBy = req.user._id;
    }

    // Add user to doctor's queue if not already present
    const alreadyInQueue = doctor.queue.find(p => p.patientId.toString() === req.user._id.toString());
    if (!alreadyInQueue) {
        const newTokenNumber = doctor.lastTokenIssued + 1;
        const newPatient = {
            patientId: req.user._id,
            patientName: req.user.name,
            tokenNumber: newTokenNumber,
        };
        doctor.queue.push(newPatient);
        doctor.lastTokenIssued = newTokenNumber;
        // Optionally, add to patientHistory if needed
    }

    await doctor.save();

      // --- YEH HAI NAYA SMS LOGIC ---
    try {
        const patient = await User.findById(req.user._id);
        if (patient && patient.phone) {
            const message = `Confirmation: Your appointment with Dr. ${doctor.name} is booked for ${date} at ${time}.`;
            await sendSms(patient.phone, message);
        }
    } catch (smsError) {
        console.error("SMS sending failed after booking:", smsError);
    }

    // Send notification to user
    await Notification.create({
        user: req.user._id,
        doctor: doctor._id,
        message: `Aapne Dr. ${doctor.name} ke sath ${date} ko ${time} par appointment book kiya hai. Aap queue mein bhi jud gaye hain!`,
        type: 'queue',
    });

    // Save appointment in Appointment collection with symptoms
    const Appointment = require('../models/Appointment');
    const appointment = new Appointment({
        doctor: doctor._id,
        user: req.user._id,
        date,
        time,
        fee,
        symptoms: symptoms || ''
    });
    await appointment.save();

    res.status(200).json({ message: 'Appointment booked and added to queue', date, time, symptoms });
});

// Sabse aakhir mein module.exports
module.exports = {
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
    updateDoctorReview, // ✅ Export kiya
    deleteDoctorReview, // ✅ Export kiya
    getPopularDoctors,  // ✅ Export kiya
    setDoctorPopularStatus, // ✅ Export kiya
    getDoctorsGroupedBySpecialty,
    setDoctorAvailability,
    bookAppointment,
    deletePatientHistory,
    getDoctorAppointments,
};