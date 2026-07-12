import { useEffect, useRef } from "react";
import { streamOrion } from "../../services/orionAPI";
import { useOrionStore } from "../../store/orionStore";
import { speakIgris } from "../../services/voiceService";
import { createEnglishResponseInstruction } from "../../services/languageService";

interface Props {
  onSleep: () => void;
}

const SLEEP_DELAY = 15_000;
const MIC_RESTART_DELAY = 700;
const INTERRUPT_RESTART_DELAY = 350;

export default function VoiceListener({ onSleep }: Props) {
  const recognitionRef = useRef<any>(null);
  const interruptRecognitionRef = useRef<any>(null);

  const speakingRef = useRef(false);
  const speakingNowRef = useRef(false);
  const processingRef = useRef(false);
  const sleepingRef = useRef(false);
  const mountedRef = useRef(true);

  const shouldRestartRef = useRef(false);
  const interruptEnabledRef = useRef(false);

  const speechQueueRef = useRef<string[]>([]);
  const sentenceBufferRef = useRef("");
  const fullResponseRef = useRef("");

  const sleepTimerRef = useRef<number | null>(null);
  const restartTimerRef = useRef<number | null>(null);
  const interruptRestartTimerRef = useRef<number | null>(null);

  // Used to ignore old streaming callbacks after interruption.
  const streamSessionRef = useRef(0);

  const onSleepRef = useRef(onSleep);

  const setState = useOrionStore((state) => state.setState);
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

  function clearSleepTimer() {
    if (sleepTimerRef.current !== null) {
      window.clearTimeout(sleepTimerRef.current);
      sleepTimerRef.current = null;
    }
  }

  function clearRestartTimer() {
    if (restartTimerRef.current !== null) {
      window.clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  }

  function clearInterruptRestartTimer() {
    if (interruptRestartTimerRef.current !== null) {
      window.clearTimeout(
        interruptRestartTimerRef.current
      );

      interruptRestartTimerRef.current = null;
    }
  }

  function stopMainRecognition() {
    shouldRestartRef.current = false;
    clearRestartTimer();

    try {
      recognitionRef.current?.abort();
    } catch {
      // Recognition may already be stopped.
    }
  }

  function stopInterruptRecognition() {
    interruptEnabledRef.current = false;
    clearInterruptRestartTimer();

    try {
      interruptRecognitionRef.current?.abort();
    } catch {
      // Interrupt recognition may already be stopped.
    }
  }

  function scheduleSleepTimer() {
    clearSleepTimer();

    sleepTimerRef.current = window.setTimeout(() => {
      console.log(
        "⏳ No command received for 15 seconds."
      );

      enterSleepMode();
    }, SLEEP_DELAY);

    console.log(
      "⏳ Sleep timeout reset: 15 seconds."
    );
  }

  function enterSleepMode() {
    if (sleepingRef.current) return;

    sleepingRef.current = true;
    processingRef.current = false;
    speakingRef.current = false;
    speakingNowRef.current = false;
    shouldRestartRef.current = false;

    // Invalidate active AI stream.
    streamSessionRef.current += 1;

    clearSleepTimer();
    clearRestartTimer();
    clearInterruptRestartTimer();

    stopMainRecognition();
    stopInterruptRecognition();

    window.speechSynthesis.cancel();

    speechQueueRef.current = [];
    sentenceBufferRef.current = "";
    fullResponseRef.current = "";

    setStateRef.current("idle");

    console.log(
      "😴 VoiceListener entering sleep mode."
    );

    onSleepRef.current();
  }

  function startMainRecognition(delay = 0) {
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

    shouldRestartRef.current = true;
    clearRestartTimer();

    restartTimerRef.current = window.setTimeout(() => {
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

      try {
        recognitionRef.current?.start();
      } catch {
        // Recognition is probably already active.
      }
    }, delay);
  }

  function startInterruptRecognition(delay = 0) {
    if (
      !mountedRef.current ||
      sleepingRef.current ||
      !speakingRef.current
    ) {
      return;
    }

    interruptEnabledRef.current = true;
    clearInterruptRestartTimer();

    interruptRestartTimerRef.current =
      window.setTimeout(() => {
        if (
          !mountedRef.current ||
          sleepingRef.current ||
          !speakingRef.current ||
          !interruptEnabledRef.current
        ) {
          return;
        }

        try {
          interruptRecognitionRef.current?.start();

          console.log(
            "👂 Interrupt listener active."
          );
        } catch {
          // Interrupt listener is probably already active.
        }
      }, delay);
  }

  function handleVoiceInterrupt() {
    if (!speakingRef.current) return;

    console.warn(
      "🛑 IGRIS interrupted by user."
    );

    // Invalidate current stream callbacks.
    streamSessionRef.current += 1;

    stopInterruptRecognition();

    window.speechSynthesis.cancel();

    speechQueueRef.current = [];
    sentenceBufferRef.current = "";
    fullResponseRef.current = "";

    speakingNowRef.current = false;
    speakingRef.current = false;
    processingRef.current = false;

    setStateRef.current("listening");

    startMainRecognition(MIC_RESTART_DELAY);
    scheduleSleepTimer();
  }

  function speak(text: string): Promise<void> {
    return speakIgris(text, {
      rate: 0.95,
      pitch: 0.9,
      volume: 1,
    });
  }

  async function drainSpeechQueue(): Promise<void> {
    if (speakingNowRef.current) return;

    speakingNowRef.current = true;
    speakingRef.current = true;

    startInterruptRecognition(
      INTERRUPT_RESTART_DELAY
    );

    try {
      while (
        mountedRef.current &&
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
        speakingRef.current &&
        speechQueueRef.current.length > 0
      ) {
        void drainSpeechQueue();
      }
    }
  }

  async function waitForSpeechToFinish(): Promise<void> {
    while (
      mountedRef.current &&
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

  function addSpeechChunk(text: string) {
    const cleanText = text.trim();

    if (!cleanText) return;

    speechQueueRef.current.push(cleanText);

    void drainSpeechQueue();
  }

  useEffect(() => {
    mountedRef.current = true;
    sleepingRef.current = false;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        "Speech recognition is not supported by this browser."
      );

      return;
    }

    const recognition = new SpeechRecognition();
    const interruptRecognition =
      new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = false;

    // User can speak Hindi/Hinglish.
    recognition.lang = "hi-IN";

    interruptRecognition.continuous = true;
    interruptRecognition.interimResults = true;
    interruptRecognition.lang = "en-IN";

    recognitionRef.current = recognition;
    interruptRecognitionRef.current =
      interruptRecognition;

    interruptRecognition.onstart = () => {
      console.log(
        "👂 Listening for interrupt commands."
      );
    };

    interruptRecognition.onresult = (
      event: any
    ) => {
      if (
        sleepingRef.current ||
        !speakingRef.current ||
        !interruptEnabledRef.current
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
          event.results[index]?.[0]?.transcript ??
          "";
      }

      const normalizedTranscript = transcript
        .toLowerCase()
        .trim();

      if (!normalizedTranscript) return;

      console.log(
        "Interrupt listener heard:",
        normalizedTranscript
      );

      const interruptCommands = [
        "stop",
        "stop igris",
        "igris stop",
        "wait",
        "wait igris",
        "shut up",
        "be quiet",
        "बस",
        "रुको",
        "चुप",
      ];

      const interruptMatched =
        interruptCommands.some(
          (command) =>
            normalizedTranscript === command ||
            normalizedTranscript.includes(command)
        );

      if (interruptMatched) {
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
      if (
        mountedRef.current &&
        interruptEnabledRef.current &&
        speakingRef.current &&
        !sleepingRef.current
      ) {
        startInterruptRecognition(300);
      }
    };

    recognition.onstart = () => {
      if (
        sleepingRef.current ||
        processingRef.current ||
        speakingRef.current
      ) {
        return;
      }

      setStateRef.current("listening");

      console.log(
        "🎙️ IGRIS listening for a command."
      );
    };

    recognition.onresult = async (
      event: any
    ) => {
      if (
        sleepingRef.current ||
        processingRef.current ||
        speakingRef.current ||
        speakingNowRef.current ||
        window.speechSynthesis.speaking
      ) {
        console.log(
          "Audio ignored while IGRIS is busy."
        );

        return;
      }

      const resultIndex = event.resultIndex;
      const result =
        event.results?.[resultIndex]?.[0];

      if (!result?.transcript) return;

      const input = result.transcript.trim();

      if (!input) return;

      console.log("User command:", input);

      const normalizedInput = input
        .toLowerCase()
        .trim();

      const wakeOnlyPhrases = new Set([
        "igris",
        "hey igris",
        "hello igris",
        "wake up igris",
        "ok igris",
        "listen igris",
        "egress",
        "idris",
        "idrees",
        "igrees",
      ]);

      if (wakeOnlyPhrases.has(normalizedInput)) {
        console.log(
          "Wake phrase tail ignored."
        );

        scheduleSleepTimer();
        return;
      }

      const stopCommands = [
        "stop",
        "shut up",
        "wait",
        "igris stop",
        "stop igris",
        "बस",
        "रुको",
        "चुप",
      ];

      const stopMatched = stopCommands.some(
        (command) =>
          normalizedInput === command ||
          normalizedInput.includes(command)
      );

      if (stopMatched) {
        handleVoiceInterrupt();
        return;
      }

      clearSleepTimer();

      processingRef.current = true;
      speakingRef.current = true;

      stopMainRecognition();
      stopInterruptRecognition();

      window.speechSynthesis.cancel();

      speechQueueRef.current = [];
      sentenceBufferRef.current = "";
      fullResponseRef.current = "";
      speakingNowRef.current = false;

      setTranscriptRef.current(input);
      setResponseRef.current("");
      setStateRef.current("thinking");

      console.log(
        "Sending command to IGRIS:",
        input
      );

      const modelInput =
        createEnglishResponseInstruction(input);

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
              !mountedRef.current ||
              sleepingRef.current ||
              currentStreamSession !==
                streamSessionRef.current
            ) {
              return;
            }

            stopInterruptRecognition();

            speakingRef.current = false;
            speakingNowRef.current = false;
            processingRef.current = false;

            setStateRef.current("listening");

            console.log(
              "✅ IGRIS finished speaking. Mic will reopen."
            );

            startMainRecognition(
              MIC_RESTART_DELAY
            );

            scheduleSleepTimer();
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

        stopInterruptRecognition();

        window.speechSynthesis.cancel();

        speechQueueRef.current = [];
        sentenceBufferRef.current = "";

        processingRef.current = false;
        speakingRef.current = false;
        speakingNowRef.current = false;

        setStateRef.current("listening");

        startMainRecognition(
          MIC_RESTART_DELAY
        );

        scheduleSleepTimer();
      }
    };

    recognition.onerror = (event: any) => {
      console.log(
        "Speech recognition error:",
        event.error
      );

      if (
        event.error === "aborted" ||
        event.error === "no-speech"
      ) {
        return;
      }

      if (
        shouldRestartRef.current &&
        !sleepingRef.current &&
        !processingRef.current &&
        !speakingRef.current
      ) {
        startMainRecognition(800);
      }
    };

    recognition.onend = () => {
      console.log(
        "Microphone recognition session ended."
      );

      if (
        shouldRestartRef.current &&
        !sleepingRef.current &&
        !processingRef.current &&
        !speakingRef.current &&
        !speakingNowRef.current &&
        !window.speechSynthesis.speaking
      ) {
        startMainRecognition(300);
      }
    };

    startMainRecognition(700);
    scheduleSleepTimer();

    return () => {
      mountedRef.current = false;
      sleepingRef.current = true;
      shouldRestartRef.current = false;
      interruptEnabledRef.current = false;

      streamSessionRef.current += 1;

      clearSleepTimer();
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
    };
  }, []);

  return null;
}