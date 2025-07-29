const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Password hashing ke liye

// Ye hamare Patient/User ka database schema (blueprint) hai
const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Kripya apna naam dalein'],
        },
        phone: {
            type: String,
            required: [true, 'Kripya apna phone number dalein'],
            unique: true, // Har user ka phone number alag hona chahiye
            match: [
                /^[6-9]\d{9}$/, // Indian phone number validation
                'Kripya ek valid 10-digit ka phone number dalein',
            ],
        },
        password: {
            type: String,
            required: [true, 'Kripya password dalein'],
            minlength: 6,
        },
        profilePic: {
            type: String,
            default: 'https://via.placeholder.com/150/CCCCCC/FFFFFF?text=User', // Default profile picture URL
        },
        height: {
            type: String,
            required: false, // Optional field
        },
        weight: {
            type: String,
            required: false, // Optional field
        },
        age: {
            type: Number,
            required: false, // Optional field
        },
        bloodGroup: {
            type: String,
            required: false, // Optional field (e.g., A+, B-, O etc.)
        },
        aboutMe: {
            type: String,
            required: false, // Optional field for a short bio
        },
        familyMembers: [ // Family members ke liye array
            {
                name: {
                    type: String,
                    required: true,
                },
                avatar: {
                    type: String,
                    default: 'https://via.placeholder.com/50/CCCCCC/FFFFFF?text=FM', // Default family member avatar
                },
                // Aap yahan aur fields bhi add kar sakte hain jaise:
                // relationship: { type: String, required: false }, // e.g., 'Son', 'Daughter', 'Spouse'
                // age: { type: Number, required: false }
            },
        ],
        isPremiumMember: { // Example field for premium status (optional)
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true, // `createdAt` aur `updatedAt` fields automatically add karega
    }
);

// Password ko database mein save karne se pehle encrypt (hash) karna
userSchema.pre('save', async function (next) {
    // Agar password modify nahi hua hai to aage badh jao
    if (!this.isModified('password')) {
        next();
    }

    // Password ko hash karna
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Login ke time password compare karne ke liye ek helper method
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;