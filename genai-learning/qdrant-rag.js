import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { QdrantClient } from "@qdrant/js-client-rest";

dotenv.config();

const qdrant = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY
})

const client = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

const COLLECTION_NAME = "employee_documents";

const question = "How many days employee can work from home?";

try {

    // 1. Create embedding for the question
    console.log("Creating question embedding...");

    const response = await client.models.embedContent({
        model: "gemini-embedding-001",
        contents: question
    });

    const queryEmbedding = response.embeddings[0].values;

    // 2. Search in Qdrant
    console.log("Searching Qdrant...");
    const searchResponse = await qdrant.query(
        COLLECTION_NAME,
        {
            query: queryEmbedding,
            limit: 3,
            with_payload: true
        }
    );

    // 3. Display results
    console.log("\nSEARCH RESULTS:");

    for (const result of searchResponse.points) {

        console.log("Score:", result.score);
        console.log("Payload:", result.payload);
        console.log("--------------------");
    }

    //4. create context from the search results
    const context = searchResponse.points
        .map(result => result.payload.text)
        .join("\n");

    console.log("\nCONTEXT:\n", context);



    //5. create prompt for the question and context

    const prompt = `Answer the question using only the provided context
    Context: ${context}
    question: ${question}
    
If the answer is not present in the context,
say "I don't know based on the provided information."

Answer clearly and concisely.`;


//6. Generate answer using the prompt
    console.log("\nGenerating answer...");
    const answer = await client.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt
    });


      console.log("\nFINAL ANSWER:");
    console.log(answer.text);

} catch (error) {

    console.error("RAG failed:");
    console.error(error);
}