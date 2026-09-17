import "dotenv/config";

import { Document } from "@langchain/core/documents";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { QdrantVectorStore } from "@langchain/qdrant";



const embeddings = new GoogleGenerativeAIEmbeddings({
    model: "gemini-embedding-001",
    apiKey: process.env.GEMINI_API_KEY
});



const vectorStore = await QdrantVectorStore.fromExistingCollection(
    embeddings,
    {
        url: process.env.QDRANT_URL!,
        apiKey: process.env.QDRANT_API_KEY,
        collectionName: "developer_edit_docs"
    }
);



// const results = await vectorStore.similaritySearch(
//     "Why is my Node.js application getting ECONNREFUSED?",
//     1
// );

const retriever = vectorStore.asRetriever({
    k: 2
});

const results = await retriever.invoke(
    "Why is my Node.js application getting ECONNREFUSED?"
);

console.log("\nSEARCH RESULTS:");

for (const doc of results) {
    console.log("\nContent:");
    console.log(doc.pageContent);

    console.log("Metadata:");
    console.log(doc.metadata);
}






// 1. Ingestion

// Use:

// QdrantVectorStore.fromDocuments(...)




// 2. Retrieval

// Once the collection already exists, use:

// QdrantVectorStore.fromExistingCollection(...)

// Then:

// const retriever = vectorStore.asRetriever({
//     k: 2
// });