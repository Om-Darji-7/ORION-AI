import { useEffect, useRef } from "react";
import { streamOrion } from "../../services/orionAPI";
import { useOrionStore } from "../../store/orionStore";
import { speakIgris } from "../../services/voiceService";
import { createEnglishResponseInstruction } from "../../services/languageService";
import { conversationMemory } from "../../memory/conversationMemory";
import { detectConversationCommand } from "../../memory/conversationCommands";
import { factMemory } from "../../memory/facts/factMemory";
import { extractMemoryFacts } from "../../services/memoryAPI";

interface Props {
  onSleep: () => void;
}

const MIC_RESTART_DELAY = 700;
const INTERRUPT_RESTART_DELAY = 300;

const WAKE_ONLY_PHRASES = new Set([
  "igris",
  "hey igris",
  "hello igris",
  "wake up igris",
  "ok igris",
  "listen igris",
  "idris",
  "egress",
  "igress",
  "इग्रिस",
  "आईग्रिस",
  "इग्निस",
]);

export default function VoiceListener({ onSleep }: Props) {
  const recognitionRef = useRef<any>(null);
  const interruptRecognitionRef = useRef<any>(null);

  const mountedRef = useRef(true);
  const sleepingRef = useRef(false);
  const processingRef = useRef(false);
  const speakingRef = useRef(false);
  const speakingNowRef = useRef(false);

  const recognitionRunningRef = useRef(false);
  const interruptRunningRef = useRef(false);

  const shouldRestartRef = useRef(true);
  const interruptAllowedRef = useRef(false);

  const restartTimerRef = useRef<number | null>(null);
  const interruptRestartTimerRef =
    useRef<number | null>(null);

  const speechQueueRef = useRef<string[]>([]);
  const sentenceBufferRef = useRef("");
  const fullResponseRef = useRef("");

  // Incrementing this invalidates callbacks from an old AI stream.
  const streamSessionRef = useRef(0);

  const activeTurnIdRef = useRef<string | null>(
  null
);

  const onSleepRef = useRef(onSleep);

  const setState = useOrionStore(
    (state) => state.setState
  );

  const setTranscript = useOrionStore(
    (state) => state.setTranscript
  );

  const setResponse = useOrionStore(
    (state) => state.setResponse
  );

  const setStateRef = useRef(setState);
  const setTranscriptRef = useRef(setTranscript);
  const setResponseRef = useRef(setResponse);

  useEffect(() => {
    onSleepRef.current = onSleep;
  }, [onSleep]);

  useEffect(() => {
    setStateRef.current = setState;
    setTranscriptRef.current = setTranscript;
    setResponseRef.current = setResponse;
  }, [setState, setTranscript, setResponse]);

  function normalizeCommand(text: string): string {
    return text
      .normalize("NFC")
      .toLowerCase()
      .replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function containsRelaxWord(text: string): boolean {
    const command = normalizeCommand(text);

    const relaxVariants = [
      "relax",
      "go to sleep",
      "sleep",
      "standby",
      "stand by",
      "रिलैक्स",
      "रिलेक्स",
      "आराम करो",
      "आराम",
      "सो जाओ",
      "स्टैंडबाय",
    ];

    return relaxVariants.some((word) =>
      command.includes(normalizeCommand(word))
    );
  }

  function isRelaxCommand(text: string): boolean {
    return containsRelaxWord(text);
  }

  function clearRestartTimer() {
    if (restartTimerRef.current !== null) {
      window.clearTimeout(
        restartTimerRef.current
      );

      restartTimerRef.current = null;
    }
  }

  function clearInterruptRestartTimer() {
    if (
      interruptRestartTimerRef.current !== null
    ) {
      window.clearTimeout(
        interruptRestartTimerRef.current
      );

      interruptRestartTimerRef.current = null;
    }
  }

  function startRecognition(delay = 0) {
    if (
      !mountedRef.current ||
      sleepingRef.current ||
      !shouldRestartRef.current ||
      processingRef.current ||
      speakingRef.current ||
      speakingNowRef.current ||
      window.speechSynthesis.speaking
    ) {
      return;
    }

    clearRestartTimer();

    restartTimerRef.current =
      window.setTimeout(() => {
        if (
          !mountedRef.current ||
          sleepingRef.current ||
          !shouldRestartRef.current ||
          recognitionRunningRef.current ||
          processingRef.current ||
          speakingRef.current ||
          speakingNowRef.current ||
          window.speechSynthesis.speaking
        ) {
          return;
        }

        try {
          recognitionRef.current?.start();
        } catch {
          // Recognition may already be starting.
        }
      }, delay);
  }

  function pauseMainRecognition() {
    shouldRestartRef.current = false;
    clearRestartTimer();

    try {
      recognitionRef.current?.abort();
    } catch {
      // Recognition may already be stopped.
    }
  }

  function resumeMainRecognition(
    delay = MIC_RESTART_DELAY
  ) {
    if (
      !mountedRef.current ||
      sleepingRef.current
    ) {
      return;
    }

    shouldRestartRef.current = true;
    startRecognition(delay);
  }

  function stopMainRecognitionPermanently() {
    shouldRestartRef.current = false;
    clearRestartTimer();

    try {
      recognitionRef.current?.abort();
    } catch {
      // Recognition may already be inactive.
    }
  }

  function startInterruptRecognition(
    delay = INTERRUPT_RESTART_DELAY
  ) {
    if (
      !mountedRef.current ||
      sleepingRef.current ||
      !interruptAllowedRef.current ||
      !speakingRef.current ||
      interruptRunningRef.current
    ) {
      return;
    }

    clearInterruptRestartTimer();

    interruptRestartTimerRef.current =
      window.setTimeout(() => {
        if (
          !mountedRef.current ||
          sleepingRef.current ||
          !interruptAllowedRef.current ||
          !speakingRef.current ||
          interruptRunningRef.current
        ) {
          return;
        }

        try {
          interruptRecognitionRef.current?.start();
        } catch {
          // Interrupt recognition may already be starting.
        }
      }, delay);
  }

  function stopInterruptRecognition() {
    interruptAllowedRef.current = false;
    clearInterruptRestartTimer();

    try {
      interruptRecognitionRef.current?.abort();
    } catch {
      // Interrupt recognition may already be inactive.
    }
  }

  function resetSpeechPipeline() {
    window.speechSynthesis.cancel();

    speechQueueRef.current = [];
    sentenceBufferRef.current = "";
    fullResponseRef.current = "";

    processingRef.current = false;
    speakingRef.current = false;
    speakingNowRef.current = false;
  }

  function enterSleepMode() {
    if (sleepingRef.current) return;

    sleepingRef.current = true;

    streamSessionRef.current += 1;

    stopMainRecognitionPermanently();
    stopInterruptRecognition();
    resetSpeechPipeline();

    setStateRef.current("idle");

    console.log(
      "😴 IGRIS entered standby mode."
    );

    onSleepRef.current();
  }

async function speakLocalResponse(
  transcript: string,
  message: string
): Promise<void> {
  pauseMainRecognition();
  stopInterruptRecognition();

  window.speechSynthesis.cancel();

  speechQueueRef.current = [];
  sentenceBufferRef.current = "";
  fullResponseRef.current = "";

  processingRef.current = true;
  speakingRef.current = true;
  speakingNowRef.current = false;

  setTranscriptRef.current(transcript);
  setResponseRef.current(message);
  setStateRef.current("speaking");

  await speakIgris(message, {
    rate: 0.95,
    pitch: 0.9,
    volume: 1,
    cancelBeforeSpeak: true,
  });

  if (
    !mountedRef.current ||
    sleepingRef.current
  ) {
    return;
  }

  processingRef.current = false;
  speakingRef.current = false;
  speakingNowRef.current = false;

  setStateRef.current("listening");

  resumeMainRecognition(
    MIC_RESTART_DELAY
  );
}

function buildLocalConversationSummary(): string {
  const messages =
    conversationMemory.getRecentMessages(12);

  const storedSummary =
    conversationMemory.getSummary();

  if (
    messages.length === 0 &&
    !storedSummary.trim()
  ) {
    return "We do not have any completed conversation history yet.";
  }

  const recentTopics = messages
    .map((message) => {
      const speaker =
        message.role === "user"
          ? "You"
          : "IGRIS";

      return `${speaker}: ${message.content}`;
    })
    .join("\n");

  if (storedSummary.trim()) {
    return [
      `Previous summary: ${storedSummary}`,
      "",
      "Recent conversation:",
      recentTopics,
    ].join("\n");
  }

  return [
    "Here is our recent conversation:",
    recentTopics,
  ].join("\n");
}

async function processMemoryFacts(
  input: string
): Promise<void> {
  try {
    const existingFacts =
      factMemory.getFactsRecord();

    const extractedFacts =
      await extractMemoryFacts(
        input,
        existingFacts
      );

    for (const fact of extractedFacts) {
      if (fact.operation === "delete") {
        factMemory.removeFact(fact.key);

        console.log(
          `🧠 Extracted fact deleted: ${fact.key}`
        );

        continue;
      }

      factMemory.setFact({
        key: fact.key,
        value: fact.value,
        displayName: fact.displayName,
        confidence:
          fact.confidence >= 0.9
            ? "user-confirmed"
            : "inferred",
        sourceText: input,
      });

      console.log(
        `🧠 Extracted fact stored: ${fact.key} = ${fact.value}`
      );
    }
  } catch (error) {
    /*
      Memory extraction failure should never
      stop the normal IGRIS response.
    */
    console.error(
      "🧠 Background memory extraction failed:",
      error
    );
  }
}

  async function handleRelaxCommand() {
    if (
      sleepingRef.current ||
      !mountedRef.current
    ) {
      return;
    }

    console.log(
      "😴 Relax command accepted."
    );

    streamSessionRef.current += 1;

    pauseMainRecognition();
    stopInterruptRecognition();

    window.speechSynthesis.cancel();

    speechQueueRef.current = [];
    sentenceBufferRef.current = "";
    fullResponseRef.current = "";

    processingRef.current = true;
    speakingRef.current = true;
    speakingNowRef.current = false;

    const message =
      "OK Boss, I go for relax but If you need me, just double snap.";

    setTranscriptRef.current("Relax");
    setResponseRef.current(message);
    setStateRef.current("speaking");

    await speakIgris(message, {
      rate: 0.95,
      pitch: 0.9,
      volume: 1,
      cancelBeforeSpeak: true,
    });

    if (
      !mountedRef.current ||
      sleepingRef.current
    ) {
      return;
    }

    processingRef.current = false;
    speakingRef.current = false;
    speakingNowRef.current = false;

    enterSleepMode();
  }

  function handleVoiceInterrupt() {
    if (
      !processingRef.current &&
      !speakingRef.current &&
      !speakingNowRef.current &&
      !window.speechSynthesis.speaking
    ) {
      return;
    }

    console.warn(
      "🛑 IGRIS stop command accepted."
    );

    // Invalidate the current Ollama stream.
    streamSessionRef.current += 1;

    if (activeTurnIdRef.current) {
  conversationMemory.interruptTurn(
    activeTurnIdRef.current,
    fullResponseRef.current
  );

  activeTurnIdRef.current = null;
}

    stopInterruptRecognition();

    window.speechSynthesis.cancel();

    speechQueueRef.current = [];
    sentenceBufferRef.current = "";
    fullResponseRef.current = "";

    processingRef.current = false;
    speakingRef.current = false;
    speakingNowRef.current = false;

    setResponseRef.current("Stopped.");
    setStateRef.current("listening");

    resumeMainRecognition(400);
  }

  function speak(
    text: string
  ): Promise<void> {
    return speakIgris(text, {
      rate: 0.95,
      pitch: 0.9,
      volume: 1,
    });
  }

  async function drainSpeechQueue() {
    if (speakingNowRef.current) return;

    speakingNowRef.current = true;
    speakingRef.current = true;

    interruptAllowedRef.current = true;

    startInterruptRecognition(
      INTERRUPT_RESTART_DELAY
    );

    try {
      while (
        mountedRef.current &&
        !sleepingRef.current &&
        speakingRef.current &&
        speechQueueRef.current.length > 0
      ) {
        const sentence =
          speechQueueRef.current.shift();

        if (!sentence) continue;

        await speak(sentence);
      }
    } finally {
      speakingNowRef.current = false;

      if (
        mountedRef.current &&
        !sleepingRef.current &&
        speakingRef.current &&
        speechQueueRef.current.length > 0
      ) {
        void drainSpeechQueue();
      }
    }
  }

  function addSpeechChunk(text: string) {
    const cleanText = text.trim();

    if (!cleanText) return;

    speechQueueRef.current.push(cleanText);

    void drainSpeechQueue();
  }

  async function waitForSpeechToFinish() {
    while (
      mountedRef.current &&
      !sleepingRef.current &&
      (
        speakingNowRef.current ||
        speechQueueRef.current.length > 0 ||
        window.speechSynthesis.speaking
      )
    ) {
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, 100);
      });
    }
  }

  useEffect(() => {
    mountedRef.current = true;
    sleepingRef.current = false;
    shouldRestartRef.current = true;
    interruptAllowedRef.current = false;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        "Speech recognition is not supported by this browser."
      );

      return;
    }

    const recognition =
      new SpeechRecognition();

    const interruptRecognition =
      new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "hi-IN";

    interruptRecognition.continuous = true;
    interruptRecognition.interimResults = true;
    interruptRecognition.lang = "en-IN";

    recognitionRef.current = recognition;
    interruptRecognitionRef.current =
      interruptRecognition;

    interruptRecognition.onstart = () => {
      interruptRunningRef.current = true;

      console.log(
        "👂 Interrupt listener active. Say: IGRIS stop."
      );
    };

    interruptRecognition.onresult = (event: any) => {
  if (
    !mountedRef.current ||
    sleepingRef.current ||
    !interruptAllowedRef.current ||
    !speakingRef.current
  ) {
    return;
  }

  let transcript = "";

  for (
    let index = event.resultIndex;
    index < event.results.length;
    index++
  ) {
    transcript +=
      event.results[index]?.[0]?.transcript ?? "";
  }

  const normalizedTranscript =
    normalizeCommand(transcript);

  if (!normalizedTranscript) return;

  const stopDetected = [
    "stop",
    "स्टॉप",
    "रुको",
    "बस करो",
    "shut up",
  ].some((word) =>
    normalizedTranscript.includes(
      normalizeCommand(word)
    )
  );

  if (stopDetected) {
    console.log(
      "🛑 INTERRUPT MATCHED:",
      transcript
    );

    handleVoiceInterrupt();
  }
};

    interruptRecognition.onerror = (
  event: any
) => {
  if (
    event.error === "aborted" ||
    event.error === "no-speech"
  ) {
    return;
  }

  console.log(
    "Interrupt recognition error:",
    event.error
  );
};

    interruptRecognition.onend = () => {
      interruptRunningRef.current = false;

      if (
        mountedRef.current &&
        !sleepingRef.current &&
        interruptAllowedRef.current &&
        speakingRef.current
      ) {
        startInterruptRecognition(250);
      }
    };

    recognition.onstart = () => {
      recognitionRunningRef.current = true;

      if (
        !sleepingRef.current &&
        !processingRef.current &&
        !speakingRef.current
      ) {
        setStateRef.current("listening");

        console.log(
          "🎙️ IGRIS listening continuously."
        );
      }
    };

    recognition.onresult = async (
      event: any
    ) => {
      if (
        !mountedRef.current ||
        sleepingRef.current ||
        processingRef.current ||
        speakingRef.current ||
        speakingNowRef.current ||
        window.speechSynthesis.speaking
      ) {
        return;
      }

      const result =
        event.results?.[event.resultIndex];

      if (!result || !result.isFinal) {
        return;
      }

      const input =
        result[0]?.transcript?.trim() ?? "";

      if (!input) return;

      const normalizedInput =
        normalizeCommand(input);

      console.log(
        "🎤 Recognition heard:",
        input
      );

      if (isRelaxCommand(input)) {
        console.log(
          "😴 RELAX MATCHED — entering standby."
        );

        await handleRelaxCommand();
        return;
      }

      if (
        WAKE_ONLY_PHRASES.has(normalizedInput)
      ) {
        console.log(
          "Wake phrase tail ignored."
        );

        return;
      }

      const conversationCommand =
  detectConversationCommand(input);

  console.log(
  "🧠 Detected conversation command:",
  conversationCommand
);

if (
  conversationCommand.type ===
  "clear-conversation"
) {
  console.log(
    "🧠 Clear conversation command matched."
  );

  conversationMemory.clearConversation();
  factMemory.clearFacts();

  await speakLocalResponse(
    input,
    "Conversation cleared. We can start fresh."
  );

  return;
}

if (
  conversationCommand.type ===
  "conversation-summary"
) {
  console.log(
    "🧠 Conversation summary command matched."
  );

  const summaryMessage =
    buildLocalConversationSummary();

  await speakLocalResponse(
    input,
    summaryMessage
  );

  return;
}

if (
  conversationCommand.type ===
  "set-response-mode"
) {
  conversationMemory.setResponseMode(
    conversationCommand.mode
  );

  const responseMessages = {
     auto:
    "Automatic response mode enabled. I will decide the appropriate answer depth myself.",

    concise:
      "Concise mode enabled. I will keep my answers short and direct.",

    normal:
      "Normal response mode enabled.",

    detailed:
      "Detailed mode enabled. I will give more complete explanations.",
  };

  await speakLocalResponse(
    input,
    responseMessages[
      conversationCommand.mode
    ]
  );

  return;
}
      void processMemoryFacts(input);
      processingRef.current = true;
      speakingRef.current = true;
      speakingNowRef.current = false;

      // Main recognition is stopped before IGRIS answers.
      pauseMainRecognition();

      window.speechSynthesis.cancel();

      speechQueueRef.current = [];
      sentenceBufferRef.current = "";
      fullResponseRef.current = "";

      setTranscriptRef.current(input);
      setResponseRef.current("");
      setStateRef.current("thinking");

      console.log(
  "Sending command to IGRIS:",
  input
);

const turnId =
  conversationMemory.startTurn(input);

activeTurnIdRef.current = turnId;

const recentMessages =
  conversationMemory.getRecentMessages(30);

const conversationSummary =
  conversationMemory.getSummary();

const responseMode =
  conversationMemory.getResponseMode();

const modelInput =
  createEnglishResponseInstruction(input, {
    recentMessages,
    summary: conversationSummary,
    responseMode,
  });

console.log(
  "🧠 Context sent to IGRIS:",
  recentMessages.length,
  "completed messages"
);

      const currentStreamSession =
        ++streamSessionRef.current;

      try {
        await streamOrion(
          modelInput,

          (token) => {
            if (
              !mountedRef.current ||
              sleepingRef.current ||
              currentStreamSession !==
                streamSessionRef.current
            ) {
              return;
            }

            setStateRef.current("speaking");

            fullResponseRef.current += token;

            setResponseRef.current(
              fullResponseRef.current
            );

            sentenceBufferRef.current += token;

            const wordCount =
              sentenceBufferRef.current
                .trim()
                .split(/\s+/)
                .filter(Boolean).length;

            const hasTerminalMark =
              /[.!?]/.test(token);

            const hasPauseMark =
              /[,;:]/.test(token) &&
              wordCount >= 8;

            if (
              hasTerminalMark ||
              hasPauseMark ||
              wordCount >= 12
            ) {
              addSpeechChunk(
                sentenceBufferRef.current
              );

              sentenceBufferRef.current = "";
            }
          },

          async () => {
            if (
              currentStreamSession !==
              streamSessionRef.current
            ) {
              return;
            }

            if (
              sentenceBufferRef.current.trim()
            ) {
              addSpeechChunk(
                sentenceBufferRef.current
              );

              sentenceBufferRef.current = "";
            }

            await waitForSpeechToFinish();

            if (
              currentStreamSession !==
              streamSessionRef.current
            ) {
              return;
            }

            if (
              activeTurnIdRef.current === turnId
            ) {
              conversationMemory.completeTurn(
                turnId,
                fullResponseRef.current
              );
            
              activeTurnIdRef.current = null;
            }

            stopInterruptRecognition();

            if (
              !mountedRef.current ||
              sleepingRef.current
            ) {
              return;
            }

            processingRef.current = false;
            speakingRef.current = false;
            speakingNowRef.current = false;

            setStateRef.current("listening");

            console.log(
              "✅ IGRIS finished speaking. Mic reopening."
            );

            resumeMainRecognition(
              MIC_RESTART_DELAY
            );
          }
        );
      } catch (error) {
        if (
          currentStreamSession !==
          streamSessionRef.current
        ) {
          return;
        }

        console.error(
          "IGRIS pipeline error:",
          error
        );

        if (
          activeTurnIdRef.current === turnId
        ) {
          conversationMemory.failTurn(turnId);
        
          activeTurnIdRef.current = null;
        }

        stopInterruptRecognition();
        resetSpeechPipeline();

        setStateRef.current("listening");

        resumeMainRecognition(
          MIC_RESTART_DELAY
        );
      }
    };

    recognition.onerror = (
      event: any
    ) => {
      console.log(
        "Speech recognition status:",
        event.error
      );

      if (
        event.error === "aborted" ||
        event.error === "no-speech"
      ) {
        return;
      }

      if (
        mountedRef.current &&
        !sleepingRef.current &&
        shouldRestartRef.current &&
        !processingRef.current &&
        !speakingRef.current
      ) {
        startRecognition(700);
      }
    };

    recognition.onend = () => {
      recognitionRunningRef.current = false;

      console.log(
        "Main recognition session ended."
      );

      if (
        mountedRef.current &&
        !sleepingRef.current &&
        shouldRestartRef.current &&
        !processingRef.current &&
        !speakingRef.current &&
        !speakingNowRef.current &&
        !window.speechSynthesis.speaking
      ) {
        startRecognition(
          MIC_RESTART_DELAY
        );
      }
    };

    startRecognition(700);

    return () => {
      mountedRef.current = false;
      sleepingRef.current = true;

      shouldRestartRef.current = false;
      interruptAllowedRef.current = false;

      recognitionRunningRef.current = false;
      interruptRunningRef.current = false;

      streamSessionRef.current += 1;

      if (activeTurnIdRef.current) {
        conversationMemory.interruptTurn(
          activeTurnIdRef.current,
          fullResponseRef.current
        );
      
        activeTurnIdRef.current = null;
      }

      clearRestartTimer();
      clearInterruptRestartTimer();

      recognition.onstart = null;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;

      interruptRecognition.onstart = null;
      interruptRecognition.onresult = null;
      interruptRecognition.onerror = null;
      interruptRecognition.onend = null;

      try {
        recognition.abort();
      } catch {}

      try {
        interruptRecognition.abort();
      } catch {}

      window.speechSynthesis.cancel();

      speechQueueRef.current = [];
      sentenceBufferRef.current = "";
      fullResponseRef.current = "";

      processingRef.current = false;
      speakingRef.current = false;
      speakingNowRef.current = false;
    };
  }, []);

  return null;
}