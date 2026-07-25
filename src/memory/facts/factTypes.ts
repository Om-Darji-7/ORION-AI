export type FactConfidence =
  | "user-confirmed"
  | "inferred"
  | "uncertain";

export interface MemoryFact {
  key: string;
  value: string;

  displayName: string;

  confidence: FactConfidence;

  sourceText: string;

  createdAt: number;
  updatedAt: number;
}

export interface FactMemoryState {
  version: 1;

  facts: Record<string, MemoryFact>;

  updatedAt: number;
}