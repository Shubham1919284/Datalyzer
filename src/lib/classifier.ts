import { DatasetMetadata, ClassificationResult, DatasetType, ColumnInfo, ChartRecommendation } from './types';

// ─── Pattern dictionaries ────────────────────────────────────────
const SALES_PATTERNS = [
    'revenue', 'sales', 'price', 'product', 'quantity', 'order', 'customer',
    'profit', 'discount', 'total', 'amount', 'unit_price', 'cost', 'sku',
    'invoice', 'payment', 'transaction', 'purchase', 'item', 'cart',
    'shipping', 'subtotal', 'tax', 'margin', 'store', 'channel',
];

const SURVEY_PATTERNS = [
    'rating', 'satisfaction', 'score', 'feedback', 'response', 'survey',
    'opinion', 'agree', 'disagree', 'recommend', 'experience', 'quality',
    'likert', 'scale', 'nps', 'sentiment', 'review', 'comment',
    'strongly_agree', 'strongly_disagree', 'neutral', 'poor', 'excellent',
];

const FINANCIAL_PATTERNS = [
    'stock', 'ticker', 'portfolio', 'market_cap', 'pe_ratio', 'dividend',
    'open', 'close', 'high', 'low', 'volume', 'adj_close', 'return',
    'yield', 'bond', 'equity', 'asset', 'liability', 'balance',
    'interest_rate', 'exchange_rate', 'currency', 'forex', 'trade',
];

const DEMOGRAPHICS_PATTERNS = [
    'age', 'gender', 'education', 'income', 'population', 'ethnicity',
    'race', 'marital_status', 'occupation', 'employment', 'household',
    'census', 'birth', 'death', 'migration', 'salary', 'wage',
    'degree', 'university', 'school', 'country', 'state', 'city', 'zip',
];

// ─── Column role keywords ────────────────────────────────────────
const ID_PATTERNS = ['id', 'index', 'key', 'uuid', 'code', 'serial', 'number', 'no', 'sr', 'sno'];
const NAME_PATTERNS = ['name', 'title', 'label', 'description', 'comment', 'note', 'text', 'remark', 'address', 'email', 'phone', 'url'];

const METRIC_KEYWORDS = [
    'revenue', 'sales', 'price', 'amount', 'total', 'cost', 'profit', 'margin',
    'quantity', 'count', 'score', 'rating', 'value', 'sum', 'avg', 'average',
    'rate', 'percentage', 'pct', 'growth', 'change', 'return', 'yield',
    'temperature', 'humidity', 'speed', 'weight', 'height', 'distance',
    'income', 'salary', 'wage', 'budget', 'expense', 'balance', 'volume',
    'popularity', 'views', 'clicks', 'impressions', 'conversions',
    'duration', 'runtime', 'minutes', 'hours', 'vote', 'likes',
];

const AVG_KEYWORDS = [
    'rating', 'score', 'percentage', 'pct', 'rate', 'ratio', 'average', 'avg',
    'return', 'yield', 'satisfaction', 'nps', 'grade', 'rank', 'popularity',
    'vote_average', 'vote_count',
];

const DIMENSION_KEYWORDS = [
    'category', 'type', 'group', 'class', 'segment', 'region', 'area', 'zone',
    'department', 'team', 'brand', 'product', 'item', 'channel', 'source',
    'status', 'level', 'tier', 'grade', 'rank', 'priority',
    'country', 'state', 'city', 'location', 'store',
    'gender', 'age_group', 'occupation', 'education',
    'month', 'quarter', 'year', 'week', 'day', 'season',
    'genre', 'language', 'platform', 'device', 'browser',
];

// ─── Helpers ─────────────────────────────────────────────────────

function normalizeColumn(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
}

function toTitleCase(name: string): string {
    return name
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/[_\-\.]+/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase())
        .trim();
}

function matchPatterns(columnNames: string[], patterns: string[]): number {
    const normalized = columnNames.map(normalizeColumn);
    let matches = 0;
    for (const col of normalized) {
        for (const pattern of patterns) {
            if (col.includes(pattern) || pattern.includes(col)) { matches++; break; }
        }
    }
    return matches / Math.max(columnNames.length, 1);
}

