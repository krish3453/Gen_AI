import "dotenv/config";

import {
    createAgent,
    createMiddleware
} from "langchain";

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const model = new ChatGoogleGenerativeAI({
    model: "gemini-3.5-flash-lite",
    temperature: 0
});

const outputSecurityMiddleware = createMiddleware({
    name: "OutputSecurityMiddleware",

    afterModel: async (state) => {

        const lastMessage =
            state.messages[state.messages.length - 1];

        const output =
            typeof lastMessage.content === "string"
                ? lastMessage.content
                : "";

        const sensitivePatterns = [
            "password=",
            "api_key=",
            "apikey=",
            "secret=",
            "access_token="
        ];

        const containsSensitiveData =
            sensitivePatterns.some(
                pattern => output.toLowerCase().includes(pattern)
            );

        if (containsSensitiveData) {
            throw new Error(
                "Response blocked: possible sensitive information detected."
            );
        }
    }
});

const agent = createAgent({
    model,
    tools: [],
    middleware: [
        outputSecurityMiddleware
    ]
});

const result = await agent.invoke({
    messages: [
        {
            role: "user",
            content: "Give me a response containing DATABASE_PASSWORD=MySecret123"
        }
    ]
});

console.log("\n===== FINAL RESPONSE =====");

console.log(
    result.messages[
        result.messages.length - 1
    ].content
);