import type {
  FactMemoryState,
  MemoryFact,
} from "./factTypes";

const FACT_STORAGE_KEY =
  "igris_facts_v1";

function createEmptyFactState():
  FactMemoryState {
  return {
    version: 1,
    facts: {},
    updatedAt: Date.now(),
  };
}

function isValidFact(
  value: unknown
): value is MemoryFact {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  const fact =
    value as Partial<MemoryFact>;

  return (
    typeof fact.key === "string" &&
    typeof fact.value === "string" &&
    typeof fact.displayName === "string" &&
    (
      fact.confidence ===
        "user-confirmed" ||
      fact.confidence === "inferred" ||
      fact.confidence === "uncertain"
    ) &&
    typeof fact.sourceText === "string" &&
    typeof fact.createdAt === "number" &&
    typeof fact.updatedAt === "number"
  );
}

function isValidFactState(
  value: unknown
): value is FactMemoryState {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  const state =
    value as Partial<FactMemoryState>;

  if (
    state.version !== 1 ||
    typeof state.updatedAt !== "number" ||
    typeof state.facts !== "object" ||
    state.facts === null
  ) {
    return false;
  }

  return Object.values(
    state.facts
  ).every(isValidFact);
}

export function loadFactState():
  FactMemoryState {
  if (typeof window === "undefined") {
    return createEmptyFactState();
  }

  try {
    const stored =
      window.localStorage.getItem(
        FACT_STORAGE_KEY
      );

    if (!stored) {
      return createEmptyFactState();
    }

    const parsed: unknown =
      JSON.parse(stored);

    if (!isValidFactState(parsed)) {
      console.warn(
        "🧠 Invalid fact memory found. Resetting facts."
      );

      window.localStorage.removeItem(
        FACT_STORAGE_KEY
      );

      return createEmptyFactState();
    }

    return parsed;
  } catch (error) {
    console.error(
      "🧠 Failed to load fact memory:",
      error
    );

    return createEmptyFactState();
  }
}

export function saveFactState(
  state: FactMemoryState
): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      FACT_STORAGE_KEY,
      JSON.stringify({
        ...state,
        updatedAt: Date.now(),
      })
    );
  } catch (error) {
    console.error(
      "🧠 Failed to save fact memory:",
      error
    );
  }
}

export function clearFactStorage():
  void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(
      FACT_STORAGE_KEY
    );
  } catch (error) {
    console.error(
      "🧠 Failed to clear fact memory:",
      error
    );
  }
}

export function getEmptyFactState():
  FactMemoryState {
  return createEmptyFactState();
}