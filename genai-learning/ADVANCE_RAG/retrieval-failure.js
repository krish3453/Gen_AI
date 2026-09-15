import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { QdrantClient } from "@qdrant/js-client-rest";
import { tavily } from "@tavily/core";

dotenv.config();

const client = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

const qdrant = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY
});

const tvly = tavily({
    apiKey: process.env.TAVILY_API_KEY
});

const COLLECTION_NAME = "employee_documents";


const question2 = "my nmae  is John Doe";
const question1 = "How many vacation days do employees receive?";
const question =
    "What is the company's policy for quantum computing research?";


const embeddingResponse =
    await client.models.embedContent({
        model: "gemini-embedding-001",
        contents: question
    });

const queryEmbedding =
    embeddingResponse.embeddings[0].values;

const searchResponse =
    await qdrant.query(
        COLLECTION_NAME,
        {
            query: queryEmbedding,
            limit: 3,
            with_payload: true
        }
    );

console.log("\nRETRIEVAL RESULTS:");
console.log(
    "Number of results:",
    searchResponse.points.length
);



const threshold = 0.50;

if (searchResponse.points.length === 0) {

    console.log(
        "\nRETRIEVAL FAILED: No documents found."
    );

} else {

    const topScore =
        searchResponse.points[0].score;

    console.log(
        "\nTOP SCORE:",
        topScore
    );

    if (topScore < threshold) {

        console.log(
            "\nRETRIEVAL FAILED: Similarity score too low."
        );

    } else {

        const context = searchResponse.points
            .map(result => result.payload.text)
            .join("\n");

        const evaluationPrompt = `
You are a retrieval evaluator.

Determine whether the retrieved documents contain enough
information to answer the user's question.

Question:
${question}

Retrieved documents:
${context}

Return ONLY valid JSON:

{
    "relevant": true
}

Use:
- true if the documents contain information that can answer
  the question
- false if the documents are irrelevant or insufficient.
`;

        const evaluationResponse =
            await client.models.generateContent({
                model: "gemini-3.5-flash-lite",
                contents: evaluationPrompt,
                config: {
                    responseMimeType: "application/json"
                }
            });

        const evaluation =
            JSON.parse(evaluationResponse.text);

        console.log("\nSEMANTIC RETRIEVAL EVALUATION:");
        console.log(evaluation);

        if (evaluation.relevant) {

            console.log(
                "\nRETRIEVAL PASSED: Documents are semantically relevant."
            );

        } else {

            console.log(
                "\nRETRIEVAL FAILED: Documents are semantically irrelevant."
            );

            console.log("\nStarting fallback web search...");

            const webResponse =
                await tvly.search(question);

            if (
                !webResponse.results ||
                webResponse.results.length === 0
            ) {

                console.log(
                    "\nFALLBACK FAILED: No external information found."
                );

            } else {

                console.log(
                    "\nFALLBACK SUCCESSFUL: External documents found."
                );


                const webContext =
                    webResponse.results
                        .slice(0, 3)
                        .map(result => `Title: ${result.title}
                            URL: ${result.url}
                            Content: ${result.content}
                            `)
                        .join("\n");

const webEvaluationPrompt = `
You are a retrieval evaluator.

Determine whether the web search results contain enough
information to answer the user's question.

Question:
${question}

Web search results:
${webContext}

Return ONLY valid JSON:

{
    "relevant": true
}

Use:
- true if the results contain information that can answer
  the question
- false if the results are irrelevant or insufficient.
`;

                const webEvaluationResponse =
                    await client.models.generateContent({
                        model: "gemini-3.5-flash-lite",
                        contents: webEvaluationPrompt,
                        config: {
                            responseMimeType: "application/json"
                        }
                    });

                const webEvaluation =
                    JSON.parse(webEvaluationResponse.text);

                console.log("\nWEB RETRIEVAL EVALUATION:");
                console.log(webEvaluation);

                if (webEvaluation.relevant) {

                    console.log(
                        "\nWEB RETRIEVAL PASSED."
                    );

                } else {

                    console.log(
                        "\nWEB RETRIEVAL FAILED."
                    );

                    console.log(
                        "\nFINAL ANSWER: I don't know based on the available information."
                    );
                }
            }
        }
    }

}