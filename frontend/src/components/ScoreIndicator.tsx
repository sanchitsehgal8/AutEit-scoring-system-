type ScoreIndicatorProps = {
  label: string;
  value: number;
  max?: number;
};

const barColor = (value: number) => {
  if (value >= 4) return 'bg-emerald-400';
  if (value >= 3) return 'bg-amber-400';
  return 'bg-rose-400';
};

function ScoreIndicator({ label, value, max = 5 }: ScoreIndicatorProps) {
  const width = `${(value / max) * 100}%`;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-300">{label}</span>
        <span className="font-medium text-slate-100">
          {value}/{max}
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-800">
        <div className={`h-2 rounded-full ${barColor(value)}`} style={{ width }} />
      </div>
    </div>
  );
}

export default ScoreIndicator;
