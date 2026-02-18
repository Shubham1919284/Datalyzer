'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'midnight' | 'light' | 'ocean' | 'forest' | 'sunset';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>('sunset');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const savedTheme = localStorage.getItem('datalyzer-theme') as Theme;
        if (savedTheme) {
            setTheme(savedTheme);
        }
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        const root = document.documentElement;

        // Remove all theme classes
        root.classList.remove('theme-light', 'theme-ocean', 'theme-forest', 'theme-sunset');

        // Add new theme class (except for default 'midnight')
        if (theme !== 'midnight') {
            root.classList.add(`theme-${theme}`);
        }

        localStorage.setItem('datalyzer-theme', theme);
    }, [theme, mounted]);

    // Always render provider to avoid context errors in children during SSR
    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
