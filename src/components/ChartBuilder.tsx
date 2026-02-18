'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, X, BarChart3, LineChart, PieChart as PieIcon, Activity,
    Layers, ChevronDown, Sparkles, GripVertical, Target, TrendingUp, TrendingDown,
} from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { ParsedDataset, ChartRecommendation } from '@/lib/types';
import { CHART_COLORS, getDistributionFromValues } from '@/lib/utils';
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, Cell, LineChart as RechartsLineChart, Line, AreaChart, Area,
    PieChart as RechartsPieChart, Pie, Legend
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────
type ChartType = 'bar' | 'line' | 'area' | 'pie' | 'histogram' | 'kpi';
type Aggregation = 'sum' | 'avg' | 'count' | 'none' | 'min' | 'max';

interface UserChart {
    id: string;
    chartType: ChartType;
    xColumn: string;
    yColumn: string;
    aggregation: Aggregation;
    title: string;
}

const CHART_TYPE_OPTIONS: { value: ChartType; label: string; icon: typeof BarChart3 }[] = [
    { value: 'kpi', label: 'KPI Card', icon: Target },
    { value: 'bar', label: 'Bar Chart', icon: BarChart3 },
    { value: 'line', label: 'Line Chart', icon: LineChart },
    { value: 'area', label: 'Area Chart', icon: Activity },
    { value: 'pie', label: 'Pie Chart', icon: PieIcon },
    { value: 'histogram', label: 'Histogram', icon: Layers },
];

const AGG_OPTIONS: { value: Aggregation; label: string }[] = [
    { value: 'sum', label: 'Sum' },
    { value: 'avg', label: 'Average' },
    { value: 'min', label: 'Minimum' },
    { value: 'max', label: 'Maximum' },
    { value: 'count', label: 'Count' },
    { value: 'none', label: 'Raw Values' },
];

const KPI_AGG_OPTIONS: { value: Aggregation; label: string }[] = [
    { value: 'sum', label: 'Sum (Total)' },
    { value: 'avg', label: 'Average' },
    { value: 'min', label: 'Minimum' },
    { value: 'max', label: 'Maximum' },
    { value: 'count', label: 'Count' },
];

