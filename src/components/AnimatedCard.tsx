'use client';

import { useState, useRef, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface AnimatedCardProps {
    children: ReactNode;
    chartId?: string;
    onDismiss?: (id: string) => void;
    accentColor?: string;
    delay?: number;
    className?: string;
}

export default function AnimatedCard({
    children,
    chartId,
    onDismiss,
    accentColor,
    delay = 0,
    className = '',
}: AnimatedCardProps) {
    const [isHovered, setIsHovered] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -2.5;
        const rotateY = ((x - centerX) / centerX) * 3;
        setTilt({ rotateX, rotateY });
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        setTilt({ rotateX: 0, rotateY: 0 });
    };

    return (
        <motion.div
            ref={cardRef}
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{
                type: 'spring',
                damping: 22,
                stiffness: 100,
                delay: delay * 0.08,
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={`glass rounded-2xl relative overflow-hidden transition-shadow duration-300
                ${isHovered ? 'glow' : ''} ${className}`}
            style={{
                perspective: '800px',
                transform: `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
                transition: 'transform 0.15s ease-out, box-shadow 0.3s ease',
            }}
        >
            {/* Gradient accent line */}
            {accentColor && (
                <div
                    className="absolute top-0 left-0 right-0 h-[2px]"
                    style={{
                        background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
                        opacity: isHovered ? 1 : 0.5,
                        transition: 'opacity 0.3s ease',
                    }}
                />
            )}

            {/* Dismiss button */}
            {chartId && onDismiss && (
                <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1 : 0.8 }}
                    transition={{ duration: 0.15 }}
                    onClick={(e) => {
                        e.stopPropagation();
                        onDismiss(chartId);
                    }}
                    className="absolute top-3 right-3 z-10 w-7 h-7 rounded-lg bg-surface-lighter/80
                        backdrop-blur-sm flex items-center justify-center hover:bg-danger/20
                        hover:text-danger transition-colors duration-200 text-text-muted"
                    aria-label="Remove chart"
                >
                    <X className="w-3.5 h-3.5" />
                </motion.button>
            )}

            {/* Card content */}
            <div className="p-5">
                {children}
            </div>

            {/* Hover glow overlay */}
            <div
                className="absolute inset-0 pointer-events-none rounded-2xl transition-opacity duration-500"
                style={{
                    opacity: isHovered ? 1 : 0,
                    background: accentColor
                        ? `radial-gradient(300px circle at var(--mouse-x, 50%) var(--mouse-y, 30%), ${accentColor}06, transparent 60%)`
                        : 'radial-gradient(300px circle at 50% 30%, rgba(99, 102, 241, 0.04), transparent 60%)',
                }}
            />
        </motion.div>
    );
}
