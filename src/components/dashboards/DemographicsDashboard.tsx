'use client';

import { ParsedDataset } from '@/lib/types';
import { getTopCategories, aggregateByCategory, getDistribution } from '@/lib/utils';
import KPICard from '@/components/charts/KPICard';
import BarChartCard from '@/components/charts/BarChartCard';
import PieChartCard from '@/components/charts/PieChartCard';
import DataTable from '@/components/charts/DataTable';
import { Users, MapPin, GraduationCap, Briefcase } from 'lucide-react';

interface DemographicsDashboardProps {
    dataset: ParsedDataset;
}

export default function DemographicsDashboard({ dataset }: DemographicsDashboardProps) {
    const { data, metadata, classification } = dataset;
    const { numericColumns, categoricalColumns, targetColumn } = classification.columnRoles;

    const primaryNumeric = targetColumn || numericColumns[0] || '';
    const genderCol = categoricalColumns.find(c => c.toLowerCase().includes('gender') || c.toLowerCase().includes('sex'));
    const locationCol = categoricalColumns.find(c =>
        c.toLowerCase().includes('country') || c.toLowerCase().includes('city') || c.toLowerCase().includes('state') || c.toLowerCase().includes('region')
    );
    const educationCol = categoricalColumns.find(c => c.toLowerCase().includes('education') || c.toLowerCase().includes('degree'));
    const occupationCol = categoricalColumns.find(c => c.toLowerCase().includes('occupation') || c.toLowerCase().includes('job') || c.toLowerCase().includes('employment'));

    // KPIs
    const ageCol = numericColumns.find(c => c.toLowerCase().includes('age'));
    const ages = ageCol ? data.map(r => Number(r[ageCol])).filter(n => !isNaN(n)) : [];
    const avgAge = ages.length ? ages.reduce((a, b) => a + b, 0) / ages.length : 0;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard title="Population" value={metadata.rowCount} icon={Users} color="#818cf8" delay={0} subtitle="total records" />
                {avgAge > 0 && <KPICard title="Avg Age" value={Math.round(avgAge * 10) / 10} icon={Users} color="#22c55e" delay={1} />}
                <KPICard title="Categories" value={categoricalColumns.length} icon={GraduationCap} color="#f59e0b" delay={2} subtitle="demographic fields" />
                <KPICard title="Locations" value={locationCol ? new Set(data.map(r => String(r[locationCol]))).size : categoricalColumns.length} icon={MapPin} color="#06b6d4" delay={3} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {genderCol && (
                    <PieChartCard title="Gender Distribution" data={getTopCategories(data, genderCol)} delay={4} />
                )}

                {ageCol && (
                    <BarChartCard
                        title="Age Distribution"
                        data={getDistribution(data, ageCol).map(d => ({ name: d.range, value: d.count }))}
                        gradient={false}
                        delay={5}
                    />
                )}

                {locationCol && (
                    <BarChartCard
                        title={`By ${locationCol}`}
                        data={getTopCategories(data, locationCol)}
                        delay={6}
                    />
                )}

                {educationCol && (
                    <PieChartCard title={`${educationCol} Breakdown`} data={getTopCategories(data, educationCol)} delay={7} />
                )}

                {occupationCol && (
                    <BarChartCard title={`Top ${occupationCol}`} data={getTopCategories(data, occupationCol)} horizontal delay={8} />
                )}

                {primaryNumeric && !ageCol && (
                    <BarChartCard
                        title={`${primaryNumeric} Distribution`}
                        data={getDistribution(data, primaryNumeric).map(d => ({ name: d.range, value: d.count }))}
                        gradient={false}
                        delay={9}
                    />
                )}
            </div>

            <DataTable data={data} delay={10} />
        </div>
    );
}
