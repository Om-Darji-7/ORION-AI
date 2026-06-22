import { useEffect, useRef } from "react";
import { useOrionStore } from "../../store/orionStore";

export default function VoiceListener() {
  const setCommand = useOrionStore((s) => s.setCommand);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    const startEngine = () => {
      if (recognitionRef.current) return;

      const rec = new SR();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = "en-US";

      rec.onresult = (event: any) => {
        const text = event.results[event.results.length - 1][0].transcript;
        console.log("🎤 ORION DETECTED TEXT:", text);
        setCommand(text);
      };

      rec.onend = () => {
        // Safe continuous restart chain block
        recognitionRef.current = null;
        if ((window as any).__orion_active_guard__) {
          startEngine();
        }
      };

      rec.onerror = (event: any) => {
        console.log("Speech Engine Update Status:", event.error);
        
        // 🔥 Force Restart on Timeout/No-Speech safely
        if (event.error === "no-speech" || event.error === "aborted") {
          rec.stop(); // Safe cycle reset mapping
        }
      };

      recognitionRef.current = rec;
      try {
        rec.start();
      } catch (e) {
        // Catch quiet frames safely
      }
    };

    // Initialize global status check wrapper
    (window as any).规律_active_guard__ = true;
    (window as any).__orion_active_guard__ = true;
    startEngine();

    return () => {
      (window as any).__orion_active_guard__ = false;
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, [setCommand]);

  return null;
}
