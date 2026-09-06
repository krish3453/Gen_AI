import dotenv from "dotenv";
import { QdrantClient } from "@qdrant/js-client-rest";
dotenv.config();

const qdrant = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY
});
const COLLECTION_NAME = "employee_documents";

try {
    const collections = await qdrant.getCollections();
    console.log("connected to Qdrant successfully.");
    console.log("Collections:", collections);

    
    await qdrant.createCollection(
        COLLECTION_NAME,
        {
            vectors: {
                size: 3072,
                distance: "Cosine"
            }
        }
    );

    console.log(`Collection "${COLLECTION_NAME}" created successfully.`);

} catch (error) {
    console.error("Qdrant connection failed:");
    console.error(error);
}


// import dotenv from "dotenv";
// import { GoogleGenAI } from "@google/genai";

// dotenv.config();

// const client = new GoogleGenAI({
//     apiKey: process.env.GEMINI_API_KEY
// });

// const response = await client.models.embedContent({
//     model: "gemini-embedding-001",
//     contents: "hello"
// });

// const embedding = response.embeddings[0].values;

// console.log("Embedding:");
// console.log(embedding);

// console.log("Embedding dimension:");
// console.log(embedding.length);