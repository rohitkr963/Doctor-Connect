const axios = require('axios');

// POST /api/ai/chat
exports.chatWithAI = async (req, res) => {
  try {
    const { message, history, user_name } = req.body;
    // Forward request to Python AI server
    const response = await axios.post('http://localhost:5001/chat', {
      message,
      history,
      user_name
    });
    return res.json(response.data);
  } catch (err) {
    console.error('AI Server Error:', err.message);
    return res.status(500).json({ error: 'AI server unavailable.' });
  }
};
