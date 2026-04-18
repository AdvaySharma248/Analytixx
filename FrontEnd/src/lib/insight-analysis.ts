import type { Dataset, Insight } from '@/types';

type DetailMetric = {
  label: string;
  value: string;
};

export interface DetailedInsight {
  intro: string;
  paragraphs: string[];
  metrics: DetailMetric[];
  closing: string;
}

function formatValue(value: number) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: value >= 100 ? 0 : 2,
  }).format(value);
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function inferMeasureLabel(query: string, dataset: Dataset | null) {
  const normalizedQuery = query.toLowerCase();

  if (normalizedQuery.includes('profit')) return 'profit';
  if (normalizedQuery.includes('discount')) return 'discount';
  if (normalizedQuery.includes('quantity') || normalizedQuery.includes('units')) return 'quantity';
  if (normalizedQuery.includes('count') || normalizedQuery.includes('how many')) return 'records';
  if (normalizedQuery.includes('revenue') || normalizedQuery.includes('sales')) return 'sales';

  const fallbackColumns = dataset?.columns ?? [];
  if (fallbackColumns.includes('Sales')) return 'sales';
  if (fallbackColumns.includes('Profit')) return 'profit';
  if (fallbackColumns.includes('Quantity')) return 'quantity';

  return 'value';
}

function buildSingleValueDetail(insight: Insight, dataset: Dataset | null, measure: string): DetailedInsight {
  const onlyPoint = insight.chartData[0];

  return {
    intro: insight.summary,
    paragraphs: [
      `This result is an overall ${measure} snapshot rather than a breakdown, so the answer resolves to one aggregated figure.`,
      `The query returned ${formatValue(onlyPoint.value)} from a dataset containing ${dataset?.rowCount ?? 'the available'} rows, which is useful when you want the headline number before drilling deeper.`,
    ],
    metrics: [
      { label: 'Answer', value: formatValue(onlyPoint.value) },
      { label: 'Rows in dataset', value: String(dataset?.rowCount ?? 'N/A') },
      { label: 'Data points shown', value: String(insight.chartData.length) },
    ],
    closing: 'If you want more context, the next best step is usually to ask for a breakdown by region, category, product, or time period.',
  };
}

function buildTrendDetail(insight: Insight, dataset: Dataset | null, measure: string): DetailedInsight {
  const firstPoint = insight.chartData[0];
  const lastPoint = insight.chartData[insight.chartData.length - 1];
  const peakPoint = insight.chartData.reduce((best, point) => (point.value > best.value ? point : best));
  const lowPoint = insight.chartData.reduce((best, point) => (point.value < best.value ? point : best));
  const change = lastPoint.value - firstPoint.value;
  const changePercent = firstPoint.value !== 0 ? (change / firstPoint.value) * 100 : 0;
  const direction = change >= 0 ? 'increase' : 'decrease';

  return {
    intro: insight.summary,
    paragraphs: [
      `Across ${insight.chartData.length} periods, ${measure} moved from ${formatValue(firstPoint.value)} in ${firstPoint.name} to ${formatValue(lastPoint.value)} in ${lastPoint.name}, which is a ${direction} of ${formatValue(Math.abs(change))}${firstPoint.value !== 0 ? ` (${formatPercent(Math.abs(changePercent))})` : ''}.`,
      `The strongest point in the series was ${peakPoint.name} at ${formatValue(peakPoint.value)}, while the weakest point was ${lowPoint.name} at ${formatValue(lowPoint.value)}. That gives you both the overall direction and the range of movement inside the period.`,
    ],
    metrics: [
      { label: 'Start', value: `${firstPoint.name} · ${formatValue(firstPoint.value)}` },
      { label: 'Latest', value: `${lastPoint.name} · ${formatValue(lastPoint.value)}` },
      { label: 'Net change', value: `${change >= 0 ? '+' : '-'}${formatValue(Math.abs(change))}` },
      { label: 'Rows in dataset', value: String(dataset?.rowCount ?? 'N/A') },
    ],
    closing: 'This kind of answer is strongest for spotting momentum. A useful follow-up is to ask what product, region, or category is driving the change between periods.',
  };
}

function buildBreakdownDetail(insight: Insight, dataset: Dataset | null, measure: string): DetailedInsight {
  const [leader, runnerUp, third] = insight.chartData;
  const total = insight.chartData.reduce((sum, point) => sum + point.value, 0);
  const leaderShare = total > 0 ? (leader.value / total) * 100 : 0;
  const runnerUpGap = runnerUp ? leader.value - runnerUp.value : 0;
  const topThreeShare = third
    ? ((leader.value + (runnerUp?.value ?? 0) + third.value) / total) * 100
    : leaderShare;

  const paragraphs = [
    `${leader.name} is leading the result with ${formatValue(leader.value)} in ${measure}, which represents ${formatPercent(leaderShare)} of the visible total.`,
  ];

  if (runnerUp) {
    paragraphs.push(
      `${leader.name} is ahead of ${runnerUp.name} by ${formatValue(runnerUpGap)}, so the lead is meaningful rather than marginal. The distribution also shows how concentrated the result is across the visible categories.`,
    );
  } else {
    paragraphs.push(
      `Only one category is visible in this result, which means the query or filters narrowed the answer to a single dominant segment.`,
    );
  }

  return {
    intro: insight.summary,
    paragraphs,
    metrics: [
      { label: 'Leader', value: `${leader.name} · ${formatValue(leader.value)}` },
      { label: 'Leader share', value: formatPercent(leaderShare) },
      { label: 'Top 3 share', value: formatPercent(topThreeShare) },
      { label: 'Categories shown', value: String(insight.chartData.length) },
    ],
    closing: 'If you want a fuller picture, the best next question is usually to compare the leader against the runner-up or break the result down by time.',
  };
}

export function buildDetailedInsight(insight: Insight, dataset: Dataset | null): DetailedInsight {
  const measure = inferMeasureLabel(insight.query, dataset);

  if (insight.chartData.length <= 1) {
    return buildSingleValueDetail(insight, dataset, measure);
  }

  if (insight.chartType === 'line' || insight.chartType === 'area' || insight.query.toLowerCase().includes('month')) {
    return buildTrendDetail(insight, dataset, measure);
  }

  return buildBreakdownDetail(insight, dataset, measure);
}
