import { useEffect, useRef } from "react";
import { streamOrion } from "../../services/orionAPI";
import { useOrionStore } from "../../store/orionStore";
import { speakIgris } from "../../services/voiceService";

interface Props {
  language: string;
  onSleep: () => void;
}

const SLEEP_DELAY = 15000;
const MIC_RESTART_DELAY = 700;

export default function VoiceListener({ language, onSleep }: Props) {
  const recognitionRef = useRef<any>(null);

  const speakingRef = useRef(false);
  const speakingNowRef = useRef(false);
  const processingRef = useRef(false);
  const sleepingRef = useRef(false);
  const shouldRestartRef = useRef(false);
  const mountedRef = useRef(true);

  const speechQueueRef = useRef<string[]>([]);
  const sentenceBufferRef = useRef("");
  const fullResponseRef = useRef("");

  const sleepTimerRef = useRef<number | null>(null);
  const restartTimerRef = useRef<number | null>(null);

  const onSleepRef = useRef(onSleep);

  const setState = useOrionStore((s) => s.setState);
  const setTranscript = useOrionStore((s) => s.setTranscript);
  const setResponse = useOrionStore((s) => s.setResponse);

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

  function stopRecognition() {
    shouldRestartRef.current = false;
    clearRestartTimer();

    try {
      recognitionRef.current?.abort();
    } catch {
      // Recognition may already be stopped.
    }
  }

  function enterSleepMode() {
    if (sleepingRef.current) return;

    sleepingRef.current = true;
    processingRef.current = false;
    speakingRef.current = false;
    shouldRestartRef.current = false;

    clearSleepTimer();
    clearRestartTimer();

    try {
      recognitionRef.current?.abort();
    } catch {}

    window.speechSynthesis.cancel();
    speechQueueRef.current = [];
    sentenceBufferRef.current = "";

    setStateRef.current("idle");

    console.log("😴 VoiceListener entering sleep mode.");

    onSleepRef.current();
  }

  function scheduleSleepTimer() {
    clearSleepTimer();

    sleepTimerRef.current = window.setTimeout(() => {
      console.log("⏳ No command received for 15 seconds.");
      enterSleepMode();
    }, SLEEP_DELAY);

    console.log("⏳ Sleep timeout reset: 15 seconds.");
  }

  function startRecognition(delay = 0) {
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
        // Already running.
      }
    }, delay);
  }

  function speak(text: string): Promise<void> {
  return speakIgris(text, {
    rate: 1.05,
    pitch: 1,
    volume: 1,
  });
}

  async function drainSpeechQueue(): Promise<void> {
    if (speakingNowRef.current) return;

    speakingNowRef.current = true;
    speakingRef.current = true;

    try {
      while (speechQueueRef.current.length > 0) {
        const sentence = speechQueueRef.current.shift();

        if (!sentence) continue;

        await speak(sentence);
      }
    } finally {
      speakingNowRef.current = false;

      // A new sentence may have arrived while the function was finishing.
      if (speechQueueRef.current.length > 0) {
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
      alert("Speech recognition is not supported by this browser.");
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = language;

    recognitionRef.current = recognition;

    recognition.onstart = () => {
      if (
        sleepingRef.current ||
        processingRef.current ||
        speakingRef.current
      ) {
        return;
      }

      setStateRef.current("listening");
      console.log("🎙️ IGRIS listening for a command.");
    };

    recognition.onresult = async (event: any) => {
      if (
        sleepingRef.current ||
        processingRef.current ||
        speakingRef.current ||
        speakingNowRef.current ||
        window.speechSynthesis.speaking
      ) {
        console.log("🔒 Audio ignored while IGRIS is busy.");
        return;
      }

      const resultIndex = event.resultIndex;
      const result = event.results?.[resultIndex]?.[0];

      if (!result?.transcript) return;

      let input = result.transcript.trim();

      if (!input) return;

      console.log("🔊 User command:", input);

      const normalizedInput = input.toLowerCase().trim();

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

      // Ignore a wake phrase repeated by SpeechRecognition.
      if (wakeOnlyPhrases.has(normalizedInput)) {
        console.log("Wake phrase tail ignored.");
        scheduleSleepTimer();
        return;
      }

      if (
        normalizedInput === "stop" ||
        normalizedInput === "shut up" ||
        normalizedInput === "wait" ||
        normalizedInput === "igris stop"
      ) {
        console.log("🛑 Speech interrupted.");

        window.speechSynthesis.cancel();

        speechQueueRef.current = [];
        sentenceBufferRef.current = "";
        fullResponseRef.current = "";

        speakingRef.current = false;
        speakingNowRef.current = false;
        processingRef.current = false;

        setStateRef.current("listening");

        startRecognition(MIC_RESTART_DELAY);
        scheduleSleepTimer();
        return;
      }

      clearSleepTimer();

      processingRef.current = true;
      speakingRef.current = true;

      // Critical: mic must remain stopped during processing and speaking.
      stopRecognition();

      window.speechSynthesis.cancel();

      speechQueueRef.current = [];
      sentenceBufferRef.current = "";
      fullResponseRef.current = "";
      speakingNowRef.current = false;

      setTranscriptRef.current(input);
      setResponseRef.current("");
      setStateRef.current("thinking");

      console.log("🧠 Sending command to IGRIS:", input);

      try {
        await streamOrion(
          input,

          (token) => {
            if (sleepingRef.current) return;

            setStateRef.current("speaking");

            fullResponseRef.current += token;
            setResponseRef.current(fullResponseRef.current);

            sentenceBufferRef.current += token;

            const wordCount = sentenceBufferRef.current
              .trim()
              .split(/\s+/)
              .filter(Boolean).length;

            const terminalMark = /[.!?]/.test(token);
            const pauseMark = /[,;:]/.test(token) && wordCount >= 8;

            if (terminalMark || pauseMark || wordCount >= 12) {
              addSpeechChunk(sentenceBufferRef.current);
              sentenceBufferRef.current = "";
            }
          },

          async () => {
            if (sentenceBufferRef.current.trim()) {
              addSpeechChunk(sentenceBufferRef.current);
              sentenceBufferRef.current = "";
            }

            // Wait until every spoken sentence has really completed.
            await waitForSpeechToFinish();

            if (!mountedRef.current || sleepingRef.current) return;

            speakingRef.current = false;
            speakingNowRef.current = false;
            processingRef.current = false;

            setStateRef.current("listening");

            console.log("✅ IGRIS finished speaking. Mic will reopen.");

            // Small delay prevents the final speaker audio from entering mic.
            startRecognition(MIC_RESTART_DELAY);

            // Sleep only after 15 seconds without another command.
            scheduleSleepTimer();
          }
        );
      } catch (error) {
        console.error("IGRIS pipeline error:", error);

        window.speechSynthesis.cancel();

        speechQueueRef.current = [];
        sentenceBufferRef.current = "";

        processingRef.current = false;
        speakingRef.current = false;
        speakingNowRef.current = false;

        setStateRef.current("listening");

        startRecognition(MIC_RESTART_DELAY);
        scheduleSleepTimer();
      }
    };

    recognition.onerror = (event: any) => {
      console.log("Speech recognition error:", event.error);

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
        startRecognition(800);
      }
    };

    recognition.onend = () => {
      console.log("Microphone recognition session ended.");

      // Restart only when the system explicitly allows it.
      if (
        shouldRestartRef.current &&
        !sleepingRef.current &&
        !processingRef.current &&
        !speakingRef.current &&
        !speakingNowRef.current &&
        !window.speechSynthesis.speaking
      ) {
        startRecognition(300);
      }
    };

    // VoiceListener is mounted only after WakeEngine activates IGRIS.
    startRecognition(700);
    scheduleSleepTimer();

    return () => {
      mountedRef.current = false;
      sleepingRef.current = true;
      shouldRestartRef.current = false;

      clearSleepTimer();
      clearRestartTimer();

      recognition.onstart = null;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;

      try {
        recognition.abort();
      } catch {}

      window.speechSynthesis.cancel();

      speechQueueRef.current = [];
      sentenceBufferRef.current = "";
    };
  }, [language]);

  return null;
}