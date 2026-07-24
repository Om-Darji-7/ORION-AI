const {
  askGroqJson,
} = require("./ollamaService");

const memoryExtractionPrompt =
  require("../prompts/memoryExtractionPrompt");

const ALLOWED_CATEGORIES = new Set([
  "personal",
  "person",
  "preference",
  "device",
  "project",
  "skill",
  "routine",
  "goal",
  "work",
  "education",
  "location",
  "other",
]);

const ALLOWED_OPERATIONS = new Set([
  "upsert",
  "delete",
]);

const FACT_KEY_PATTERN =
  /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;

const MAX_FACTS_PER_MESSAGE = 12;

function cleanText(value, maxLength) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function normalizeExistingFacts(
  existingFacts
) {
  if (
    !existingFacts ||
    typeof existingFacts !== "object" ||
    Array.isArray(existingFacts)
  ) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(existingFacts)
      .filter(
        ([key, value]) =>
          typeof key === "string" &&
          typeof value === "string"
      )
      .slice(0, 100)
      .map(([key, value]) => [
        cleanText(key, 150),
        cleanText(value, 500),
      ])
      .filter(
        ([key, value]) =>
          key.length > 0 &&
          value.length > 0
      )
  );
}

function validateFact(candidate) {
  if (
    !candidate ||
    typeof candidate !== "object" ||
    Array.isArray(candidate)
  ) {
    return null;
  }

  const key = cleanText(
    candidate.key,
    150
  ).toLowerCase();

  const operation =
    ALLOWED_OPERATIONS.has(
      candidate.operation
    )
      ? candidate.operation
      : "upsert";

  const category =
    ALLOWED_CATEGORIES.has(
      candidate.category
    )
      ? candidate.category
      : "other";

  const displayName =
    cleanText(
      candidate.displayName,
      150
    ) || key;

  const confidence =
    typeof candidate.confidence ===
      "number" &&
    Number.isFinite(candidate.confidence)
      ? Math.min(
          1,
          Math.max(
            0,
            candidate.confidence
          )
        )
      : 0;

  const value =
    operation === "delete"
      ? ""
      : cleanText(
          candidate.value,
          1000
        );

  if (
    !key ||
    !FACT_KEY_PATTERN.test(key)
  ) {
    return null;
  }

  if (
    operation === "upsert" &&
    !value
  ) {
    return null;
  }

  /*
    Low-confidence facts are rejected instead
    of silently polluting memory.
  */
  if (confidence < 0.75) {
    return null;
  }

  return {
    key,
    value,
    displayName,
    category,
    operation,
    confidence,
  };
}

function parseAndValidateResponse(
  rawResponse
) {
  let parsed;

  try {
    parsed = JSON.parse(rawResponse);
  } catch {
    throw new Error(
      "Memory extractor returned invalid JSON."
    );
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    !Array.isArray(parsed.facts)
  ) {
    throw new Error(
      "Memory extractor returned an invalid facts structure."
    );
  }

  const uniqueFacts = new Map();

  for (
    const candidate of parsed.facts.slice(
      0,
      MAX_FACTS_PER_MESSAGE
    )
  ) {
    const validated =
      validateFact(candidate);

    if (!validated) continue;

    /*
      Latest fact with the same key wins inside
      a single extraction response.
    */
    uniqueFacts.set(
      validated.key,
      validated
    );
  }

  return Array.from(
    uniqueFacts.values()
  );
}

async function extractMemoryFacts({
  message,
  existingFacts = {},
}) {
  const cleanMessage =
    cleanText(message, 6000);

  if (!cleanMessage) {
    return [];
  }

  const safeExistingFacts =
    normalizeExistingFacts(
      existingFacts
    );

  const extractionInput = `
EXISTING MEMORY FACTS:
${JSON.stringify(
  safeExistingFacts,
  null,
  2
)}

CURRENT USER MESSAGE:
${cleanMessage}

Extract durable facts from the current user message.
Reuse an existing semantic key when the message updates or corrects that fact.
Return JSON only.
`.trim();

  const rawResponse =
    await askGroqJson({
      systemPrompt:
        memoryExtractionPrompt,
      userMessage: extractionInput,
    });

  return parseAndValidateResponse(
    rawResponse
  );
}

module.exports = {
  extractMemoryFacts,
};