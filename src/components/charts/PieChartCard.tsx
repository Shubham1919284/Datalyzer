'use client';

import {
    ResponsiveContainer,
    PieChart as RechartsPieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
} from 'recharts';
import { CHART_COLORS } from '@/lib/utils';
import AnimatedCard from '@/components/AnimatedCard';

interface PieChartCardProps {
    title: string;
    subtitle?: string;
    data: { name: string; value: number }[];
    delay?: number;
    donut?: boolean;
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

export default function PieChartCard({
    title,
    subtitle,
    data,
    delay = 0,
    donut = true,
    chartId,
    onDismiss,
}: PieChartCardProps) {
    const displayData = data.slice(0, 8);

    return (
        <AnimatedCard
            delay={delay}
            chartId={chartId}
            onDismiss={onDismiss}
            accentColor={CHART_COLORS[2]}
        >
            <div className="mb-4">
                <h3 className="text-base font-semibold text-text">{title}</h3>
                {subtitle && <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>}
            </div>

            <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                        <Pie
                            data={displayData}
                            cx="50%"
                            cy="50%"
                            innerRadius={donut ? 60 : 0}
                            outerRadius={100}
                            paddingAngle={3}
                            dataKey="value"
                            stroke="rgba(10, 15, 30, 0.5)"
                            strokeWidth={2}
                            animationBegin={delay * 100}
                            animationDuration={800}
                        >
                            {displayData.map((_, i) => (
                                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={tooltipStyle}
                            itemStyle={{ color: '#e2e8f0' }}
                            labelStyle={{ color: '#94a3b8', fontWeight: 600 }}
                        />
                        <Legend
                            wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }}
                            iconType="circle"
                            iconSize={8}
                            formatter={(value: string) => (
                                <span style={{ color: '#cbd5e1', fontSize: '11px' }}>{value}</span>
                            )}
                        />
                    </RechartsPieChart>
                </ResponsiveContainer>
            </div>
        </AnimatedCard>
    );
}
