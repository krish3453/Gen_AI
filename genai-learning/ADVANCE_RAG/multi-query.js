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



const question = "What are the company's remote work rules?";

const prompt_1 = `
You are a query generation system.

Generate 3 different search queries for the user's question.

Each query should express the same information need
using different wording.

Do not answer the question.
Return only the 3 search queries,
one per line.

User question:
${question}
`;

const response = await client.models.generateContent({
    model: "gemini-3.5-flash-lite",
    contents: prompt_1
});

console.log("Original question:");
console.log(question);

console.log("\nGenerated queries:");
console.log(response.text);

const queries = response.text
    .split("\n")
    .map(query => query.trim())
    .filter(query => query.length > 0);

console.log("\nQueries:");

const allResults = [];

for (const query of queries) {

    console.log("\nSearching for:");
    console.log(query);

    const embeddingResponse =
        await client.models.embedContent({
            model: "gemini-embedding-001",
            contents: query
        });

    const embedding =
        embeddingResponse.embeddings[0].values;

    const searchResponse = await qdrant.query(
        COLLECTION_NAME,
        {
            query: embedding,
            limit: 3,
            with_payload: true
        }
    );

    for (const result of searchResponse.points) {
        allResults.push(result);
    }

    console.log("\nTOTAL RESULTS:", allResults.length);
}

const uniqueResults = new Map();

for (const result of allResults) {

    if (!uniqueResults.has(result.id)) {
        uniqueResults.set(result.id, result);
    } else {
        // If the result already exists, keep the one with the higher score
        const existingResult = uniqueResults.get(result.id);
        if (result.score > existingResult.score) {
            uniqueResults.set(result.id, result);
        }
    }
}

const rankedResults = [...uniqueResults.values()]
    .sort((a, b) => b.score - a.score);

console.log("\nRANKED RESULTS:");

for (const result of rankedResults) {
    console.log("\nID:", result.id);
    console.log("Best Score:", result.score);
    console.log("Text:", result.payload.text);
}


//RERANKING
const candidates = rankedResults.map((result, index) => `
Document ${index + 1}:${result.payload.text}
`).join("\n");

const rerankPrompt = `
You are a document relevance evaluator.

User question:
${question}

Evaluate how relevant each document is to the question.

Give each document a relevance score from 0 to 100.

100 = directly answers the question
0 = completely irrelevant

Documents:
${candidates}

Return a JSON array in exactly this format:

[
  {"document": 1, "score": 100},
  {"document": 2, "score": 0},
  {"document": 3, "score": 0},
  {"document": 4, "score": 0}
]
`;

const rerankResponse = await client.models.generateContent({
    model: "gemini-3.5-flash",
    contents: rerankPrompt,
    config: {
        responseMimeType: "application/json"
    }
});

const rerankScores = JSON.parse(rerankResponse.text);

rankedResults.forEach((result, index) => {
    result.rerankScore = rerankScores[index].score;
});
const rerankedResults = [...rankedResults]
    .sort((a, b) => b.rerankScore - a.rerankScore);
console.log("\nRESULTS WITH RERANK SCORES:");

for (const result of rerankedResults) {

    console.log("\nID:", result.id);
    console.log("Vector Score:", result.score);
    console.log("Rerank Score:", result.rerankScore);
    console.log("Text:", result.payload.text);
}

console.log("\nRERANKER OUTPUT:");
console.log(rerankScores);



//THRESHOLD

const threshold = 50;
const relevantResults = rerankedResults.filter(result => result.rerankScore >= threshold);

console.log("\nRELEVANT RESULTS:");

for (const result of relevantResults) {
    console.log("\nScore:", result.rerankScore);
    console.log("Text:", result.payload.text);
}


const context = relevantResults.map(
    result => result.payload.text
).join("\n");

console.log("\nCONTEXT:");
console.log(context);

const prompt = `
Answer the user's question using only the provided context.

Context:
${context}

Question:
${question}

If the answer is not present in the context,
say "I don't know based on the provided information."

Answer clearly and concisely.
`;

console.log("\nGenerating final answer...");

const respons = await client.models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt
});

console.log("\nFINAL ANSWER:");
console.log(respons.text);