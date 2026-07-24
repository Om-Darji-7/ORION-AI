import type {
  ConversationMessage,
  ResponseMode,
} from "../memory/conversationTypes";

import { buildConversationPrompt } from "./conversationPrompt";

interface EnglishResponseOptions {
  recentMessages?: ConversationMessage[];
  summary?: string;
  responseMode?: ResponseMode;
}

export function createEnglishResponseInstruction(
  userInput: string,
  options: EnglishResponseOptions = {}
): string {
  return buildConversationPrompt({
    userInput,
    recentMessages:
      options.recentMessages ?? [],
    summary: options.summary ?? "",
    responseMode:
      options.responseMode ?? "normal",
  });
}