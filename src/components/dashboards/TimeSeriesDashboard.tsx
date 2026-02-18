'use client';

import { ParsedDataset } from '@/lib/types';
import { getTimeSeriesData, aggregateByCategory, getDistribution } from '@/lib/utils';
import KPICard from '@/components/charts/KPICard';
import TrendChart from '@/components/charts/TrendChart';
import BarChartCard from '@/components/charts/BarChartCard';
import DataTable from '@/components/charts/DataTable';
import { CalendarDays, TrendingUp, BarChart3, Activity } from 'lucide-react';

interface TimeSeriesDashboardProps {
    dataset: ParsedDataset;
}

export default function TimeSeriesDashboard({ dataset }: TimeSeriesDashboardProps) {
    const { data, metadata, classification } = dataset;
    const { dateColumns, numericColumns } = classification.columnRoles;

    const dateCol = dateColumns[0] || '';
    const primaryMetric = classification.columnRoles.targetColumn || numericColumns[0] || '';
    const secondaryMetrics = numericColumns.filter(c => c !== primaryMetric).slice(0, 3);

    // Compute KPIs
    const values = data.map(r => Number(r[primaryMetric])).filter(n => !isNaN(n));
    const total = values.reduce((a, b) => a + b, 0);
    const avg = total / (values.length || 1);
    const maxVal = Math.max(...values);
    const minVal = Math.min(...values);

    // Moving average
    const tsData = getTimeSeriesData(data, dateCol, primaryMetric);
    const windowSize = Math.max(3, Math.floor(tsData.length / 20));
    const withMA = tsData.map((point, i) => {
        const start = Math.max(0, i - windowSize + 1);
        const window = tsData.slice(start, i + 1);
        const ma = window.reduce((s, p) => s + p.value, 0) / window.length;
        return { ...point, movingAvg: Math.round(ma * 100) / 100 };
    });

    return (
        <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard title={`Total ${primaryMetric}`} value={total} icon={TrendingUp} color="#22c55e" delay={0} subtitle={`${metadata.rowCount} data points`} />
                <KPICard title="Average" value={avg} icon={Activity} color="#818cf8" delay={1} />
                <KPICard title="Maximum" value={maxVal} icon={BarChart3} color="#f59e0b" delay={2} />
                <KPICard title="Minimum" value={minVal} icon={CalendarDays} color="#06b6d4" delay={3} />
            </div>

            {/* Main trend with moving average */}
            <TrendChart
                title={`${primaryMetric} Trend`}
                subtitle={`With ${windowSize}-point moving average`}
                data={withMA}
                xKey="date"
                yKeys={['value', 'movingAvg']}
                type="area"
                delay={4}
            />

            {/* Secondary metrics */}
            {secondaryMetrics.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {secondaryMetrics.slice(0, 2).map((metric, i) => (
                        <TrendChart
                            key={metric}
                            title={`${metric}`}
                            data={getTimeSeriesData(data, dateCol, metric)}
                            xKey="date"
                            yKeys={['value']}
                            type="line"
                            delay={5 + i}
                        />
                    ))}
                </div>
            )}

            {/* Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <BarChartCard
                    title={`${primaryMetric} Distribution`}
                    subtitle="Frequency histogram"
                    data={getDistribution(data, primaryMetric).map(d => ({ name: d.range, value: d.count }))}
                    gradient={false}
                    delay={7}
                />
                {secondaryMetrics[0] && (
                    <BarChartCard
                        title={`${secondaryMetrics[0]} Distribution`}
                        subtitle="Frequency histogram"
                        data={getDistribution(data, secondaryMetrics[0]).map(d => ({ name: d.range, value: d.count }))}
                        gradient={false}
                        delay={8}
                    />
                )}
            </div>

            <DataTable data={data} delay={9} />
        </div>
    );
}
