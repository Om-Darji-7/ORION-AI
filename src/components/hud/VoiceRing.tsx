import { useEffect, useState } from "react";
import { useOrionStore } from "../../store/orionStore";

export default function VoiceRing() {
  const currentCommand = useOrionStore((s) => s.command); // Store string watch data target
  const [pulse, setPulse] = useState(0);

  // Jab bhi naya command detect hoga, ring high ripple wave pulse generate karegi
  useEffect(() => {
    if (!currentCommand) return;
    
    // Simulates an energetic audio frequency jump waveform loop
    setPulse(1);
    const t = setInterval(() => {
      setPulse((p) => (p > 0.05 ? p * 0.88 : 0));
    }, 30);

    return () => clearInterval(t);
  }, [currentCommand]);

  const scale = 1 + pulse * 0.35;

  return (
    <div
      className="voice-ring"
      style={{
        position: "absolute",
        top: "43%",
        left: "50%",
        transform: `translate(-50%, -50%) scale(${scale})`,
        width: 0,
        height: 0,
        zIndex: 1005,
        pointerEvents: "none"
      }}
    >
      {Array.from({ length: 64 }).map((_, i) => (
        <span
          key={i}
          className="voice-bar"
          style={{
            transform: `rotate(${i * 5.625}deg) translateY(-140px)`,
            // Bars will spike layout dynamics based on system word captures
            height: `${12 + pulse * (40 + Math.sin(i * 0.5) * 35)}px`,
            backgroundColor: "#00d9ff",
            transition: pulse > 0 ? "none" : "height 0.4s ease-out"
          }}
        />
      ))}
    </div>
  );
}
