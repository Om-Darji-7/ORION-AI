import type { ResponseMode } from "./conversationTypes";

export type ConversationCommand =
  | {
      type: "clear-conversation";
    }
  | {
      type: "conversation-summary";
    }
  | {
      type: "set-response-mode";
      mode: ResponseMode;
    }
  | {
      type: "none";
    };

function normalizeCommand(text: string): string {
  return text
    .normalize("NFC")
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function includesAny(
  command: string,
  patterns: string[]
): boolean {
  return patterns.some((pattern) =>
    command.includes(normalizeCommand(pattern))
  );
}

export function detectConversationCommand(
  input: string
): ConversationCommand {
  const command = normalizeCommand(input);

 const clearActionWords = [
  "clear",
  "reset",
  "forget",
  "delete",
  "क्लियर",
  "रीसेट",
  "साफ",
  "भूल",
  "डिलीट",
];

const conversationTargetWords = [
  "conversation",
  "chat",
  "memory",
  "history",
  "कन्वर्सेशन",
  "चैट",
  "मेमोरी",
  "हिस्ट्री",
  "बातचीत",
];

const hasClearAction = clearActionWords.some(
  (word) =>
    command.includes(normalizeCommand(word))
);

const hasConversationTarget =
  conversationTargetWords.some(
    (word) =>
      command.includes(normalizeCommand(word))
  );

if (hasClearAction && hasConversationTarget) {
  return {
    type: "clear-conversation",
  };
}

  const summaryPatterns = [
    "what were we discussing",
    "what did we discuss",
    "summarize our conversation",
    "summarize the conversation",
    "what did i say earlier",
    "what were we talking about",
    "हम क्या बात कर रहे थे",
    "हमने क्या बात की",
    "बातचीत का सार बताओ",
    "पहले मैंने क्या कहा था",
  ];

  if (includesAny(command, summaryPatterns)) {
    return {
      type: "conversation-summary",
    };
  }

  const autoPatterns = [
  "automatic response mode",
  "auto response mode",
  "use automatic mode",
  "decide response length yourself",
  "decide answer length yourself",
  "automatic mode",
  "ऑटो मोड",
  "ऑटोमेटिक मोड",
  "जवाब की लंबाई खुद तय करो",
];

if (includesAny(command, autoPatterns)) {
  return {
    type: "set-response-mode",
    mode: "auto",
  };
}

  const concisePatterns = [
    "keep answers short",
    "keep your answers short",
    "answer briefly",
    "be concise",
    "concise mode",
    "short answers",
    "छोटा जवाब दो",
    "जवाब छोटा रखो",
    "कम शब्दों में जवाब दो",
  ];

  if (includesAny(command, concisePatterns)) {
    return {
      type: "set-response-mode",
      mode: "concise",
    };
  }

  const detailedPatterns = [
    "explain in detail",
    "give detailed answers",
    "detailed mode",
    "answer in detail",
    "give complete explanation",
    "डिटेल में बताओ",
    "विस्तार से बताओ",
    "पूरा समझाओ",
    "डिटेल जवाब दो",
  ];

  if (includesAny(command, detailedPatterns)) {
    return {
      type: "set-response-mode",
      mode: "detailed",
    };
  }

  const normalPatterns = [
    "normal response mode",
    "use normal responses",
    "normal answers",
    "answer normally",
    "normal mode",
    "नॉर्मल जवाब दो",
    "सामान्य जवाब दो",
    "नॉर्मल मोड",
  ];

  if (includesAny(command, normalPatterns)) {
    return {
      type: "set-response-mode",
      mode: "normal",
    };
  }

  return {
    type: "none",
  };
}