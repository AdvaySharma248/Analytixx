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
  const chartColors = isDark ? CHART_COLORS_DARK : CHART_COLORS_LIGHT;
  const strokeColor = isDark ? '#9CA3AF' : '#374151';
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F5';
  const tickColor = isDark ? '#9CA3AF' : '#4B5563';

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
                fill={chartColors[index % chartColors.length]}
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
        <AreaChart data={data} margin={{ top: 20, right: 20, left: 40, bottom: 20 }}>
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity={0.08} />
              <stop offset="100%" stopColor={strokeColor} stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={gridColor} vertical={false} strokeDasharray="0" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fill: tickColor }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: tickColor }}
            axisLine={false}
            tickLine={false}
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
        <LineChart data={data} margin={{ top: 20, right: 20, left: 40, bottom: 20 }}>
          <CartesianGrid stroke={gridColor} vertical={false} strokeDasharray="0" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fill: tickColor }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: tickColor }}
            axisLine={false}
            tickLine={false}
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

  return (
    <ChartContainer config={chartConfig} className="h-[340px] w-full">
      <BarChart data={data} margin={{ top: 20, right: 20, left: 40, bottom: 20 }}>
        <CartesianGrid stroke={gridColor} vertical={false} strokeDasharray="0" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12, fill: tickColor }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: tickColor }}
          axisLine={false}
          tickLine={false}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={52}>
          {data.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={chartColors[index % chartColors.length]}
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
