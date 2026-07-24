export interface ExtractedFact {
  key: string;
  value: string;
  displayName: string;
  sourceText: string;
}

function normalizeInput(text: string): string {
  return text
    .normalize("NFC")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function extractGraphicsCard(
  input: string
): ExtractedFact[] {
  const normalized = normalizeInput(input);

  const hasGraphicsContext =
    /graphics card|graphic card|gpu|ग्राफिक कार्ड|जीपीयू/.test(
      normalized
    );

  if (!hasGraphicsContext) {
    return [];
  }

  const modelMatch = normalized.match(
    /(?:rtx|rts|आरटीएस|आरटीएक्स)\s*[- ]?(\d{3,4})/i
  );

  const memoryMatch = normalized.match(
    /(\d+)\s*gb/i
  );

  const facts: ExtractedFact[] = [];

  if (modelMatch) {
    facts.push({
      key: "graphicsCard",
      value: `NVIDIA GeForce RTX ${modelMatch[1]}`,
      displayName: "Graphics card",
      sourceText: input,
    });
  }

  if (memoryMatch) {
    facts.push({
      key: "graphicsMemory",
      value: `${memoryMatch[1]} GB VRAM`,
      displayName: "Graphics memory",
      sourceText: input,
    });
  }

  return facts;
}

function extractSisterName(
  input: string
): ExtractedFact[] {
  const normalized = normalizeInput(input);

  const hasSisterContext =
    /my sister|sister name|मेरी बहन|बहन का नाम|सिस्टर नेम/.test(
      normalized
    );

  if (!hasSisterContext) {
    return [];
  }

  const englishNameMatch = input.match(
    /(?:my sister(?:'s)? name is|sister name is)\s+([a-zA-Z]+)/i
  );

  if (englishNameMatch) {
    const name = englishNameMatch[1];

    return [
      {
        key: "sisterName",
        value:
          name.charAt(0).toUpperCase() +
          name.slice(1).toLowerCase(),
        displayName: "Sister's name",
        sourceText: input,
      },
    ];
  }

  const hindiNameMatch = input.match(
    /(?:बहन का नाम|सिस्टर नेम(?: इज़| इस)?)\s+([^\s.,!?]+)/i
  );

  if (!hindiNameMatch) {
    return [];
  }

  const rawName = hindiNameMatch[1];

  return [
    {
      key: "sisterName",
      value: rawName,
      displayName: "Sister's name",
      sourceText: input,
    },
  ];
}

function extractHandycamBrand(
  input: string
): ExtractedFact[] {
  const normalized = normalizeInput(input);

  const hasHandycam =
    /handycam|हैंडीकैम|हैंडी कैम/.test(
      normalized
    );

  const hasSony =
    /sony|सोनी/.test(normalized);

  if (!hasHandycam || !hasSony) {
    return [];
  }

  return [
    {
      key: "handycamBrand",
      value: "Sony",
      displayName: "Handycam brand",
      sourceText: input,
    },
  ];
}

export function extractFactsFromInput(
  input: string
): ExtractedFact[] {
  return [
    ...extractGraphicsCard(input),
    ...extractSisterName(input),
    ...extractHandycamBrand(input),
  ];
}