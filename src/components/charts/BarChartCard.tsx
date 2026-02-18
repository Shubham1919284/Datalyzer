'use client';

import {
    ResponsiveContainer,
    BarChart as RechartsBarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Cell,
} from 'recharts';
import { CHART_COLORS } from '@/lib/utils';
import AnimatedCard from '@/components/AnimatedCard';

interface BarChartCardProps {
    title: string;
    subtitle?: string;
    data: { name: string; value: number }[];
    color?: string;
    horizontal?: boolean;
    delay?: number;
    gradient?: boolean;
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

export default function BarChartCard({
    title,
    subtitle,
    data,
    horizontal = false,
    delay = 0,
    gradient = true,
    chartId,
    onDismiss,
}: BarChartCardProps) {
    const displayData = data.slice(0, 12);
    const primaryColor = gradient ? CHART_COLORS[0] : CHART_COLORS[0];

    return (
        <AnimatedCard
            delay={delay}
            chartId={chartId}
            onDismiss={onDismiss}
            accentColor={primaryColor}
        >
            <div className="mb-4">
                <h3 className="text-base font-semibold text-text">{title}</h3>
                {subtitle && <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>}
            </div>

            <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart
                        data={displayData}
                        layout={horizontal ? 'vertical' : 'horizontal'}
                        margin={{ top: 5, right: 10, left: horizontal ? 60 : -10, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(99, 102, 241, 0.08)" />
                        {horizontal ? (
                            <>
                                <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={55} />
                            </>
                        ) : (
                            <>
                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={{ stroke: '#1e293b' }} tickLine={false} interval={0} angle={-20} textAnchor="end" height={50} />
                                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                            </>
                        )}
                        <Tooltip
                            contentStyle={tooltipStyle}
                            itemStyle={{ color: '#e2e8f0' }}
                            labelStyle={{ color: '#94a3b8', fontWeight: 600, marginBottom: 4 }}
                            cursor={{ fill: 'rgba(99, 102, 241, 0.08)' }}
                        />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={40}>
                            {displayData.map((_, i) => (
                                <Cell
                                    key={i}
                                    fill={gradient ? CHART_COLORS[i % CHART_COLORS.length] : CHART_COLORS[0]}
                                />
                            ))}
                        </Bar>
                    </RechartsBarChart>
                </ResponsiveContainer>
            </div>
        </AnimatedCard>
    );
}
