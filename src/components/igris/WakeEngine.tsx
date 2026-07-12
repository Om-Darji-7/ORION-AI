import { useEffect, useRef } from "react";
import { speakIgris } from "../../services/voiceService";
import { useOrionStore } from "../../store/orionStore";

interface Props {
  language: string;
  onWake: () => void;
}

const WAKE_PHRASES = [
  "igris",
  "hey igris",
  "hello igris",
  "wake up igris",
  "ok igris",
  "listen igris",

  // Common Chrome misrecognitions
  "hey idris",
  "hello idris",
  "wake up idris",
  "hey egress",
  "hello egress",
  "wake up egress",
];

const MIN_CLAP_GAP = 220;
const MAX_CLAP_GAP = 900;
const CLAP_DEBOUNCE = 180;

export default function WakeEngine({ language, onWake }: Props) {
  const recognitionRef = useRef<any>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const animationFrameRef = useRef<number | null>(null);

  const awakenedRef = useRef(false);
  const mountedRef = useRef(true);

  const firstClapTimeRef = useRef<number | null>(null);
  const lastClapTimeRef = useRef(0);
  const noiseFloorRef = useRef(0.015);

  function stopSpeechWake() {
    const recognition = recognitionRef.current;

    if (!recognition) return;

    recognition.onstart = null;
    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;

    try {
      recognition.abort();
    } catch {}

    recognitionRef.current = null;
  }

  function stopClapDetector() {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    try {
      sourceRef.current?.disconnect();
    } catch {}

    try {
      analyserRef.current?.disconnect();
    } catch {}

    mediaStreamRef.current?.getTracks().forEach((track) => {
      track.stop();
    });

    mediaStreamRef.current = null;
    sourceRef.current = null;
    analyserRef.current = null;

    const audioContext = audioContextRef.current;

    if (audioContext && audioContext.state !== "closed") {
      void audioContext.close();
    }

    audioContextRef.current = null;
  }

async function speakWakeGreeting(
  source: "voice" | "double-clap"
): Promise<void> {
  const message =
    source === "double-clap"
      ? "Hello Lucifer, how can I help you today?"
      : "Yes Lucifer, I'm listening.";

  // Greeting ko HUD/chat me show karo.
  const store = useOrionStore.getState();

  store.setTranscript("");
  store.setResponse(message);
  store.setState("speaking");

  await speakIgris(message, {
    rate: 1.05,
    pitch: 1,
    volume: 1,
    cancelBeforeSpeak: true,
  });
}

async function triggerWake(
  source: "voice" | "double-clap"
) {
  if (awakenedRef.current || !mountedRef.current) return;

  awakenedRef.current = true;

  console.log(
    source === "double-clap"
      ? "👏👏 Double clap detected — IGRIS activated"
      : "🗣️ Wake phrase detected — IGRIS activated"
  );

  stopSpeechWake();
  stopClapDetector();

  await speakWakeGreeting(source);

  if (!mountedRef.current) return;

  window.setTimeout(() => {
    if (!mountedRef.current) return;

    useOrionStore.getState().setState("listening");
    onWake();
  }, 500);
}

  function startSpeechWake() {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("SpeechRecognition is unavailable.");
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = language;

    recognitionRef.current = recognition;

    recognition.onstart = () => {
      console.log("🟢 Voice wake listener running");
    };

    recognition.onresult = (event: any) => {
      if (awakenedRef.current) return;

      const index = event.resultIndex;
      const result = event.results?.[index]?.[0];

      if (!result?.transcript) return;

      const transcript = result.transcript
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .trim();

      console.log("Wake heard:", transcript);

      const matched = WAKE_PHRASES.some((phrase) => {
        return transcript.includes(phrase);
      });

      if (matched) {
        triggerWake("voice");
      }
    };

    recognition.onerror = (event: any) => {
      if (
        event.error === "aborted" ||
        event.error === "no-speech"
      ) {
        return;
      }

      console.log("Wake recognition error:", event.error);
    };

    recognition.onend = () => {
      if (!mountedRef.current || awakenedRef.current) return;

      window.setTimeout(() => {
        if (!mountedRef.current || awakenedRef.current) return;

        try {
          recognition.start();
        } catch {}
      }, 300);
    };

    try {
      recognition.start();
    } catch {}
  }

  async function startClapDetector() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
          channelCount: 1,
        },
      });

      if (!mountedRef.current || awakenedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      mediaStreamRef.current = stream;

      const AudioContextConstructor =
        window.AudioContext ||
        (window as any).webkitAudioContext;

      const audioContext = new AudioContextConstructor();

      audioContextRef.current = audioContext;

      if (audioContext.state === "suspended") {
        try {
          await audioContext.resume();
        } catch {}
      }

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();

      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.05;

      source.connect(analyser);

      sourceRef.current = source;
      analyserRef.current = analyser;

      const timeData = new Float32Array(analyser.fftSize);
      const frequencyData = new Uint8Array(
        analyser.frequencyBinCount
      );

      const sampleRate = audioContext.sampleRate;
      const binFrequency =
        sampleRate / analyser.fftSize;

      function averageFrequencyRange(
        minimumFrequency: number,
        maximumFrequency: number
      ) {
        const startBin = Math.max(
          0,
          Math.floor(minimumFrequency / binFrequency)
        );

        const endBin = Math.min(
          frequencyData.length - 1,
          Math.ceil(maximumFrequency / binFrequency)
        );

        let total = 0;
        let count = 0;

        for (let index = startBin; index <= endBin; index++) {
          total += frequencyData[index];
          count++;
        }

        return count > 0 ? total / count : 0;
      }

      function detectAudioFrame() {
        if (
          !mountedRef.current ||
          awakenedRef.current ||
          !analyserRef.current
        ) {
          return;
        }

        analyser.getFloatTimeDomainData(timeData);
        analyser.getByteFrequencyData(frequencyData);

        let squareTotal = 0;
        let peak = 0;

        for (let index = 0; index < timeData.length; index++) {
          const sample = Math.abs(timeData[index]);

          squareTotal += sample * sample;

          if (sample > peak) {
            peak = sample;
          }
        }

        const rms = Math.sqrt(squareTotal / timeData.length);

        const currentNoiseFloor = noiseFloorRef.current;

        // Slowly learn normal background noise.
        if (rms < currentNoiseFloor * 2.5) {
          noiseFloorRef.current =
            currentNoiseFloor * 0.97 + rms * 0.03;
        }

        const adaptiveRmsThreshold = Math.max(
          0.055,
          noiseFloorRef.current * 4.5
        );

        const adaptivePeakThreshold = Math.max(
          0.3,
          noiseFloorRef.current * 9
        );

        const lowFrequencyEnergy =
          averageFrequencyRange(100, 1200);

        const highFrequencyEnergy =
          averageFrequencyRange(2000, 8000);

        const crestFactor =
          rms > 0 ? peak / rms : 0;

        const isSharpTransient =
          crestFactor >= 2.2;

        const hasHighFrequencyContent =
          highFrequencyEnergy >= 28 &&
          highFrequencyEnergy >= lowFrequencyEnergy * 0.8;

        const isClap =
          rms >= adaptiveRmsThreshold &&
          peak >= adaptivePeakThreshold &&
          isSharpTransient &&
          hasHighFrequencyContent;

        const now = performance.now();

        if (
          isClap &&
          now - lastClapTimeRef.current >= CLAP_DEBOUNCE
        ) {
          lastClapTimeRef.current = now;

          const firstClapTime = firstClapTimeRef.current;

          if (firstClapTime === null) {
            firstClapTimeRef.current = now;
            console.log("👏 First clap detected");
          } else {
            const clapGap = now - firstClapTime;

            if (
              clapGap >= MIN_CLAP_GAP &&
              clapGap <= MAX_CLAP_GAP
            ) {
              firstClapTimeRef.current = null;
              triggerWake("double-clap");
              return;
            }

            // Previous clap expired; current clap becomes first.
            firstClapTimeRef.current = now;
            console.log("👏 First clap reset");
          }
        }

        if (
          firstClapTimeRef.current !== null &&
          now - firstClapTimeRef.current > MAX_CLAP_GAP
        ) {
          firstClapTimeRef.current = null;
        }

        animationFrameRef.current =
          requestAnimationFrame(detectAudioFrame);
      }

      console.log("👏 Double-clap detector running");

      detectAudioFrame();
    } catch (error) {
      console.error(
        "Unable to start double-clap detector:",
        error
      );
    }
  }

  useEffect(() => {
    mountedRef.current = true;
    awakenedRef.current = false;

    startSpeechWake();
    void startClapDetector();

    return () => {
      mountedRef.current = false;
      awakenedRef.current = true;

      stopSpeechWake();
      stopClapDetector();
    };
  }, [language]);

  return null;
}