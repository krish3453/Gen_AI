import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const client = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

const conversation = `
User: How many vacation days do employees get?

Assistant: Employees receive 20 days of paid annual leave.
`;

const currentQuestion = "What about remote work?";

const prompt = `
You are a query rewriting system.

Your job is to rewrite the user's current question
into a clear, standalone search query.

Use the conversation history to understand references
such as "it", "that", "they", "what about", etc.

Do not answer the question.
Only return the rewritten search query.

Conversation:
${conversation}

Current question:
${currentQuestion}
`;

const response = await client.models.generateContent({
    model: "gemini-3.5-flash-lite",
    contents: prompt
});

console.log("Original question:");
console.log(currentQuestion);

console.log("\nRewritten query:");
console.log(response.text);