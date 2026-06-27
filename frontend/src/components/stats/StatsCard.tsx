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
    <div className="panel p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="mb-1 text-sm font-medium text-foreground-muted">
            {title}
          </p>
          <p className="font-utility text-3xl font-semibold text-foreground">
            {value}
          </p>
          {subtitle && (
            <p className="mt-2 text-xs text-foreground-muted">
              {subtitle}
            </p>
          )}
        </div>
        {icon && (
          <div className="text-[hsl(var(--primary))]">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
