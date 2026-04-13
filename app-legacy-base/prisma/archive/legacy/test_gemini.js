
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
    try {
        const apiKey = 'AIzaSyBkCOYdb2vJJvLN9HiAdSXH5Iz9E88axH0';
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const result = await model.generateContent("hello");
        console.log("SUCCESS:", result.response.text());
    } catch (e) {
        console.error("ERROR:", e);
    }
}
test();

