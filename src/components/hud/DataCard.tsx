type Props = {
  title: string;
  value: string;
  top: number;
  left?: number;
  right?: number;
};

export default function DataCard({
  title,
  value,
  top,
  right,
}: Props) {
  // 🔥 Core Right-Shift Automation Logic:
  // Agar parent component ne left prop pass kiya bhi hai, tab bhi hum use right-side stack (right: 20px) mein force push kar denge
  const finalRight = right !== undefined ? right : 280;

  return (
    <div
      className="data-card"
      style={{
        top: top + 50,
        // left ko completely undefined rakhenge taaki right property activate ho sake
        left: undefined, 
        right: finalRight,
      }}
    >
      <div className="dc-title">
        {title}
      </div>

      <div className="dc-value">
        {value}
      </div>
    </div>
  );
}
