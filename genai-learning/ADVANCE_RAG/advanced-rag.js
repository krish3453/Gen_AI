import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { QdrantClient } from "@qdrant/js-client-rest";

dotenv.config();

const client = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

const qdrant = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY
});

const COLLECTION_NAME = "employee_documents";

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

const rewrittenQuery = response.text.trim();

console.log("\nRewritten query:");
console.log(rewrittenQuery);

const embeddingResponse = await client.models.embedContent({
    model: "gemini-embedding-001",
    contents: rewrittenQuery
});

const queryEmbedding =
    embeddingResponse.embeddings[0].values;

console.log("\nEmbedding created!");
console.log("Embedding dimensions:", queryEmbedding.length);

const searchResponse = await qdrant.query(
    COLLECTION_NAME,
    {
        query:queryEmbedding,
        limit:3,
        with_payload:true
    }
)

console.log("\nSearch results:");
for (const result of searchResponse.points) {
    console.log("Score:", result.score);
    console.log("Text:", result.payload.text);
    console.log("--------------------");
}

const threshold=0.7
const relevantResults = searchResponse.points.filter(result => result.score >= threshold);

console.log("\nRelevant results:");

for (const result of relevantResults) {
    console.log("Score:", result.score);
    console.log("Text:", result.payload.text);
    console.log("--------------------");
}

const contextParts = relevantResults.map(
    result => result.payload.text
);

const context = contextParts.join("\n");

console.log("\nCONTEXT:");
console.log(context);

const prompt_F = `
Answer the question using only the provided context.

Context:
${context}

Question:
${currentQuestion}

If the answer is not present in the context,
say "I don't know based on the provided information."

Answer clearly and concisely.
`;

const respons = await client.models.generateContent({
    model: "gemini-3.5-flash-lite",
    contents: prompt_F
});

console.log("\nFinal Answer:");
console.log(respons.text);