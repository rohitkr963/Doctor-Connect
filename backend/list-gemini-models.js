const axios = require('axios');
require('dotenv').config();

async function listGeminiModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY not found in environment.');
    return;
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  try {
    const response = await axios.get(url);
    console.log('Available Gemini models:', response.data);
  } catch (err) {
    if (err.response) {
      console.error('Gemini API error:', err.response.data);
    } else {
      console.error('Request error:', err.message);
    }
  }
}

listGeminiModels();
