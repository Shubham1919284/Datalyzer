'use client';

import { useState, useCallback, useMemo } from 'react';
import { ParsedDataset, ChartRecommendation } from '@/lib/types';
import {
    formatNumber,
    aggregateByCategory,
    getDistribution,
    getTimeSeriesData,
    getTopCategories,
    computeCorrelation,
    CHART_COLORS,
} from '@/lib/utils';
import KPICard from '@/components/charts/KPICard';
import TrendChart from '@/components/charts/TrendChart';
import BarChartCard from '@/components/charts/BarChartCard';
import PieChartCard from '@/components/charts/PieChartCard';
import DataTable from '@/components/charts/DataTable';
import AnimatedCard from '@/components/AnimatedCard';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
    TrendingUp, Hash, Target, Layers, BarChart3,
    Activity, Database, AlertTriangle, Grid3x3,
    RotateCcw, Undo2, PanelLeft, Eye, EyeOff,
    PieChart as PieIcon, LineChart, BarChart2, ScatterChart,
    GripVertical,
} from 'lucide-react';

interface SmartDashboardProps {
    dataset: ParsedDataset;
}

function toTitleCase(name: string): string {
    return name
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/[_\-\.]+/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase())
        .trim();
}

function processRecommendation(
    rec: ChartRecommendation,
    data: Record<string, unknown>[],
): { name: string; value: number }[] | null {
    try {
        switch (rec.chartType) {
            case 'bar':
            case 'pie': {
                if (rec.aggregation === 'count') {
                    return getTopCategories(data, rec.xColumn, 12);
                }
                const firstVal = data[0]?.[rec.xColumn];
                if (typeof firstVal === 'number' || !isNaN(Number(firstVal))) {
                    const groups: Record<string, number[]> = {};
                    for (const row of data) {
                        const x = String(row[rec.xColumn] ?? '');
                        const y = Number(row[rec.yColumn]);
                        if (isNaN(y) || !x) continue;
                        if (!groups[x]) groups[x] = [];
                        groups[x].push(y);
                    }
                    return Object.entries(groups)
                        .map(([name, vals]) => ({
                            name,
                            value: Math.round(
                                rec.aggregation === 'avg'
                                    ? vals.reduce((a, b) => a + b, 0) / vals.length
                                    : vals.reduce((a, b) => a + b, 0)
                            ),
                        }))
                        .sort((a, b) => Number(a.name) - Number(b.name))
                        .slice(0, 20);
                }
                return aggregateByCategory(data, rec.xColumn, rec.yColumn, rec.aggregation as 'sum' | 'avg');
            }
            case 'histogram': {
                const dist = getDistribution(data, rec.yColumn, 12);
                if (dist.length === 0) return null;
                return dist.map(d => ({ name: d.range, value: d.count }));
            }
            default:
                return null;
        }
    } catch {
        return null;
    }
}

// ─────────────────────── Component ───────────────────────

const CHART_TYPE_ICONS: Record<string, typeof BarChart3> = {
    bar: BarChart2,
    line: LineChart,
    area: TrendingUp,
    pie: PieIcon,
    histogram: BarChart3,
    scatter: ScatterChart,
};