function isTimeSeries(metadata: DatasetMetadata): { is: boolean; score: number } {
    const dateColumns = metadata.columns.filter(c => c.type === 'date');
    const numericColumns = metadata.columns.filter(c => c.type === 'number');
    if (dateColumns.length >= 1 && numericColumns.length >= 1) {
        const ratio = numericColumns.length / metadata.columnCount;
        return { is: true, score: 0.5 + ratio * 0.5 };
    }
    return { is: false, score: 0 };
}

// ─── Data pattern detection ──────────────────────────────────────

/** Detect if a numeric column is actually a year (e.g., 1990-2030) */
function looksLikeYear(col: ColumnInfo): boolean {
    if (col.type !== 'number') return false;
    if (col.min === undefined || col.max === undefined) return false;
    return col.min >= 1900 && col.max <= 2100 && col.uniqueCount > 3 &&
        (col.max - col.min) <= 200 && col.stdDev !== undefined && col.stdDev < 50;
}

/** Detect if a numeric column looks like a boolean/flag (0/1 or very few values) */
function looksLikeFlag(col: ColumnInfo, rowCount: number): boolean {
    if (col.type !== 'number') return false;
    return col.uniqueCount <= 2 && rowCount > 10;
}

/** Detect if values are likely sequential IDs */
function isLikelySequential(data: Record<string, unknown>[], colName: string): boolean {
    const sample = data.slice(0, Math.min(100, data.length));
    const values = sample.map(r => Number(r[colName])).filter(n => !isNaN(n));
    if (values.length < 10) return false;

    let ascending = 0;
    for (let i = 1; i < values.length; i++) {
        if (values[i] > values[i - 1]) ascending++;
    }
    return ascending / (values.length - 1) > 0.9;
}

/** Detect if string column has URL-like or path-like values */
function looksLikeUrlOrPath(col: ColumnInfo): boolean {
    if (col.type !== 'string') return false;
    const samples = col.sampleValues.filter(v => typeof v === 'string') as string[];
    return samples.some(v => v.startsWith('http') || v.startsWith('/') || v.includes('://'));
}

// ─── Entropy: how "interesting" a dimension is ──────────────────

function entropy(data: Record<string, unknown>[], colName: string): number {
    const counts: Record<string, number> = {};
    let total = 0;
    for (const row of data) {
        const v = String(row[colName] ?? '');
        counts[v] = (counts[v] || 0) + 1;
        total++;
    }
    if (total === 0) return 0;

    let h = 0;
    for (const count of Object.values(counts)) {
        const p = count / total;
        if (p > 0) h -= p * Math.log2(p);
    }
    return h;
}

// ─── Mutual Information: how related are two columns ─────────────

function mutualInformation(
    data: Record<string, unknown>[],
    dimCol: string,
    metricCol: string,
    bins: number = 5,
): number {
    // Discretize the metric column into bins
    const metricVals = data.map(r => Number(r[metricCol])).filter(n => !isNaN(n));
    if (metricVals.length < 20) return 0;

    const min = Math.min(...metricVals);
    const max = Math.max(...metricVals);
    const binWidth = (max - min) / bins || 1;

    // Joint and marginal counts
    const jointCounts: Record<string, number> = {};
    const dimCounts: Record<string, number> = {};
    const metricBinCounts: Record<string, number> = {};
    let total = 0;

    for (const row of data) {
        const dimVal = String(row[dimCol] ?? '');
        const metricVal = Number(row[metricCol]);
        if (isNaN(metricVal)) continue;

        const binIdx = Math.min(Math.floor((metricVal - min) / binWidth), bins - 1);
        const binKey = `b${binIdx}`;
        const jointKey = `${dimVal}|${binKey}`;

        jointCounts[jointKey] = (jointCounts[jointKey] || 0) + 1;
        dimCounts[dimVal] = (dimCounts[dimVal] || 0) + 1;
        metricBinCounts[binKey] = (metricBinCounts[binKey] || 0) + 1;
        total++;
    }

    if (total === 0) return 0;

    // MI = sum p(x,y) * log2(p(x,y) / (p(x)*p(y)))
    let mi = 0;
    for (const [jointKey, jointCount] of Object.entries(jointCounts)) {
        const [dimVal, binKey] = jointKey.split('|');
        const pXY = jointCount / total;
        const pX = dimCounts[dimVal] / total;
        const pY = metricBinCounts[binKey] / total;
        if (pX > 0 && pY > 0 && pXY > 0) {
            mi += pXY * Math.log2(pXY / (pX * pY));
        }
    }
    return Math.round(mi * 1000) / 1000;
}

