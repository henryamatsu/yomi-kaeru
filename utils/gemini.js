const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config({ path: "./config/.env" });

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

module.exports = {
    run: async (eligibleData) => {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
        let prompt =
        `Take the following array of objects. For each object, look through the eligibleWords array and find each word in the string within the sentence property. Translate each word into a Japanese word that fits the sentence context. Your output should be a JSON array in the following format (don’t provide any other text in your response): { words: [{ japanese: (translated Japanese word and nothing else), english: (original English word), romaji: (romaji), wordIndex: (the original wordIndex) }], sentence: (the original English sentence, with all eligible words translated to Japanese), sentenceIndex: (the original sentenceIndex) } The input array: `

        prompt += JSON.stringify(eligibleData);
    
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        text = text.replace("```json", "").replace("```", "");

        return text;
    }
}

