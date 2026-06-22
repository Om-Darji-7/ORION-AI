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
  left,
  right,
}: Props) {
  return (
    <div
      className="data-card"
      style={{
        top,
        left,
        right,
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