// ─── Column scoring (enhanced) ───────────────────────────────────

function scoreAsMetric(col: ColumnInfo, metadata: DatasetMetadata, data: Record<string, unknown>[]): number {
    const norm = normalizeColumn(col.name);
    let score = 0;

    if (col.type !== 'number') return -Infinity;

    // ── Pattern-based ──
    if (ID_PATTERNS.some(p => norm === p || norm.endsWith(`_${p}`) || norm.startsWith(`${p}_`))) score -= 50;
    if (NAME_PATTERNS.some(p => norm.includes(p))) score -= 30;
    if (METRIC_KEYWORDS.some(p => norm.includes(p))) score += 40;

    // ── Data-pattern detection ──
    if (looksLikeYear(col)) score -= 35;         // Year columns are dimensions, not metrics
    if (looksLikeFlag(col, metadata.rowCount)) score -= 25;  // Boolean flags aren't useful metrics
    if (looksLikeUrlOrPath(col)) score -= 40;

    // ── Statistical signals ──

    // CV: meaningful variation (sweet spot 0.1-2.0)
    if (col.mean && col.stdDev && col.mean !== 0) {
        const cv = Math.abs(col.stdDev / col.mean);
        if (cv >= 0.1 && cv <= 2.0) score += 15;
        else if (cv > 5.0) score -= 5;
    }

    // Variance exists
    if (col.stdDev && col.stdDev > 0) score += 5;

    // Range breadth
    const range = (col.max ?? 0) - (col.min ?? 0);
    if (range > 10) score += 5;
    if (range > 100) score += 5;
    if (range > 1000) score += 5;

    // Non-negative
    if (col.min !== undefined && col.min >= 0) score += 5;

    // Decimal values (prices, rates)
    const sampleNums = col.sampleValues.map(v => Number(v)).filter(n => !isNaN(n));
    if (sampleNums.some(n => n !== Math.floor(n))) score += 8;

    // Constant column
    if (col.min !== undefined && col.max !== undefined && col.min === col.max) score -= 40;

    // Very few unique → likely encoded category
    if (col.uniqueCount <= 5 && metadata.rowCount > 20) score -= 15;

    // Unique per row → likely ID
    if (col.uniqueCount === metadata.rowCount) score -= 20;

    // Sequential / monotonic → likely auto-increment
    if (isLikelySequential(data, col.name)) score -= 30;

    return score;
}

function scoreAsDimension(col: ColumnInfo, metadata: DatasetMetadata, data: Record<string, unknown>[]): number {
    const norm = normalizeColumn(col.name);
    let score = 0;

    // Penalty: IDs
    if (ID_PATTERNS.some(p => norm === p || norm.endsWith(`_${p}`) || norm.startsWith(`${p}_`))) score -= 30;

    // Penalty: URL/path columns
    if (looksLikeUrlOrPath(col)) score -= 40;

    // Bonus: dimension keywords
    if (DIMENSION_KEYWORDS.some(p => norm.includes(p))) score += 40;

    if (col.type === 'string') {
        // Unique per row → likely a name/ID
        if (col.uniqueCount === metadata.rowCount) { score -= 40; return score; }

        score += 10;

        // Cardinality sweet spot: 2-30
        if (col.uniqueCount >= 2 && col.uniqueCount <= 30) score += 30;
        else if (col.uniqueCount > 30 && col.uniqueCount <= 100) score += 10;
        else if (col.uniqueCount > 100) score -= 10;

        // Sample value length
        const sampleStrings = col.sampleValues.filter(v => typeof v === 'string') as string[];
        if (sampleStrings.length > 0) {
            const avgLen = sampleStrings.reduce((s, v) => s + v.length, 0) / sampleStrings.length;
            if (avgLen <= 20) score += 10;
            else if (avgLen > 50) score -= 20;
        }

        // Repetition in sample → good for grouping
        const uniqueInSample = new Set(col.sampleValues).size;
        const repetitionRatio = 1 - (uniqueInSample / Math.max(col.sampleValues.length, 1));
        if (repetitionRatio > 0.3) score += 15;

        // Entropy bonus: more uniform distributions are more interesting
        const h = entropy(data, col.name);
        const maxH = Math.log2(col.uniqueCount || 1);
        if (maxH > 0) {
            const normalizedEntropy = h / maxH;
            if (normalizedEntropy > 0.7) score += 10; // uniform-ish distribution
        }
    }

    // Year columns are great dimensions
    if (col.type === 'number' && looksLikeYear(col)) score += 35;

    // Dates
    if (col.type === 'date') score += 25;

    // Number with few unique values (rating 1-5)
    if (col.type === 'number' && col.uniqueCount <= 10 && !looksLikeFlag(col, metadata.rowCount)) score += 15;

    return score;
}

