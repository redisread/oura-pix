/**
 * DistributionChart Component
 *
 * Simple bar chart for platform/style distribution
 */

import * as m from '@/paraglide/messages.js';

interface DistributionChartProps {
  data: { label: string; value: number }[];
  title: string;
  color?: string;
}

export default function DistributionChart({ data, title, color = '#d97706' }: DistributionChartProps) {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="panel p-6">
      <h3 className="mb-4 text-lg font-semibold text-foreground">
        {title}
      </h3>

      <div className="space-y-3">
        {data.map((item, index) => {
          const percentage = (item.value / maxValue) * 100;
          const actualPercentage = total > 0 ? (item.value / total) * 100 : 0;

          return (
            <div key={index}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-foreground">
                  {item.label}
                </span>
                <span className="font-utility text-sm text-foreground-muted">
                  {item.value} ({actualPercentage.toFixed(1)}%)
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-[hsl(var(--secondary))]">
                <div
                  className="h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {data.length === 0 && (
        <p className="py-8 text-center text-sm text-foreground-muted">{m.stats_noData()}</p>
      )}
    </div>
  );
}
