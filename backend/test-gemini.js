const axios = require('axios');
require('dotenv').config();

async function testGeminiAPI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY not found in environment.');
    return;
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
  const prompt = 'What is a healthy diet?';
  try {
    const response = await axios.post(url, {
      contents: [{ parts: [{ text: prompt }] }]
    });
    console.log('Gemini API response:', response.data);
  } catch (err) {
    if (err.response) {
      console.error('Gemini API error:', err.response.data);
    } else {
      console.error('Request error:', err.message);
    }
  }
}

testGeminiAPI();
