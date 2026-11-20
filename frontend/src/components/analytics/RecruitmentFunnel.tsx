import React, { useState } from 'react';
import {
  ArrowRight,
  TrendingDown,
  Clock,
  CheckCircle2,
  AlertCircle,
  Layers,
} from 'lucide-react';
import { FunnelStageData, PipelineStageKey } from './types';

export interface RecruitmentFunnelProps {
  stages: FunnelStageData[];
  totalApplicants: number;
}

export const RecruitmentFunnel: React.FC<RecruitmentFunnelProps> = ({
  stages,
  totalApplicants,
}) => {
  const [selectedStageKey, setSelectedStageKey] = useState<PipelineStageKey | null>(null);

  // Fallback safe denominator
  const maxVolume = totalApplicants > 0 ? totalApplicants : Math.max(...stages.map((s) => s.count), 1);

  const selectedStage = stages.find((s) => s.stage === selectedStageKey) || stages[0];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
      {/* Header and Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-brand-50 text-brand-600 border border-brand-100">
              <Layers className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-slate-900">
              6-Stage Recruitment Funnel & Drop-off Telemetry
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tracking pipeline throughput and stage-to-stage candidate retention from initial application to final hire.
          </p>
        </div>

        {/* Pipeline Stage Path Indicator */}
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/70 overflow-x-auto max-w-full">
          <span className="text-blue-700">APPLIED</span>
          <ArrowRight className="w-3 h-3 text-slate-400" />
          <span className="text-indigo-700">SCREENING</span>
          <ArrowRight className="w-3 h-3 text-slate-400" />
          <span className="text-cyan-700">INTERVIEW</span>
          <ArrowRight className="w-3 h-3 text-slate-400" />
          <span className="text-teal-700">SELECTED</span>
          <ArrowRight className="w-3 h-3 text-slate-400" />
          <span className="text-amber-700">OFFERED</span>
          <ArrowRight className="w-3 h-3 text-slate-400" />
          <span className="text-emerald-700 font-bold">HIRED</span>
        </div>
      </div>

      {/* Main Funnel Bars Container */}
      <div className="space-y-4">
        {stages.map((stg, idx) => {
          const isSelected = selectedStageKey === stg.stage;
          const nextStage = stages[idx + 1];

          // Compute bar width percentage relative to max volume with min width 6% for visual clarity
          const barWidthPercent = maxVolume > 0 
            ? Math.max(Math.round((stg.count / maxVolume) * 100), 6)
            : 0;

          return (
            <div key={stg.stage} className="group">
              {/* Stage Bar Row */}
              <div
                onClick={() => setSelectedStageKey(isSelected ? null : stg.stage)}
                className={`relative p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-brand-300 bg-brand-50/20 shadow-xs ring-1 ring-brand-200'
                    : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                {/* Stage Header Info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${stg.badgeBg}`}
                    >
                      Stage {stg.stageNumber} of 6
                    </span>
                    <span className="text-sm font-bold text-slate-900 tracking-tight">
                      {stg.label}
                    </span>
                    <span className="text-xs text-slate-400 hidden sm:inline">
                      • {stg.description}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <span className="font-semibold text-slate-800">
                      <strong className="text-sm text-slate-900 font-bold">{stg.count}</strong> candidates
                    </span>
                    <span className="text-slate-400">|</span>
                    <span className="font-mono font-medium text-slate-600">
                      {stg.cumulativeConversionPct}% of total
                    </span>
                    <span className="text-slate-400 hidden md:inline">|</span>
                    <span className="text-slate-500 hidden md:flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {stg.avgDaysInStage}d avg
                    </span>
                  </div>
                </div>

                {/* Funnel Progress Bar with Drop-off Visual */}
                <div className="relative w-full h-8 bg-slate-100 rounded-lg overflow-hidden flex items-center p-1">
                  {/* Active Gradient Fill Bar */}
                  <div
                    className={`h-full rounded-md transition-all duration-500 ease-out flex items-center justify-end px-3 shadow-inner ${stg.barGradient}`}
                    style={{ width: `${barWidthPercent}%` }}
                  >
                    {barWidthPercent > 18 && (
                      <span className="text-[11px] font-bold text-white tracking-wide shadow-xs drop-shadow-sm">
                        {stg.count} ({stg.cumulativeConversionPct}%)
                      </span>
                    )}
                  </div>

                  {barWidthPercent <= 18 && (
                    <span className="ml-2 text-xs font-semibold text-slate-700">
                      {stg.count} ({stg.cumulativeConversionPct}%)
                    </span>
                  )}
                </div>

                {/* Sub-bar Drop-off & Conversion Indicators */}
                <div className="mt-2.5 flex flex-wrap items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-600">
                      Step Conversion:{' '}
                      <strong className="text-slate-900">{stg.stepConversionPct}%</strong>
                    </span>
                    {stg.avgDaysInStage > 0 && (
                      <span className="flex items-center gap-1 text-slate-500">
                        <Clock className="w-3 h-3 text-slate-400" />
                        Avg Dwell: <span className="font-medium text-slate-700">{stg.avgDaysInStage} days</span>
                      </span>
                    )}
                  </div>

                  {stg.dropoffCount > 0 && (
                    <div className="flex items-center gap-1 text-rose-600 font-medium">
                      <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                      <span>
                        Stage Drop-off: -{stg.dropoffCount} candidates ({stg.dropoffPct}%)
                      </span>
                    </div>
                  )}

                  {stg.stage === 'HIRED' && (
                    <div className="flex items-center gap-1 text-emerald-600 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Final Milestone: Full Hire Completion</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Connecting Drop-off Bridge to Next Stage */}
              {nextStage && (
                <div className="my-1.5 ml-8 pl-4 border-l-2 border-dashed border-slate-200 py-1 flex items-center justify-between pr-4">
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>
                      Advancement to <strong>{nextStage.label}</strong>:
                    </span>
                    <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                      {nextStage.count} passed ({nextStage.stepConversionPct}%)
                    </span>
                  </div>

                  {stg.dropoffCount > 0 && (
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-medium border border-rose-100 flex items-center gap-1">
                        <TrendingDown className="w-3 h-3" />
                        {stg.dropoffCount} dropped ({stg.dropoffPct}%)
                      </span>
                      {stg.topDropoffReason && (
                        <span className="text-slate-400 hidden sm:inline italic">
                          ({stg.topDropoffReason})
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Stage Detail Drawer / Deep Dive */}
      {selectedStage && (
        <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md ${selectedStage.badgeBg}`}>
                Stage {selectedStage.stageNumber}: {selectedStage.label}
              </span>
              <span className="text-xs text-slate-600 font-medium">
                Detailed Stage Analytics & Drop-off Diagnostics
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedStageKey(null)}
              className="text-xs text-slate-400 hover:text-slate-700 transition"
            >
              Close Deep Dive
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-slate-400 uppercase text-[10px] font-semibold">Active In Stage</span>
              <p className="text-lg font-bold text-slate-900 mt-0.5">{selectedStage.count}</p>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">{selectedStage.cumulativeConversionPct}% total pool</p>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-slate-400 uppercase text-[10px] font-semibold">Advance Rate</span>
              <p className="text-lg font-bold text-emerald-700 mt-0.5">{selectedStage.stepConversionPct}%</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Step-to-step throughput</p>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-slate-400 uppercase text-[10px] font-semibold">Stage Drop-off</span>
              <p className="text-lg font-bold text-rose-700 mt-0.5">-{selectedStage.dropoffCount}</p>
              <p className="text-[11px] text-rose-500 mt-0.5">{selectedStage.dropoffPct}% loss rate</p>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-slate-400 uppercase text-[10px] font-semibold">Average Dwell Time</span>
              <p className="text-lg font-bold text-slate-900 mt-0.5">{selectedStage.avgDaysInStage} Days</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Days from entry to transition</p>
            </div>
          </div>

          {selectedStage.topDropoffReason && (
            <div className="flex items-center gap-2 p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Primary Stage Friction Factor:</strong> {selectedStage.topDropoffReason}. Review qualification criteria to optimize pipeline flow.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
