'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Zap, Brain, ArrowRight, X, Sparkles, Loader2
} from 'lucide-react';
import { DatasetMetadata } from '@/lib/types';
import { getApiKey, setApiKey, testApiKey } from '@/lib/ai-classifier';
import { formatBytes } from '@/lib/utils';

interface ModeSelectorProps {
    metadata: DatasetMetadata;
    onSelectAuto: () => void;
    onSelectAI: (apiKey: string) => void;
    isClassifying: boolean;
}

export default function ModeSelector({ metadata, onSelectAuto, onSelectAI, isClassifying }: ModeSelectorProps) {
    const [apiKey, setApiKeyState] = useState('');
    const [keyValid, setKeyValid] = useState<boolean | null>(null);
    const [aiComingSoon, setAiComingSoon] = useState(false);

    // Check if key already exists in localStorage
    useEffect(() => {
        const saved = getApiKey();
        if (saved) {
            setApiKeyState(saved);
            setKeyValid(true); // Assume valid if saved
        }
    }, []);

    const handleAISelect = () => {
        // Temporary "Coming Soon" message
        setAiComingSoon(true);
        setTimeout(() => setAiComingSoon(false), 3000);
        return;
    };

    if (isClassifying) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                >
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                        className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-6"
                    >
                        <Loader2 className="w-8 h-8 text-primary-light" />
                    </motion.div>
                    <h2 className="text-2xl font-bold text-text mb-2">Analyzing Your Dataset</h2>
                    <p className="text-text-muted text-sm max-w-md mx-auto">
                        Scanning {metadata.columnCount} columns and {metadata.rowCount.toLocaleString()} rows
                        to build your dashboard...
                    </p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface bg-grid relative overflow-hidden pb-20">
            {/* Background blobs */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-accent/5 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 pt-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-10"
                >
                    <h1 className="text-4xl sm:text-5xl font-bold mb-3 tracking-tight">
                        <span className="gradient-text">Choose Analysis Mode</span>
                    </h1>
                    <p className="text-text-muted text-sm max-w-lg mx-auto">
                        Your dataset <span className="text-text font-medium">{metadata.fileName}</span> has been parsed —
                        {' '}{metadata.rowCount.toLocaleString()} rows, {metadata.columnCount} columns ({formatBytes(metadata.fileSize)})
                    </p>
                </motion.div>

                {/* Mode cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl w-full mb-20">
                    {/* Auto Dashboard */}
                    <motion.button
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        onClick={onSelectAuto}
                        className="glass rounded-2xl p-6 text-left group hover:glow transition-all duration-300 border border-border/50 hover:border-amber-500/30 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2" />

                        <div className="relative">
                            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Zap className="w-7 h-7 text-amber-400" />
                            </div>

                            <h3 className="text-xl font-bold text-text mb-2 flex items-center gap-2">
                                Auto Dashboard
                                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-medium">Free</span>
                            </h3>

                            <p className="text-sm text-text-muted mb-4 leading-relaxed">
                                Instant analysis using pattern matching — no API key needed.
                            </p>

                            <div className="mt-4 flex items-center gap-2 text-sm font-medium text-amber-400 group-hover:gap-3 transition-all">
                                Generate Instantly <ArrowRight className="w-4 h-4" />
                            </div>
                        </div>
                    </motion.button>

                    {/* AI Dashboard */}
                    <motion.button
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        onClick={handleAISelect}
                        className="glass rounded-2xl p-6 text-left group hover:glow transition-all duration-300 border border-border/50 hover:border-primary/30 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2" />

                        <div className="relative">
                            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Brain className="w-7 h-7 text-primary-light" />
                            </div>

                            <h3 className="text-xl font-bold text-text mb-2 flex items-center gap-2">
                                AI Dashboard
                                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary-light font-medium">Coming Soon</span>
                            </h3>

                            <p className="text-sm text-text-muted mb-4 leading-relaxed">
                                LLM analyzes your data and builds intelligent, relevant visualizations.
                            </p>

                            <div className="mt-4 flex items-center gap-2 text-sm font-medium text-primary-light group-hover:gap-3 transition-all">
                                Join Waitlist <ArrowRight className="w-4 h-4" />
                            </div>
                        </div>
                    </motion.button>
                </div>

                {/* Coming Soon Toast */}
                <AnimatePresence>
                    {aiComingSoon && (
                        <motion.div
                            initial={{ opacity: 0, y: 50, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.95 }}
                            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 glass-strong px-6 py-3 rounded-xl border border-primary/20 shadow-2xl flex items-center gap-3"
                        >
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                <Sparkles className="w-4 h-4 text-primary-light" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-text">Coming Soon!</h4>
                                <p className="text-xs text-text-muted">AI Analysis mode is currently in closed beta.</p>
                            </div>
                            <button onClick={() => setAiComingSoon(false)} className="ml-2 hover:bg-white/5 p-1 rounded-lg">
                                <X className="w-4 h-4 text-text-muted" />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
