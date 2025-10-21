interface DataPoint {
  range: string;
  count: number;
}

interface SimpleBarChartProps {
  data: DataPoint[];
}

export function SimpleBarChart({ data }: SimpleBarChartProps) {
  const maxCount = Math.max(...data.map(d => d.count));

  return (
    <div className="w-full h-[300px] flex items-end justify-around gap-2 px-4 py-4">
      {data.map((item, index) => {
        const height = (item.count / maxCount) * 100;
        return (
          <div key={index} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full flex flex-col items-center justify-end" style={{ height: '240px' }}>
              <div className="text-xs text-muted-foreground mb-1">{item.count}</div>
              <div
                className="w-full bg-gradient-to-t from-green-500/80 to-green-500/30 rounded-t-lg transition-all hover:from-green-500 hover:to-green-500/50 cursor-pointer"
                style={{ height: `${height}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground text-center transform -rotate-45 origin-top-left w-16 truncate">
              {item.range}
            </span>
          </div>
        );
      })}
    </div>
  );
}
