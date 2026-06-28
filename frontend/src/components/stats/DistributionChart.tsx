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
    <div className="bg-white dark:bg-stone-800 rounded-lg shadow-sm border border-stone-200 dark:border-stone-700 p-6">
      <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-4">
        {title}
      </h3>

      <div className="space-y-3">
        {data.map((item, index) => {
          const percentage = (item.value / maxValue) * 100;
          const actualPercentage = total > 0 ? (item.value / total) * 100 : 0;

          return (
            <div key={index}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
                  {item.label}
                </span>
                <span className="text-sm text-stone-600 dark:text-stone-400">
                  {item.value} ({actualPercentage.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-stone-200 dark:bg-stone-700 rounded-full h-2">
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
        <p className="text-sm text-stone-500 dark:text-stone-500 text-center py-8">
          {m.stats_noData()}
        </p>
      )}
    </div>
  );
}
