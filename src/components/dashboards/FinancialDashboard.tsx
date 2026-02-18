'use client';

import { ParsedDataset } from '@/lib/types';
import { getTimeSeriesData, getDistribution, getTopCategories, aggregateByCategory } from '@/lib/utils';
import KPICard from '@/components/charts/KPICard';
import TrendChart from '@/components/charts/TrendChart';
import BarChartCard from '@/components/charts/BarChartCard';
import PieChartCard from '@/components/charts/PieChartCard';
import DataTable from '@/components/charts/DataTable';
import { DollarSign, TrendingUp, BarChart3, Percent } from 'lucide-react';

interface FinancialDashboardProps {
    dataset: ParsedDataset;
}

export default function FinancialDashboard({ dataset }: FinancialDashboardProps) {
    const { data, metadata, classification } = dataset;
    const { numericColumns, categoricalColumns, dateColumns, targetColumn } = classification.columnRoles;

    const primaryCol = targetColumn || numericColumns[0] || '';
    const dateCol = dateColumns[0] || '';
    const secondaryCol = numericColumns.find(c => c !== primaryCol) || '';

    // KPIs
    const values = data.map(r => Number(r[primaryCol])).filter(n => !isNaN(n));
    const total = values.reduce((a, b) => a + b, 0);
    const avg = total / (values.length || 1);
    const maxVal = Math.max(...values);
    const minVal = Math.min(...values);
    const volatility = values.length > 1
        ? Math.sqrt(values.reduce((s, v) => s + (v - avg) ** 2, 0) / values.length)
        : 0;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard title={`Total ${primaryCol}`} value={total} icon={DollarSign} color="#22c55e" delay={0} />
                <KPICard title="Average" value={avg} icon={TrendingUp} color="#818cf8" delay={1} />
                <KPICard title="Range" value={`${Math.round(minVal)} - ${Math.round(maxVal)}`} icon={BarChart3} color="#f59e0b" delay={2} />
                <KPICard title="Volatility (σ)" value={Math.round(volatility * 100) / 100} icon={Percent} color="#ef4444" delay={3} />
            </div>

            {dateCol && primaryCol && (
                <TrendChart
                    title={`${primaryCol} Trend`}
                    subtitle={`Over ${dateCol}`}
                    data={getTimeSeriesData(data, dateCol, primaryCol)}
                    xKey="date"
                    yKeys={['value']}
                    type="area"
                    delay={4}
                />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {dateCol && secondaryCol && (
                    <TrendChart
                        title={secondaryCol}
                        data={getTimeSeriesData(data, dateCol, secondaryCol)}
                        xKey="date"
                        yKeys={['value']}
                        type="line"
                        delay={5}
                    />
                )}

                <BarChartCard
                    title={`${primaryCol} Distribution`}
                    data={getDistribution(data, primaryCol).map(d => ({ name: d.range, value: d.count }))}
                    gradient={false}
                    delay={6}
                />

                {categoricalColumns[0] && (
                    <PieChartCard
                        title={`By ${categoricalColumns[0]}`}
                        data={aggregateByCategory(data, categoricalColumns[0], primaryCol).slice(0, 8)}
                        delay={7}
                    />
                )}
            </div>

            <DataTable data={data} delay={8} />
        </div>
    );
}
