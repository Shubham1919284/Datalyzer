'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon, TrendingUp, TrendingDown, Minus, X } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

interface KPICardProps {
    title: string;
    value: number | string;
    subtitle?: string;
    icon?: LucideIcon;
    trend?: number;
    color?: string;
    delay?: number;
    kpiId?: string;
    onDismiss?: (id: string) => void;
}

function useCountUp(target: number, duration: number = 1500, startDelay: number = 0) {
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        let frameId = 0;
        let startTime: number | null = null;
        let cancelled = false;

        const timeout = setTimeout(() => {
            const animate = (timestamp: number) => {
                if (cancelled) return;
                if (startTime === null) startTime = timestamp;
                const elapsed = timestamp - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                setCurrent(target * eased);
                if (progress < 1) {
                    frameId = requestAnimationFrame(animate);
                } else {
                    setCurrent(target);
                }
            };
            frameId = requestAnimationFrame(animate);
        }, startDelay);

        return () => {
            cancelled = true;
            clearTimeout(timeout);
            cancelAnimationFrame(frameId);
        };
    }, [target, duration, startDelay]);

    return current;
}

export default function KPICard({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    color = '#818cf8',
    delay = 0,
    kpiId,
    onDismiss,
}: KPICardProps) {
    const TrendIcon = trend && trend > 0 ? TrendingUp : trend && trend < 0 ? TrendingDown : Minus;
    const isNumber = typeof value === 'number';
    const animatedValue = useCountUp(isNumber ? value : 0, 1600, delay * 100);
    const displayValue = isNumber ? formatNumber(animatedValue) : value;

    const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });
    const [hovered, setHovered] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setTilt({
            rotateX: ((y - rect.height / 2) / (rect.height / 2)) * -2,
            rotateY: ((x - rect.width / 2) / (rect.width / 2)) * 3,
        });
    };

    return (
        <motion.div
            ref={cardRef}
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{
                type: 'spring',
                damping: 22,
                stiffness: 100,
                delay: delay * 0.08,
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => { setHovered(false); setTilt({ rotateX: 0, rotateY: 0 }); }}
            className="relative rounded-2xl group"
            style={{
                transform: `perspective(800px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
                transition: 'transform 0.15s ease-out',
            }}
        >
            {/* ── Animated rotating border ── */}
            <div className="absolute -inset-[1px] rounded-2xl overflow-hidden">
                <div
                    className="absolute inset-0 animate-border-rotate"
                    style={{
                        background: `conic-gradient(from 0deg, transparent, ${color}, transparent, ${color}40, transparent)`,
                        opacity: hovered ? 0.9 : 0.4,
                        transition: 'opacity 0.4s ease',
                    }}
                />
            </div>

            {/* ── Card content (sits above the border) ── */}
            <div
                className={`relative rounded-2xl p-5 overflow-hidden
                    transition-shadow duration-300 ${hovered ? 'glow' : ''}`}
                style={{ background: 'rgba(10, 15, 30, 0.92)' }}
            >
                {/* Corner glow */}
                <div
                    className="absolute -top-8 -right-8 w-28 h-28 rounded-full blur-2xl pointer-events-none transition-opacity duration-500"
                    style={{
                        background: `radial-gradient(circle, ${color}25 0%, transparent 70%)`,
                        opacity: hovered ? 1 : 0,
                    }}
                />

                <div className="flex items-start justify-between mb-3 relative">
                    <p className="text-sm text-text-muted font-medium">{title}</p>
                    <div className="flex items-center gap-1">
                        {onDismiss && kpiId && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onDismiss(kpiId); }}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-surface-lighter text-text-muted transition-all"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                        {Icon && (
                            <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
                                style={{ backgroundColor: color + '18' }}
                            >
                                <Icon className="w-4 h-4" style={{ color }} />
                            </div>
                        )}
                    </div>
                </div>

                <p className="text-2xl font-bold text-text tracking-tight relative tabular-nums">{displayValue}</p>

                <div className="flex items-center gap-2 mt-2 relative">
                    {trend !== undefined && (
                        <span className={`flex items-center gap-1 text-xs font-medium ${trend > 0 ? 'text-success' : trend < 0 ? 'text-danger' : 'text-text-muted'
                            }`}>
                            <TrendIcon className="w-3 h-3" />
                            {Math.abs(trend)}%
                        </span>
                    )}
                    {subtitle && (
                        <span className="text-xs text-text-muted">{subtitle}</span>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
