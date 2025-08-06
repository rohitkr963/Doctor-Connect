// backend/controllers/doctorAssistantController.js
// Doctor's AI Assistant using LangChain and custom DB tools

const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { ChatPromptTemplate } = require('@langchain/core/prompts');
const { LLMChain } = require('langchain/chains');
const Appointment = require('../models/Appointment');
const User = require('../models/User');

// Tool: Get today's appointments for a doctor
async function get_todays_appointments(doctor_id) {
  const today = new Date();
  today.setHours(0,0,0,0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const appointments = await Appointment.find({
    doctor: doctor_id,
    date: { $gte: today, $lt: tomorrow }
  }).populate('patient', 'name age gender');
  return appointments.map(a => ({
    time: a.time,
    patient: a.patient.name,
    age: a.patient.age,
    gender: a.patient.gender
  }));
}

// Tool: Get patient history for a doctor
async function get_patient_history(patient_name, doctor_id) {
  const user = await User.findOne({ name: patient_name });
  if (!user) return `No patient found with name ${patient_name}`;
  const appointments = await Appointment.find({ doctor: doctor_id, patient: user._id });
  return appointments.map(a => ({
    date: a.date,
    notes: a.notes || 'No notes'
  }));
}

// LangChain agent setup
const llm = new ChatGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY,
  model: process.env.GEMINI_MODEL || 'gemma-3n-e4b-it',
});

const prompt = ChatPromptTemplate.fromTemplate(
  `You are a doctor's AI assistant. You have access to these tools:
- get_todays_appointments(doctor_id): Returns today's appointments for the doctor.
- get_patient_history(patient_name, doctor_id): Returns history of a patient for the doctor.

When the doctor asks a question, use these tools to fetch information from the database and reply in simple language. If you need to call a tool, ask for required info (doctor_id, patient_name). If info is missing, ask for it. Always reply in easy Hindi or English.`
);

async function doctorAssistantResponse(input, doctor_id) {
  // Tool invocation logic (improved)
  if (/aaj.*appointment|today.*appointment|appointments.*aaj/i.test(input)) {
    const data = await get_todays_appointments(doctor_id);
    return `Aapke aaj ke appointments: ${JSON.stringify(data)}`;
  }
  if (/history|patient.*detail|patient.*history|bimari|इलाज|मरीज.*इतिहास/i.test(input)) {
    // Extract patient name from input (Hindi/English)
    let match = input.match(/patient\s+(\w+)/i);
    if (!match) match = input.match(/मरीज\s+(\w+)/i);
    const patient_name = match ? match[1] : null;
    if (!patient_name) return 'Kripya patient ka naam batayein.';
    const data = await get_patient_history(patient_name, doctor_id);
    return `Patient ${patient_name} ka history: ${JSON.stringify(data)}`;
  }
  // Fallback to LLM for other queries
  const chain = new LLMChain({ llm, prompt });
  const result = await chain.call({ input });
  return result.text;
}

module.exports = { doctorAssistantResponse };
