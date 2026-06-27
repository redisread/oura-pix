'use client';

import { Heart, ImageIcon, Timer, Zap } from 'lucide-react';
import { useStats, type TimeRange } from '@/hooks/useStats';
import StatsCard from './StatsCard';
import DistributionChart from './DistributionChart';
import TrendChart from './TrendChart';
import { StateMessage } from '@/components/StateMessage';

const timeRanges: { value: TimeRange; label: string }[] = [
  { value: '7d', label: '近7天' },
  { value: '30d', label: '近30天' },
  { value: '90d', label: '近90天' },
  { value: 'all', label: '全部' },
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
    lifestyle: '生活方式',
    professional: '专业',
    luxury: '奢华',
    casual: '休闲',
  };

  return (
    <div className="workbench-page">
      <div className="workbench-container">
        <header className="mb-8">
          <p className="page-kicker">Analytics / Generation stats</p>
          <h1 className="page-title mt-2">生成统计</h1>
          <p className="page-description mt-3">查看您的生成历史数据分析</p>
        </header>

        <div className="mb-6 flex flex-wrap gap-2">
          {timeRanges.map((tr) => (
            <button
              key={tr.value}
              onClick={() => setRange(tr.value)}
              className={`segmented-option ${range === tr.value ? 'segmented-option-active' : ''}`}
            >
              {tr.label}
            </button>
          ))}
        </div>

        {loading && <StateMessage variant="loading" message="加载统计数据..." />}
        {error && <StateMessage variant="error" message={error} onRetry={refresh} />}

        {data && !loading && data.totalGenerations === 0 && (
          <StateMessage
            variant="empty"
            title="暂无统计数据"
            description="开始生成商品图片后，统计数据将在这里展示"
          />
        )}

        {data && !loading && data.totalGenerations > 0 && (
          <>
            <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatsCard
                title="总生成次数"
                value={data.totalGenerations}
                subtitle="AI 生成任务总数"
                icon={<Zap className="h-8 w-8" aria-hidden="true" />}
              />
              <StatsCard
                title="总图片数"
                value={data.totalImages}
                subtitle="生成的图片总数"
                icon={<ImageIcon className="h-8 w-8" aria-hidden="true" />}
              />
              <StatsCard
                title="平均生成时间"
                value={`${data.avgGenerationTime}s`}
                subtitle="每次生成的平均耗时"
                icon={<Timer className="h-8 w-8" aria-hidden="true" />}
              />
              <StatsCard
                title="收藏率"
                value={`${data.favoriteRate}%`}
                subtitle="收藏图片占比"
                icon={<Heart className="h-8 w-8" aria-hidden="true" />}
              />
            </div>

            <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <DistributionChart
                data={data.byPlatform.map(p => ({
                  label: platformLabels[p.platform] || p.platform,
                  value: p.count,
                }))}
                title="平台分布"
                color="#2563eb"
              />
              <DistributionChart
                data={data.byStyle.map(s => ({
                  label: styleLabels[s.style] || s.style,
                  value: s.count,
                }))}
                title="风格分布"
                color="#b45309"
              />
            </div>

            <TrendChart data={data.trend} title="生成趋势" />
          </>
        )}
      </div>
    </div>
  );
}
