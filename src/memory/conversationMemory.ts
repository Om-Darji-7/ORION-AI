import type {
  ConversationMessage,
  ConversationState,
  ResponseMode,
} from "./conversationTypes";

import {
  clearConversationStorage,
  getEmptyConversationState,
  loadConversationState,
  saveConversationState,
} from "./conversationStorage";

const MAX_STORED_MESSAGES = 50;
const DEFAULT_CONTEXT_MESSAGES = 16;

function createId(prefix: string): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

class ConversationMemory {
  private state: ConversationState;

  constructor() {
    this.state = loadConversationState();

    this.recoverIncompleteTurns();

    saveConversationState(this.state);

    console.log(
      `🧠 Conversation memory loaded: ${this.state.messages.length} messages`
    );
  }

  private persist(): void {
    this.state.updatedAt = Date.now();

    saveConversationState(this.state);
  }

  private recoverIncompleteTurns(): void {
    let changed = false;

    this.state.messages =
      this.state.messages.map((message) => {
        if (message.status !== "pending") {
          return message;
        }

        changed = true;

        return {
          ...message,
          status: "interrupted",
        };
      });

    if (changed) {
      this.persist();
    }
  }

  private trimStoredMessages(): void {
    if (
      this.state.messages.length <=
      MAX_STORED_MESSAGES
    ) {
      return;
    }

    this.state.messages =
      this.state.messages.slice(
        -MAX_STORED_MESSAGES
      );
  }

  public startTurn(userInput: string): string {
    const cleanInput = userInput.trim();

    if (!cleanInput) {
      throw new Error(
        "Cannot create a conversation turn with empty input."
      );
    }

    const turnId = createId("turn");

    const userMessage: ConversationMessage = {
      id: createId("message"),
      turnId,
      role: "user",
      content: cleanInput,
      createdAt: Date.now(),
      status: "pending",
    };

    this.state.messages.push(userMessage);

    this.trimStoredMessages();
    this.persist();

    console.log(
      "🧠 Conversation turn started:",
      turnId
    );

    return turnId;
  }

  public completeTurn(
    turnId: string,
    assistantResponse: string
  ): void {
    const cleanResponse =
      assistantResponse.trim();

    if (!cleanResponse) {
      this.failTurn(turnId);

      return;
    }

    let userMessageFound = false;

    this.state.messages =
      this.state.messages.map((message) => {
        if (
          message.turnId === turnId &&
          message.role === "user"
        ) {
          userMessageFound = true;

          return {
            ...message,
            status: "complete",
          };
        }

        return message;
      });

    if (!userMessageFound) {
      console.warn(
        "🧠 Cannot complete missing conversation turn:",
        turnId
      );

      return;
    }

    const assistantMessage:
      ConversationMessage = {
        id: createId("message"),
        turnId,
        role: "assistant",
        content: cleanResponse,
        createdAt: Date.now(),
        status: "complete",
      };

    this.state.messages.push(
      assistantMessage
    );

    this.trimStoredMessages();
    this.persist();

    console.log(
      "🧠 Conversation turn completed:",
      turnId
    );
  }

  public interruptTurn(
    turnId: string,
    partialResponse = ""
  ): void {
    this.markTurnStatus(
      turnId,
      "interrupted"
    );

    const cleanPartialResponse =
      partialResponse.trim();

    if (cleanPartialResponse) {
      this.state.messages.push({
        id: createId("message"),
        turnId,
        role: "assistant",
        content: cleanPartialResponse,
        createdAt: Date.now(),
        status: "interrupted",
      });
    }

    this.trimStoredMessages();
    this.persist();

    console.log(
      "🧠 Conversation turn interrupted:",
      turnId
    );
  }

  public failTurn(turnId: string): void {
    this.markTurnStatus(turnId, "failed");

    console.log(
      "🧠 Conversation turn failed:",
      turnId
    );
  }

  private markTurnStatus(
    turnId: string,
    status: "interrupted" | "failed"
  ): void {
    this.state.messages =
      this.state.messages.map((message) => {
        if (message.turnId !== turnId) {
          return message;
        }

        return {
          ...message,
          status,
        };
      });

    this.persist();
  }

  public getRecentMessages(
    limit = DEFAULT_CONTEXT_MESSAGES
  ): ConversationMessage[] {
    const safeLimit = Math.max(
      1,
      Math.floor(limit)
    );

    return this.state.messages
      .filter(
        (message) =>
          message.status === "complete"
      )
      .slice(-safeLimit)
      .map((message) => ({
        ...message,
      }));
  }

  public getAllMessages():
    ConversationMessage[] {
    return this.state.messages.map(
      (message) => ({
        ...message,
      })
    );
  }

  public getSummary(): string {
    return this.state.summary;
  }

  public setSummary(summary: string): void {
    this.state.summary = summary.trim();

    this.persist();
  }

  public getResponseMode(): ResponseMode {
    return this.state.responseMode;
  }

  public setResponseMode(
    mode: ResponseMode
  ): void {
    this.state.responseMode = mode;

    this.persist();

    console.log(
      "🧠 Response mode changed:",
      mode
    );
  }

  public clearConversation(): void {
    const responseMode =
      this.state.responseMode;

    clearConversationStorage();

    this.state =
      getEmptyConversationState();

    // Preserve response preference when only
    // conversation history is cleared.
    this.state.responseMode = responseMode;

    this.persist();

    console.log(
      "🧠 Conversation memory cleared."
    );
  }

  public getDebugState(): ConversationState {
    return {
      ...this.state,
      messages: this.getAllMessages(),
    };
  }
}

export const conversationMemory =
  new ConversationMemory();