/**
 * TrendChart Component
 *
 * Line chart for generation trend over time
 */

interface TrendChartProps {
  data: { date: string; count: number }[];
  title: string;
}

export default function TrendChart({ data, title }: TrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-stone-800 rounded-lg shadow-sm border border-stone-200 dark:border-stone-700 p-6">
        <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-4">
          {title}
        </h3>
        <p className="text-sm text-stone-500 dark:text-stone-500 text-center py-8">
          暂无数据
        </p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.count), 1);
  const chartHeight = 200;
  const chartWidth = 100; // percentage
  const padding = 40;

  // Calculate points for the line
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1 || 1)) * chartWidth;
    const y = chartHeight - (d.count / maxValue) * (chartHeight - padding);
    return { x, y, ...d };
  });

  // Create SVG path
  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  // Create area path
  const areaD = `${pathD} L ${points[points.length - 1]?.x || 0} ${chartHeight} L 0 ${chartHeight} Z`;

  return (
    <div className="bg-white dark:bg-stone-800 rounded-lg shadow-sm border border-stone-200 dark:border-stone-700 p-6">
      <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-4">
        {title}
      </h3>

      <div className="relative" style={{ height: `${chartHeight + padding}px` }}>
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${chartWidth} ${chartHeight + padding}`}
          preserveAspectRatio="none"
          className="overflow-visible"
        >
          {/* Grid lines */}
          {[0.25, 0.5, 0.75, 1].map((ratio, i) => (
            <line
              key={i}
              x1={0}
              y1={chartHeight - ratio * (chartHeight - padding)}
              x2={chartWidth}
              y2={chartHeight - ratio * (chartHeight - padding)}
              stroke="currentColor"
              strokeWidth="0.2"
              className="text-stone-200 dark:text-stone-700"
            />
          ))}

          {/* Area fill */}
          <path
            d={areaD}
            fill="url(#gradient)"
            opacity={0.3}
          />

          {/* Line */}
          <path
            d={pathD}
            fill="none"
            stroke="#d97706"
            strokeWidth="1"
            className="drop-shadow-sm"
          />

          {/* Data points */}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="1"
              fill="#d97706"
              className="hover:r-2 transition-all"
            >
              <title>{`${p.date}: ${p.count} 次`}</title>
            </circle>
          ))}

          {/* Gradient definition */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#d97706" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {/* X-axis labels */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-stone-500 dark:text-stone-500">
          {data.length > 0 && (
            <>
              <span>{data[0].date}</span>
              {data.length > 2 && (
                <span>{data[Math.floor(data.length / 2)].date}</span>
              )}
              <span>{data[data.length - 1].date}</span>
            </>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-stone-200 dark:border-stone-700">
        <div className="flex justify-between text-sm">
          <span className="text-stone-600 dark:text-stone-400">总计</span>
          <span className="font-semibold text-stone-900 dark:text-stone-100">
            {data.reduce((sum, d) => sum + d.count, 0)} 次
          </span>
        </div>
        <div className="flex justify-between text-sm mt-2">
          <span className="text-stone-600 dark:text-stone-400">平均</span>
          <span className="font-semibold text-stone-900 dark:text-stone-100">
            {(data.reduce((sum, d) => sum + d.count, 0) / data.length).toFixed(1)} 次/天
          </span>
        </div>
      </div>
    </div>
  );
}
