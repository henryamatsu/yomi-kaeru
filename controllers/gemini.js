import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

console.log(process.env.API_KEY);

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

async function run() {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt =
    `Take the following sentence, and return it to me in English, but just translate the word "ate" into Japanese: The boy ate a red apple`

    const tokenCount = await model.countTokens({ contents: [{ parts: [{ text: prompt }] }] });

    console.log("Token Count:", tokenCount);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log(text);
}

run();
