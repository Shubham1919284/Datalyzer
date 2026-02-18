'use client';

import { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileSpreadsheet, AlertCircle, Loader2 } from 'lucide-react';
import { formatBytes } from '@/lib/utils';

interface FileUploadProps {
    onFileLoaded: (file: File) => void;
    isProcessing: boolean;
}

export default function FileUpload({ onFileLoaded, isProcessing }: FileUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const ACCEPTED = ['.csv', '.xlsx', '.xls', '.json'];

    const validateFile = useCallback((file: File) => {
        const ext = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!ACCEPTED.includes(ext)) {
            setError(`Unsupported format: ${ext}. Please use CSV, Excel, or JSON.`);
            return false;
        }
        if (file.size > 50 * 1024 * 1024) {
            setError('File too large. Maximum size is 50MB.');
            return false;
        }
        setError(null);
        return true;
    }, []);

    const handleFile = useCallback((file: File) => {
        if (validateFile(file)) {
            setSelectedFile(file);
            onFileLoaded(file);
        }
    }, [validateFile, onFileLoaded]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    }, [handleFile]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    }, [handleFile]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl mx-auto"
        >
            <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`
          relative rounded-2xl p-12 text-center cursor-pointer transition-all duration-300
          ${isDragging
                        ? 'glass-strong glow-strong scale-[1.02]'
                        : 'glass glow hover:glow-strong'
                    }
        `}
            >
                <input
                    type="file"
                    accept={ACCEPTED.join(',')}
                    onChange={handleInputChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    disabled={isProcessing}
                    id="file-upload-input"
                />

                <AnimatePresence mode="wait">
                    {isProcessing ? (
                        <motion.div
                            key="processing"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="flex flex-col items-center gap-4"
                        >
                            <Loader2 className="w-16 h-16 text-primary animate-spin" />
                            <p className="text-lg font-medium text-text">Analyzing your dataset...</p>
                            {selectedFile && (
                                <p className="text-sm text-text-muted">
                                    {selectedFile.name} ({formatBytes(selectedFile.size)})
                                </p>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="upload"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="flex flex-col items-center gap-4"
                        >
                            <div className="relative">
                                <motion.div
                                    animate={isDragging ? { scale: 1.1 } : { scale: 1 }}
                                    className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center"
                                >
                                    {isDragging ? (
                                        <FileSpreadsheet className="w-10 h-10 text-primary-light" />
                                    ) : (
                                        <Upload className="w-10 h-10 text-primary-light" />
                                    )}
                                </motion.div>
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent rounded-full animate-pulse-glow" />
                            </div>

                            <div>
                                <p className="text-xl font-semibold text-text">
                                    {isDragging ? 'Drop your file here' : 'Drop your dataset here'}
                                </p>
                                <p className="text-sm text-text-muted mt-1">
                                    or click to browse  •  CSV, Excel, JSON up to 50MB
                                </p>
                            </div>

                            <div className="flex gap-3 mt-2">
                                {['CSV', 'XLSX', 'JSON'].map((format) => (
                                    <span
                                        key={format}
                                        className="px-3 py-1 rounded-full text-xs font-mono bg-surface-lighter/50 text-text-muted"
                                    >
                                        .{format.toLowerCase()}
                                    </span>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mt-4 flex items-center gap-2 text-danger text-sm bg-danger/10 rounded-xl px-4 py-3"
                    >
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
