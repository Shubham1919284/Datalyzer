'use client';

import { motion } from 'framer-motion';
import {
    Printer, ArrowLeft, Upload, BarChart3, Brain,
    Filter, Download, Shield, Zap
} from 'lucide-react';
import Link from 'next/link';

export default function GuidePage() {
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-surface text-text font-sans selection:bg-primary/20">
            {/* Navigation (Hidden on Print) */}
            <nav className="print:hidden sticky top-0 z-50 glass border-b border-border/50 px-6 py-4 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 text-text-muted hover:text-text transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    Back to App
                </Link>
                <div className="flex items-center gap-4">
                    <h1 className="text-lg font-bold">Datalyzer User Guide</h1>
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20"
                    >
                        <Printer className="w-4 h-4" />
                        Save as PDF
                    </button>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto px-6 py-12 print:px-0 print:py-0">
                {/* Print Header */}
                <div className="hidden print:block mb-8 border-b border-black/10 pb-4">
                    <div className="flex justify-between items-center">
                        <h1 className="text-3xl font-bold text-black">Datalyzer User Documentation</h1>
                        <span className="text-sm text-gray-500">v2.0 • Generated {new Date().toLocaleDateString()}</span>
                    </div>
                </div>

                <div className="space-y-12">
                    {/* Introduction */}
                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center print:border print:border-gray-200">
                                <Zap className="w-6 h-6 text-primary-light print:text-black" />
                            </div>
                            <h2 className="text-2xl font-bold">Getting Started</h2>
                        </div>
                        <div className="prose prose-invert print:prose-neutral max-w-none">
                            <p className="text-lg text-text-muted print:text-gray-700">
                                Datalyzer is an instant data analysis platform that transforms raw files into interactive dashboards.
                                No account or configuration is required.
                            </p>

                            <h3 className="text-xl font-semibold mt-6 mb-3">Supported Formats</h3>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 list-none pl-0">
                                <li className="flex items-center gap-3 p-4 rounded-xl bg-surface-lighter/50 border border-border/50 print:border-gray-200">
                                    <div className="font-mono text-sm bg-green-500/10 text-green-400 px-2 py-1 rounded">.CSV</div>
                                    <span className="text-sm">Standard comma-separated values. Ideal for large datasets.</span>
                                </li>
                                <li className="flex items-center gap-3 p-4 rounded-xl bg-surface-lighter/50 border border-border/50 print:border-gray-200">
                                    <div className="font-mono text-sm bg-green-500/10 text-green-400 px-2 py-1 rounded">.XLSX</div>
                                    <span className="text-sm">Microsoft Excel workbooks. The first sheet will be analyzed.</span>
                                </li>
                                <li className="flex items-center gap-3 p-4 rounded-xl bg-surface-lighter/50 border border-border/50 print:border-gray-200">
                                    <div className="font-mono text-sm bg-green-500/10 text-green-400 px-2 py-1 rounded">.JSON</div>
                                    <span className="text-sm">Array of objects structure. Great for nested data exports.</span>
                                </li>
                            </ul>
                        </div>
                    </section>

                    <hr className="border-border/50 print:border-gray-200" />

                    {/* Dashboard Guide */}
                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center print:border print:border-gray-200">
                                <BarChart3 className="w-6 h-6 text-accent print:text-black" />
                            </div>
                            <h2 className="text-2xl font-bold">The Dashboard</h2>
                        </div>

                        <div className="grid gap-6">
                            <div className="p-6 rounded-2xl bg-surface-lighter/30 border border-border/30 print:border-gray-200 print:bg-white text-text-muted">
                                <h3 className="text-lg font-semibold text-text print:text-black mb-2">1. KPI Cards</h3>
                                <p className="mb-4">Top-level metrics identified automatically from your columns.</p>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li><strong>Total/Sum:</strong> For additive metrics like Revenue or Sales.</li>
                                    <li><strong>Average:</strong> For rates, scores, or percentages.</li>
                                    <li><strong>Count:</strong> Unique values for categorical columns.</li>
                                </ul>
                            </div>

                            <div className="p-6 rounded-2xl bg-surface-lighter/30 border border-border/30 print:border-gray-200 print:bg-white text-text-muted">
                                <h3 className="text-lg font-semibold text-text print:text-black mb-2">2. Interactive Charts</h3>
                                <p className="mb-4">All charts are fully interactive. Hover for details, click legend items to toggle series.</p>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="font-medium text-text print:text-black">Chart Types</h4>
                                        <ul className="text-sm mt-2 space-y-1">
                                            <li>• Time Series (Line/Area)</li>
                                            <li>• Categorical (Bar/Column)</li>
                                            <li>• Distribution (Pie/Donut)</li>
                                            <li>• Correlation Heatmaps</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-text print:text-black">Controls</h4>
                                        <ul className="text-sm mt-2 space-y-1">
                                            <li>• <strong>Drag</strong> to reorder sections</li>
                                            <li>• <strong>Dismiss (×)</strong> to hide irrelevant charts</li>
                                            <li>• <strong>Undo</strong> to bring back dismissed items</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <hr className="border-border/50 print:border-gray-200" />

                    {/* AI Mode */}
                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center print:border print:border-gray-200">
                                <Brain className="w-6 h-6 text-emerald-400 print:text-black" />
                            </div>
                            <h2 className="text-2xl font-bold">AI Analysis (Beta)</h2>
                        </div>
                        <div className="prose prose-invert print:prose-neutral max-w-none text-text-muted">
                            <p>
                                The AI mode (coming soon) uses Large Language Models (LLMs) to understand the semantic meaning of your data.
                            </p>
                            <div className="flex gap-4 mt-4 print:block">
                                <div className="flex-1 p-4 rounded-xl bg-surface-lighter/50 border border-border/30 print:border-gray-200 print:mb-4">
                                    <h4 className="font-semibold text-text print:text-black mb-2">Auto Mode (Current)</h4>
                                    <p className="text-sm">"Column 'price' is a number, so I'll calculate the average."</p>
                                </div>
                                <div className="flex-1 p-4 rounded-xl bg-primary/5 border border-primary/20 print:border-gray-200">
                                    <h4 className="font-semibold text-primary-light print:text-black mb-2">AI Mode</h4>
                                    <p className="text-sm">"This looks like e-commerce sales data. I should calculate Revenue by Product Category and show monthly growth trends."</p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                <footer className="mt-20 pt-8 border-t border-border/30 print:border-black/50 text-center text-sm text-text-muted">
                    <p>Datalyzer Documentation • Generated via datalyzer.app</p>
                </footer>
            </main>

            {/* Print Styles Injection */}
            <style jsx global>{`
                @media print {
                    @page { margin: 2cm; }
                    body { 
                        background: white; 
                        color: black; 
                    }
                    .glass, .glass-strong, .bg-surface, .bg-surface-lighter\\/50, .bg-primary\\/10 {
                        background: transparent !important;
                        box-shadow: none !important;
                    }
                    .text-text, .text-text-muted, .text-primary-light, .text-accent {
                        color: black !important;
                    }
                    .border-border\\/50, .border-border\\/30 {
                        border-color: #ddd !important;
                    }
                    /* Ensure graphs print reasonably well contextually (though canvas printing varies) */
                    canvas, svg {
                        break-inside: avoid;
                    }
                }
            `}</style>
        </div>
    );
}
