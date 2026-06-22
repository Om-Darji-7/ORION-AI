import { useEffect, useState } from "react";

export default function LeftPanel() {
  const [cpu, setCpu] = useState(42);
  const [gpu, setGpu] = useState(61);

  useEffect(() => {
    const t = setInterval(() => {
      setCpu(35 + Math.floor(Math.random() * 20));
      setGpu(50 + Math.floor(Math.random() * 25));
    }, 2000);

    return () => clearInterval(t);
  }, []);

  return (
    <div className="left-panel">
      <h3>CORE</h3>

      <p>CPU : {cpu}%</p>
      <p>GPU : {gpu}%</p>
      <p>RAM : 13.8 GB</p>
    </div>
  );
}