// ─── Smart aggregation ───────────────────────────────────────────

function pickAggregation(col: ColumnInfo): 'sum' | 'avg' {
    const norm = normalizeColumn(col.name);
    if (AVG_KEYWORDS.some(p => norm.includes(p))) return 'avg';
    const range = (col.max ?? 0) - (col.min ?? 0);
    if (range > 0 && range <= 100 && (col.min ?? 0) >= 0 && (col.max ?? Infinity) <= 100) return 'avg';
    if (range > 0 && range <= 10 && (col.min ?? 0) >= 0) return 'avg';
    return 'sum';
}

// ─── Correlations ────────────────────────────────────────────────

function quickCorrelation(data: Record<string, unknown>[], colA: string, colB: string): number {
    const pairs: [number, number][] = [];
    for (let i = 0; i < Math.min(data.length, 500); i++) {
        const a = Number(data[i][colA]);
        const b = Number(data[i][colB]);
        if (!isNaN(a) && !isNaN(b)) pairs.push([a, b]);
    }
    if (pairs.length < 10) return 0;
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

// ─── Recommendation generation (with MI ranking + validation) ────

function generateRecommendations(
    metadata: DatasetMetadata,
    data: Record<string, unknown>[],
): ChartRecommendation[] {
    const recs: ChartRecommendation[] = [];
    const cols = metadata.columns;

    // Score & rank
    const metricRanking = cols
        .map(c => ({ col: c, score: scoreAsMetric(c, metadata, data) }))
        .filter(x => x.score > -Infinity)
        .sort((a, b) => b.score - a.score);

    const dimRanking = cols
        .map(c => ({ col: c, score: scoreAsDimension(c, metadata, data) }))
        .sort((a, b) => b.score - a.score);

    const topMetrics = metricRanking.filter(x => x.score > 0).slice(0, 5);
    const topDimensions = dimRanking.filter(x => x.score > 0).slice(0, 5);
    const dateColumns = cols.filter(c => c.type === 'date');

    // If no named metrics scored well, take the best numerics anyway
    if (topMetrics.length === 0 && metricRanking.length > 0) {
        topMetrics.push(metricRanking[0]);
    }

    let priority = 100;

    // ── 1. Mutual-information-ranked dimension × metric pairs ──
    // Compute MI for all interesting dim-metric pairs and sort by it
    const miPairs: { dim: ColumnInfo; metric: ColumnInfo; mi: number; agg: 'sum' | 'avg' }[] = [];

    for (const dim of topDimensions.filter(d => d.col.type === 'string' || looksLikeYear(d.col))) {
        for (const metric of topMetrics) {
            const mi = mutualInformation(data, dim.col.name, metric.col.name);
            miPairs.push({
                dim: dim.col,
                metric: metric.col,
                mi,
                agg: pickAggregation(metric.col),
            });
        }
    }
    miPairs.sort((a, b) => b.mi - a.mi);

    // Top MI pairs become the primary bar charts
    const usedPairs = new Set<string>();
    for (const pair of miPairs.slice(0, 6)) {
        const pairKey = `${pair.dim.name}-${pair.metric.name}`;
        if (usedPairs.has(pairKey)) continue;
        usedPairs.add(pairKey);

        const aggLabel = pair.agg === 'avg' ? 'Average' : 'Total';
        recs.push({
            id: `mi-bar-${pair.dim.name}-${pair.metric.name}`,
            chartType: 'bar',
            title: `${aggLabel} ${toTitleCase(pair.metric.name)} by ${toTitleCase(pair.dim.name)}`,
            description: `${aggLabel} ${toTitleCase(pair.metric.name)} grouped by ${toTitleCase(pair.dim.name)} (MI: ${pair.mi.toFixed(2)})`,
            xColumn: pair.dim.name,
            yColumn: pair.metric.name,
            aggregation: pair.agg,
            priority: priority--,
        });
    }

    // ── 2. Time series ──
    for (const dateCol of dateColumns) {
        for (const metric of topMetrics.slice(0, 3)) {
            recs.push({
                id: `ts-${dateCol.name}-${metric.col.name}`,
                chartType: 'area',
                title: `${toTitleCase(metric.col.name)} Over ${toTitleCase(dateCol.name)}`,
                description: `Trend of ${toTitleCase(metric.col.name)} over time`,
                xColumn: dateCol.name,
                yColumn: metric.col.name,
                aggregation: 'none',
                priority: priority--,
            });
        }
    }

    // ── 3. Year columns as time-like dimension ──
    const yearDims = topDimensions.filter(d => looksLikeYear(d.col));
    for (const yearDim of yearDims) {
        for (const metric of topMetrics.slice(0, 2)) {
            recs.push({
                id: `year-${yearDim.col.name}-${metric.col.name}`,
                chartType: 'line',
                title: `${toTitleCase(metric.col.name)} by ${toTitleCase(yearDim.col.name)}`,
                description: `Trend across ${toTitleCase(yearDim.col.name)}`,
                xColumn: yearDim.col.name,
                yColumn: metric.col.name,
                aggregation: pickAggregation(metric.col),
                priority: priority--,
            });
        }
    }

    // ── 4. Pie charts for low-cardinality dimensions ──
    for (const dim of topDimensions.filter(d => d.col.type === 'string' && d.col.uniqueCount >= 2 && d.col.uniqueCount <= 12)) {
        recs.push({
            id: `pie-${dim.col.name}`,
            chartType: 'pie',
            title: `${toTitleCase(dim.col.name)} Distribution`,
            description: `Share of records by ${toTitleCase(dim.col.name)}`,
            xColumn: dim.col.name,
            yColumn: dim.col.name,
            aggregation: 'count',
            priority: priority--,
        });

        // Also pie with top metric value
        if (topMetrics.length > 0) {
            const m = topMetrics[0];
            const agg = pickAggregation(m.col);
            recs.push({
                id: `pie-val-${dim.col.name}-${m.col.name}`,
                chartType: 'pie',
                title: `${toTitleCase(dim.col.name)} by ${toTitleCase(m.col.name)}`,
                description: `${agg === 'avg' ? 'Average' : 'Total'} ${toTitleCase(m.col.name)} per ${toTitleCase(dim.col.name)}`,
                xColumn: dim.col.name,
                yColumn: m.col.name,
                aggregation: agg,
                priority: priority--,
            });
        }
    }

    // ── 5. Correlations between metrics ──
    if (topMetrics.length >= 2) {
        const corrPairs: { a: string; b: string; corr: number }[] = [];
        for (let i = 0; i < Math.min(topMetrics.length, 4); i++) {
            for (let j = i + 1; j < Math.min(topMetrics.length, 4); j++) {
                const corr = quickCorrelation(data, topMetrics[i].col.name, topMetrics[j].col.name);
                if (Math.abs(corr) > 0.3) {
                    corrPairs.push({ a: topMetrics[i].col.name, b: topMetrics[j].col.name, corr });
                }
            }
        }
        corrPairs.sort((a, b) => Math.abs(b.corr) - Math.abs(a.corr));

        for (const pair of corrPairs.slice(0, 2)) {
            recs.push({
                id: `corr-${pair.a}-${pair.b}`,
                chartType: 'line',
                title: `${toTitleCase(pair.a)} vs ${toTitleCase(pair.b)}`,
                description: `Correlated (r=${pair.corr > 0 ? '+' : ''}${pair.corr})`,
                xColumn: pair.a,
                yColumn: pair.b,
                aggregation: 'none',
                priority: priority--,
            });
        }
    }

    // ── 6. Histograms for top metrics ──
    for (const metric of topMetrics.slice(0, 2)) {
        recs.push({
            id: `hist-${metric.col.name}`,
            chartType: 'histogram',
            title: `${toTitleCase(metric.col.name)} Distribution`,
            description: `Frequency distribution of ${toTitleCase(metric.col.name)}`,
            xColumn: metric.col.name,
            yColumn: metric.col.name,
            aggregation: 'none',
            priority: priority--,
        });
    }

    // ── Validation: remove degenerate recommendations ──
    return recs
        .filter(rec => {
            // Ensure x and y columns actually exist in data
            const hasX = metadata.columns.some(c => c.name === rec.xColumn);
            const hasY = metadata.columns.some(c => c.name === rec.yColumn);
            if (!hasX || !hasY) return false;

            // For bar/pie charts, ensure dimension has ≥ 2 groups
            if (rec.chartType === 'bar' || rec.chartType === 'pie') {
                const xCol = metadata.columns.find(c => c.name === rec.xColumn);
                if (xCol && xCol.uniqueCount < 2) return false;
                if (xCol && xCol.uniqueCount > 50 && rec.chartType === 'pie') return false;
            }

            return true;
        })
        .sort((a, b) => b.priority - a.priority);
}

// ─── Type config ─────────────────────────────────────────────────
const TYPE_CONFIG: Record<DatasetType, { label: string; description: string; charts: string[] }> = {
    sales: {
        label: '📊 Sales & Revenue',
        description: 'Revenue trends, product performance, and business KPIs',
        charts: ['line', 'bar', 'pie', 'kpi'],
    },
    timeseries: {
        label: '📈 Time Series',
        description: 'Temporal trends, patterns, and seasonal analysis',
        charts: ['line', 'area', 'bar', 'kpi'],
    },
    survey: {
        label: '📋 Survey & Feedback',
        description: 'Response distributions, satisfaction scores, and sentiment',
        charts: ['bar', 'pie', 'kpi', 'radar'],
    },
    financial: {
        label: '💰 Financial',
        description: 'Market data, portfolio analysis, and financial metrics',
        charts: ['line', 'bar', 'kpi', 'area'],
    },
    demographics: {
        label: '👥 Demographics',
        description: 'Population statistics, distributions, and socioeconomic data',
        charts: ['bar', 'pie', 'kpi', 'histogram'],
    },
    generic: {
        label: '📑 General Analysis',
        description: 'Comprehensive statistical overview and data exploration',
        charts: ['bar', 'pie', 'kpi', 'scatter'],
    },
};

// ─── Main classifier ─────────────────────────────────────────────
export function classifyDataset(
    metadata: DatasetMetadata,
    data: Record<string, unknown>[] = [],
): ClassificationResult {
    const columnNames = metadata.columns.map(c => c.name);

    const scores: Record<string, number> = {
        sales: matchPatterns(columnNames, SALES_PATTERNS),
        survey: matchPatterns(columnNames, SURVEY_PATTERNS),
        financial: matchPatterns(columnNames, FINANCIAL_PATTERNS),
        demographics: matchPatterns(columnNames, DEMOGRAPHICS_PATTERNS),
    };

    const tsCheck = isTimeSeries(metadata);
    scores.timeseries = tsCheck.score;

    let bestType: DatasetType = 'generic';
    let bestScore = 0.15;
    for (const [type, score] of Object.entries(scores)) {
        if (score > bestScore) { bestScore = score; bestType = type as DatasetType; }
    }

    // Column roles using enhanced scoring
    const dateColumns = metadata.columns.filter(c => c.type === 'date').map(c => c.name);

    const metricRanked = metadata.columns
        .map(c => ({ name: c.name, score: scoreAsMetric(c, metadata, data) }))
        .filter(x => x.score > -Infinity)
        .sort((a, b) => b.score - a.score);
    const numericColumns = metricRanked.map(x => x.name);

    const dimRanked = metadata.columns
        .map(c => ({ name: c.name, score: scoreAsDimension(c, metadata, data) }))
        .sort((a, b) => b.score - a.score);
    const categoricalColumns = dimRanked.filter(x => x.score > 0).map(x => x.name);

    const targetColumn = metricRanked.length > 0 && metricRanked[0].score > 0
        ? metricRanked[0].name : undefined;

    const config = TYPE_CONFIG[bestType];
    const recommendations = generateRecommendations(metadata, data);

    return {
        type: bestType,
        confidence: Math.min(Math.round(bestScore * 100), 99),
        label: config.label,
        description: config.description,
        suggestedCharts: config.charts,
        recommendations,
        columnRoles: { dateColumns, numericColumns, categoricalColumns, targetColumn },
    };
}
