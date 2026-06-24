import { useEffect, useRef } from "react";
import { useOrionStore } from "../../store/orionStore";

const commandRoutes = [
  {
    labels: ["open vs code", "open visual studio code", "start vs code"],
    title: "VS Code",
    response: "VS Code intent detected. Local automation route is ready."
  },
  {
    labels: ["open chrome", "start chrome", "launch chrome"],
    title: "Chrome",
    response: "Chrome intent detected. Browser launch route is ready."
  }
];

function speak(message: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel(); 
  const utterance = new SpeechSynthesisUtterance(message);
  const voices = window.speechSynthesis.getVoices();
  const pureHumanVoice = voices.find(v => 
    v.name.toLowerCase().includes("natural") ||       
    v.name.toLowerCase().includes("google us english") || 
    v.name.toLowerCase().includes("guy") ||           
    v.name.toLowerCase().includes("aria")             
  ) || voices.find(v => v.lang.startsWith("en-"));    

  if (pureHumanVoice) utterance.voice = pureHumanVoice;
  utterance.rate = 1.0;   
  utterance.pitch = 1.0;  
  window.speechSynthesis.speak(utterance);
}

async function askLocalAI(prompt: string, setResponse: (res: string) => void) {
  try {
    setResponse("Thinking...");
    const res = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "deepseek-r1:1.5b",
        prompt: `You are ORION, a premium cybernetic AI assistant. Respond to the user request shortly, crisply and professionally in 1-2 lines maximum. Do not include thinking tags. User: ${prompt}`,
        stream: false
      })
    });

    const data = await res.json();
    let aiAnswer = data.response || "No response received.";
    aiAnswer = aiAnswer.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

    console.log("🤖 ORION RESPONSE:", aiAnswer);
    setResponse(aiAnswer);
    speak(aiAnswer);
  } catch (error) {
    console.error("Ollama connection error:", error);
    const fallbackMsg = "Connection to local brain failed.";
    setResponse(fallbackMsg);
    speak(fallbackMsg);
  }
}

export default function VoiceListener() {
  const setCommand = useOrionStore((s) => s.setCommand);
  const setResponse = useOrionStore((s) => s.setResponse);
  const setVoiceActive = useOrionStore((s) => s.setVoiceActive);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    const startEngine = () => {
      if (recognitionRef.current) return;

      const rec = new SR();
      rec.continuous = true;
      rec.interimResults = false; // Isko safe false rakha taaki freeze na ho browser frame
      rec.lang = "en-US";

      rec.onresult = (event: any) => {
        setVoiceActive(true);
        const resultIndex = event.resultIndex !== undefined ? event.resultIndex : event.results.length - 1;
        const resultRow = event.results[resultIndex];
        if (!resultRow) return;
        
        const text = resultRow[0]?.transcript ? resultRow[0].transcript.trim() : "";
        if (!text) return;

        console.log("🎤 USER SAID:", text);
        setCommand(text);
        setVoiceActive(false);

        const normalized = text.toLowerCase();
        const matchedRoute = commandRoutes.find((route) => 
          route.labels.some((label) => normalized.includes(label))
        );

        if (matchedRoute) {
          setResponse(matchedRoute.response);
          speak(matchedRoute.response);
        } else {
          askLocalAI(text, setResponse);
        }
      };

      rec.onend = () => {
        setVoiceActive(false);
        recognitionRef.current = null;
        if ((window as any).__orion_active_guard__) startEngine();
      };

      rec.onerror = (event: any) => {
        if (event.error === "no-speech" || event.error === "aborted") {
          try { rec.stop(); } catch(e){}
        }
      };

      recognitionRef.current = rec;
      try { rec.start(); } catch (e) {}
    };

    (window as any).__orion_active_guard__ = true;
    startEngine();

    return () => {
      (window as any).__orion_active_guard__ = false;
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        try { recognitionRef.current.stop(); } catch(e){}
      }
    };
  }, [setCommand, setResponse, setVoiceActive]);

  return null;
}
