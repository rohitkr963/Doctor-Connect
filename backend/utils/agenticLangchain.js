// backend/utils/agenticLangchain.js
// Advanced agentic AI using LangChain and Gemini

require('dotenv').config(); // ✅ Make sure this is FIRST

const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { ChatPromptTemplate } = require('@langchain/core/prompts');
const { LLMChain } = require('langchain/chains');

// Create the LLM with direct API key assignment
const llm = new ChatGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY,
  model: process.env.GEMINI_MODEL || 'gemma-3n-e4b-it',
});

// Define prompt template for agentic reasoning
const prompt = ChatPromptTemplate.fromTemplate(
  `You are an advanced AI health assistant agent.\n\nUser: {input}\n\nYour job is to:\n- Understand user's intent (appointment, report, notification, doctor search, advice)\n- Reason step by step\n- If medical, suggest doctor type\n- If appointment, ask for details\n- If report, fetch or summarize\n- If notification, send\n- If advice, give health tips\n- Always reply in a helpful, conversational way.\n\nRespond:`
);

// AI response function
async function agenticAIResponse(input, userId, context = {}) {
  const chain = new LLMChain({ llm, prompt });
  const result = await chain.call({ input, userId, ...context });
  return result.text;
}

module.exports = { agenticAIResponse };
