// backend/controllers/agenticChatController.js
const { bookAppointment, getRecords, sendNotification } = require('../utils/agentTools');
const { getLLMIntent } = require('../utils/llmIntent');

// Main agentic AI controller for chatbot
async function agenticChatbot(req, res) {
  const { message, userId } = req.body;

  // Step 1: Use LLM to extract intent from user message
  const intent = await getLLMIntent(message);

  // Step 2: Call the right tool/action based on intent
  if (intent === 'book_appointment') {
    const result = await bookAppointment(userId);
    return res.json({ reply: `Appointment booked: ${result.details}` });
  }
  if (intent === 'get_report') {
    const result = await getRecords(userId);
    return res.json({ reply: `Your latest report: ${result.link}` });
  }
  if (intent === 'send_notification') {
    await sendNotification(userId, 'Custom notification!');
    return res.json({ reply: 'Notification sent!' });
  }
  return res.json({ reply: 'Sorry, I did not understand. Try: book appointment, get report, send notification.' });
}

module.exports = { agenticChatbot };
