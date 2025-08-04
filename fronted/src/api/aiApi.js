import axios from 'axios';
import server from '../environment';


export const chatWithAI = async ({ message, history, user_name }) => {
  const response = await axios.post(`${server}/api/ai/chat`, {
    message,
    history,
    user_name
  });
  return response.data;
};
