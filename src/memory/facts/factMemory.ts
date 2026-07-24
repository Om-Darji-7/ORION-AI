import type {
  FactConfidence,
  FactMemoryState,
  MemoryFact,
} from "./factTypes";

import {
  clearFactStorage,
  getEmptyFactState,
  loadFactState,
  saveFactState,
} from "./factStorage";

interface SetFactInput {
  key: string;
  value: string;
  displayName?: string;
  confidence?: FactConfidence;
  sourceText?: string;
}

class FactMemory {
  private state: FactMemoryState;

  constructor() {
    this.state = loadFactState();

    saveFactState(this.state);

    console.log(
      `🧠 Fact memory loaded: ${
        Object.keys(this.state.facts)
          .length
      } facts`
    );
  }

  private persist(): void {
    this.state.updatedAt = Date.now();

    saveFactState(this.state);
  }

  private normalizeKey(
    key: string
  ): string {
    return key
      .trim()
      .replace(/\s+/g, "")
      .replace(
        /^./,
        (character) =>
          character.toLowerCase()
      );
  }

  public setFact({
    key,
    value,
    displayName,
    confidence =
      "user-confirmed",
    sourceText = "",
  }: SetFactInput): MemoryFact {
    const normalizedKey =
      this.normalizeKey(key);

    const cleanValue = value.trim();

    if (!normalizedKey) {
      throw new Error(
        "Fact key cannot be empty."
      );
    }

    if (!cleanValue) {
      throw new Error(
        "Fact value cannot be empty."
      );
    }

    const existing =
      this.state.facts[normalizedKey];

    const now = Date.now();

    const fact: MemoryFact = {
      key: normalizedKey,
      value: cleanValue,

      displayName:
        displayName?.trim() ||
        existing?.displayName ||
        normalizedKey,

      confidence,

      sourceText:
        sourceText.trim() ||
        existing?.sourceText ||
        "",

      createdAt:
        existing?.createdAt ?? now,

      updatedAt: now,
    };

    this.state.facts[normalizedKey] =
      fact;

    this.persist();

    console.log(
      `🧠 Fact saved: ${normalizedKey} = ${cleanValue}`
    );

    return {
      ...fact,
    };
  }

  public getFact(
    key: string
  ): MemoryFact | null {
    const normalizedKey =
      this.normalizeKey(key);

    const fact =
      this.state.facts[normalizedKey];

    return fact
      ? {
          ...fact,
        }
      : null;
  }

  public getFactValue(
    key: string
  ): string | null {
    return (
      this.getFact(key)?.value ?? null
    );
  }

  public hasFact(
    key: string
  ): boolean {
    return this.getFact(key) !== null;
  }

  public removeFact(
    key: string
  ): boolean {
    const normalizedKey =
      this.normalizeKey(key);

    if (
      !this.state.facts[
        normalizedKey
      ]
    ) {
      return false;
    }

    delete this.state.facts[
      normalizedKey
    ];

    this.persist();

    console.log(
      "🧠 Fact removed:",
      normalizedKey
    );

    return true;
  }

  public getAllFacts():
    MemoryFact[] {
    return Object.values(
      this.state.facts
    )
      .sort(
        (first, second) =>
          second.updatedAt -
          first.updatedAt
      )
      .map((fact) => ({
        ...fact,
      }));
  }

  public getFactsRecord():
    Record<string, string> {
    return Object.fromEntries(
      Object.values(
        this.state.facts
      ).map((fact) => [
        fact.key,
        fact.value,
      ])
    );
  }

  public clearFacts(): void {
    clearFactStorage();

    this.state =
      getEmptyFactState();

    this.persist();

    console.log(
      "🧠 All structured facts cleared."
    );
  }

  public getDebugState():
    FactMemoryState {
    return {
      ...this.state,

      facts: Object.fromEntries(
        Object.entries(
          this.state.facts
        ).map(([key, fact]) => [
          key,
          {
            ...fact,
          },
        ])
      ),
    };
  }
}



export const factMemory =
  new FactMemory();