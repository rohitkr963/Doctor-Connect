import axios from 'axios';

export const chatWithAI = async ({ message, history, user_name }) => {
  const response = await axios.post('http://localhost:5000/api/ai/chat', {
    message,
    history,
    user_name
  });
  return response.data;
};
