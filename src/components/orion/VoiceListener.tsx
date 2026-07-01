import { useEffect, useRef } from "react";
import { askOrion } from "../../services/orionAPI";
import { useOrionStore } from "../../store/orionStore";

function speak(text: string): Promise<void> {
  return new Promise((resolve) => {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    const voices = window.speechSynthesis.getVoices();

    const voice =
      voices.find((v) => v.lang.startsWith("en")) ||
      voices[0];

    if (voice) utterance.voice = voice;

    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onend = () => resolve();

    window.speechSynthesis.speak(utterance);
  });
}

export default function VoiceListener() {

  const recognitionRef = useRef<any>(null);

  const speakingRef = useRef(false);

  const setState = useOrionStore((s) => s.setState);

  const setTranscript = useOrionStore((s) => s.setTranscript);

  const setResponse = useOrionStore((s) => s.setResponse);

  useEffect(() => {

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {

      alert("Speech Recognition not supported.");

      return;

    }

    const recognition = new SpeechRecognition();

    recognition.continuous = true;

    recognition.interimResults = false;

    recognition.lang = "en-US";

    recognitionRef.current = recognition;

    recognition.onstart = () => {

      setState("listening");

      console.log("🎤 Listening...");

    };

    recognition.onresult = async (event: any) => {

      if (speakingRef.current) return;

      const text =
        event.results[event.results.length - 1][0].transcript.trim();

      if (!text) return;

      recognition.stop();

      setTranscript(text);

      setState("thinking");

      console.log("USER:", text);

      try {

        const reply = await askOrion(text);

        setResponse(reply);

        setState("speaking");

        speakingRef.current = true;

        console.log("ORION:", reply);

        await speak(reply);

      } catch (err) {

        console.error(err);

        await speak("Connection error.");

      }

      speakingRef.current = false;

      recognition.start();

    };

    recognition.onerror = (e: any) => {

      console.log(e.error);

    };

    recognition.onend = () => {

  console.log("Recognition Ended");

};
    recognition.start();

    return () => {

      recognition.stop();

    };

  }, []);

  return null;

}