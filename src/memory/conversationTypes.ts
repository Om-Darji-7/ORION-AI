export type ConversationRole =
  | "user"
  | "assistant";

export type ConversationMessageStatus =
  | "pending"
  | "complete"
  | "interrupted"
  | "failed";

export type ResponseMode =
  | "auto"
  | "concise"
  | "normal"
  | "detailed";

export interface ConversationMessage {
  id: string;
  turnId: string;
  role: ConversationRole;
  content: string;
  createdAt: number;
  status: ConversationMessageStatus;
}

export interface ConversationState {
  version: 1;
  summary: string;
  responseMode: ResponseMode;
  messages: ConversationMessage[];
  updatedAt: number;
}