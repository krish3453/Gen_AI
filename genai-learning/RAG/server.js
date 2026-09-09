import express, { text } from "express";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();

app.use(express.json());

const client = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

const history = []



app.post("/ask", async (req, res) => {
    try {
        console.log("1. Request received");

        const { question } = req.body;

        history.push({
            role: "user",
            content: question
        })


        const content = history.map((message) => ({
            role: message.role === "assistant" ? "model" : "user",  
            parts: [{
                text: message.content
            }]
        }));


        const response = await client.models.generateContent({
            model: "gemini-3.7-flash",
            contents: content,
            config: {
                systemInstruction:
                    "Answer the user's question clearly and simply."
            }
        });

        history.push({
            role: "assistant",
            content: response.text
        });

        res.json({
            answer: response.text
        });

    } catch (error) {

        res.status(500).json({
            error: error.message
        });
    }
});

app.get("/", (req, res) => {
    for (let i = 0; i < history.length; i++) {
        console.log(`Role: ${history[i].role}, Content: ${history[i].content}`);
    }
    res.json({
        history: history
    });
});

app.listen(process.env.PORT || 4000, () => {
    console.log(
        `Server is running on port ${process.env.PORT || 4000}`
    );
});