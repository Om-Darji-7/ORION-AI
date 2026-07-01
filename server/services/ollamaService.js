const axios = require("axios");
const config = require("../config/ollama");

async function askOllama(prompt) {
  try {
    const response = await axios.post(
      `${config.baseURL}/api/generate`,
      {
        model: config.model,
        prompt,
        stream: false,
      }
    );

    return response.data.response;
  } catch (error) {
    console.error(error.message);
    throw new Error("Unable to reach ORION Brain");
  }
}

module.exports = {
  askOllama,
};