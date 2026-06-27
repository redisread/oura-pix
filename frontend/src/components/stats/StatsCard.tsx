/**
 * StatsCard Component
 *
 * Displays a single statistics metric
 */

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
}

export default function StatsCard({ title, value, subtitle, icon }: StatsCardProps) {
  return (
    <div className="bg-white dark:bg-stone-800 rounded-lg shadow-sm border border-stone-200 dark:border-stone-700 p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-stone-600 dark:text-stone-400 mb-1">
            {title}
          </p>
          <p className="text-3xl font-bold text-stone-900 dark:text-stone-100">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-stone-500 dark:text-stone-500 mt-2">
              {subtitle}
            </p>
          )}
        </div>
        {icon && (
          <div className="text-amber-600 dark:text-amber-500">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
