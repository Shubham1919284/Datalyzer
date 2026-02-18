import { ColumnInfo } from './types';

export function formatNumber(num: number): string {
    if (Math.abs(num) >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + 'B';
    if (Math.abs(num) >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
    if (Math.abs(num) >= 1_000) return (num / 1_000).toFixed(1) + 'K';
    return num.toFixed(num % 1 === 0 ? 0 : 2);
}

export function formatBytes(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function computeCorrelation(
    data: Record<string, unknown>[],
    colA: string,
    colB: string
): number {
    const pairs = data
        .map(r => [Number(r[colA]), Number(r[colB])])
        .filter(([a, b]) => !isNaN(a) && !isNaN(b));

    if (pairs.length < 3) return 0;

    const n = pairs.length;
    const sumA = pairs.reduce((s, [a]) => s + a, 0);
    const sumB = pairs.reduce((s, [, b]) => s + b, 0);
    const sumAB = pairs.reduce((s, [a, b]) => s + a * b, 0);
    const sumA2 = pairs.reduce((s, [a]) => s + a * a, 0);
    const sumB2 = pairs.reduce((s, [, b]) => s + b * b, 0);

    const num = n * sumAB - sumA * sumB;
    const den = Math.sqrt((n * sumA2 - sumA ** 2) * (n * sumB2 - sumB ** 2));

    return den === 0 ? 0 : Math.round((num / den) * 100) / 100;
}

export function getTopCategories(
    data: Record<string, unknown>[],
    column: string,
    limit: number = 10
): { name: string; value: number }[] {
    const counts: Record<string, number> = {};
    for (const row of data) {
        const val = String(row[column] ?? 'N/A');
        counts[val] = (counts[val] || 0) + 1;
    }

    return Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(([name, value]) => ({ name, value }));
}

export function aggregateByCategory(
    data: Record<string, unknown>[],
    categoryCol: string,
    valueCol: string,
    agg: 'sum' | 'avg' | 'count' = 'sum'
): { name: string; value: number }[] {
    const groups: Record<string, number[]> = {};

    for (const row of data) {
        const cat = String(row[categoryCol] ?? 'Other');
        const val = Number(row[valueCol]);
        if (isNaN(val)) continue;
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(val);
    }

    return Object.entries(groups)
        .map(([name, vals]) => ({
            name,
            value: Math.round(
                agg === 'sum' ? vals.reduce((a, b) => a + b, 0)
                    : agg === 'avg' ? vals.reduce((a, b) => a + b, 0) / vals.length
                        : vals.length
            ),
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 15);
}

export function getDistribution(
    data: Record<string, unknown>[],
    column: string,
    bins: number = 10
): { range: string; count: number }[] {
    const values = data.map(r => Number(r[column])).filter(n => !isNaN(n));
    if (values.length === 0) return [];

    const min = Math.min(...values);
    const max = Math.max(...values);
    const binWidth = (max - min) / bins || 1;

    const histogram: number[] = new Array(bins).fill(0);
    for (const v of values) {
        const idx = Math.min(Math.floor((v - min) / binWidth), bins - 1);
        histogram[idx]++;
    }

    return histogram.map((count, i) => ({
        range: `${formatNumber(min + i * binWidth)}-${formatNumber(min + (i + 1) * binWidth)}`,
        count,
    }));
}

/** Histogram from raw number array — returns {name, value}[] for use in charts */
export function getDistributionFromValues(
    values: number[],
    bins: number = 10
): { name: string; value: number }[] {
    if (values.length === 0) return [];

    const min = Math.min(...values);
    const max = Math.max(...values);
    const binWidth = (max - min) / bins || 1;

    const histogram: number[] = new Array(bins).fill(0);
    for (const v of values) {
        const idx = Math.min(Math.floor((v - min) / binWidth), bins - 1);
        histogram[idx]++;
    }

    return histogram.map((count, i) => ({
        name: `${formatNumber(min + i * binWidth)}-${formatNumber(min + (i + 1) * binWidth)}`,
        value: count,
    }));
}

export function getTimeSeriesData(
    data: Record<string, unknown>[],
    dateCol: string,
    valueCol: string,
): { date: string; value: number }[] {
    const sorted = data
        .map(r => ({
            date: String(r[dateCol]),
            value: Number(r[valueCol]),
        }))
        .filter(r => !isNaN(r.value) && r.date)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // If too many points, sample
    if (sorted.length > 200) {
        const step = Math.ceil(sorted.length / 200);
        return sorted.filter((_, i) => i % step === 0);
    }

    return sorted;
}

export const CHART_COLORS = [
    '#818cf8', '#06b6d4', '#f59e0b', '#22c55e', '#ef4444',
    '#ec4899', '#8b5cf6', '#14b8a6', '#f97316', '#64748b',
    '#a78bfa', '#2dd4bf', '#facc15', '#fb923c', '#38bdf8',
];
