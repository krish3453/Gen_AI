import dotenv from "dotenv";
import { QdrantClient } from "@qdrant/js-client-rest";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const qdrant = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY
});

const client = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

const COLLECTION_NAME = "employee_documents";

try {

    // 1. Check Qdrant connection
    const collections = await qdrant.getCollections();

    console.log("Connected to Qdrant successfully.");
    console.log("Collections:", collections);


    // // 2. Create collection
    // await qdrant.createCollection(
    //     COLLECTION_NAME,
    //     {
    //         vectors: {
    //             size: 3072,
    //             distance: "Cosine"
    //         }
    //     }
    // );

    // console.log("Collection created successfully.");


    // 3. Our documents
    const documents = [
        "Employees receive 20 days of paid annual leave.",
        "Employees can work remotely two days per week.",
        "The company provides health insurance to full-time employees.",
        "Employees must submit leave requests to their manager."
    ];


    // 4. Store Qdrant points
    const points = [];


    // 5. Create embeddings
    for (let i = 0; i < documents.length; i++) {

        const document = documents[i];

        console.log(`Creating embedding for document ${i + 1}...`);

        const response = await client.models.embedContent({
            model: "gemini-embedding-001",
            contents: document
        });

        const embedding = response.embeddings[0].values;


        // 6. Create Qdrant point
        points.push({
            id: i + 1,

            vector: embedding,

            payload: {
                text: document
            }
        });
    }


    // 7. Upload points to Qdrant
    console.log("Uploading documents to Qdrant...");

    await qdrant.upsert(
        COLLECTION_NAME,
        {
            points: points
        }
    );


    console.log("Documents uploaded successfully!");

} catch (error) {

    console.error("Qdrant operation failed:");
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