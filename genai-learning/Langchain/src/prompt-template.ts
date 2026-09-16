import "dotenv/config";

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatPromptTemplate } from "@langchain/core/prompts";

const model = new ChatGoogleGenerativeAI({
    model: "gemini-3.5-flash-lite",
    temperature: 0
});

const prompt = ChatPromptTemplate.fromMessages([
    [
        "system",
        "You are a {role}. Explain concepts in very simple language."
    ],
    [
        "human",
        "Explain {topic}."
    ]
]);

const messages = await prompt.invoke({
    role: "baby",
    topic: "RAG"
});

const response = await model.invoke(messages);

console.log(response);