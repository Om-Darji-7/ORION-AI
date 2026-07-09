import { useEffect, useRef } from "react";
import { streamOrion } from "../../services/orionAPI";
import { useOrionStore } from "../../store/orionStore";

export default function VoiceListener() {
  const recognitionRef = useRef<any>(null);
  const speakingRef = useRef<boolean>(false);
  const speechQueue = useRef<string[]>([]);
  const sentenceBuffer = useRef<string>("");
  const speakingNow = useRef<boolean>(false);
  const fullResponseAccumulator = useRef<string>("");

  // Target global Zustand hooks
  const setState = useOrionStore((s) => s.setState);
  const setTranscript = useOrionStore((s) => s.setTranscript);
  const setResponse = useOrionStore((s) => s.setResponse);

  // Isolate state triggers into static tracking pointers to terminate infinite component execution loops
  const setStateRef = useRef(setState);
  const setTranscriptRef = useRef(setTranscript);
  const setResponseRef = useRef(setResponse);

  useEffect(() => {
    setStateRef.current = setState;
    setTranscriptRef.current = setTranscript;
    setResponseRef.current = setResponse;
  }, [setState, setTranscript, setResponse]);

  // Internal Speech Synthesis Sequence (Wired internally inside component scope to stop scoping crash errors)
  function speak(text: string): Promise<void> {
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      const systemVoices = window.speechSynthesis.getVoices();

      const selectVoice = systemVoices.find((v) => v.lang.startsWith("en")) || systemVoices[0];
      if (selectVoice) utterance.voice = selectVoice;

      utterance.rate = 1.05; // Slightly fast pace for true Jarvis robotic feel
      utterance.pitch = 1.0;

      utterance.onend = () => resolve();
      utterance.onerror = (err) => {
        console.error("Audio device hardware parsing fault:", err);
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  }

  async function speakQueue() {
    if (speakingNow.current) return;
    speakingNow.current = true;

    while (speechQueue.current.length > 0) {
      const sentence = speechQueue.current.shift();
      if (!sentence) continue;
      await speak(sentence);
    }

    speakingNow.current = false;
  }

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition API profile incompatible with this device browser configuration.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setStateRef.current("listening");
      console.log("🎙️ Orion Speech Core Protocol: Listening Active");
    };

    recognition.onresult = async (event: any) => {
      // Loop Guard Interceptor: Stop processing loops if audio playback outputs sound waves
      if (speakingRef.current || window.speechSynthesis.speaking) {
        console.warn("Input dropped to prevent audio echo reflections loop processing.");
        return;
      }

      const inputRawResult = event.results[event.results.length - 1][0].transcript.trim();
      if (!inputRawResult) return;

      // Lock status instantly before execution changes
      speakingRef.current = true;
      recognition.stop();

      // Reset application session pointers
      window.speechSynthesis.cancel();
      speechQueue.current = [];
      speakingNow.current = false;
      sentenceBuffer.current = "";
      fullResponseAccumulator.current = "";

      setTranscriptRef.current(inputRawResult);
      setStateRef.current("thinking");
      console.log("USER COMMAND VECTOR MATCHED:", inputRawResult);

      try {
        setStateRef.current("speaking");

        await streamOrion(
          inputRawResult,
          (token) => {
            // Live absolute tracking HUD setup updates seamlessly
            fullResponseAccumulator.current += token;
            setResponseRef.current(fullResponseAccumulator.current);

            sentenceBuffer.current += token;

            // Low Latency Interceptor Slicing (8-12 word limits or explicit punctuation signals)
            const dynamicWordLength = sentenceBuffer.current.trim().split(/\s+/).length;
            const hasTerminalMark = /[.\?!]/.test(token);
            const hasPauseMark = /[,;:]/.test(token) && dynamicWordLength >= 8;

            if (hasTerminalMark || hasPauseMark || dynamicWordLength >= 12) {
              const isolatedCleanChunk = sentenceBuffer.current.trim();
              if (isolatedCleanChunk.length > 0) {
                speechQueue.current.push(isolatedCleanChunk);
                sentenceBuffer.current = "";
                speakQueue();
              }
            }
          },
          async () => {
            // Drain trailing remaining text elements from memory structures
            if (sentenceBuffer.current.trim().length > 0) {
              speechQueue.current.push(sentenceBuffer.current.trim());
              sentenceBuffer.current = "";
            }

            await speakQueue();

            // Guard interval loop configuration to make sure system outputs are completely dry before recycling mic
            const postSpeechCoolDownMonitor = setInterval(() => {
              if (!window.speechSynthesis.speaking && speechQueue.current.length === 0) {
                clearInterval(postSpeechCoolDownMonitor);
                speakingRef.current = false;
                try {
                  recognition.start();
                } catch (err) {
                  // Prevent immediate operational restart conflicts
                }
              }
            }, 300);
          }
        );
      } catch (err) {
        console.error("Pipeline breakdown Exception:", err);
        await speak("Network handshake error.");
        speakingRef.current = false;
        try {
          recognition.start();
        } catch {}
      }
    };

    recognition.onerror = (e: any) => {
      console.log("Speech engine error code captured:", e.error);
      if (e.error === "aborted" || e.error === "no-speech") return;
    };

    recognition.onend = () => {
      console.log("Microphone endpoint signal disconnected.");
      // Absolute verification check before triggering hardware inputs back alive
      if (!speakingRef.current && !window.speechSynthesis.speaking) {
        try {
          recognition.start();
        } catch {}
      }
    };

    // Fire application engine safe start setup configuration
    try {
      recognition.start();
    } catch {}

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null; // Unbind events before cleanup
        recognitionRef.current.stop();
      }
      window.speechSynthesis.cancel();
    };
  }, []); // 100% empty configuration dependencies tracking vector arrays to kill infinite reload loops

  return null;
}
