// Test script to verify doctors in database
require('dotenv').config();
const mongoose = require('mongoose');
const Doctor = require('./models/Doctor');

async function testDoctors() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Test 1: Count all doctors
        const totalDoctors = await Doctor.countDocuments();
        console.log(`\n📊 Total Doctors: ${totalDoctors}`);

        // Test 2: Find Neurology doctors
        const neurologyDoctors = await Doctor.find({
            $or: [
                { 'profileDetails.specialty': { $regex: 'Neurology', $options: 'i' } },
                { 'profileDetails.specialties': { $regex: 'Neurology', $options: 'i' } }
            ]
        }).select('name city profileDetails.specialty');
        
        console.log(`\n🧠 Neurology Doctors (${neurologyDoctors.length}):`);
        neurologyDoctors.forEach((doc, idx) => {
            console.log(`  ${idx + 1}. ${doc.name} (${doc.city}) - ${doc.profileDetails?.specialty}`);
        });

        // Test 3: Find specific doctor by name
        const prince = await Doctor.findOne({ name: { $regex: 'prince', $options: 'i' } });
        console.log(`\n👨‍⚕️ Doctor "prince":`);
        if (prince) {
            console.log(`  Found: ${prince.name} (${prince.city}) - ${prince.profileDetails?.specialty}`);
        } else {
            console.log(`  ❌ Not found`);
        }

        // Test 4: Show all doctors with their specialties
        console.log(`\n📋 All Doctors:`);
        const allDoctors = await Doctor.find({}).select('name city profileDetails.specialty').limit(20);
        allDoctors.forEach((doc, idx) => {
            console.log(`  ${idx + 1}. ${doc.name} (${doc.city}) - ${doc.profileDetails?.specialty || 'N/A'}`);
        });

        console.log('\n✅ Test completed!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

testDoctors();
