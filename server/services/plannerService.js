const axios = require("axios");
const config = require("../config/ollama");

async function decide(userMessage) {

    const prompt = `
You are ORION Planner.

Your job is NOT to answer the user.

Your job is ONLY to decide what should happen.

Available tools:

general
internet
automation
medical
coding
vision
memory
file
image

Return ONLY valid JSON.

Example:

{
  "tool":"internet",
  "reason":"User is asking about recent information."
}

User:

${userMessage}
`;

    const response = await axios.post(

        `${config.baseURL}/api/generate`,

        {
            model: config.model,
            prompt,
            stream:false
        }

    );

    let text=response.data.response.trim();

    text=text.replace(/```json/g,"");
    text=text.replace(/```/g,"");

    return JSON.parse(text);

}

module.exports={

    decide

};