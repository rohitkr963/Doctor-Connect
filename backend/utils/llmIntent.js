const axios = require('axios');

// Gemini (Google AI) API intent extraction
async function getLLMIntent(message) {
  // Gemini API key and endpoint from .env
  const apiKey = process.env.GEMINI_API_KEY;
  // Gemini model name (e.g. gemma)
  const model = process.env.GEMINI_MODEL || 'gemma-3n-e4b-it';
  // Gemini endpoint (update if needed)
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  // Gemini prompt for intent extraction
  const prompt = {
    contents: [{
      parts: [{ text: `User message: "${message}" Intent (book_appointment, get_report, send_notification, unknown):` }]
    }]
  };

  const response = await axios.post(endpoint, prompt);
  // Gemini response parsing
  const text = response.data.candidates && response.data.candidates[0] && response.data.candidates[0].content && response.data.candidates[0].content.parts && response.data.candidates[0].content.parts[0] && response.data.candidates[0].content.parts[0].text ? response.data.candidates[0].content.parts[0].text : '';
  const intent = text.trim().split('\n')[0];
  return intent;
}

module.exports = { getLLMIntent };
