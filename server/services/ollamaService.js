const Groq = require("groq-sdk");

// ⚠️ IMPORTANT: Apni Groq API Key yahan paste karo ya fir .env file mein GROQ_API_KEY naam se daal do
const groq = new Groq({ apiKey: "ll" });

/**
 * Sends a system prompt and message to Groq Cloud API and returns a live text chunk stream.
 * @param {string} prompt - The compiled message sequence context.
 * @returns {Promise<AsyncIterable>} Dynamic token generation stream loop object.
 */
async function askOllama(prompt) {
  try {
    // Calling Groq's high-speed completion interface engine
    const chatCompletionStream = await groq.chat.completions.create({
      // Llama 3.1 8B Instant market mein sabse fast and low latency text streaming model hai [1]
      model: "llama-3.1-8b-instant", 
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      stream: true, // Forces the cloud router to leak text variables block by block live
    });

    return chatCompletionStream;
  } catch (err) {
    throw new Error(`Groq Cloud Service Error Handshake Disruption: ${err.message}`);
  }
}

module.exports = {
  askOllama,
};
