interface DataPoint {
  strategy: string;
  effectiveness: number;
}

interface SimpleRadarChartProps {
  data: DataPoint[];
}

export function SimpleRadarChart({ data }: SimpleRadarChartProps) {
  const centerX = 150;
  const centerY = 150;
  const maxRadius = 120;
  const numPoints = data.length;

  // Calculate polygon points
  const points = data.map((item, index) => {
    const angle = (index / numPoints) * 2 * Math.PI - Math.PI / 2;
    const radius = (item.effectiveness / 100) * maxRadius;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
      labelX: centerX + (maxRadius + 30) * Math.cos(angle),
      labelY: centerY + (maxRadius + 30) * Math.sin(angle),
      label: item.strategy,
      value: item.effectiveness,
    };
  });

  const polygonPoints = points.map(p => `${p.x},${p.y}`).join(' ');

  // Grid circles
  const gridCircles = [25, 50, 75, 100];

  return (
    <div className="w-full h-[300px] flex items-center justify-center">
      <svg viewBox="0 0 300 300" className="w-full h-full max-w-[300px]">
        {/* Grid circles */}
        {gridCircles.map((percent) => (
          <circle
            key={percent}
            cx={centerX}
            cy={centerY}
            r={(percent / 100) * maxRadius}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
          />
        ))}

        {/* Grid lines */}
        {points.map((point, index) => (
          <line
            key={index}
            x1={centerX}
            y1={centerY}
            x2={point.labelX}
            y2={point.labelY}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
          />
        ))}

        {/* Data polygon */}
        <defs>
          <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#ec4899" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        <polygon
          points={polygonPoints}
          fill="url(#radarGradient)"
          stroke="#8b5cf6"
          strokeWidth="2"
        />

        {/* Data points */}
        {points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="4"
            fill="#8b5cf6"
            className="hover:r-6 transition-all cursor-pointer"
          />
        ))}

        {/* Labels */}
        {points.map((point, index) => (
          <text
            key={index}
            x={point.labelX}
            y={point.labelY}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-xs fill-muted-foreground"
            fontSize="11"
          >
            {point.label}
          </text>
        ))}
      </svg>
    </div>
  );
}
