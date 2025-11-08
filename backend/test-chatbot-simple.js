// Simple test to verify chatbot logic without database
const message1 = "neurology doctor find kro";
const message2 = "ha dikha do neurology";
const message3 = "mujhe appointment book krna h";

console.log('\n🧪 Testing Keyword Detection\n');

// Test keyword detection
const specialtyKeywords = [
    { keywords: ['neurologist', 'neurology', 'neuro'], specialty: 'Neurology' },
    { keywords: ['cardiologist', 'cardiology', 'heart', 'dil'], specialty: 'Cardiology' },
    { keywords: ['dermatologist', 'dermatology', 'skin'], specialty: 'Dermatology' },
    { keywords: ['dentist', 'dental', 'teeth', 'daant'], specialty: 'Dentist' },
];

function detectSpecialty(message) {
    const lowerMessage = message.toLowerCase();
    
    for (const group of specialtyKeywords) {
        for (const keyword of group.keywords) {
            const regex = new RegExp(`\\b${keyword}`, 'i');
            if (regex.test(lowerMessage)) {
                return group.specialty;
            }
        }
    }
    return 'General Physician';
}

console.log(`Message: "${message1}"`);
console.log(`Detected: ${detectSpecialty(message1)}`);
console.log(`Expected: Neurology\n`);

console.log(`Message: "${message2}"`);
console.log(`Detected: ${detectSpecialty(message2)}`);
console.log(`Expected: Neurology\n`);

console.log(`Message: "${message3}"`);
console.log(`Detected: ${detectSpecialty(message3)}`);
console.log(`Expected: General Physician\n`);

// Test word boundary
const testMessages = [
    'appointment book krna h',
    'ent specialist chahiye',
    'neurology doctor',
];

console.log('\n🧪 Testing Word Boundaries\n');
testMessages.forEach(msg => {
    const detected = detectSpecialty(msg);
    console.log(`"${msg}" → ${detected}`);
});

console.log('\n✅ Test completed!\n');
