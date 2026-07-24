const Groq = require("groq-sdk");

const apiKey = process.env.GROQ_API_KEY;

if (!apiKey) {
  throw new Error(
    "GROQ_API_KEY is missing. Add it to the backend .env file."
  );
}

const groq = new Groq({
  apiKey,
});

const CHAT_MODEL =
  "llama-3.1-8b-instant";

async function askOllama(prompt) {
  if (
    typeof prompt !== "string" ||
    !prompt.trim()
  ) {
    throw new Error(
      "A non-empty prompt is required."
    );
  }

  try {
    return await groq.chat.completions.create({
      model: CHAT_MODEL,

      messages: [
        {
          role: "user",
          content: prompt.trim(),
        },
      ],

      temperature: 0.3,
      stream: true,
    });
  } catch (error) {
    throw new Error(
      `Groq chat service error: ${
        error instanceof Error
          ? error.message
          : "Unknown error"
      }`
    );
  }
}

async function askGroqJson({
  systemPrompt,
  userMessage,
}) {
  if (
    typeof systemPrompt !== "string" ||
    !systemPrompt.trim()
  ) {
    throw new Error(
      "Memory system prompt is required."
    );
  }

  if (
    typeof userMessage !== "string" ||
    !userMessage.trim()
  ) {
    throw new Error(
      "Memory extraction input is required."
    );
  }

  try {
    const completion =
      await groq.chat.completions.create({
        model: CHAT_MODEL,

        messages: [
          {
            role: "system",
            content: systemPrompt.trim(),
          },
          {
            role: "user",
            content: userMessage.trim(),
          },
        ],

        response_format: {
          type: "json_object",
        },

        temperature: 0,
        stream: false,
        max_completion_tokens: 1200,
      });

    const content =
      completion.choices?.[0]?.message
        ?.content;

    if (
      typeof content !== "string" ||
      !content.trim()
    ) {
      throw new Error(
        "Groq returned an empty JSON response."
      );
    }

    return content.trim();
  } catch (error) {
    throw new Error(
      `Groq JSON service error: ${
        error instanceof Error
          ? error.message
          : "Unknown error"
      }`
    );
  }
}

module.exports = {
  askOllama,
  askGroqJson,
};