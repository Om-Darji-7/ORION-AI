import { useOrionStore } from "../../store/orionStore";

export default function BottomPanel() {
  const command =
    useOrionStore((s) => s.command);

  return (
    <div className="orion-console">
      <span className="prompt">
        ORION &gt;
      </span>

      <span>
        {command || "Listening..."}
      </span>
    </div>
  );
}