// ─── Data processing ──────────────────────────────────────────────
function processChartData(
    data: Record<string, unknown>[],
    chart: UserChart,
): { name: string; value: number }[] {
    const { xColumn, yColumn, chartType, aggregation } = chart;

    // Histogram: distribution of a single numeric column
    if (chartType === 'histogram') {
        const values = data
            .map(r => Number(r[yColumn]))
            .filter(v => !isNaN(v));
        return getDistributionFromValues(values);
    }

    // Pie + Count: count by category
    if (aggregation === 'count') {
        const counts: Record<string, number> = {};
        for (const row of data) {
            const key = String(row[xColumn] ?? 'Unknown');
            counts[key] = (counts[key] || 0) + 1;
        }
        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 15);
    }

    // Raw values (no aggregation) — good for time series
    if (aggregation === 'none') {
        return data.slice(0, 200).map(row => ({
            name: String(row[xColumn] ?? ''),
            value: Number(row[yColumn]) || 0,
        }));
    }

    // Aggregated: group by xColumn, aggregate yColumn
    const groups: Record<string, number[]> = {};
    for (const row of data) {
        const key = String(row[xColumn] ?? 'Unknown');
        const val = Number(row[yColumn]);
        if (!isNaN(val)) {
            if (!groups[key]) groups[key] = [];
            groups[key].push(val);
        }
    }

    return Object.entries(groups)
        .map(([name, values]) => ({
            name,
            value: aggregation === 'sum'
                ? values.reduce((a, b) => a + b, 0)
                : values.reduce((a, b) => a + b, 0) / values.length,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 15);
}

// ─── KPI value computation ────────────────────────────────────────
function computeKPIValue(
    data: Record<string, unknown>[],
    chart: UserChart,
): { value: number; subtitle: string } {
    if (chart.aggregation === 'count') {
        const uniqueValues = new Set(data.map(r => String(r[chart.xColumn] ?? '')));
        return {
            value: data.length,
            subtitle: `${uniqueValues.size} unique values in ${chart.xColumn}`,
        };
    }

    const values = data.map(r => Number(r[chart.yColumn])).filter(v => !isNaN(v));
    if (values.length === 0) return { value: 0, subtitle: 'No numeric data' };

    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    switch (chart.aggregation) {
        case 'sum':
            return { value: sum, subtitle: `avg: ${formatNumber(avg)} · ${values.length} records` };
        case 'avg':
            return { value: Math.round(avg * 100) / 100, subtitle: `range: ${formatNumber(min)} – ${formatNumber(max)}` };
        case 'min':
            return { value: min, subtitle: `max: ${formatNumber(max)} · avg: ${formatNumber(avg)}` };
        case 'max':
            return { value: max, subtitle: `min: ${formatNumber(min)} · avg: ${formatNumber(avg)}` };
        default:
            return { value: sum, subtitle: `${values.length} records` };
    }
}

// ─── Chart renderer ───────────────────────────────────────────────
function ChartRenderer({ chartData, chart }: { chartData: { name: string; value: number }[]; chart: UserChart }) {
    const tooltipStyle = {
        backgroundColor: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '12px',
        fontSize: '12px',
        color: '#f1f5f9',
    };

    switch (chart.chartType) {
        case 'pie':
            return (
                <RechartsPieChart>
                    <Pie
                        data={chartData}
                        cx="50%" cy="50%"
                        innerRadius={55} outerRadius={95}
                        paddingAngle={3} dataKey="value"
                        stroke="none" animationDuration={800}
                    >
                        {chartData.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} iconType="circle" iconSize={8} />
                </RechartsPieChart>
            );

        case 'line':
            return (
                <RechartsLineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(99, 102, 241, 0.08)" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Line type="monotone" dataKey="value" stroke="#818cf8" strokeWidth={2.5} dot={false} />
                </RechartsLineChart>
            );

        case 'area':
            return (
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <defs>
                        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#818cf8" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="#818cf8" stopOpacity={0.02} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(99, 102, 241, 0.08)" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area type="monotone" dataKey="value" stroke="#818cf8" strokeWidth={2} fill="url(#areaGrad)" />
                </AreaChart>
            );

        case 'histogram':
        case 'bar':
        default:
            return (
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(99, 102, 241, 0.08)" />
                    <XAxis
                        dataKey="name"
                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                        axisLine={{ stroke: '#334155' }}
                        tickLine={false}
                        interval={0}
                        angle={chartData.length > 6 ? -25 : 0}
                        textAnchor={chartData.length > 6 ? 'end' : 'middle'}
                        height={chartData.length > 6 ? 55 : 30}
                    />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={40}>
                        {chartData.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                    </Bar>
                </BarChart>
            );
    }
}

// ─── Select dropdown ──────────────────────────────────────────────
function Select({ value, onChange, options, label }: {
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
    label: string;
}) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-wider text-text-muted font-medium">{label}</label>
            <div className="relative">
                <select
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    className="w-full appearance-none bg-surface-lighter border border-border/50 rounded-lg px-3 py-2 text-xs text-text focus:outline-none focus:border-primary/50 cursor-pointer pr-7"
                >
                    {options.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
            </div>
        </div>
    );
}

// ─── Main ChartBuilder ────────────────────────────────────────────
interface ChartBuilderProps {
    dataset: ParsedDataset;
}

export default function ChartBuilder({ dataset }: ChartBuilderProps) {
    const { data, metadata, classification } = dataset;
    const recommendations = classification.recommendations || [];

    // User-created custom charts
    const [userCharts, setUserCharts] = useState<UserChart[]>([]);
    const [showBuilder, setShowBuilder] = useState(false);

    // Builder form state
    const numericCols = metadata.columns.filter(c => c.type === 'number');
    const allCols = metadata.columns;
    const defaultX = allCols[0]?.name || '';
    const defaultY = numericCols[0]?.name || allCols[0]?.name || '';

    const [newType, setNewType] = useState<ChartType>('bar');
    const [newX, setNewX] = useState(defaultX);
    const [newY, setNewY] = useState(defaultY);
    const [newAgg, setNewAgg] = useState<Aggregation>('sum');

    const columnOptions = allCols.map(c => ({
        value: c.name,
        label: `${c.name} (${c.type})`,
    }));

    const addChart = () => {
        let title: string;
        if (newType === 'kpi') {
            const aggLabel = newAgg === 'count' ? 'Count' : newAgg.charAt(0).toUpperCase() + newAgg.slice(1);
            title = newAgg === 'count' ? `${newX} Count` : `${aggLabel} ${newY}`;
        } else if (newAgg === 'count') {
            title = `${newX} Count`;
        } else if (newType === 'histogram') {
            title = `${newY} Distribution`;
        } else {
            title = `${newAgg === 'none' ? '' : newAgg.charAt(0).toUpperCase() + newAgg.slice(1) + ' of '}${newY} by ${newX}`;
        }
        const chart: UserChart = {
            id: `custom-${Date.now()}`,
            chartType: newType,
            xColumn: newX,
            yColumn: newY,
            aggregation: newAgg,
            title,
        };
        setUserCharts(prev => [...prev, chart]);
        setShowBuilder(false);
    };

    const addFromRecommendation = (rec: ChartRecommendation) => {
        const chart: UserChart = {
            id: rec.id + '-' + Date.now(),
            chartType: rec.chartType,
            xColumn: rec.xColumn,
            yColumn: rec.yColumn,
            aggregation: rec.aggregation,
            title: rec.title,
        };
        setUserCharts(prev => [...prev, chart]);
    };

    const removeChart = (id: string) => {
        setUserCharts(prev => prev.filter(c => c.id !== id));
    };

    const allCharts = userCharts;

    return (
        <div className="mt-8">
            {/* Section header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-text flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary-light" />
                        Custom Charts
                    </h2>
                    <p className="text-xs text-text-muted mt-1">Build your own visualizations — pick chart type, columns, and aggregation</p>
                </div>
                <button
                    onClick={() => setShowBuilder(!showBuilder)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/20 hover:bg-primary/30 text-primary-light text-sm font-medium transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Chart
                </button>
            </div>

            {/* Recommendations */}
            {recommendations.length > 0 && userCharts.length === 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mb-6"
                >
                    <p className="text-xs text-text-muted mb-3 uppercase tracking-wider font-medium">💡 Suggested Charts (click to add)</p>
                    <div className="flex flex-wrap gap-2">
                        {recommendations.slice(0, 8).map(rec => {
                            const Icon = CHART_TYPE_OPTIONS.find(o => o.value === rec.chartType)?.icon || BarChart3;
                            return (
                                <button
                                    key={rec.id}
                                    onClick={() => addFromRecommendation(rec)}
                                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-lighter/50 border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all text-xs text-text-muted hover:text-text group"
                                    title={rec.description}
                                >
                                    <Icon className="w-3.5 h-3.5 text-primary-light/60 group-hover:text-primary-light" />
                                    <span className="truncate max-w-48">{rec.title}</span>
                                </button>
                            );
                        })}
                    </div>
                </motion.div>
            )}

            {/* Builder form */}
            <AnimatePresence>
                {showBuilder && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden mb-6"
                    >
                        <div className="glass rounded-2xl p-5 border border-primary/20">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-semibold text-text">Create a Chart</h3>
                                <button onClick={() => setShowBuilder(false)} className="p-1 rounded-lg hover:bg-surface-lighter text-text-muted">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Chart type selector */}
                            <div className="mb-4">
                                <label className="text-[10px] uppercase tracking-wider text-text-muted font-medium mb-2 block">Chart Type</label>
                                <div className="flex flex-wrap gap-2">
                                    {CHART_TYPE_OPTIONS.map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => setNewType(opt.value)}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all ${newType === opt.value
                                                ? 'bg-primary/20 text-primary-light border border-primary/30'
                                                : 'bg-surface-lighter/50 text-text-muted border border-border/50 hover:border-primary/20'
                                                }`}
                                        >
                                            <opt.icon className="w-3.5 h-3.5" />
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Column selectors */}
                            <div className={`grid grid-cols-1 gap-4 mb-4 ${newType === 'kpi' || newType === 'histogram' ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}>
                                {newType !== 'histogram' && newType !== 'kpi' && (
                                    <Select
                                        value={newX}
                                        onChange={setNewX}
                                        options={columnOptions}
                                        label="X Axis / Group By"
                                    />
                                )}
                                {newType === 'kpi' && newAgg !== 'count' && (
                                    <Select
                                        value={newY}
                                        onChange={setNewY}
                                        options={columnOptions.filter(o => numericCols.some(c => c.name === o.value))}
                                        label="Metric Column"
                                    />
                                )}
                                {newType === 'kpi' && newAgg === 'count' && (
                                    <Select
                                        value={newX}
                                        onChange={setNewX}
                                        options={columnOptions}
                                        label="Column to Count"
                                    />
                                )}
                                {newType !== 'kpi' && (
                                    <Select
                                        value={newY}
                                        onChange={setNewY}
                                        options={newType === 'histogram'
                                            ? columnOptions.filter(o => numericCols.some(c => c.name === o.value))
                                            : columnOptions
                                        }
                                        label={newType === 'histogram' ? 'Column' : 'Y Axis / Value'}
                                    />
                                )}
                                {newType !== 'histogram' && (
                                    <Select
                                        value={newAgg}
                                        onChange={(v) => setNewAgg(v as Aggregation)}
                                        options={newType === 'kpi' ? KPI_AGG_OPTIONS : AGG_OPTIONS}
                                        label={newType === 'kpi' ? 'Metric Type' : 'Aggregation'}
                                    />
                                )}
                            </div>

                            {/* Suggestions row inside builder */}
                            {recommendations.length > 0 && (
                                <div className="mb-4">
                                    <p className="text-[10px] uppercase tracking-wider text-text-muted font-medium mb-2">Quick suggestions</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {recommendations.slice(0, 5).map(rec => (
                                            <button
                                                key={rec.id}
                                                onClick={() => {
                                                    setNewType(rec.chartType);
                                                    setNewX(rec.xColumn);
                                                    setNewY(rec.yColumn);
                                                    setNewAgg(rec.aggregation);
                                                }}
                                                className="px-2 py-1 rounded-lg text-[10px] bg-primary/10 text-primary-light hover:bg-primary/20 transition-colors"
                                            >
                                                {rec.title}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={addChart}
                                className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary/80 text-white text-sm font-medium transition-colors"
                            >
                                Add to Dashboard
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Rendered charts grid */}
            {allCharts.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <AnimatePresence>
                        {allCharts.map((chart, i) => {
                            // KPI rendering
                            if (chart.chartType === 'kpi') {
                                const kpiValue = computeKPIValue(data, chart);
                                return (
                                    <motion.div
                                        key={chart.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="glass rounded-2xl p-5 relative group"
                                    >
                                        <button
                                            onClick={() => removeChart(chart.id)}
                                            className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-surface-lighter text-text-muted transition-all z-10"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${CHART_COLORS[i % CHART_COLORS.length]}18` }}>
                                                <Target className="w-5 h-5" style={{ color: CHART_COLORS[i % CHART_COLORS.length] }} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-text-muted uppercase tracking-wider">{chart.title}</p>
                                                <p className="text-2xl font-bold text-text">{formatNumber(kpiValue.value)}</p>
                                            </div>
                                        </div>
                                        <p className="text-xs text-text-muted">{kpiValue.subtitle}</p>
                                    </motion.div>
                                );
                            }

                            // Regular chart rendering
                            const chartData = processChartData(data, chart);
                            return (
                                <motion.div
                                    key={chart.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="glass rounded-2xl p-5 relative group"
                                >
                                    {/* Header */}
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <h3 className="text-sm font-semibold text-text truncate">{chart.title}</h3>
                                        </div>
                                        <button
                                            onClick={() => removeChart(chart.id)}
                                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-surface-lighter text-text-muted transition-all"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-text-muted mb-3">
                                        {chart.chartType} · {chart.aggregation !== 'none' ? chart.aggregation + ' · ' : ''}{chart.xColumn} × {chart.yColumn}
                                    </p>

                                    {/* Chart */}
                                    <div className="h-[280px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <ChartRenderer chartData={chartData} chart={chart} />
                                        </ResponsiveContainer>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}

            {/* Empty state */}
            {allCharts.length === 0 && !showBuilder && recommendations.length === 0 && (
                <div className="text-center py-10">
                    <BarChart3 className="w-10 h-10 text-text-muted/30 mx-auto mb-3" />
                    <p className="text-sm text-text-muted">No custom charts yet. Click "Add Chart" to create one.</p>
                </div>
            )}
        </div>
    );
}
