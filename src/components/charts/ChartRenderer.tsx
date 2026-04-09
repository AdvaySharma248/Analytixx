'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

const CHART_COLORS_LIGHT = [
  '#374151',
  '#6B7280',
  '#9CA3AF',
  '#D1D5DB',
  '#4B5563',
  '#78716C',
  '#A8A29E',
  '#57534E',
];

const CHART_COLORS_DARK = [
  '#9CA3AF',
  '#D1D5DB',
  '#6B7280',
  '#E5E7EB',
  '#78716C',
  '#A8A29E',
  '#4B5563',
  '#9CA3AF',
];

interface ChartRendererProps {
  data: { name: string; value: number; [key: string]: string | number }[];
  chartType: 'bar' | 'line' | 'pie' | 'area';
}

export default function ChartRenderer({ data, chartType }: ChartRendererProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const CHART_COLORS = isDark ? CHART_COLORS_DARK : CHART_COLORS_LIGHT;
  const strokeColor = isDark ? '#9CA3AF' : '#374151';
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F5';
  const tickColor = isDark ? '#6B7280' : '#9CA3AF';
  const areaGradStart = isDark ? 'rgba(156,163,175,0.08)' : 'rgba(55,65,81,0.08)';
  const areaGradEnd = isDark ? 'rgba(156,163,175,0.01)' : 'rgba(55,65,81,0.01)';

  const chartConfig: ChartConfig = {
    value: {
      label: 'Value',
      color: strokeColor,
    },
  };

  if (!data || data.length === 0) return null;

  if (chartType === 'pie') {
    return (
      <ChartContainer config={chartConfig} className="h-[340px] w-full">
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent />} />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={120}
            paddingAngle={2}
            strokeWidth={0}
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={CHART_COLORS[index % CHART_COLORS.length]}
              />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
    );
  }

  if (chartType === 'area') {
    return (
      <ChartContainer config={chartConfig} className="h-[340px] w-full">
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isDark ? '#9CA3AF' : '#374151'} stopOpacity={0.08} />
              <stop offset="100%" stopColor={isDark ? '#9CA3AF' : '#374151'} stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={gridColor} vertical={false} strokeDasharray="0" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: tickColor }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: tickColor }}
            axisLine={false}
            tickLine={false}
            width={45}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={strokeColor}
            strokeWidth={2}
            fill="url(#areaGradient)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: strokeColor }}
          />
        </AreaChart>
      </ChartContainer>
    );
  }

  if (chartType === 'line') {
    return (
      <ChartContainer config={chartConfig} className="h-[340px] w-full">
        <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid stroke={gridColor} vertical={false} strokeDasharray="0" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: tickColor }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: tickColor }}
            axisLine={false}
            tickLine={false}
            width={45}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Line
            type="monotone"
            dataKey="value"
            stroke={strokeColor}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: strokeColor }}
          />
        </LineChart>
      </ChartContainer>
    );
  }

  // Default: bar chart
  return (
    <ChartContainer config={chartConfig} className="h-[340px] w-full">
      <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid stroke={gridColor} vertical={false} strokeDasharray="0" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: tickColor }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: tickColor }}
          axisLine={false}
          tickLine={false}
          width={45}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={52}>
          {data.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={CHART_COLORS[index % CHART_COLORS.length]}
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
