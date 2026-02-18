'use client';

import { ParsedDataset } from '@/lib/types';
import { formatNumber, getTopCategories, getDistribution, computeCorrelation, aggregateByCategory, getTimeSeriesData, CHART_COLORS } from '@/lib/utils';
import KPICard from '@/components/charts/KPICard';
import TrendChart from '@/components/charts/TrendChart';
import BarChartCard from '@/components/charts/BarChartCard';
import PieChartCard from '@/components/charts/PieChartCard';
import DataTable from '@/components/charts/DataTable';
import { motion } from 'framer-motion';
import { Database, Hash, Type, AlertTriangle, BarChart3, Grid3x3 } from 'lucide-react';

interface GenericDashboardProps {
    dataset: ParsedDataset;
}

export default function GenericDashboard({ dataset }: GenericDashboardProps) {
    const { data, metadata, classification } = dataset;
    const { numericColumns, categoricalColumns, dateColumns, targetColumn } = classification.columnRoles;

    // Column Stats Summary
    const numCols = metadata.columns.filter(c => c.type === 'number');
    const catCols = metadata.columns.filter(c => c.type === 'string');
    const dateCols = metadata.columns.filter(c => c.type === 'date');
    const totalNulls = metadata.columns.reduce((s, c) => s + c.nullCount, 0);

    // Correlation matrix for numeric cols (top 6)
    const corrCols = numericColumns.slice(0, 6);
    const correlations: { pair: string; value: number }[] = [];
    for (let i = 0; i < corrCols.length; i++) {
        for (let j = i + 1; j < corrCols.length; j++) {
            correlations.push({
                pair: `${corrCols[i]} × ${corrCols[j]}`,
                value: computeCorrelation(data, corrCols[i], corrCols[j]),
            });
        }
    }
    correlations.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

    return (
        <div className="space-y-6">
            {/* Overview KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard title="Total Rows" value={metadata.rowCount} icon={Database} color="#818cf8" delay={0} />
                <KPICard title="Numeric Cols" value={numCols.length} icon={Hash} color="#22c55e" delay={1} subtitle={`of ${metadata.columnCount} total`} />
                <KPICard title="Text Cols" value={catCols.length} icon={Type} color="#06b6d4" delay={2} />
                <KPICard title="Missing Values" value={totalNulls} icon={AlertTriangle} color={totalNulls > 0 ? '#f59e0b' : '#22c55e'} delay={3} subtitle={`${Math.round(totalNulls / (metadata.rowCount * metadata.columnCount) * 100)}% of all cells`} />
            </div>

            {/* Column Summary */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="glass rounded-2xl p-5"
            >
                <h3 className="text-base font-semibold text-text mb-4 flex items-center gap-2">
                    <Grid3x3 className="w-4 h-4 text-primary-light" />
                    Column Statistics
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="bg-surface-lighter/50">
                                <th className="text-left py-2.5 px-3 text-text-muted font-medium">Column</th>
                                <th className="text-left py-2.5 px-3 text-text-muted font-medium">Type</th>
                                <th className="text-right py-2.5 px-3 text-text-muted font-medium">Unique</th>
                                <th className="text-right py-2.5 px-3 text-text-muted font-medium">Missing</th>
                                <th className="text-right py-2.5 px-3 text-text-muted font-medium">Min</th>
                                <th className="text-right py-2.5 px-3 text-text-muted font-medium">Max</th>
                                <th className="text-right py-2.5 px-3 text-text-muted font-medium">Mean</th>
                                <th className="text-right py-2.5 px-3 text-text-muted font-medium">Std Dev</th>
                            </tr>
                        </thead>
                        <tbody>
                            {metadata.columns.map((col, i) => (
                                <tr key={col.name} className="border-t border-border/50 hover:bg-surface-lighter/30 transition-colors">
                                    <td className="py-2 px-3 text-text font-medium">{col.name}</td>
                                    <td className="py-2 px-3">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${col.type === 'number' ? 'bg-green-500/15 text-green-400'
                                                : col.type === 'date' ? 'bg-blue-500/15 text-blue-400'
                                                    : col.type === 'boolean' ? 'bg-amber-500/15 text-amber-400'
                                                        : 'bg-purple-500/15 text-purple-400'
                                            }`}>
                                            {col.type}
                                        </span>
                                    </td>
                                    <td className="py-2 px-3 text-text-muted text-right">{col.uniqueCount.toLocaleString()}</td>
                                    <td className="py-2 px-3 text-right">
                                        <span className={col.nullCount > 0 ? 'text-amber-400' : 'text-text-muted'}>
                                            {col.nullCount.toLocaleString()}
                                        </span>
                                    </td>
                                    <td className="py-2 px-3 text-text-muted text-right">{col.min !== undefined ? formatNumber(col.min) : '—'}</td>
                                    <td className="py-2 px-3 text-text-muted text-right">{col.max !== undefined ? formatNumber(col.max) : '—'}</td>
                                    <td className="py-2 px-3 text-text-muted text-right">{col.mean !== undefined ? formatNumber(col.mean) : '—'}</td>
                                    <td className="py-2 px-3 text-text-muted text-right">{col.stdDev !== undefined ? formatNumber(col.stdDev) : '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* Correlation Pairs */}
            {correlations.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="glass rounded-2xl p-5"
                >
                    <h3 className="text-base font-semibold text-text mb-4 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-primary-light" />
                        Top Correlations
                    </h3>
                    <div className="space-y-3">
                        {correlations.slice(0, 8).map((corr, i) => (
                            <div key={corr.pair} className="flex items-center gap-3">
                                <span className="text-xs text-text-muted w-48 truncate">{corr.pair}</span>
                                <div className="flex-1 h-2 bg-surface-lighter rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{
                                            width: `${Math.abs(corr.value) * 100}%`,
                                            backgroundColor: corr.value > 0 ? '#22c55e' : '#ef4444',
                                        }}
                                    />
                                </div>
                                <span className={`text-xs font-mono w-12 text-right ${Math.abs(corr.value) > 0.7 ? 'text-text font-bold' : 'text-text-muted'
                                    }`}>
                                    {corr.value > 0 ? '+' : ''}{corr.value}
                                </span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Distributions and category charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* First time series if available */}
                {dateColumns[0] && numericColumns[0] && (
                    <TrendChart
                        title={`${numericColumns[0]} Over Time`}
                        data={getTimeSeriesData(data, dateColumns[0], numericColumns[0])}
                        xKey="date"
                        yKeys={['value']}
                        delay={6}
                    />
                )}

                {/* Top numeric distribution */}
                {numericColumns[0] && (
                    <BarChartCard
                        title={`${numericColumns[0]} Distribution`}
                        subtitle="Frequency histogram"
                        data={getDistribution(data, numericColumns[0]).map(d => ({ name: d.range, value: d.count }))}
                        gradient={false}
                        delay={7}
                    />
                )}

                {/* Category breakdown */}
                {categoricalColumns[0] && (
                    <PieChartCard
                        title={`${categoricalColumns[0]} Distribution`}
                        data={getTopCategories(data, categoricalColumns[0])}
                        delay={8}
                    />
                )}

                {categoricalColumns[1] && (
                    <BarChartCard
                        title={`${categoricalColumns[1]} Distribution`}
                        data={getTopCategories(data, categoricalColumns[1])}
                        horizontal
                        delay={9}
                    />
                )}
            </div>

            <DataTable data={data} delay={10} />
        </div>
    );
}