export default function SmartDashboard({ dataset }: SmartDashboardProps) {
    const { data, metadata, classification } = dataset;
    const { numericColumns, categoricalColumns } = classification.columnRoles;
    const recs = classification.recommendations;

    // ── Dismiss state ──
    const [dismissed, setDismissed] = useState<Set<string>>(new Set());
    const [lastDismissed, setLastDismissed] = useState<{ id: string; title: string } | null>(null);
    const [undoTimer, setUndoTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // ── Section order for drag-to-reorder ──
    const SECTION_KEYS = ['kpi-primary', 'kpi-overview', 'timeseries', 'lines', 'bars', 'distributions', 'statistics', 'correlations', 'corr-charts', 'datatable'] as const;
    type SectionKey = typeof SECTION_KEYS[number];
    const [sectionOrder, setSectionOrder] = useState<SectionKey[]>([...SECTION_KEYS]);

    const dismiss = useCallback((id: string) => {
        // Look up title from either recs or KPI labels
        const rec = recs.find(r => r.id === id);
        const title = rec?.title || id.replace(/^kpi-(ov-)?/, '').replace(/-/g, ' ');
        setDismissed(prev => new Set(prev).add(id));
        setLastDismissed({ id, title });

        if (undoTimer) clearTimeout(undoTimer);
        const timer = setTimeout(() => setLastDismissed(null), 5000);
        setUndoTimer(timer);
    }, [recs, undoTimer]);

    const undo = useCallback(() => {
        if (!lastDismissed) return;
        setDismissed(prev => {
            const next = new Set(prev);
            next.delete(lastDismissed.id);
            return next;
        });
        setLastDismissed(null);
        if (undoTimer) clearTimeout(undoTimer);
    }, [lastDismissed, undoTimer]);

    const restoreAll = useCallback(() => {
        setDismissed(new Set());
        setLastDismissed(null);
    }, []);

    const toggleVisibility = useCallback((id: string) => {
        setDismissed(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const isVisible = (id: string) => !dismissed.has(id);

    // ── KPIs Row 1 ──
    const kpiIcons = [Target, TrendingUp, Hash, Layers];

    const primaryKPIs = numericColumns.slice(0, 4).map((colName, idx) => {
        const col = metadata.columns.find(c => c.name === colName);
        const values = data.map(r => Number(r[colName])).filter(n => !isNaN(n));
        if (values.length === 0) return null;

        const total = values.reduce((a, b) => a + b, 0);
        const avg = total / values.length;
        const max = Math.max(...values);
        const min = Math.min(...values);

        const isRate = col && col.max !== undefined && col.min !== undefined
            && col.max <= 100 && col.min >= 0;
        const isSmallScale = col && col.max !== undefined && col.max <= 10
            && col.min !== undefined && col.min >= 0;

        if (isRate || isSmallScale) {
            return {
                name: colName, label: `Avg ${toTitleCase(colName)}`,
                value: Math.round(avg * 100) / 100,
                subtitle: `range: ${formatNumber(min)}–${formatNumber(max)}`,
                icon: kpiIcons[idx % 4], color: CHART_COLORS[idx], delay: idx,
            };
        }
        return {
            name: colName, label: `Total ${toTitleCase(colName)}`,
            value: total,
            subtitle: `avg: ${formatNumber(avg)} · max: ${formatNumber(max)}`,
            icon: kpiIcons[idx % 4], color: CHART_COLORS[idx], delay: idx,
        };
    }).filter(Boolean) as { name: string; label: string; value: number; subtitle: string; icon: typeof Target; color: string; delay: number }[];

    // ── KPIs Row 2 ──
    const totalNulls = metadata.columns.reduce((s, c) => s + c.nullCount, 0);
    const nullPct = Math.round((totalNulls / (metadata.rowCount * metadata.columnCount)) * 100);
    const numCols = metadata.columns.filter(c => c.type === 'number').length;
    const catCols = metadata.columns.filter(c => c.type === 'string').length;

    const overviewKPIs = [
        { label: 'Total Rows', value: metadata.rowCount, subtitle: `${metadata.columnCount} columns`, icon: Database, color: '#818cf8' },
        { label: 'Numeric Columns', value: numCols, subtitle: `${catCols} text · ${metadata.columns.filter(c => c.type === 'date').length} date`, icon: Hash, color: '#22c55e' },
        { label: 'Missing Values', value: totalNulls, subtitle: `${nullPct}% of all cells`, icon: AlertTriangle, color: totalNulls > 0 ? '#f59e0b' : '#22c55e' },
        { label: 'Categories', value: categoricalColumns.length, subtitle: categoricalColumns.slice(0, 3).map(c => toTitleCase(c)).join(', ') || 'none', icon: Grid3x3, color: '#06b6d4' },
    ];

    // ── Chart sections ──
    const timeSeriesRecs = recs.filter(r => r.chartType === 'area' && isVisible(r.id));
    const lineRecs = recs.filter(r => r.chartType === 'line' && !r.id.startsWith('corr-') && isVisible(r.id));
    const barRecs = recs.filter(r => r.chartType === 'bar' && isVisible(r.id));
    const pieRecs = recs.filter(r => r.chartType === 'pie' && isVisible(r.id));
    const histRecs = recs.filter(r => r.chartType === 'histogram' && isVisible(r.id));
    const corrRecs = recs.filter(r => r.id.startsWith('corr-') && isVisible(r.id));

    let delay = primaryKPIs.length + overviewKPIs.length;

    // ── Build a unified items list for the sidebar ──
    type SidebarItem = { id: string; title: string; type: string };
    const allSidebarItems: SidebarItem[] = [
        ...primaryKPIs.map(k => ({ id: `kpi-${k.name}`, title: k.label, type: 'kpi' as const })),
        ...overviewKPIs.map(k => ({ id: `kpi-ov-${k.label.replace(/\s/g, '-').toLowerCase()}`, title: k.label, type: 'kpi' as const })),
        ...recs.map(r => ({ id: r.id, title: r.title, type: r.chartType })),
    ];
    const totalItems = allSidebarItems.length;
    const visibleItems = allSidebarItems.filter(i => isVisible(i.id)).length;

    // ── Correlations ──
    const corrCols = numericColumns.slice(0, 6);
    const correlations: { pair: string; value: number }[] = [];
    for (let i = 0; i < corrCols.length; i++) {
        for (let j = i + 1; j < corrCols.length; j++) {
            correlations.push({
                pair: `${toTitleCase(corrCols[i])} × ${toTitleCase(corrCols[j])}`,
                value: computeCorrelation(data, corrCols[i], corrCols[j]),
            });
        }
    }
    correlations.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

    return (
        <div className="flex gap-0 relative">
            {/* ── Sidebar Panel ── */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.aside
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 296, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ type: 'spring', damping: 26, stiffness: 200 }}
                        className="flex-shrink-0"
                        style={{ overflow: 'visible' }}
                    >
                        <div className="w-[280px] h-fit sticky top-4 glass rounded-2xl p-4 mr-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-semibold text-text flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-primary-light" />
                                    Generated Visuals
                                </h3>
                                {dismissed.size > 0 && (
                                    <button
                                        onClick={restoreAll}
                                        className="text-[10px] font-medium text-primary-light hover:text-primary
                                            flex items-center gap-1 transition-colors"
                                    >
                                        <RotateCcw className="w-3 h-3" />
                                        Restore All
                                    </button>
                                )}
                            </div>
                            <div className="space-y-1 max-h-[70vh] overflow-y-auto pr-1">
                                {allSidebarItems.map(item => {
                                    const visible = isVisible(item.id);
                                    const TypeIcon = item.type === 'kpi' ? Target : (CHART_TYPE_ICONS[item.type] || BarChart3);
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => toggleVisibility(item.id)}
                                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left
                                                transition-all duration-200 group/item
                                                ${visible
                                                    ? 'hover:bg-primary/[0.06] text-text'
                                                    : 'opacity-50 hover:opacity-75 text-text-muted'
                                                }`}
                                        >
                                            <TypeIcon className={`w-3.5 h-3.5 flex-shrink-0 ${visible ? 'text-primary-light' : 'text-text-muted'}`} />
                                            <span className={`text-xs flex-1 min-w-0 truncate ${!visible ? 'line-through' : ''}`}>
                                                {item.title}
                                            </span>
                                            <span className="flex-shrink-0">
                                                {visible
                                                    ? <Eye className="w-3.5 h-3.5 text-text-muted opacity-0 group-hover/item:opacity-100 transition-opacity" />
                                                    : <EyeOff className="w-3.5 h-3.5 text-text-muted" />
                                                }
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                            {totalItems > 0 && (
                                <div className="mt-3 pt-3 border-t border-border/20 text-[10px] text-text-muted text-center">
                                    {visibleItems} of {totalItems} visible
                                </div>
                            )}
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* ── Main Dashboard Content ── */}
            <div className="flex-1 min-w-0 space-y-6">
                {/* ── Toolbar ── */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setSidebarOpen(prev => !prev)}
                        className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-xl
                            glass transition-all duration-200
                            ${sidebarOpen ? 'text-primary-light border-primary/20' : 'text-text-muted hover:text-text'}`}
                    >
                        <PanelLeft className="w-3.5 h-3.5" />
                        Visuals
                        {dismissed.size > 0 && (
                            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] bg-amber-500/20 text-amber-400">
                                {dismissed.size} hidden
                            </span>
                        )}
                    </button>
                </div>

                {/* ── Draggable Sections ── */}
                <Reorder.Group axis="y" values={sectionOrder} onReorder={setSectionOrder} className="space-y-6">
                    {sectionOrder.map(sectionKey => {
                        const content = (() => {
                            switch (sectionKey) {
                                case 'kpi-primary':
                                    if (primaryKPIs.filter(m => isVisible(`kpi-${m.name}`)).length === 0) return null;
                                    return (
                                        <AnimatePresence mode="popLayout">
                                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                                {primaryKPIs.filter(m => isVisible(`kpi-${m.name}`)).map(m => (
                                                    <motion.div key={`kpi-${m.name}`} layout exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }}>
                                                        <KPICard
                                                            title={m.label}
                                                            value={m.value}
                                                            icon={m.icon}
                                                            color={m.color}
                                                            delay={m.delay}
                                                            subtitle={m.subtitle}
                                                            kpiId={`kpi-${m.name}`}
                                                            onDismiss={dismiss}
                                                        />
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </AnimatePresence>
                                    );
                                case 'kpi-overview': {
                                    const visibleOverview = overviewKPIs.filter(k => isVisible(`kpi-ov-${k.label.replace(/\s/g, '-').toLowerCase()}`));
                                    if (visibleOverview.length === 0) return null;
                                    return (
                                        <AnimatePresence mode="popLayout">
                                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                                {visibleOverview.map((kpi, i) => (
                                                    <motion.div key={`kpi-ov-${kpi.label.replace(/\s/g, '-').toLowerCase()}`} layout exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }}>
                                                        <KPICard
                                                            title={kpi.label}
                                                            value={kpi.value}
                                                            icon={kpi.icon}
                                                            color={kpi.color}
                                                            delay={primaryKPIs.length + i}
                                                            subtitle={kpi.subtitle}
                                                            kpiId={`kpi-ov-${kpi.label.replace(/\s/g, '-').toLowerCase()}`}
                                                            onDismiss={dismiss}
                                                        />
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </AnimatePresence>
                                    );
                                }
                                case 'timeseries':
                                    if (timeSeriesRecs.length === 0) return null;
                                    return (
                                        <AnimatePresence mode="popLayout">
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                {timeSeriesRecs.slice(0, 4).map(rec => {
                                                    const tsData = getTimeSeriesData(data, rec.xColumn, rec.yColumn);
                                                    if (tsData.length < 2) return null;
                                                    return (
                                                        <motion.div key={rec.id} layout exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }}>
                                                            <TrendChart
                                                                title={rec.title}
                                                                subtitle={rec.description}
                                                                data={tsData}
                                                                xKey="date"
                                                                yKeys={['value']}
                                                                type="area"
                                                                delay={delay++}
                                                                chartId={rec.id}
                                                                onDismiss={dismiss}
                                                            />
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        </AnimatePresence>
                                    );
                                case 'lines':
                                    if (lineRecs.length === 0) return null;
                                    return (
                                        <AnimatePresence mode="popLayout">
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                {lineRecs.slice(0, 2).map(rec => {
                                                    const chartData = processRecommendation(rec, data);
                                                    if (!chartData || chartData.length < 2) return null;
                                                    return (
                                                        <motion.div key={rec.id} layout exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }}>
                                                            <TrendChart
                                                                title={rec.title}
                                                                subtitle={rec.description}
                                                                data={chartData.map(d => ({ date: d.name, value: d.value }))}
                                                                xKey="date"
                                                                yKeys={['value']}
                                                                type="line"
                                                                delay={delay++}
                                                                chartId={rec.id}
                                                                onDismiss={dismiss}
                                                            />
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        </AnimatePresence>
                                    );
                                case 'bars':
                                    if (barRecs.length === 0) return null;
                                    return (
                                        <motion.div layout>
                                            <SectionHeader icon={BarChart3} label="Key Relationships" delay={delay} />
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-3">
                                                <AnimatePresence mode="popLayout">
                                                    {barRecs.slice(0, 6).map((rec, i) => {
                                                        const chartData = processRecommendation(rec, data);
                                                        if (!chartData || chartData.length < 2) return null;
                                                        return (
                                                            <motion.div key={rec.id} layout exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }}>
                                                                <BarChartCard
                                                                    title={rec.title}
                                                                    subtitle={rec.description}
                                                                    data={chartData}
                                                                    horizontal={i % 2 === 1}
                                                                    delay={delay++}
                                                                    chartId={rec.id}
                                                                    onDismiss={dismiss}
                                                                />
                                                            </motion.div>
                                                        );
                                                    })}
                                                </AnimatePresence>
                                            </div>
                                        </motion.div>
                                    );
                                case 'distributions':
                                    if (pieRecs.length === 0 && histRecs.length === 0) return null;
                                    return (
                                        <motion.div layout>
                                            <SectionHeader icon={Layers} label="Distributions" delay={delay} />
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-3">
                                                <AnimatePresence mode="popLayout">
                                                    {pieRecs.slice(0, 3).map(rec => {
                                                        const chartData = processRecommendation(rec, data);
                                                        if (!chartData || chartData.length < 2) return null;
                                                        return (
                                                            <motion.div key={rec.id} layout exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }}>
                                                                <PieChartCard
                                                                    title={rec.title}
                                                                    subtitle={rec.description}
                                                                    data={chartData}
                                                                    delay={delay++}
                                                                    chartId={rec.id}
                                                                    onDismiss={dismiss}
                                                                />
                                                            </motion.div>
                                                        );
                                                    })}
                                                    {histRecs.slice(0, 3).map(rec => {
                                                        const chartData = processRecommendation(rec, data);
                                                        if (!chartData || chartData.length < 2) return null;
                                                        return (
                                                            <motion.div key={rec.id} layout exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }}>
                                                                <BarChartCard
                                                                    title={rec.title}
                                                                    subtitle={rec.description}
                                                                    data={chartData}
                                                                    gradient={false}
                                                                    delay={delay++}
                                                                    chartId={rec.id}
                                                                    onDismiss={dismiss}
                                                                />
                                                            </motion.div>
                                                        );
                                                    })}
                                                </AnimatePresence>
                                            </div>
                                        </motion.div>
                                    );
                                case 'statistics':
                                    return (
                                        <AnimatedCard delay={delay} accentColor="#818cf8">
                                            <h3 className="text-base font-semibold text-text mb-4 flex items-center gap-2">
                                                <Grid3x3 className="w-4 h-4 text-primary-light" />
                                                Column Statistics
                                            </h3>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-xs">
                                                    <thead>
                                                        <tr className="bg-surface-lighter/30">
                                                            <th className="text-left py-2.5 px-3 text-text-muted font-medium">Column</th>
                                                            <th className="text-left py-2.5 px-3 text-text-muted font-medium">Type</th>
                                                            <th className="text-right py-2.5 px-3 text-text-muted font-medium">Unique</th>
                                                            <th className="text-right py-2.5 px-3 text-text-muted font-medium">Missing</th>
                                                            <th className="text-right py-2.5 px-3 text-text-muted font-medium">Min</th>
                                                            <th className="text-right py-2.5 px-3 text-text-muted font-medium">Max</th>
                                                            <th className="text-right py-2.5 px-3 text-text-muted font-medium">Mean</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {metadata.columns.map(col => (
                                                            <tr key={col.name} className="border-t border-border/30 hover:bg-primary/[0.03] transition-colors">
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
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </AnimatedCard>
                                    );
                                case 'correlations':
                                    if (correlations.length === 0) return null;
                                    return (
                                        <AnimatedCard delay={delay + 1} accentColor="#22c55e">
                                            <h3 className="text-base font-semibold text-text mb-4 flex items-center gap-2">
                                                <Activity className="w-4 h-4 text-primary-light" />
                                                Correlation Analysis
                                            </h3>
                                            <div className="space-y-3">
                                                {correlations.slice(0, 10).map(corr => (
                                                    <div key={corr.pair} className="flex items-center gap-3">
                                                        <span className="text-xs text-text-muted w-56 truncate">{corr.pair}</span>
                                                        <div className="flex-1 h-2.5 bg-surface-lighter/50 rounded-full overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                whileInView={{ width: `${Math.abs(corr.value) * 100}%` }}
                                                                viewport={{ once: true }}
                                                                transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
                                                                className="h-full rounded-full"
                                                                style={{ backgroundColor: corr.value > 0 ? '#22c55e' : '#ef4444' }}
                                                            />
                                                        </div>
                                                        <span className={`text-xs font-mono w-14 text-right ${Math.abs(corr.value) > 0.7 ? 'text-text font-bold' : 'text-text-muted'
                                                            }`}>
                                                            {corr.value > 0 ? '+' : ''}{corr.value.toFixed(2)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </AnimatedCard>
                                    );
                                case 'corr-charts':
                                    if (corrRecs.length === 0) return null;
                                    return (
                                        <AnimatePresence mode="popLayout">
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                {corrRecs.slice(0, 2).map(rec => {
                                                    const pairedData = data
                                                        .map(r => ({
                                                            date: String(Number(r[rec.xColumn])?.toFixed(1) ?? ''),
                                                            value: Number(r[rec.yColumn]),
                                                        }))
                                                        .filter(r => !isNaN(r.value) && r.date !== 'NaN')
                                                        .slice(0, 200);
                                                    if (pairedData.length < 5) return null;
                                                    return (
                                                        <motion.div key={rec.id} layout exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }}>
                                                            <TrendChart
                                                                title={rec.title}
                                                                subtitle={rec.description}
                                                                data={pairedData}
                                                                xKey="date"
                                                                yKeys={['value']}
                                                                type="line"
                                                                delay={delay++}
                                                                chartId={rec.id}
                                                                onDismiss={dismiss}
                                                            />
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        </AnimatePresence>
                                    );
                                case 'datatable':
                                    return <DataTable data={data} delay={delay + 2} />;
                                default:
                                    return null;
                            }
                        })();

                        if (!content) return null;

                        return (
                            <Reorder.Item
                                key={sectionKey}
                                value={sectionKey}
                                className="relative group/section"
                                whileDrag={{ scale: 1.01, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            >
                                {/* Drag handle */}
                                <div className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover/section:opacity-60 hover:!opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10">
                                    <GripVertical className="w-4 h-4 text-text-muted" />
                                </div>
                                {content}
                            </Reorder.Item>
                        );
                    })}
                </Reorder.Group>


                {/* ── Undo Toast ── */}
                <AnimatePresence>
                    {lastDismissed && (
                        <motion.div
                            initial={{ opacity: 0, y: 40, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.95 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50
                            glass-strong rounded-xl px-5 py-3 flex items-center gap-3
                            shadow-xl shadow-black/30"
                        >
                            <span className="text-sm text-text-muted">
                                Removed <span className="text-text font-medium">&ldquo;{lastDismissed.title}&rdquo;</span>
                            </span>
                            <button
                                onClick={undo}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                                text-primary-light hover:bg-primary/10 transition-colors duration-200"
                            >
                                <Undo2 className="w-3 h-3" />
                                Undo
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div> {/* end main content */}
        </div>
    );
}

function SectionHeader({ icon: Icon, label, delay }: { icon: typeof BarChart3; label: string; delay: number }) {
    return (
        <motion.h3
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', damping: 20, stiffness: 100, delay: delay * 0.06 }}
            className="text-sm font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2 pt-2"
        >
            <Icon className="w-4 h-4 text-primary-light" />
            {label}
        </motion.h3>
    );
}
