export type DatasetType =
  | 'sales'
  | 'timeseries'
  | 'survey'
  | 'financial'
  | 'demographics'
  | 'generic';

export interface ColumnInfo {
  name: string;
  type: 'number' | 'string' | 'date' | 'boolean' | 'mixed';
  uniqueCount: number;
  nullCount: number;
  sampleValues: (string | number | null)[];
  min?: number;
  max?: number;
  mean?: number;
  median?: number;
  stdDev?: number;
}

export interface DatasetMetadata {
  rowCount: number;
  columnCount: number;
  columns: ColumnInfo[];
  fileName: string;
  fileSize: number;
}

export interface ChartRecommendation {
  id: string;
  chartType: 'bar' | 'line' | 'area' | 'pie' | 'histogram';
  title: string;
  description: string;
  xColumn: string;
  yColumn: string;
  aggregation: 'sum' | 'avg' | 'count' | 'none';
  priority: number;
}

export interface ClassificationResult {
  type: DatasetType;
  confidence: number;
  label: string;
  description: string;
  suggestedCharts: string[];
  recommendations: ChartRecommendation[];
  columnRoles: {
    dateColumns: string[];
    numericColumns: string[];
    categoricalColumns: string[];
    targetColumn?: string;
  };
}

export interface ParsedDataset {
  data: Record<string, unknown>[];
  metadata: DatasetMetadata;
  classification: ClassificationResult;
  analysisMode: 'auto' | 'ai';
}

export type AppState = 'upload' | 'analyzing' | 'modeSelect' | 'classifying' | 'dashboard';
