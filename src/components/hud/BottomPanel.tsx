import { useOrionStore } from "../../store/orionStore";

export default function BottomPanel() {
  // 🔥 Global Store se real-time dynamic voice text read karo
  const currentCommand = useOrionStore((s) => s.command);

  return (
    <div 
      className="orion-console"
      style={{ left: 'auto', right: '80px', transform: 'none', width: '1000px' }} 
    >
      <span className="prompt">{"ORION >"}</span>
      
      {/* 🚀 Dynamic Text Swap Block: 
          Agar aap kuch bol rahe hain toh aapka text dikhega, nahi toh default waiting prompt */}
      <span className="typing">
        {currentCommand ? currentCommand : "Awaiting Command..."}
      </span>
    </div>
  );
}
