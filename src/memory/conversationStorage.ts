import type {
  ConversationMessage,
  ConversationState,
  ResponseMode,
} from "./conversationTypes";

const STORAGE_KEY = "igris_conversation_v1";

const DEFAULT_RESPONSE_MODE: ResponseMode =
  "auto";

function createDefaultState(): ConversationState {
  return {
    version: 1,
    summary: "",
    responseMode: DEFAULT_RESPONSE_MODE,
    messages: [],
    updatedAt: Date.now(),
  };
}

function isValidMessage(
  value: unknown
): value is ConversationMessage {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  const message =
    value as Partial<ConversationMessage>;

  return (
    typeof message.id === "string" &&
    typeof message.turnId === "string" &&
    (
      message.role === "user" ||
      message.role === "assistant"
    ) &&
    typeof message.content === "string" &&
    typeof message.createdAt === "number" &&
    (
      message.status === "pending" ||
      message.status === "complete" ||
      message.status === "interrupted" ||
      message.status === "failed"
    )
  );
}

function isValidResponseMode(
  value: unknown
): value is ResponseMode {
  return (
    value === "auto" ||
    value === "concise" ||
    value === "normal" ||
    value === "detailed"
  );
}

function isValidConversationState(
  value: unknown
): value is ConversationState {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  const state =
    value as Partial<ConversationState>;

  return (
    state.version === 1 &&
    typeof state.summary === "string" &&
    isValidResponseMode(state.responseMode) &&
    Array.isArray(state.messages) &&
    state.messages.every(isValidMessage) &&
    typeof state.updatedAt === "number"
  );
}

export function loadConversationState():
  ConversationState {
  if (typeof window === "undefined") {
    return createDefaultState();
  }

  try {
    const storedValue =
      window.localStorage.getItem(STORAGE_KEY);

    if (!storedValue) {
      return createDefaultState();
    }

    const parsedValue: unknown =
      JSON.parse(storedValue);

    if (!isValidConversationState(parsedValue)) {
      console.warn(
        "🧠 Invalid conversation memory detected. Starting clean."
      );

      window.localStorage.removeItem(
        STORAGE_KEY
      );

      return createDefaultState();
    }

    return parsedValue;
  } catch (error) {
    console.error(
      "🧠 Failed to load conversation memory:",
      error
    );

    return createDefaultState();
  }
}

export function saveConversationState(
  state: ConversationState
): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...state,
        updatedAt: Date.now(),
      })
    );
  } catch (error) {
    console.error(
      "🧠 Failed to save conversation memory:",
      error
    );
  }
}

export function clearConversationStorage(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(
      STORAGE_KEY
    );
  } catch (error) {
    console.error(
      "🧠 Failed to clear conversation storage:",
      error
    );
  }
}

export function getEmptyConversationState():
  ConversationState {
  return createDefaultState();
}