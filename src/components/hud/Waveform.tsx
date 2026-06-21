export default function Waveform() {
  return (
    <div className="waveform">
      {Array.from({ length: 48 }).map((_, i) => (
        <span
          key={i}
          className="wave-bar"
          style={{
            animationDelay: `${i * 0.05}s`,
          }}
        />
      ))}
    </div>
  );
}