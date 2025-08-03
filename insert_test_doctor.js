// Run this script with: node insert_test_doctor.js
// Make sure your MongoDB server is running and your Doctor model is correct.

const mongoose = require('mongoose');
const Doctor = require('./server/models/Doctor'); // Adjust path if needed

const MONGO_URI = 'mongodb://localhost:27017/doctor-connect'; // Change if your DB URI is different

async function insertTestDoctor() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  const testDoctor = new Doctor({
    name: 'Dr. ENT Specialist',
    isLoggedIn: true,
    city: 'Siwan',
    clinicName: 'Siwan ENT Clinic',
    email: 'ent.specialist@demo.com',
    password: 'Test@1234', // For demo only; in production, hash passwords!
    profileDetails: {
      specialty: 'ENT',
      specialties: ['ENT', 'Otolaryngologist'],
      city: 'Siwan',
      experience: 10,
      qualification: 'MBBS, MS (ENT)',
      about: 'Specialist in Ear, Nose, Throat disorders.'
    },
    rating: 4.8,
    numReviews: 12
  });

  await testDoctor.save();
  console.log('Test doctor inserted!');
  await mongoose.disconnect();
}

insertTestDoctor().catch(console.error);
