'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

interface DataTableProps {
    data: Record<string, unknown>[];
    title?: string;
    delay?: number;
}

export default function DataTable({ data, title = 'Data Preview', delay = 0 }: DataTableProps) {
    const [page, setPage] = useState(0);
    const [search, setSearch] = useState('');
    const pageSize = 10;

    if (data.length === 0) return null;

    const columns = Object.keys(data[0]);

    const filtered = search
        ? data.filter(row =>
            Object.values(row).some(v =>
                String(v).toLowerCase().includes(search.toLowerCase())
            )
        )
        : data;

    const totalPages = Math.ceil(filtered.length / pageSize);
    const pageData = filtered.slice(page * pageSize, (page + 1) * pageSize);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay * 0.1, duration: 0.5 }}
            className="glass rounded-2xl p-5"
        >
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-base font-semibold text-text">{title}</h3>
                    <p className="text-xs text-text-muted mt-0.5">
                        {filtered.length.toLocaleString()} rows × {columns.length} columns
                    </p>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                        className="pl-8 pr-3 py-1.5 bg-surface-lighter rounded-lg text-xs text-text border border-border focus:border-primary focus:outline-none w-44"
                        id="data-table-search"
                    />
                </div>
            </div>

            <div className="overflow-x-auto rounded-xl">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="bg-surface-lighter/50">
                            {columns.map(col => (
                                <th key={col} className="text-left py-2.5 px-3 text-text-muted font-medium whitespace-nowrap">
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {pageData.map((row, i) => (
                            <tr
                                key={i}
                                className="border-t border-border/50 hover:bg-surface-lighter/30 transition-colors"
                            >
                                {columns.map(col => (
                                    <td key={col} className="py-2 px-3 text-text whitespace-nowrap max-w-[200px] truncate">
                                        {row[col] !== null && row[col] !== undefined ? String(row[col]) : '—'}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
                <p className="text-xs text-text-muted">
                    Page {page + 1} of {totalPages}
                </p>
                <div className="flex gap-1">
                    <button
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="p-1.5 rounded-lg hover:bg-surface-lighter disabled:opacity-30 transition-colors"
                        id="table-prev-btn"
                    >
                        <ChevronLeft className="w-4 h-4 text-text-muted" />
                    </button>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={page >= totalPages - 1}
                        className="p-1.5 rounded-lg hover:bg-surface-lighter disabled:opacity-30 transition-colors"
                        id="table-next-btn"
                    >
                        <ChevronRight className="w-4 h-4 text-text-muted" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
