import React, { useState } from 'react';
import {
  Users,
  GitBranch,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
  Info,
  Activity,
  Award,
} from 'lucide-react';
import { AnalyticsKpiData } from './types';

export interface AnalyticsKpiCardsProps {
  kpi: AnalyticsKpiData;
  loading?: boolean;
}

export const AnalyticsKpiCards: React.FC<AnalyticsKpiCardsProps> = ({ kpi, loading = false }) => {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs animate-pulse space-y-3"
          >
            <div className="flex justify-between items-center">
              <div className="h-4 w-28 bg-slate-200 rounded-md" />
              <div className="h-8 w-8 bg-slate-100 rounded-lg" />
            </div>
            <div className="h-8 w-24 bg-slate-200 rounded-md" />
            <div className="h-4 w-36 bg-slate-100 rounded-md" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {/* 1. Total Applicants */}
      <div className="relative bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow duration-200 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Applicants
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100/60">
              <Users className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-slate-900">
              {kpi.totalApplicants.value.toLocaleString()}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-600" />
              +{kpi.totalApplicants.trendPct}%
            </span>
          </div>

          <p className="mt-1.5 text-xs text-slate-500 font-medium">
            {kpi.totalApplicants.subtext}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1 font-mono">
            <Activity className="w-3 h-3 text-blue-500" />
            Intake Volume
          </span>
          <button
            type="button"
            className="hover:text-slate-600 transition"
            title={kpi.totalApplicants.formula}
            onClick={() =>
              setActiveTooltip(activeTooltip === 'total' ? null : 'total')
            }
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>

        {activeTooltip === 'total' && (
          <div className="absolute bottom-12 right-4 z-20 w-64 p-2.5 bg-slate-900 text-slate-100 text-xs rounded-lg shadow-lg border border-slate-800 animate-fadeIn">
            <p className="font-semibold text-slate-200">Formula Definition:</p>
            <p className="text-slate-300 font-mono text-[11px] mt-0.5">{kpi.totalApplicants.formula}</p>
          </div>
        )}
      </div>

      {/* 2. Active Pipeline */}
      <div className="relative bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow duration-200 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Pipeline
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100/60">
              <GitBranch className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-slate-900">
              {kpi.activePipeline.value.toLocaleString()}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60 flex items-center gap-1">
              {kpi.activePipeline.throughputPct}% throughput
            </span>
          </div>

          <p className="mt-1.5 text-xs text-slate-500 font-medium">
            {kpi.activePipeline.subtext}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span className="font-mono text-indigo-600 font-medium truncate max-w-[190px]">
            {kpi.activePipeline.stageSpreadText}
          </span>
          <button
            type="button"
            className="hover:text-slate-600 transition shrink-0"
            title={kpi.activePipeline.formula}
            onClick={() =>
              setActiveTooltip(activeTooltip === 'pipeline' ? null : 'pipeline')
            }
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>

        {activeTooltip === 'pipeline' && (
          <div className="absolute bottom-12 right-4 z-20 w-64 p-2.5 bg-slate-900 text-slate-100 text-xs rounded-lg shadow-lg border border-slate-800 animate-fadeIn">
            <p className="font-semibold text-slate-200">Formula Definition:</p>
            <p className="text-slate-300 font-mono text-[11px] mt-0.5">{kpi.activePipeline.formula}</p>
          </div>
        )}
      </div>

      {/* 3. Offer Acceptance % */}
      <div className="relative bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow duration-200 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Offer Acceptance %
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100/60">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-slate-900">
              {kpi.offerAcceptance.ratePct}%
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center gap-1">
              <Award className="w-3 h-3 text-emerald-600" />
              +{kpi.offerAcceptance.benchmarkDiffPct}% vs benchmark
            </span>
          </div>

          <p className="mt-1.5 text-xs text-slate-500 font-medium">
            {kpi.offerAcceptance.subtext}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span className="text-emerald-700 font-medium">
            {kpi.offerAcceptance.acceptedCount} of {kpi.offerAcceptance.totalDecided} accepted
          </span>
          <button
            type="button"
            className="hover:text-slate-600 transition shrink-0"
            title={kpi.offerAcceptance.formula}
            onClick={() =>
              setActiveTooltip(activeTooltip === 'acceptance' ? null : 'acceptance')
            }
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>

        {activeTooltip === 'acceptance' && (
          <div className="absolute bottom-12 right-4 z-20 w-64 p-2.5 bg-slate-900 text-slate-100 text-xs rounded-lg shadow-lg border border-slate-800 animate-fadeIn">
            <p className="font-semibold text-slate-200">Formula Definition:</p>
            <p className="text-slate-300 font-mono text-[11px] mt-0.5">{kpi.offerAcceptance.formula}</p>
          </div>
        )}
      </div>

      {/* 4. Time-to-Hire in days */}
      <div className="relative bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow duration-200 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Time-to-Hire in Days
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100/60">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-slate-900">
              {kpi.timeToHire.averageDays}
              <span className="text-lg font-semibold text-slate-500 ml-1">Days</span>
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center gap-1">
              <TrendingDown className="w-3 h-3 text-emerald-600" />
              {kpi.timeToHire.daysDeltaVsTarget}d below target
            </span>
          </div>

          <p className="mt-1.5 text-xs text-slate-500 font-medium">
            {kpi.timeToHire.subtext}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span className="font-mono text-amber-700 font-medium">
            SLA Target: ≤ {kpi.timeToHire.targetDays} days
          </span>
          <button
            type="button"
            className="hover:text-slate-600 transition shrink-0"
            title={kpi.timeToHire.formula}
            onClick={() =>
              setActiveTooltip(activeTooltip === 'timetohire' ? null : 'timetohire')
            }
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>

        {activeTooltip === 'timetohire' && (
          <div className="absolute bottom-12 right-4 z-20 w-64 p-2.5 bg-slate-900 text-slate-100 text-xs rounded-lg shadow-lg border border-slate-800 animate-fadeIn">
            <p className="font-semibold text-slate-200">Formula Definition:</p>
            <p className="text-slate-300 font-mono text-[11px] mt-0.5">{kpi.timeToHire.formula}</p>
          </div>
        )}
      </div>
    </div>
  );
};
