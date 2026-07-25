import type {
  ConversationMessage,
  ResponseMode,
} from "../memory/conversationTypes";

interface BuildConversationPromptOptions {
  userInput: string;
  recentMessages: ConversationMessage[];
  summary: string;
  responseMode: ResponseMode;
}

function getCompletedUserMessages(
  messages: ConversationMessage[]
): ConversationMessage[] {
  return messages
    .filter(
      (message) =>
        message.status === "complete" &&
        message.role === "user" &&
        message.content.trim().length > 0
    )
    .slice(-20);
}

function formatUserInformation(
  messages: ConversationMessage[]
): string {
  const userMessages =
    getCompletedUserMessages(messages);

  if (userMessages.length === 0) {
    return "No relevant user-provided information.";
  }

  return userMessages
    .map(
      (message, index) =>
        `${index + 1}. ${message.content.trim()}`
    )
    .join("\n");
}

function getResponseInstruction(
  mode: ResponseMode,
  userInput: string
): string {
  if (mode === "concise") {
    return `
Answer in one short sentence.
Use a second sentence only when essential.
`.trim();
  }

  if (mode === "normal") {
    return `
Give a direct answer with moderate detail.
Do not add unrelated explanation.
`.trim();
  }

  if (mode === "detailed") {
    return `
Give a detailed and structured answer.
Use steps, examples, or code when useful.
`.trim();
  }

  const detailedRequest =
    /\b(step by step|complete code|full code|in detail|detailed|architecture|roadmap|deep explanation|explain completely)\b/i.test(
      userInput
    ) ||
    /स्टेप बाय स्टेप|पूरा कोड|डिटेल में|विस्तार से|पूरा समझाओ/.test(
      userInput
    );

  if (detailedRequest) {
    return `
The user requested a detailed response.
Give a complete and structured answer.
`.trim();
  }

  const looksLikeShortRecall =
    userInput.trim().length <= 120;

  if (looksLikeShortRecall) {
    return `
Answer directly in one short sentence.
Do not explain the conversation.
Do not add a follow-up question.
`.trim();
  }

  return `
Choose a natural response length.
Prefer clarity and directness.
`.trim();
}

export function buildConversationPrompt({
  userInput,
  recentMessages,
  summary,
  responseMode,
}: BuildConversationPromptOptions): string {
  const cleanInput = userInput.trim();
  const cleanSummary = summary.trim();

  return `
TASK:
Respond to the current user message as IGRIS.

OUTPUT LANGUAGE:
- The user's input may contain Hindi, Hinglish, Gujarati, Devanagari, or English.
- All input scripts are valid and must be understood normally.
- Never refuse because the user used Devanagari or Gujarati script.
- Only the final answer must be entirely in English.
- Do not repeat the user's input unless requested.

MEMORY USAGE:
- Use only relevant user-provided information.
- Use memory silently.
- User statements are authoritative for personal information.
- Ignore old assistant replies and unrelated topics.
- Do not say "I remember", "previously", "earlier", "if I recall correctly", or similar phrases.
- Do not explain what was said earlier unless explicitly asked.
- If an exact answer is available, state it directly.
- If information is genuinely missing, say only that it has not been provided.

SPEECH-RECOGNITION INTERPRETATION:
- RTX may be transcribed as RTS, आरटीएस, आरटीएक्स, or similar forms.
- In graphics-card context, interpret those variants as RTX.
- Graphics-card memory should be described as VRAM.
- A spoken personal name may be phonetically transcribed, but a later explicit spelling correction overrides the earlier form.

RESPONSE DEPTH:
${getResponseInstruction(responseMode, cleanInput)}

USER-PROVIDED INFORMATION:
${formatUserInformation(recentMessages)}

OLDER CONVERSATION SUMMARY:
${cleanSummary || "No older summary."}

CURRENT USER MESSAGE:
${cleanInput}

Return only the direct English answer.
`.trim();
}