export type ExtractedMemoryFact = {
  key: string;
  value: string;
  displayName: string;
  category: string;
  operation: "upsert" | "delete";
  confidence: number;
};

interface MemoryExtractionResponse {
  success: boolean;
  facts: ExtractedMemoryFact[];
  message?: string;
}

const MEMORY_API_URL =
  "http://localhost:5000/api/memory/extract";

export async function extractMemoryFacts(
  message: string,
  existingFacts: Record<string, string>
): Promise<ExtractedMemoryFact[]> {
  const cleanMessage = message.trim();

  if (!cleanMessage) {
    return [];
  }

  const response = await fetch(
    MEMORY_API_URL,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        message: cleanMessage,
        existingFacts,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Memory extraction failed: ${response.status}`
    );
  }

  const data =
    (await response.json()) as MemoryExtractionResponse;

  if (
    !data.success ||
    !Array.isArray(data.facts)
  ) {
    return [];
  }

  return data.facts;
}