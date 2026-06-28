'use client';

import { Heart, ImageIcon, Timer, Zap } from 'lucide-react';
import { useStats, type TimeRange } from '@/hooks/useStats';
import StatsCard from './StatsCard';
import DistributionChart from './DistributionChart';
import TrendChart from './TrendChart';
import { StateMessage } from '@/components/StateMessage';
import * as m from '@/paraglide/messages.js';

const timeRanges: { value: TimeRange; label: () => string }[] = [
  { value: '7d', label: m.stats_range7d },
  { value: '30d', label: m.stats_range30d },
  { value: '90d', label: m.stats_range90d },
  { value: 'all', label: m.stats_rangeAll },
];

export default function StatsPage() {
  const { range, setRange, data, loading, error, refresh } = useStats('30d');

  const platformLabels: Record<string, string> = {
    amazon: 'Amazon',
    ebay: 'eBay',
    shopify: 'Shopify',
    etsy: 'Etsy',
    tiktok: 'TikTok',
  };

  const styleLabels: Record<string, string> = {
    lifestyle: m.style_lifestyle_label(),
    professional: m.style_professional_label(),
    luxury: m.style_luxury_label(),
    casual: m.stats_styleCasual(),
  };

  return (
    <div className="workbench-page">
      <div className="workbench-container">
        <header className="mb-8">
          <p className="page-kicker">{m.stats_kicker()}</p>
          <h1 className="page-title mt-2">{m.meta_statsTitle()}</h1>
          <p className="page-description mt-3">{m.stats_description()}</p>
        </header>

        <div className="mb-6 flex flex-wrap gap-2">
          {timeRanges.map((tr) => (
            <button
              key={tr.value}
              onClick={() => setRange(tr.value)}
              className={`segmented-option ${range === tr.value ? 'segmented-option-active' : ''}`}
            >
              {tr.label()}
            </button>
          ))}
        </div>

        {loading && <StateMessage variant="loading" message={m.stats_loading()} />}
        {error && <StateMessage variant="error" message={error} onRetry={refresh} />}

        {data && !loading && data.totalGenerations === 0 && (
          <StateMessage
            variant="empty"
            title={m.stats_emptyTitle()}
            description={m.stats_emptyDescription()}
          />
        )}

        {data && !loading && data.totalGenerations > 0 && (
          <>
            <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatsCard
                title={m.stats_totalGenerations()}
                value={data.totalGenerations}
                subtitle={m.stats_totalGenerationsSubtitle()}
                icon={<Zap className="h-8 w-8" aria-hidden="true" />}
              />
              <StatsCard
                title={m.stats_totalImages()}
                value={data.totalImages}
                subtitle={m.stats_totalImagesSubtitle()}
                icon={<ImageIcon className="h-8 w-8" aria-hidden="true" />}
              />
              <StatsCard
                title={m.stats_avgGenerationTime()}
                value={`${data.avgGenerationTime}s`}
                subtitle={m.stats_avgGenerationTimeSubtitle()}
                icon={<Timer className="h-8 w-8" aria-hidden="true" />}
              />
              <StatsCard
                title={m.stats_favoriteRate()}
                value={`${data.favoriteRate}%`}
                subtitle={m.stats_favoriteRateSubtitle()}
                icon={<Heart className="h-8 w-8" aria-hidden="true" />}
              />
            </div>

            <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <DistributionChart
                data={data.byPlatform.map(p => ({
                  label: platformLabels[p.platform] || p.platform,
                  value: p.count,
                }))}
                title={m.stats_platformDistribution()}
                color="#2563eb"
              />
              <DistributionChart
                data={data.byStyle.map(s => ({
                  label: styleLabels[s.style] || s.style,
                  value: s.count,
                }))}
                title={m.stats_styleDistribution()}
                color="#b45309"
              />
            </div>

            <TrendChart data={data.trend} title={m.stats_generationTrend()} />
          </>
        )}
      </div>
    </div>
  );
}
