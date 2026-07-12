interface Props {
  value: string;
  onChange: (language: string) => void;
}

export default function SpeechLanguageSelector({
  value,
  onChange,
}: Props) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label="Speech recognition language"
      style={{
        position: "fixed",
        right: "20px",
        bottom: "20px",
        zIndex: 1000,
        padding: "8px 12px",
        borderRadius: "8px",
        background: "rgba(0, 0, 0, 0.75)",
        color: "white",
        border: "1px solid rgba(255,255,255,0.25)",
      }}
    >
      <option value="en-IN">English / Hinglish</option>
      <option value="hi-IN">Hindi</option>
      <option value="gu-IN">Gujarati</option>
      <option value="en-US">English US</option>
      <option value="en-GB">English UK</option>
    </select>
  );
}