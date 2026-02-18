'use client';

import {
    ResponsiveContainer,
    LineChart,
    Line,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from 'recharts';
import { CHART_COLORS } from '@/lib/utils';
import AnimatedCard from '@/components/AnimatedCard';

interface ChartCardProps {
    title: string;
    subtitle?: string;
    data: Record<string, unknown>[];
    xKey: string;
    yKeys: string[];
    type?: 'line' | 'area';
    delay?: number;
    chartId?: string;
    onDismiss?: (id: string) => void;
}

const tooltipStyle = {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    border: '1px solid rgba(99, 102, 241, 0.25)',
    borderRadius: '12px',
    padding: '10px 14px',
    fontSize: '12px',
    color: '#e2e8f0',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(12px)',
};

export default function TrendChart({
    title,
    subtitle,
    data,
    xKey,
    yKeys,
    type = 'area',
    delay = 0,
    chartId,
    onDismiss,
}: ChartCardProps) {
    const ChartComponent = type === 'area' ? AreaChart : LineChart;

    return (
        <AnimatedCard
            delay={delay}
            chartId={chartId}
            onDismiss={onDismiss}
            accentColor={CHART_COLORS[0]}
        >
            <div className="mb-4">
                <h3 className="text-base font-semibold text-text">{title}</h3>
                {subtitle && <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>}
            </div>

            <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                    <ChartComponent data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                        <defs>
                            {yKeys.map((key, i) => (
                                <linearGradient key={key} id={`gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.35} />
                                    <stop offset="95%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.02} />
                                </linearGradient>
                            ))}
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(99, 102, 241, 0.08)" />
                        <XAxis
                            dataKey={xKey}
                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                            tickLine={false}
                            axisLine={{ stroke: '#1e293b' }}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip
                            contentStyle={tooltipStyle}
                            itemStyle={{ color: '#e2e8f0' }}
                            labelStyle={{ color: '#94a3b8', fontWeight: 600, marginBottom: 4 }}
                            cursor={{ stroke: 'rgba(99, 102, 241, 0.3)', strokeWidth: 1 }}
                        />
                        {yKeys.length > 1 && (
                            <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                        )}
                        {yKeys.map((key, i) =>
                            type === 'area' ? (
                                <Area
                                    key={key}
                                    type="monotone"
                                    dataKey={key}
                                    stroke={CHART_COLORS[i % CHART_COLORS.length]}
                                    strokeWidth={2.5}
                                    fill={`url(#gradient-${key})`}
                                    dot={false}
                                    activeDot={{
                                        r: 5,
                                        strokeWidth: 2,
                                        stroke: CHART_COLORS[i % CHART_COLORS.length],
                                        fill: '#0a0f1e',
                                    }}
                                />
                            ) : (
                                <Line
                                    key={key}
                                    type="monotone"
                                    dataKey={key}
                                    stroke={CHART_COLORS[i % CHART_COLORS.length]}
                                    strokeWidth={2.5}
                                    dot={false}
                                    activeDot={{
                                        r: 5,
                                        strokeWidth: 2,
                                        stroke: CHART_COLORS[i % CHART_COLORS.length],
                                        fill: '#0a0f1e',
                                    }}
                                />
                            )
                        )}
                    </ChartComponent>
                </ResponsiveContainer>
            </div>
        </AnimatedCard>
    );
}
