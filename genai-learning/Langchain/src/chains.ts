import "dotenv/config";

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

const model = new ChatGoogleGenerativeAI({
    model: "gemini-3.5-flash-lite",
    temperature: 0
});

const outputParser = new StringOutputParser();

const prompt = ChatPromptTemplate.fromTemplate(
    "Explain {topic} in simple language."
);

const chain=prompt.pipe(model).pipe(outputParser);



const response=await chain.invoke({
    topic: "RAG"
});

console.log(response);


//A chain connects multiple LangChain components,
//  and .pipe() passes the output of one component into the next.