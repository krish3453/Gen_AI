import "dotenv/config";

import fs from "node:fs";
import { PDFParse } from "pdf-parse";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { QdrantVectorStore } from "@langchain/qdrant";


const pdfBuffer = fs.readFileSync(
    "docs/Redis_Info.pdf"
);


const parser = new PDFParse({
    data: pdfBuffer
});



const result = await parser.getText();



console.log("\nNUMBER OF PAGES:");
console.log(result.total);



const documents: Document[] = result.pages.map(
    (page) =>
        new Document({
            pageContent: page.text,

            metadata: {
                source: "docs/Redis_Info.pdf",
                page: page.num
            }
        })
);


console.log("\nLANGCHAIN DOCUMENTS:");
console.log(documents.length);


// console.log("\nFIRST DOCUMENT:");
// console.log(documents[0]);


// console.log("\nFIRST PAGE CONTENT:");
// console.log(documents[0].pageContent);


// console.log("\nFIRST PAGE METADATA:");
// console.log(documents[0].metadata);

const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 50
});

const chunks = await splitter.splitDocuments(documents);

// console.log("\nNUMBER OF CHUNKS:");
// console.log(chunks.length);

// for (let i = 0; i < Math.min(chunks.length,5); i++) {
//     console.log(`\n--- CHUNK ${i + 1} ---`);
//     console.log(chunks[i].pageContent);

//     console.log("\nMETADATA:");
//     console.log(chunks[i].metadata);
// }



const embeddings = new GoogleGenerativeAIEmbeddings({
    model: "gemini-embedding-001",
    apiKey: process.env.GEMINI_API_KEY
});

await QdrantVectorStore.fromDocuments(
    chunks,
    embeddings,
    {
        url: process.env.QDRANT_URL!,
        apiKey: process.env.QDRANT_API_KEY,
        collectionName: "redis_langchain_docs"
    }
);

console.log(
    "\nChunks successfully stored in Qdrant."
);
await parser.destroy();