interface DataPoint {
  date: string;
  pnl: number;
}

interface SimpleLineChartProps {
  data: DataPoint[];
}

export function SimpleLineChart({ data }: SimpleLineChartProps) {
  if (data.length === 0) return null;

  const maxValue = Math.max(...data.map(d => d.pnl));
  const minValue = Math.min(...data.map(d => d.pnl));
  const range = maxValue - minValue;
  const padding = 20;

  const width = 100;
  const height = 80;

  const points = data.map((point, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((point.pnl - minValue) / range) * (height - padding);
    return { x, y, value: point.pnl };
  });

  const pathData = points.map((p, i) => 
    i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`
  ).join(' ');

  return (
    <div className="relative w-full h-[300px] flex items-center justify-center">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((y) => (
          <line
            key={y}
            x1="0"
            y1={y}
            x2={width}
            y2={y}
            stroke="rgba(255,255,255,0.1)"
            strokeDasharray="2,2"
          />
        ))}

        {/* Area under curve */}
        <defs>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <path
          d={`${pathData} L ${width} ${height} L 0 ${height} Z`}
          fill="url(#lineGradient)"
        />

        {/* Line */}
        <path
          d={pathData}
          fill="none"
          stroke="#0EA5E9"
          strokeWidth="0.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Points */}
        {points.map((point, index) => (
          <g key={index}>
            <circle
              cx={point.x}
              cy={point.y}
              r="0.8"
              fill="#0EA5E9"
              className="hover:r-1.5 transition-all cursor-pointer"
            />
          </g>
        ))}
      </svg>

      {/* X-axis labels */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between px-4 text-xs text-muted-foreground">
        {data.map((d, i) => (
          i % Math.floor(data.length / 6) === 0 ? (
            <span key={i}>{d.date}</span>
          ) : null
        ))}
      </div>

      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-muted-foreground pr-2">
        <span>₹{Math.round(maxValue/1000)}k</span>
        <span>₹{Math.round(minValue/1000)}k</span>
      </div>
    </div>
  );
}
