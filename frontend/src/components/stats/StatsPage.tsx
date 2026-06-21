'use client';

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
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100">
            生成统计
          </h1>
          <p className="text-stone-600 dark:text-stone-400 mt-2">
            查看您的生成历史数据分析
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="mb-6 flex gap-2">
          {timeRanges.map((tr) => (
            <button
              key={tr.value}
              onClick={() => setRange(tr.value)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                range === tr.value
                  ? 'bg-amber-600 text-white'
                  : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700'
              }`}
            >
              {tr.label}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && <StateMessage variant="loading" message="加载统计数据..." />}

        {/* Error State */}
        {error && <StateMessage variant="error" message={error} onRetry={refresh} />}

        {/* Empty State */}
        {data && !loading && data.totalGenerations === 0 && (
          <StateMessage
            variant="empty"
            title="暂无统计数据"
            description="开始生成商品图片后，统计数据将在这里展示"
          />
        )}

        {/* Stats Content */}
        {data && !loading && data.totalGenerations > 0 && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatsCard
                title="总生成次数"
                value={data.totalGenerations}
                subtitle="AI 生成任务总数"
                icon={
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                }
              />
              <StatsCard
                title="总图片数"
                value={data.totalImages}
                subtitle="生成的图片总数"
                icon={
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                }
              />
              <StatsCard
                title="平均生成时间"
                value={`${data.avgGenerationTime}s`}
                subtitle="每次生成的平均耗时"
                icon={
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
              <StatsCard
                title="收藏率"
                value={`${data.favoriteRate}%`}
                subtitle="收藏图片占比"
                icon={
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                }
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <DistributionChart
                data={data.byPlatform.map(p => ({
                  label: platformLabels[p.platform] || p.platform,
                  value: p.count,
                }))}
                title="平台分布"
                color="#d97706"
              />
              <DistributionChart
                data={data.byStyle.map(s => ({
                  label: styleLabels[s.style] || s.style,
                  value: s.count,
                }))}
                title="风格分布"
                color="#059669"
              />
            </div>

            <TrendChart
              data={data.trend}
              title="生成趋势"
            />
          </>
        )}
      </div>
    </div>
  );
}
