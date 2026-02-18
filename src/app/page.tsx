'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, Brain, Sparkles, Database, Upload,
  MousePointerClick, ArrowRight, ShieldCheck, Zap,
  FileText
} from 'lucide-react';
import Link from 'next/link';
import FileUpload from '@/components/FileUpload';
import DashboardView from '@/components/DashboardView';
import ModeSelector from '@/components/ModeSelector';
import { parseFile } from '@/lib/parser';
import { classifyDataset } from '@/lib/classifier';
import { classifyWithAI } from '@/lib/ai-classifier';
import { AppState, ParsedDataset, DatasetMetadata } from '@/lib/types';

export default function Home() {
  const [appState, setAppState] = useState<AppState>('upload');
  const [dataset, setDataset] = useState<ParsedDataset | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isClassifying, setIsClassifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parsed data held between mode select and classification
  const parsedDataRef = useRef<{ data: Record<string, unknown>[]; metadata: DatasetMetadata } | null>(null);

  // Step 1: Parse file, then go to mode selection
  const handleFileLoaded = useCallback(async (file: File) => {
    try {
      setIsProcessing(true);
      setError(null);
      setAppState('analyzing');

      await new Promise(r => setTimeout(r, 800));

      const { data, metadata } = await parseFile(file);
      parsedDataRef.current = { data, metadata };

      await new Promise(r => setTimeout(r, 400));
      setAppState('modeSelect');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to process file');
      setAppState('upload');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Step 2a: Auto mode — use heuristic classifier
  const handleAutoMode = useCallback(() => {
    if (!parsedDataRef.current) return;
    const { data, metadata } = parsedDataRef.current;
    const classification = classifyDataset(metadata, data);
    setDataset({ data, metadata, classification, analysisMode: 'auto' });
    setAppState('dashboard');
  }, []);

  // Step 2b: AI mode — send to OpenRouter
  const handleAIMode = useCallback(async (apiKey: string) => {
    if (!parsedDataRef.current) return;
    const { data, metadata } = parsedDataRef.current;

    setIsClassifying(true);
    setAppState('classifying');
    setError(null);

    try {
      const classification = await classifyWithAI(metadata, data, apiKey);
      setDataset({ data, metadata, classification, analysisMode: 'ai' });
      setAppState('dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'AI analysis failed');
      setAppState('modeSelect'); // Go back to mode selection on error
    } finally {
      setIsClassifying(false);
    }
  }, []);

  const handleReset = useCallback(() => {
    setDataset(null);
    parsedDataRef.current = null;
    setAppState('upload');
    setError(null);
  }, []);

  // ─── Render States ──────────────────────────────────────────────

  // Dashboard
  if (appState === 'dashboard' && dataset) {
    return <DashboardView dataset={dataset} onReset={handleReset} />;
  }

  // Mode selection (after parsing, before classification)
  if ((appState === 'modeSelect' || appState === 'classifying') && parsedDataRef.current) {
    return (
      <div>
        <ModeSelector
          metadata={parsedDataRef.current.metadata}
          onSelectAuto={handleAutoMode}
          onSelectAI={handleAIMode}
          isClassifying={isClassifying}
        />
        {/* Error toast */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl glass-strong border border-danger/30 text-sm text-danger max-w-md text-center"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Landing Page
  return (
    <div className="min-h-screen bg-surface bg-grid relative overflow-hidden flex flex-col">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] right-[-10%] w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-text">Datalyzer</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/guide" className="text-sm font-medium text-text-muted hover:text-text transition-colors">
            User Guide
          </Link>

        </div>
      </nav>

      <main className="flex-1 relative z-10">
        {/* Hero Section */}
        <section className="pt-10 pb-20 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center mb-12">


            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl sm:text-7xl font-bold mb-6 tracking-tight text-text"
            >
              Instant Data Insights <br />
              <span className="gradient-text">Zero Config Required</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-text-muted max-w-2xl mx-auto leading-relaxed mb-10"
            >
              Upload any CSV, Excel, or JSON file. our intelligent engine automatically detects patterns, trends, and key metrics to build a stunning interactive dashboard in seconds.
            </motion.p>

            {/* Upload Area */}
            <div className="max-w-2xl mx-auto">
              <FileUpload onFileLoaded={handleFileLoaded} isProcessing={isProcessing} />

              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-danger text-sm mt-4"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 px-4 sm:px-6 relative">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-text mb-4">How It Works</h2>
              <p className="text-text-muted max-w-xl mx-auto">
                Three simple steps to transform your raw data into actionable insights.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
              {/* Connecting Line (Desktop) */}
              <div className="hidden md:block absolute top-[2.5rem] left-[16%] right-[16%] h-[2px] bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 z-0" />

              {[
                {
                  icon: Upload,
                  title: "1. Upload Data",
                  desc: "Drag & drop your file. All processing happens locally in your browser for maximum privacy.",
                  color: "bg-blue-500/10 text-blue-400"
                },
                {
                  icon: MousePointerClick,
                  title: "2. Select Mode",
                  desc: "Choose 'Auto' for instant pattern matching or 'AI' (Coming Soon) for deep semantic analysis.",
                  color: "bg-purple-500/10 text-purple-400"
                },
                {
                  icon: BarChart3,
                  title: "3. Interact",
                  desc: "Filter, sort, and drill down into your data. Reorder charts to tell your story.",
                  color: "bg-teal-500/10 text-teal-400"
                }
              ].map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="relative z-10 flex flex-col items-center text-center group"
                >
                  <div className={`w-20 h-20 rounded-2xl ${step.color} flex items-center justify-center mb-6 glass-strong border border-white/5 shadow-xl group-hover:scale-110 transition-transform duration-300`}>
                    <step.icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-text mb-3">{step.title}</h3>
                  <p className="text-sm text-text-muted leading-relaxed max-w-[280px]">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 px-4 sm:px-6 bg-surface-lighter/30">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: Zap,
                  title: "Instant Analysis",
                  desc: "No setup required. Our heuristic engine identifies time series, categories, and distributions automatically."
                },
                {
                  icon: ShieldCheck,
                  title: "Privacy First",
                  desc: "Your data never leaves your device in Auto Mode. Processing handles client-side."
                },
                {
                  icon: Database,
                  title: "Any Format",
                  desc: "Support for CSV, Excel, and JSON files. Messy data? We handle the parsing for you."
                }
              ].map((feature, i) => (
                <div key={i} className="glass p-8 rounded-3xl border border-border/50 hover:bg-surface-lighter/50 transition-colors">
                  <feature.icon className="w-8 h-8 text-primary-light mb-4" />
                  <h3 className="text-lg font-bold text-text mb-2">{feature.title}</h3>
                  <p className="text-sm text-text-muted leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 text-center text-sm text-text-muted border-t border-border/30">
        <div className="flex flex-col items-center gap-4">
          <p>© 2026 Datalyzer. Built for modern data teams.</p>
          <div className="flex gap-4">
            <Link href="/guide" className="hover:text-text transition-colors">Documentation</Link>
            <Link href="#" className="hover:text-text transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-text transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
