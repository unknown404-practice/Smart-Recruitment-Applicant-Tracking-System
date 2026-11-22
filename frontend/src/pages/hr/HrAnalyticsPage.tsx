import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, ShieldAlert, Download, Layers } from 'lucide-react';
import { useAnalytics } from '../../hooks/useAnalytics';
import { AnalyticsKpiCards } from '../../components/analytics/AnalyticsKpiCards';
import { RecruitmentFunnelChart } from '../../components/analytics/RecruitmentFunnelChart';
import { AnalyticsFilterBar } from '../../components/analytics/AnalyticsFilterBar';
import { SPRING_GENTLE } from '../../components/animations';

export const HrAnalyticsPage: React.FC = () => {
  const {
    metrics,
    funnel,
    loading,
    error,
    filters,
    filterOptions,
    setFilter,
    applyDatePreset,
    resetFilters,
    refetch,
  } = useAnalytics();

  const handleExportJson = () => {
    const exportDoc = {
      exportedAt: new Date().toISOString(),
      filters,
      metrics,
      funnel,
    };
    const blob = new Blob([JSON.stringify(exportDoc, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Smart_ATS_Hiring_Analytics_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING_GENTLE}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-50 text-brand-700 border border-brand-200">
              Floor 22 • Hiring Analytics Engine
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-brand-600" />
            Recruitment Analytics & Funnel Conversion
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Live SQL-aggregated pipeline metrics, stage conversion rates, offer acceptance, and time-to-hire velocity.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExportJson}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-xs transition"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Export Data
          </button>
        </div>
      </motion.div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Failed to fetch analytics metrics</p>
            <p className="text-rose-600 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <AnalyticsFilterBar
        filters={filters}
        filterOptions={filterOptions}
        onFilterChange={setFilter}
        onPresetChange={applyDatePreset}
        onReset={resetFilters}
        onRefresh={refetch}
        isLoading={loading}
      />

      {/* 4 Primary KPI Summary Cards */}
      <AnalyticsKpiCards metrics={metrics} isLoading={loading} />

      {/* 6-Stage Conversion Funnel Visualization */}
      <RecruitmentFunnelChart
        funnel={funnel}
        totalApplications={metrics.totalApplications}
        isLoading={loading}
      />

      {/* Pipeline Stage Distribution & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Stage Volume Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-brand-600" />
            Candidate Stage Retention
          </h4>
          <div className="divide-y divide-slate-100 text-xs">
            {funnel.map((item) => (
              <div key={item.stage} className="py-2.5 flex items-center justify-between">
                <span className="font-semibold text-slate-800">{item.stage}</span>
                <div className="flex items-center gap-4 text-slate-600">
                  <span className="font-mono">{item.count} candidates</span>
                  <span className="font-mono font-bold text-slate-900 w-12 text-right">
                    {item.conversionFromTotal.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Offer & Onboarding Velocity */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-emerald-600" />
            Hiring Speed & Decision Metrics
          </h4>
          <div className="space-y-3 pt-1 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex justify-between items-center">
              <div>
                <p className="font-semibold text-slate-800">Total Offers Extended</p>
                <p className="text-[11px] text-slate-500">Official offers issued via controlled templates</p>
              </div>
              <span className="font-black text-lg text-slate-900">{metrics.totalOffers}</span>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 flex justify-between items-center">
              <div>
                <p className="font-semibold text-emerald-900">Signed Acceptance Rate</p>
                <p className="text-[11px] text-emerald-700">Candidates verified with tamper-proof signatures</p>
              </div>
              <span className="font-black text-lg text-emerald-700">{metrics.offerAcceptanceRate.toFixed(1)}%</span>
            </div>

            <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 flex justify-between items-center">
              <div>
                <p className="font-semibold text-blue-900">Interview Completion Efficiency</p>
                <p className="text-[11px] text-blue-700">Scheduled interviews with completed scorecards</p>
              </div>
              <span className="font-black text-lg text-blue-700">{metrics.interviewCompletionRate.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
