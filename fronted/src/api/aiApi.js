import axios from 'axios';

export const chatWithAI = async ({ message, history, user_name }) => {
  const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/ai/chat`, {
    message,
    history,
    user_name
  });
  return response.data;
};
