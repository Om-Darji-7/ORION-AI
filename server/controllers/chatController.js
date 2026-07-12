const { askOllama } = require("../services/ollamaService");

async function chat(req, res) {
  try {
    const { message } = req.body;

    // Strict system role definitions passing straight to the cloud stream executor channels
    const systemPrompt = require("../prompts/systemPrompt");
    const formattedPrompt = `${systemPrompt}\n\nUSER: ${message}\n\nIGRIS:`;

    // 1. Establish precise low latency Server Sent Events connection headers mapping
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
    });

    // 2. Await asynchronous cloud engine initialization pipelines
    const streamIterator = await askOllama(formattedPrompt);

    // 3. Loop dynamically through streaming events arriving over cloud network vectors
    for await (const partialChunkObj of streamIterator) {
      const generatedTextToken = partialChunkObj.choices[0]?.delta?.content || "";
      
      if (generatedTextToken) {
        // Write the token to the client connection line
        res.write(`data: ${JSON.stringify({ text: generatedTextToken })}\n\n`);
        
        // Immediate flash system push logic to circumvent Express output delays
        if (res.flush) res.flush();
      }
    }

    // 4. Send termination sentinel signal to frontend reader interfaces
    res.write("data: [DONE]\n\n");
    res.end();

  } catch (err) {
    console.error("Fatal Error inside Groq Chat Pipeline Router:", err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: err.message });
    } else {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    }
  }
}

module.exports = {
  chat,
};
