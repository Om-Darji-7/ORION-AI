import { useOrionStore } from "../../store/orionStore";

export default function BottomPanel() {
  const currentCommand = useOrionStore((s) => s.command);
  const aiResponse = useOrionStore((s) => s.response);

  return (
    <div 
      className="orion-console"
      style={{ left: 'auto', right: '20px', transform: 'none', width: '500px' }} 
    >
      <span className="prompt">{"ORION >"}</span>
      <span className="typing">
        {/* Dynamic Display Loop: Pehle user ka text dikhega, fir AI ka response */}
        {aiResponse ? aiResponse : (currentCommand ? currentCommand : "Awaiting Command...")}
      </span>
    </div>
  );
}
