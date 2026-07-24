const {
  extractMemoryFacts,
} = require(
  "../services/memoryExtractorService"
);

async function extractFacts(req, res) {
  try {
    const {
      message,
      existingFacts = {},
    } = req.body ?? {};

    if (
      typeof message !== "string" ||
      !message.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "A non-empty message is required.",
      });
    }

    const facts =
      await extractMemoryFacts({
        message,
        existingFacts,
      });

    return res.json({
      success: true,
      facts,
    });
  } catch (error) {
    console.error(
      "Memory extraction error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Memory extraction failed.",
      facts: [],
    });
  }
}

module.exports = {
  extractFacts,
};