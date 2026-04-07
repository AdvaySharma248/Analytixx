'use client';

import React from 'react';
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

const CHART_COLORS = [
  '#6366F1',
  '#94A3B8',
  '#6EE7B7',
  '#FCD34D',
  '#F87171',
  '#A78BFA',
  '#34D399',
  '#FBBF24',
];

const chartConfig: ChartConfig = {
  value: {
    label: 'Value',
    color: '#6366F1',
  },
};

interface ChartRendererProps {
  data: { name: string; value: number; [key: string]: string | number }[];
  chartType: 'bar' | 'line' | 'pie' | 'area';
}

export default function ChartRenderer({ data, chartType }: ChartRendererProps) {
  if (!data || data.length === 0) return null;

  if (chartType === 'pie') {
    return (
      <ChartContainer config={chartConfig} className="h-[260px] w-full">
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent />} />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={95}
            paddingAngle={3}
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
      <ChartContainer config={chartConfig} className="h-[260px] w-full">
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366F1" stopOpacity={0.12} />
              <stop offset="100%" stopColor="#6366F1" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#F0F1F3" vertical={false} strokeDasharray="0" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: '#9CA3AF' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#9CA3AF' }}
            axisLine={false}
            tickLine={false}
            width={45}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#6366F1"
            strokeWidth={2}
            fill="url(#areaGradient)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: '#6366F1' }}
          />
        </AreaChart>
      </ChartContainer>
    );
  }

  if (chartType === 'line') {
    return (
      <ChartContainer config={chartConfig} className="h-[260px] w-full">
        <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid stroke="#F0F1F3" vertical={false} strokeDasharray="0" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: '#9CA3AF' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#9CA3AF' }}
            axisLine={false}
            tickLine={false}
            width={45}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#6366F1"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: '#6366F1' }}
          />
        </LineChart>
      </ChartContainer>
    );
  }

  // Default: bar chart
  return (
    <ChartContainer config={chartConfig} className="h-[260px] w-full">
      <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid stroke="#F0F1F3" vertical={false} strokeDasharray="0" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: '#9CA3AF' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#9CA3AF' }}
          axisLine={false}
          tickLine={false}
          width={45}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={44}>
          {data.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill="#6366F1"
              fillOpacity={index === 0 ? 1 : 0.65 - (index * 0.04)}
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
