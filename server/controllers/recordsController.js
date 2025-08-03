// controllers/recordsController.js

const asyncHandler = require('express-async-handler');
const { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } = require("@langchain/google-genai");
const { PDFLoader } = require("@langchain/community/document_loaders/fs/pdf");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { MemoryVectorStore } = require("langchain/vectorstores/memory");
const { RunnableSequence } = require("@langchain/core/runnables");
const { PromptTemplate } = require("@langchain/core/prompts");
const { StringOutputParser } = require("@langchain/core/output_parsers");
const { formatDocumentsAsString } = require("langchain/util/document");
const fs = require('fs').promises;
const path = require('path');

// NOTE: The server-side cache has been removed.
// This function will now check the file system for new PDFs on every request,
// ensuring that recently uploaded documents are always found.

/**
 * Loads a user's PDF reports and creates a vector store on-the-fly.
 * This function now reads from the directory every time to ensure it's up-to-date.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<MemoryVectorStore|null>} - The searchable vector store or null.
 */
const getVectorStoreForUser = async (userId) => {
    const reportsDir = path.join(__dirname, `../uploads/reports/${userId}`);
    const documents = [];

    try {
        const files = await fs.readdir(reportsDir);
        const pdfFiles = files.filter(file => file.endsWith('.pdf'));

        if (pdfFiles.length === 0) {
            console.log(`No PDF reports found for user ${userId}.`);
            return null;
        }

        for (const file of pdfFiles) {
            const filePath = path.join(reportsDir, file);
            const loader = new PDFLoader(filePath);
            const loadedDocs = await loader.load();
            documents.push(...loadedDocs);
        }

        const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
        const splitDocs = await textSplitter.splitDocuments(documents);

        const embeddings = new GoogleGenerativeAIEmbeddings({
            apiKey: process.env.GEMINI_API_KEY,
            modelName: "embedding-001",
        });

        const vectorStore = await MemoryVectorStore.fromDocuments(splitDocs, embeddings);
        
        return vectorStore;

    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log(`No reports directory found for user ${userId}.`);
            return null;
        }
        console.error("Error creating vector store:", error);
        throw error;
    }
};

/**
 * Handles the API request to ask a question about a user's records.
 */
const askMyRecords = asyncHandler(async (req, res) => {
    // Debug log for Gemini API key
    console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY);
    if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ answer: 'Gemini API key is missing from environment. Please check your .env file and server setup.' });
    }
    const { question, userId } = req.body;

    if (!question || !userId) {
        res.status(400);
        throw new Error("A question and userId are required.");
    }

    const vectorStore = await getVectorStoreForUser(userId);

    if (!vectorStore) {
        const reportsDir = path.join(__dirname, `../uploads/reports/${userId}`);
        try {
            const files = await fs.readdir(reportsDir);
            if (files.length > 0) {
                res.status(200).json({ answer: "I can only read PDF documents. Please upload your reports in PDF format to ask questions." });
            } else {
                res.status(200).json({ answer: "You have not uploaded any reports yet. Please upload a PDF report to start." });
            }
        } catch (error) {
             res.status(200).json({ answer: "You have not uploaded any reports yet. Please upload a PDF report to start." });
        }
        return;
    }

    const retriever = vectorStore.asRetriever(4);

    const promptTemplate = `
    You are a helpful AI assistant. Your task is to answer questions based ONLY on the context provided from the user's medical reports.
    If you do not know the answer from the context, just say "I do not have that information in the provided reports." Do not try to make up an answer.
    Answer in a clear and concise way.

    CONTEXT:
    {context}

    QUESTION:
    {question}

    ANSWER:
    `;
    const prompt = PromptTemplate.fromTemplate(promptTemplate);

    // Defensive check for required Google Generative AI env vars
    if (!process.env.GEMINI_API_KEY || typeof process.env.GEMINI_API_KEY !== 'string') {
        return res.status(500).json({ answer: 'Gemini API key is missing or invalid. Please check your .env file and server setup.' });
    }
    // Defensive check for modelName
    const modelName = "gemini-pro";
    if (!modelName || typeof modelName !== 'string') {
        return res.status(500).json({ answer: 'Gemini model name is missing or invalid.' });
    }
    // Now instantiate
    const model = new ChatGoogleGenerativeAI({
        apiKey: process.env.GEMINI_API_KEY,
        modelName,
        temperature: 0.3,
    });

    const chain = RunnableSequence.from([
        {
            context: retriever.pipe(formatDocumentsAsString),
            question: (input) => input.question,
        },
        prompt,
        model,
        new StringOutputParser(),
    ]);

    const answer = await chain.invoke({ question });

    res.status(200).json({ answer });
});

module.exports = {
    askMyRecords,
};
