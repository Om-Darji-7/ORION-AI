const {
  askOllama,
} = require("../services/ollamaService");

const systemPrompt = require(
  "../prompts/systemPrompt"
);

async function chat(req, res) {
  try {
    const message =
      typeof req.body?.message === "string"
        ? req.body.message.trim()
        : "";

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required.",
      });
    }

    /*
      The frontend message already contains:
      - conversation memory
      - response-depth instructions
      - current user message

      The backend system rules remain highest priority.
    */
    const formattedPrompt = `
${systemPrompt}

ASSISTANT TASK CONTEXT:
${message}

IGRIS FINAL ENGLISH RESPONSE:
`.trim();

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    });

    const streamIterator =
      await askOllama(formattedPrompt);

    for await (const partialChunkObj of streamIterator) {
      const generatedTextToken =
        partialChunkObj?.choices?.[0]?.delta
          ?.content ?? "";

      if (!generatedTextToken) continue;

      res.write(
        `data: ${JSON.stringify({
          text: generatedTextToken,
        })}\n\n`
      );

      if (typeof res.flush === "function") {
        res.flush();
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
    console.error(
      "Fatal error inside IGRIS chat pipeline:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unknown server error.";

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message,
      });

      return;
    }

    res.write(
      `data: ${JSON.stringify({
        error: message,
      })}\n\n`
    );

    res.end();
  }
}

module.exports = {
  chat,
};