'use client';

import { useState, useEffect, useRef } from 'react';
import { useTheme } from './ThemeProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Check, Moon, Sun, CloudRain, Trees, Sunset } from 'lucide-react';

const themes = [
    { id: 'midnight', label: 'Midnight', icon: Moon, color: '#6366f1' },
    { id: 'light', label: 'Light', icon: Sun, color: '#4f46e5' },
    { id: 'ocean', label: 'Ocean', icon: CloudRain, color: '#0ea5e9' },
    { id: 'forest', label: 'Forest', icon: Trees, color: '#10b981' },
    { id: 'sunset', label: 'Sunset', icon: Sunset, color: '#f43f5e' },
] as const;

export default function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-xl bg-surface-lighter hover:bg-primary/10 border border-border/50 text-text-muted hover:text-primary-light transition-colors"
                aria-label="Change theme"
            >
                <Palette className="w-5 h-5" />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-48 py-2 rounded-xl glass-strong border border-border/50 shadow-xl z-50 origin-top-right"
                    >
                        <div className="px-3 py-1.5 text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
                            Select Theme
                        </div>
                        {themes.map((t) => (
                            <button
                                key={t.id}
                                onClick={() => {
                                    setTheme(t.id);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors hover:bg-white/5
                                    ${theme === t.id ? 'text-text font-medium bg-white/5' : 'text-text-muted'}
                                `}
                            >
                                <div
                                    className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 border border-white/10"
                                    style={{ backgroundColor: t.color }}
                                >
                                    {theme === t.id && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                                </div>
                                <span className="flex-1 text-left">{t.label}</span>
                                <t.icon className="w-3.5 h-3.5 opacity-50" />
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
