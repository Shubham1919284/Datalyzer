'use client';

import { ParsedDataset } from '@/lib/types';
import { getTopCategories, aggregateByCategory } from '@/lib/utils';
import KPICard from '@/components/charts/KPICard';
import BarChartCard from '@/components/charts/BarChartCard';
import PieChartCard from '@/components/charts/PieChartCard';
import DataTable from '@/components/charts/DataTable';
import { Star, MessageSquare, ThumbsUp, Users } from 'lucide-react';

interface SurveyDashboardProps {
    dataset: ParsedDataset;
}

export default function SurveyDashboard({ dataset }: SurveyDashboardProps) {
    const { data, metadata, classification } = dataset;
    const { numericColumns, categoricalColumns, targetColumn } = classification.columnRoles;

    // Find rating/score columns
    const ratingCol = targetColumn || numericColumns.find(c =>
        c.toLowerCase().includes('rating') || c.toLowerCase().includes('score') || c.toLowerCase().includes('satisfaction')
    ) || numericColumns[0] || '';

    const responseCol = categoricalColumns.find(c =>
        c.toLowerCase().includes('response') || c.toLowerCase().includes('feedback') || c.toLowerCase().includes('answer')
    ) || categoricalColumns[0] || '';

    // KPIs
    const ratings = data.map(r => Number(r[ratingCol])).filter(n => !isNaN(n));
    const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
    const maxRating = ratings.length ? Math.max(...ratings) : 0;
    const positiveRate = ratings.length ? (ratings.filter(r => r >= maxRating * 0.7).length / ratings.length * 100) : 0;

    return (
        <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard title="Total Responses" value={metadata.rowCount} icon={MessageSquare} color="#818cf8" delay={0} />
                <KPICard title={`Avg ${ratingCol}`} value={Math.round(avgRating * 100) / 100} icon={Star} color="#f59e0b" delay={1} subtitle={`out of ${maxRating}`} />
                <KPICard title="Positive Rate" value={`${Math.round(positiveRate)}%`} icon={ThumbsUp} color="#22c55e" delay={2} subtitle="≥70% of max" />
                <KPICard title="Categories" value={categoricalColumns.length} icon={Users} color="#06b6d4" delay={3} subtitle="segmentation fields" />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Rating distribution */}
                {ratingCol && (
                    <BarChartCard
                        title={`${ratingCol} Distribution`}
                        subtitle="Response frequency by score"
                        data={getTopCategories(data, ratingCol, 10)}
                        delay={4}
                    />
                )}

                {/* Response breakdown */}
                {responseCol && (
                    <PieChartCard
                        title={`${responseCol} Breakdown`}
                        subtitle="Response distribution"
                        data={getTopCategories(data, responseCol)}
                        delay={5}
                    />
                )}
            </div>

            {/* Category cross tabs */}
            {categoricalColumns.length >= 2 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {categoricalColumns.slice(0, 2).map((col, i) => (
                        <BarChartCard
                            key={col}
                            title={`By ${col}`}
                            subtitle={ratingCol ? `Average ${ratingCol}` : 'Count'}
                            data={ratingCol
                                ? aggregateByCategory(data, col, ratingCol, 'avg')
                                : getTopCategories(data, col)
                            }
                            horizontal
                            delay={6 + i}
                        />
                    ))}
                </div>
            )}

            <DataTable data={data} delay={8} />
        </div>
    );
}
