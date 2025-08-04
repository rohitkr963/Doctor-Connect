const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const { PromptTemplate } = require("@langchain/core/prompts");

async function askLangchain(prompt) {
  try {
    // Gemini LLM setup (replace with your model/config)
    const llm = new ChatGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY,
      model: "gemma-3n-e4b-it"
    });
    const template = new PromptTemplate({ template: "{input}", inputVariables: ["input"] });
    const formattedPrompt = await template.format({ input: prompt });
    const result = await llm.invoke(formattedPrompt);
    return result.content;
  } catch (err) {
    console.error('LangChain error log:', err);
    throw err;
  }
}

module.exports = { askLangchain };
