const User = require('../models/User');
const Doctor = require('../models/Doctor'); // Doctor model ko import karna zaroori hai (agar use hota hai)
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler'); // Async operations ko handle karne ke liye
const Notification = require('../models/Notification');

// @desc    Get user profile by userId (for doctor read-only view)
// @route   GET /api/users/:userId
// @access  Public (for doctor viewing user profile)
const getUserProfileById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.userId).select('-password');
    if (user) {
        res.json({
            _id: user._id,
            name: user.name,
            phone: user.phone,
            profilePic: user.profilePic,
            height: user.height,
            weight: user.weight,
            age: user.age,
            bloodGroup: user.bloodGroup,
            aboutMe: user.aboutMe,
            familyMembers: user.familyMembers,
            isPremiumMember: user.isPremiumMember,
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});
// @desc    Get notifications for logged-in user
// @route   GET /api/users/notifications
// @access  Private (User)
const getUserNotifications = asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(notifications);
});

// Helper function to generate JWT token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d', // Token 30 din tak valid rahega
    });
};

// @desc    Naye user ko register karna (patient)
// @route   POST /api/users/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const { name, phone, password } = req.body;

    console.log('Register attempt for phone:', phone); // Debugging
    console.log('Register data received:', req.body); // Debugging

    const userExists = await User.findOne({ phone });
    if (userExists) {
        res.status(400);
        throw new Error('Is phone number se user pehle se registered hai');
    }

    const user = await User.create({
        name,
        phone,
        password,
        // Baki fields (profilePic, height, etc.) default value lenge ya baad mein update honge
    });

    if (user) {
        console.log('User registered successfully:', user.phone); // Debugging
        res.status(201).json({
            _id: user._id,
            name: user.name,
            phone: user.phone,
            token: generateToken(user._id),
            type: 'user', // User type indicate karein
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    User ko authenticate karna aur token generate karna (Login)
// @route   POST /api/users/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
    const { phone, password } = req.body;

    console.log('Login attempt for phone:', phone); // Debugging
    console.log('Password received (plaintext):', password); // Debugging (REMOVE IN PRODUCTION)

    const user = await User.findOne({ phone });

    if (!user) {
        console.log('User not found for phone:', phone); // Debugging
        res.status(401);
        throw new Error('Invalid phone number or password');
    }

    console.log('User found:', user.phone); // Debugging
    console.log('Comparing passwords...'); // Debugging

    // user.matchPassword method User model mein define kiya gaya hai
    if (await user.matchPassword(password)) {
        console.log('Password matched! User logged in:', user.phone); // Debugging
        res.json({
            _id: user._id,
            name: user.name,
            phone: user.phone,
            profilePic: user.profilePic, // Login ke time profile pic bhi bhejein
            token: generateToken(user._id),
            type: 'user', // User type indicate karein
        });
    } else {
        console.log('Password did NOT match for user:', user.phone); // Debugging
        res.status(401);
        throw new Error('Invalid phone number or password');
    }
});

// @desc    Get all active queues for the logged-in user
// @route   GET /api/users/my-queues
// @access  Private (User)
const getMyActiveQueues = asyncHandler(async (req, res) => {
    // Find all doctors where this user is in the queue and not yet served
    const doctorsInQueue = await Doctor.find({ 'queue.patientId': req.user._id });
    let myQueues = [];
    let movedToPast = false;

    doctorsInQueue.forEach(doctor => {
        const myQueueEntry = doctor.queue.find(p => p.patientId.toString() === req.user._id.toString() && !p.servedAt);
        if (myQueueEntry) {
            myQueues.push({
                doctorId: doctor._id,
                doctorName: doctor.name,
                specialty: doctor.profileDetails ? doctor.profileDetails.specialty : 'N/A',
                yourToken: myQueueEntry.tokenNumber,
                currentToken: doctor.currentQueueToken
            });
        } else {
            // If user is not in upcoming queue but was previously in queue, move to past appointments
            const pastEntry = doctor.queue.find(p => p.patientId.toString() === req.user._id.toString() && p.servedAt);
            if (pastEntry) {
                movedToPast = true;
            }
        }
    });

    // If no upcoming appointments, and user was previously in queue, ensure past appointment is added
    if (myQueues.length === 0 && movedToPast) {
        // No need to do anything, pastAppointments will show it
    }

    res.json(myQueues);
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private (User)
const getUserProfile = asyncHandler(async (req, res) => {
    // req.user comes from the protect middleware, jismein user ka _id hota hai
    const user = await User.findById(req.user._id).select('-password'); // Password ko exclude karein

    if (user) {
        res.json({
            _id: user._id,
            name: user.name,
            phone: user.phone,
            profilePic: user.profilePic,
            height: user.height,
            weight: user.weight,
            age: user.age,
            bloodGroup: user.bloodGroup,
            aboutMe: user.aboutMe,
            familyMembers: user.familyMembers,
            isPremiumMember: user.isPremiumMember,
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Update user profile (including file upload)
// @route   PUT /api/users/profile
// @access  Private (User)
const updateUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id); // Authenticated user ko dhundhein

    if (user) {
        // Request body se fields update karein, agar value provide ki gayi hai
        user.name = req.body.name || user.name;
        user.phone = req.body.phone || user.phone;
        user.height = req.body.height || user.height;
        user.weight = req.body.weight || user.weight;
        user.age = req.body.age || user.age;
        user.bloodGroup = req.body.bloodGroup || user.bloodGroup;
        user.aboutMe = req.body.aboutMe || user.aboutMe;

        // Profile picture update handle karna
        if (req.file) { // Agar 'multer' ne koi file upload ki hai
            console.log('New profile picture uploaded:', req.file.filename); // Debugging
            user.profilePic = `/uploads/${req.file.filename}`; // Save relative path to the DB
        } else {
            console.log('No new profile picture uploaded.'); // Debugging
        }

        const updatedUser = await user.save();
        console.log('User profile saved to DB.'); // Debugging

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            phone: updatedUser.phone,
            profilePic: updatedUser.profilePic,
            height: updatedUser.height,
            weight: updatedUser.weight,
            age: updatedUser.age,
            bloodGroup: updatedUser.bloodGroup,
            aboutMe: updatedUser.aboutMe,
            familyMembers: updatedUser.familyMembers,
            isPremiumMember: updatedUser.isPremiumMember,
            token: generateToken(updatedUser._id),
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});


// @desc    Add a new family member to user's profile
// @route   POST /api/users/family-members
// @access  Private (User)
const addFamilyMember = asyncHandler(async (req, res) => {
    const { name, avatar } = req.body; // Family member ka naam aur optional avatar URL

    if (!name) {
        res.status(400);
        throw new Error('Family member ka naam zaroori hai');
    }

    const user = await User.findById(req.user._id);

    if (user) {
        const newFamilyMember = {
            // MongoDB automatically generates _id for subdocuments
            name,
            avatar: avatar || 'https://via.placeholder.com/50/CCCCCC/FFFFFF?text=FM' // Default avatar
        };
        user.familyMembers.push(newFamilyMember); // Array mein naya member add karein
        const updatedUser = await user.save();

        res.status(201).json({
            message: 'Family member successfully added',
            familyMember: newFamilyMember, // Naya add kiya gaya member return karein
            familyMembers: updatedUser.familyMembers // Updated list bhi return kar sakte hain
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Remove a family member from user's profile
// @route   DELETE /api/users/family-members/:memberId
// @access  Private (User)
const removeFamilyMember = asyncHandler(async (req, res) => {
    const { memberId } = req.params; // URL params se memberId lenge

    const user = await User.findById(req.user._id);

    if (user) {
        // familyMembers array se member ko remove karein uski _id se
        // Mongoose subdocuments ko unique _id deta hai
        const initialLength = user.familyMembers.length;
        user.familyMembers = user.familyMembers.filter(
            member => member._id.toString() !== memberId
        );

        if (user.familyMembers.length === initialLength) {
            res.status(404);
            throw new Error('Family member not found');
        }

        const updatedUser = await user.save();

        res.json({
            message: 'Family member successfully removed',
            familyMembers: updatedUser.familyMembers // Updated list return karein
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Get all past appointments for the logged-in user
// @route   GET /api/users/past-appointments
// @access  Private (User)
const getPastAppointments = asyncHandler(async (req, res) => {
    const doctors = await Doctor.find({ 'queue.patientId': req.user._id });
    const pastAppointments = [];
    let hasUpcoming = false;

    doctors.forEach(doctor => {
        doctor.queue.forEach(entry => {
            if (entry.patientId.toString() === req.user._id.toString()) {
                if (entry.servedAt) {
                    pastAppointments.push({
                        doctorId: doctor._id,
                        doctorName: doctor.name,
                        specialty: doctor.profileDetails ? doctor.profileDetails.specialty : 'N/A',
                        date: entry.servedAt,
                    });
                } else {
                    hasUpcoming = true;
                }
            }
        });
    });

    // If user is not in any upcoming queue, also show unserved entries as past
    if (!hasUpcoming) {
        doctors.forEach(doctor => {
            doctor.queue.forEach(entry => {
                if (
                    entry.patientId.toString() === req.user._id.toString() &&
                    !entry.servedAt
                ) {
                    pastAppointments.push({
                        doctorId: doctor._id,
                        doctorName: doctor.name,
                        specialty: doctor.profileDetails ? doctor.profileDetails.specialty : 'N/A',
                        date: 'Unknown',
                    });
                }
            });
        });
    }
    res.json(pastAppointments);
});



module.exports = {
    registerUser,
    loginUser,
    getMyActiveQueues,
    getUserProfile,
    updateUserProfile,
    addFamilyMember,
    removeFamilyMember,
    getUserNotifications,
    getPastAppointments,
    getUserProfileById,
};

