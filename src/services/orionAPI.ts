/**
 * Processes live output parsing pipelines directly using fetch reader protocols.
 */
export const streamOrion = async (
  message: string,
  onToken: (token: string) => void,
  onDone: () => Promise<void> | void
): Promise<void> => {
  try {
    // ⚠️ CRITICAL: Check your Node port! If backend runs on 5000, keep this absolute URL template structure.
    const response = await fetch("http://localhost:5000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error(`Connection bridge rejected payload: ${response.status}`);
    }

    if (!response.body) {
      throw new Error("Target payload text data stream layer unreadable.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let parsingBufferAccumulator = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      parsingBufferAccumulator += decoder.decode(value, { stream: true });
      const processSegments = parsingBufferAccumulator.split("\n");

      // Save incomplete fragments back to data register memory spaces
      parsingBufferAccumulator = processSegments.pop() || "";

      for (const structuralSegment of processSegments) {
        const structuralLine = structuralSegment.trim();
        if (!structuralLine.startsWith("data: ")) continue;

        const dynamicPayloadText = structuralLine.replace("data: ", "").trim();

        if (dynamicPayloadText === "[DONE]") {
          await onDone();
          return;
        }

        try {
          const contentMatrix = JSON.parse(dynamicPayloadText);
          if (contentMatrix.text) {
            onToken(contentMatrix.text); // Transmits text packet to component store interface
          }
        } catch (jsonErr) {
          // Absorb data parsing boundary clips safely
        }
      }
    }

    await onDone();

  } catch (error) {
    console.error("FATAL: Client network hook collapsed!", error);
    throw error;
  }
};
