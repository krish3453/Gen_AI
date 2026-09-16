import "dotenv/config";
import { z } from "zod";    
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatPromptTemplate } from "@langchain/core/prompts";



const model = new ChatGoogleGenerativeAI({
    model: "gemini-3.5-flash-lite",
    temperature: 0
});



const ragSchema = z.object({
    topic: z.string(),
    difficulty: z.enum(["easy", "medium", "hard"]),
    summary: z.string()
});



const structuredModel = model.withStructuredOutput(ragSchema);

const prompt = ChatPromptTemplate.fromTemplate(
    "Explain {topic} in simple language."
);

const chain=prompt.pipe(structuredModel);

const response = await chain.invoke({
    topic: "RAG"
});

console.log(response);