import { DatasetMetadata, ClassificationResult, ChartRecommendation, DatasetType } from './types';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'google/gemini-2.5-pro-exp-03-25:free';

// ─── API Key Management ──────────────────────────────────────────
const STORAGE_KEY = 'datalyzer_openrouter_key';

export function getApiKey(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEY);
}

export function setApiKey(key: string): void {
    localStorage.setItem(STORAGE_KEY, key);
}

export function clearApiKey(): void {
    localStorage.removeItem(STORAGE_KEY);
}

// ─── Build the prompt ────────────────────────────────────────────
function buildPrompt(metadata: DatasetMetadata, sampleRows: Record<string, unknown>[]): string {
    const columnSummary = metadata.columns.map(col => {
        let info = `- **${col.name}** (${col.type})`;
        info += ` | ${col.uniqueCount} unique values, ${col.nullCount} nulls`;
        if (col.type === 'number') {
            info += ` | min=${col.min}, max=${col.max}, mean=${col.mean?.toFixed(2)}, stdDev=${col.stdDev?.toFixed(2)}`;
        }
        info += ` | samples: ${col.sampleValues.slice(0, 4).join(', ')}`;
        return info;
    }).join('\n');

    const sampleData = JSON.stringify(sampleRows.slice(0, 5), null, 2);

    return `You are a data analysis expert. Analyze this dataset and determine the best way to visualize it.

## Dataset Info
- **File**: ${metadata.fileName}
- **Rows**: ${metadata.rowCount}
- **Columns**: ${metadata.columnCount}

## Column Details
${columnSummary}

## Sample Data (first 5 rows)
\`\`\`json
${sampleData}
\`\`\`

## Your Task
Analyze the columns and data to determine:
1. The dataset type (one of: sales, timeseries, survey, financial, demographics, generic)
2. Which columns should be used as METRICS (Y-axis values — things like revenue, price, score)
3. Which columns should be used as DIMENSIONS (X-axis grouping — things like category, region, product)
4. Which columns are DATES (for time series)
5. Which single column is the best PRIMARY TARGET metric
6. Specific chart recommendations (which chart type + which columns make the most sense together)

IMPORTANT RULES:
- NEVER use ID, index, or serial number columns as metrics
- NEVER use name, email, or description columns as chart values
- Prefer columns with meaningful names (revenue, quantity, rating) as metrics
- Prefer columns with moderate cardinality (2-30 unique values) as dimensions
- Make chart titles human-readable and descriptive

Respond with ONLY valid JSON in this exact format:
{
  "type": "sales|timeseries|survey|financial|demographics|generic",
  "confidence": 85,
  "label": "📊 Human-Readable Label",
  "description": "One sentence describing what analysis this dashboard shows",
  "dateColumns": ["col1"],
  "numericColumns": ["col2", "col3"],
  "categoricalColumns": ["col4", "col5"],
  "targetColumn": "col2",
  "charts": [
    {
      "chartType": "bar|line|area|pie|histogram",
      "title": "Human-Readable Chart Title",
      "description": "What this chart shows",
      "xColumn": "col4",
      "yColumn": "col2",
      "aggregation": "sum|avg|count|none"
    }
  ]
}`;
}

// ─── Type config (same as heuristic classifier) ──────────────────
const TYPE_CHARTS: Record<DatasetType, string[]> = {
    sales: ['line', 'bar', 'pie', 'kpi'],
    timeseries: ['line', 'area', 'bar', 'kpi'],
    survey: ['bar', 'pie', 'kpi', 'radar'],
    financial: ['line', 'bar', 'kpi', 'area'],
    demographics: ['bar', 'pie', 'kpi', 'histogram'],
    generic: ['bar', 'pie', 'kpi', 'scatter'],
};

// ─── Main AI classifier ─────────────────────────────────────────
export async function classifyWithAI(
    metadata: DatasetMetadata,
    data: Record<string, unknown>[],
    apiKey: string,
    model: string = DEFAULT_MODEL,
): Promise<ClassificationResult> {
    const prompt = buildPrompt(metadata, data);

    const response = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://datalyzer.app',
            'X-Title': 'Datalyzer',
        },
        body: JSON.stringify({
            model,
            messages: [
                {
                    role: 'system',
                    content: 'You are a data analysis expert. Always respond with valid JSON only, no markdown fencing, no extra text.',
                },
                { role: 'user', content: prompt },
            ],
            temperature: 0.1,
            max_tokens: 2000,
        }),
    });

    if (!response.ok) {
        const err = await response.text();
        if (response.status === 401) throw new Error('Invalid API key. Please check your OpenRouter API key.');
        if (response.status === 429) throw new Error('Rate limited. Please wait a moment and try again.');
        throw new Error(`OpenRouter API error (${response.status}): ${err}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;

    if (!content) {
        throw new Error('No response from AI model. Please try again.');
    }

    // Parse JSON (handle markdown code fences if the model wraps it)
    let parsed;
    try {
        const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        parsed = JSON.parse(cleaned);
    } catch {
        throw new Error('AI returned invalid JSON. Please try again.');
    }

    // Validate and normalize
    const validTypes: DatasetType[] = ['sales', 'timeseries', 'survey', 'financial', 'demographics', 'generic'];
    const type: DatasetType = validTypes.includes(parsed.type) ? parsed.type : 'generic';

    const recommendations: ChartRecommendation[] = (parsed.charts || []).map(
        (chart: { chartType: string; title: string; description: string; xColumn: string; yColumn: string; aggregation: string }, i: number) => ({
            id: `ai-chart-${i}`,
            chartType: (['bar', 'line', 'area', 'pie', 'histogram'].includes(chart.chartType) ? chart.chartType : 'bar') as ChartRecommendation['chartType'],
            title: chart.title || `Chart ${i + 1}`,
            description: chart.description || '',
            xColumn: chart.xColumn || '',
            yColumn: chart.yColumn || '',
            aggregation: (['sum', 'avg', 'count', 'none'].includes(chart.aggregation) ? chart.aggregation : 'sum') as ChartRecommendation['aggregation'],
            priority: 100 - i,
        })
    );

    return {
        type,
        confidence: Math.min(Math.max(parsed.confidence || 75, 50), 99),
        label: parsed.label || `📊 ${type.charAt(0).toUpperCase() + type.slice(1)}`,
        description: parsed.description || 'AI-analyzed dataset',
        suggestedCharts: TYPE_CHARTS[type] || TYPE_CHARTS.generic,
        recommendations,
        columnRoles: {
            dateColumns: parsed.dateColumns || [],
            numericColumns: parsed.numericColumns || [],
            categoricalColumns: parsed.categoricalColumns || [],
            targetColumn: parsed.targetColumn,
        },
    };
}

// ─── Test API key ────────────────────────────────────────────────
export async function testApiKey(apiKey: string): Promise<boolean> {
    try {
        const response = await fetch(OPENROUTER_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: DEFAULT_MODEL,
                messages: [{ role: 'user', content: 'Say "ok"' }],
                max_tokens: 5,
            }),
        });
        return response.ok;
    } catch {
        return false;
    }
}
