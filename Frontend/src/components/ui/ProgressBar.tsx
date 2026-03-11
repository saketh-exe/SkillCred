interface Props {
  value: number;
  className?: string;
  showLabel?: boolean;
}

function getColor(value: number) {
  if (value >= 75) return 'var(--success)';
  if (value >= 50) return 'var(--warning)';
  return 'var(--danger)';
}

export default function ProgressBar({ value, className = '', showLabel = true }: Props) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex-1 h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${clamped}%`, backgroundColor: getColor(clamped) }}
        />
      </div>
      {showLabel && (
        <span className="font-[var(--font-mono)] text-sm font-medium" style={{ color: getColor(clamped) }}>
          {clamped}%
        </span>
      )}
    </div>
  );
}
