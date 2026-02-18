'use client';

import { ParsedDataset } from '@/lib/types';
import { formatNumber, aggregateByCategory, getTimeSeriesData, getTopCategories } from '@/lib/utils';
import KPICard from '@/components/charts/KPICard';
import TrendChart from '@/components/charts/TrendChart';
import BarChartCard from '@/components/charts/BarChartCard';
import PieChartCard from '@/components/charts/PieChartCard';
import DataTable from '@/components/charts/DataTable';
import { DollarSign, ShoppingCart, TrendingUp, Users } from 'lucide-react';

interface SalesDashboardProps {
    dataset: ParsedDataset;
}

export default function SalesDashboard({ dataset }: SalesDashboardProps) {
    const { data, metadata, classification } = dataset;
    const { numericColumns, categoricalColumns, dateColumns, targetColumn } = classification.columnRoles;

    // Find key columns
    const revenueCol = targetColumn || numericColumns[0] || '';
    const categoryCol = categoricalColumns[0] || '';
    const dateCol = dateColumns[0] || '';
    const quantityCol = numericColumns.find(c =>
        c.toLowerCase().includes('qty') || c.toLowerCase().includes('quantity') || c.toLowerCase().includes('count')
    ) || numericColumns[1] || '';

    // Compute KPIs
    const revenueValues = data.map(r => Number(r[revenueCol])).filter(n => !isNaN(n));
    const totalRevenue = revenueValues.reduce((a, b) => a + b, 0);
    const avgRevenue = totalRevenue / (revenueValues.length || 1);
    const maxRevenue = Math.max(...revenueValues);

    const quantityValues = quantityCol ? data.map(r => Number(r[quantityCol])).filter(n => !isNaN(n)) : [];
    const totalQuantity = quantityValues.reduce((a, b) => a + b, 0);

    return (
        <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard title={`Total ${revenueCol}`} value={totalRevenue} icon={DollarSign} color="#22c55e" delay={0} subtitle={`from ${metadata.rowCount} records`} />
                <KPICard title="Average" value={avgRevenue} icon={TrendingUp} color="#818cf8" delay={1} subtitle={`per record`} />
                <KPICard title="Maximum" value={maxRevenue} icon={ShoppingCart} color="#f59e0b" delay={2} />
                <KPICard title={quantityCol ? `Total ${quantityCol}` : 'Total Records'} value={quantityCol ? totalQuantity : metadata.rowCount} icon={Users} color="#06b6d4" delay={3} />
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Trend over time */}
                {dateCol && revenueCol && (
                    <TrendChart
                        title={`${revenueCol} Over Time`}
                        subtitle={`Trend by ${dateCol}`}
                        data={getTimeSeriesData(data, dateCol, revenueCol)}
                        xKey="date"
                        yKeys={['value']}
                        delay={4}
                    />
                )}

                {/* Top categories */}
                {categoryCol && (
                    <BarChartCard
                        title={`Top ${categoryCol}`}
                        subtitle={`By ${revenueCol}`}
                        data={aggregateByCategory(data, categoryCol, revenueCol)}
                        delay={5}
                    />
                )}

                {/* If no date chart, show distribution */}
                {!dateCol && categoryCol && (
                    <PieChartCard
                        title={`${categoryCol} Distribution`}
                        subtitle="Share of total"
                        data={getTopCategories(data, categoryCol)}
                        delay={4}
                    />
                )}
            </div>

            {/* Category breakdown pie */}
            {categoryCol && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <PieChartCard
                        title={`${categoryCol} Share`}
                        subtitle={`By ${revenueCol}`}
                        data={aggregateByCategory(data, categoryCol, revenueCol).slice(0, 8)}
                        delay={6}
                    />
                    {categoricalColumns[1] && (
                        <BarChartCard
                            title={`Top ${categoricalColumns[1]}`}
                            subtitle={`By ${revenueCol}`}
                            data={aggregateByCategory(data, categoricalColumns[1], revenueCol)}
                            delay={7}
                            horizontal
                        />
                    )}
                </div>
            )}

            {/* Data Table */}
            <DataTable data={data} delay={8} />
        </div>
    );
}
