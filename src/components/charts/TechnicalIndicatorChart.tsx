"use client";

import type { ChartDataPoint } from '@/types';
import { BarChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Bar } from 'recharts';
import { ChartTooltip, ChartTooltipContent, ChartContainer, ChartConfig } from '@/components/ui/chart';

interface TechnicalIndicatorChartProps {
  data: ChartDataPoint[];
  dataKey: string; // key for 'value' in ChartDataPoint
  name: string;
  color?: string; // HSL string e.g. "hsl(var(--chart-1))"
  type?: 'line' | 'bar';
}

export function TechnicalIndicatorChart({
  data,
  dataKey,
  name,
  color = 'var(--chart-1)',
  type = 'line',
}: TechnicalIndicatorChartProps) {
  
  const chartConfig = {
    [dataKey]: {
      label: name,
      color: color.startsWith('hsl') ? color : `hsl(${color})`, // Ensure HSL format
    },
  } satisfies ChartConfig;

  if (!data || data.length === 0) {
    return <div className="text-center text-muted-foreground p-4">No chart data available.</div>;
  }
  
  // Truncate date labels if they are too long
  const formattedData = data.map(item => ({
    ...item,
    date: item.date.length > 7 ? item.date.substring(5,10) : item.date // Example: YYYY-MM-DD -> MM-DD
  }));


  return (
    <ChartContainer config={chartConfig} className="w-full h-[200px] sm:h-[250px]">
      <ComposedChart accessibilityLayer data={formattedData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis 
          dataKey="date" 
          tickLine={false} 
          axisLine={false} 
          tickMargin={8}
          fontSize={12}
        />
        <YAxis 
          tickLine={false} 
          axisLine={false} 
          tickMargin={8}
          fontSize={12}
          domain={['auto', 'auto']}
        />
        <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent indicator="line" />}
          />
        <Legend />
        {type === 'line' && (
          <Line
            dataKey={dataKey}
            type="monotone"
            stroke={`hsl(${chartConfig[dataKey].color.replace('hsl(','').replace(')','')})`} // Use HSL value directly
            strokeWidth={2}
            dot={false}
            name={name}
          />
        )}
        {type === 'bar' && (
           <Bar 
            dataKey={dataKey} 
            fill={`hsl(${chartConfig[dataKey].color.replace('hsl(','').replace(')','')})`}
            name={name}
            radius={4} 
          />
        )}
      </ComposedChart>
    </ChartContainer>
  );
}
