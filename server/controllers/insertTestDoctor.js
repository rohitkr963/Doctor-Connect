const mongoose = require('mongoose');
const Doctor = require('../models/Doctor');

async function insertTestDoctor() {
    await mongoose.connect('mongodb://localhost:27017/doctor-connect'); // Update if your DB URI is different
    const testDoctor = new Doctor({
        name: 'Dr. Test Neurologist',
        clinicName: 'Siwan Neuro Clinic',
        email: 'test.neuro.siwan@example.com',
        password: 'Test@1234', // For test only; in production, hash passwords!
        profileDetails: {
            specialty: 'Neurologist',
            city: 'Siwan',
            // Add other profile fields as needed
        },
        isLoggedIn: true,
        city: 'Siwan',
        rating: 4.8,
        numReviews: 12
    });
    await testDoctor.save();
    console.log('Test doctor inserted!');
    await mongoose.disconnect();
}

insertTestDoctor().catch(console.error);
