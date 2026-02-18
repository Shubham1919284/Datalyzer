'use client';

import { ParsedDataset } from '@/lib/types';
import { motion } from 'framer-motion';
import { ArrowLeft, FileSpreadsheet, Brain, Rows3, Columns3, Zap } from 'lucide-react';
import SmartDashboard from './dashboards/SmartDashboard';
import ChartBuilder from './ChartBuilder';
import { formatBytes } from '@/lib/utils';

interface DashboardViewProps {
    dataset: ParsedDataset;
    onReset: () => void;
}

export default function DashboardView({ dataset, onReset }: DashboardViewProps) {
    const { metadata, classification } = dataset;

    return (
        <div className="min-h-screen bg-surface bg-grid">
            {/* Top Navigation */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="sticky top-0 z-50 glass-strong border-b border-border/50"
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onReset}
                            className="p-2 rounded-xl hover:bg-surface-lighter transition-colors"
                            id="back-button"
                        >
                            <ArrowLeft className="w-5 h-5 text-text-muted" />
                        </button>
                        <div>
                            <h1 className="text-lg font-bold text-text flex items-center gap-2">
                                <span className="gradient-text">Datalyzer</span>
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-lighter/50 border border-border/50">
                            <FileSpreadsheet className="w-3.5 h-3.5 text-primary-light" />
                            <span className="text-xs text-text-muted truncate max-w-32">{metadata.fileName}</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20">
                            <Brain className="w-3.5 h-3.5 text-primary-light" />
                            <span className="text-xs font-medium text-primary-light">{classification.label}</span>
                            <span className="text-[10px] text-text-muted bg-surface-lighter px-1.5 py-0.5 rounded-full">
                                {classification.confidence}%
                            </span>
                        </div>
                        <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[10px] font-medium uppercase tracking-wider ${dataset.analysisMode === 'ai'
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                            }`}>
                            {dataset.analysisMode === 'ai' ? <Brain className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
                            {dataset.analysisMode === 'ai' ? 'AI' : 'Auto'}
                        </div>
                    </div>
                </div>
            </motion.header>

            {/* Info Bar */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="max-w-7xl mx-auto px-4 sm:px-6 py-4"
            >
                <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted">
                    <span className="flex items-center gap-1.5">
                        <Rows3 className="w-3.5 h-3.5" />
                        {metadata.rowCount.toLocaleString()} rows
                    </span>
                    <span className="w-px h-3 bg-border" />
                    <span className="flex items-center gap-1.5">
                        <Columns3 className="w-3.5 h-3.5" />
                        {metadata.columnCount} columns
                    </span>
                    <span className="w-px h-3 bg-border" />
                    <span>{formatBytes(metadata.fileSize)}</span>
                    <span className="w-px h-3 bg-border" />
                    <span className="text-text-muted/70">{classification.description}</span>
                </div>
            </motion.div>

            {/* Dashboard Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
                {/* Recommendation-driven dashboard */}
                <SmartDashboard dataset={dataset} />

                <div className="my-8 border-t border-border/30" />

                {/* Custom chart builder */}
                <ChartBuilder dataset={dataset} />
            </main>
        </div>
    );
}
