import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { ColumnInfo, DatasetMetadata } from './types';

function detectColumnType(values: unknown[]): ColumnInfo['type'] {
    const nonNull = values.filter(v => v !== null && v !== undefined && v !== '');
    if (nonNull.length === 0) return 'string';

    let numCount = 0;
    let dateCount = 0;
    let boolCount = 0;

    for (const v of nonNull.slice(0, 100)) {
        const str = String(v).trim();

        if (str === 'true' || str === 'false' || str === '0' || str === '1') {
            boolCount++;
        }

        if (!isNaN(Number(str)) && str !== '') {
            numCount++;
        }

        // Date detection
        const datePatterns = [
            /^\d{4}-\d{2}-\d{2}/, // ISO
            /^\d{1,2}\/\d{1,2}\/\d{2,4}/, // US
            /^\d{1,2}-\d{1,2}-\d{2,4}/, // EU
            /^\w{3,9}\s+\d{1,2},?\s+\d{4}/, // "Jan 1, 2024"
        ];
        if (datePatterns.some(p => p.test(str))) {
            dateCount++;
        }
    }

    const total = nonNull.slice(0, 100).length;
    if (boolCount / total > 0.9) return 'boolean';
    if (dateCount / total > 0.7) return 'date';
    if (numCount / total > 0.8) return 'number';
    return 'string';
}

function computeStats(values: unknown[], type: ColumnInfo['type']): Partial<ColumnInfo> {
    if (type !== 'number') return {};

    const nums = values
        .map(v => Number(v))
        .filter(n => !isNaN(n));

    if (nums.length === 0) return {};

    const sorted = [...nums].sort((a, b) => a - b);
    const sum = nums.reduce((a, b) => a + b, 0);
    const mean = sum / nums.length;
    const median = sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)];
    const variance = nums.reduce((acc, n) => acc + (n - mean) ** 2, 0) / nums.length;

    return {
        min: sorted[0],
        max: sorted[sorted.length - 1],
        mean: Math.round(mean * 100) / 100,
        median: Math.round(median * 100) / 100,
        stdDev: Math.round(Math.sqrt(variance) * 100) / 100,
    };
}

function analyzeColumns(data: Record<string, unknown>[]): ColumnInfo[] {
    if (data.length === 0) return [];

    const columns = Object.keys(data[0]);

    return columns.map(name => {
        const values = data.map(row => row[name]);
        const type = detectColumnType(values);
        const nonNull = values.filter(v => v !== null && v !== undefined && v !== '');
        const uniqueValues = new Set(nonNull.map(String));
        const sampleValues = nonNull.slice(0, 5).map(v =>
            type === 'number' ? Number(v) : String(v)
        );

        return {
            name,
            type,
            uniqueCount: uniqueValues.size,
            nullCount: values.length - nonNull.length,
            sampleValues,
            ...computeStats(values, type),
        };
    });
}

export function parseCSV(file: File): Promise<{ data: Record<string, unknown>[]; metadata: DatasetMetadata }> {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true,
            complete: (results) => {
                const data = results.data as Record<string, unknown>[];
                const columns = analyzeColumns(data);

                resolve({
                    data,
                    metadata: {
                        rowCount: data.length,
                        columnCount: columns.length,
                        columns,
                        fileName: file.name,
                        fileSize: file.size,
                    },
                });
            },
            error: (error) => reject(new Error(`CSV parsing failed: ${error.message}`)),
        });
    });
}

export function parseExcel(file: File): Promise<{ data: Record<string, unknown>[]; metadata: DatasetMetadata }> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const workbook = XLSX.read(e.target?.result, { type: 'array' });
                const firstSheet = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheet];
                const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);
                const columns = analyzeColumns(data);

                resolve({
                    data,
                    metadata: {
                        rowCount: data.length,
                        columnCount: columns.length,
                        columns,
                        fileName: file.name,
                        fileSize: file.size,
                    },
                });
            } catch (err) {
                reject(new Error(`Excel parsing failed: ${err}`));
            }
        };
        reader.onerror = () => reject(new Error('File read failed'));
        reader.readAsArrayBuffer(file);
    });
}

export function parseJSON(file: File): Promise<{ data: Record<string, unknown>[]; metadata: DatasetMetadata }> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                let parsed = JSON.parse(e.target?.result as string);
                // Handle both array and object formats
                const data: Record<string, unknown>[] = Array.isArray(parsed) ? parsed : [parsed];
                const columns = analyzeColumns(data);

                resolve({
                    data,
                    metadata: {
                        rowCount: data.length,
                        columnCount: columns.length,
                        columns,
                        fileName: file.name,
                        fileSize: file.size,
                    },
                });
            } catch (err) {
                reject(new Error(`JSON parsing failed: ${err}`));
            }
        };
        reader.onerror = () => reject(new Error('File read failed'));
        reader.readAsText(file);
    });
}

export async function parseFile(file: File) {
    const ext = file.name.split('.').pop()?.toLowerCase();

    switch (ext) {
        case 'csv':
            return parseCSV(file);
        case 'xlsx':
        case 'xls':
            return parseExcel(file);
        case 'json':
            return parseJSON(file);
        default:
            throw new Error(`Unsupported file type: .${ext}. Please upload CSV, Excel, or JSON files.`);
    }
}
