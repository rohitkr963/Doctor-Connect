const mongoose = require('mongoose');

// Ek chhota sa schema review ke liye
const reviewSchema = mongoose.Schema({
    name: { type: String, required: true }, // Reviewer ka naam
    rating: { type: Number, required: true },
    comment: { type: String, required: true },
    user: { // Kaun sa user review de raha hai
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
}, {
    timestamps: true,
});

const doctorSchema = new mongoose.Schema({
  // --- Basic Info (Pehle se hai) ---
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  clinicName: {
    type: String,
    required: true,
  },
  address: {
    type: String,
  },
  city: {
    type: String,
    required: true,
  },

  // --- Live Status (Pehle se hai) ---
  currentStatus: {
    type: String,
    enum: ['Available', 'Not Available'],
    default: 'Not Available',
  },
  statusMessage: {
    type: String,
    default: '',
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },

  // --- NAYE FIELDS (PROFILE DETAILS) ---
  profileDetails: {
    specialty: { type: String, default: 'General Physician' },
    experience: { type: Number, default: 0 }, // Saal mein
    consultationFee: { type: Number, default: 0 },
    bio: { type: String, maxlength: 500, default: '' }, // Doctor ke baare mein
    profilePicture: { type: String, default: '' } // Photo ka URL
  },
  
  // --- YEH HAIN NAYE RATING FIELDS ---
  reviews: [reviewSchema], // Har doctor ke paas reviews ki ek list hogi
  rating: { // Average rating
      type: Number,
      required: true,
      default: 0,
  },
  numReviews: { // Total kitne reviews hain
      type: Number,
      required: true,
      default: 0,
  },

  // --- NAYA FIELD (CLINIC TIMINGS) ---
  timings: [
    {
      day: { type: String, required: true, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
      startTime: { type: String, default: '10:00' },
      endTime: { type: String, default: '18:00' },
      isOpen: { type: Boolean, default: true }
    }
  ],
  
  // --- Doctor Availability for Appointments ---
  availability: [
    {
      date: { type: String, required: true }, // e.g. "2025-07-25"
      slots: [
        {
          time: String, // e.g. "09:00 AM"
          isBooked: { type: Boolean, default: false },
          bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
        }
      ]
    }
  ],

  // --- YEH HAI CORRECTED QUEUE SCHEMA ---
  queue: [
    {
      patientId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
      },
      patientName: { type: String },
      tokenNumber: { type: Number },
      joinedAt: { type: Date, default: Date.now },
      servedAt: { type: Date } // Add servedAt field to track when patient was served
    }
  ],
  currentQueueToken: { type: Number, default: 0 },
  lastTokenIssued: { type: Number, default: 0 },

  // --- NAYE FIELDS (ADVANCED FEATURES) ---
  isGeofenceActive: {
    type: Boolean,
    default: false
  },
  multiClinicInfo: [
    {
      clinicName: String,
      address: String,
    }
  ],

  // --- YEH HAI NAYA FIELD ---
  patientHistory: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]

}, {
  timestamps: true,
});


// Password hashing pre-save hook
const bcrypt = require('bcryptjs');
doctorSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

const Doctor = mongoose.model('Doctor', doctorSchema);

module.exports = Doctor;
