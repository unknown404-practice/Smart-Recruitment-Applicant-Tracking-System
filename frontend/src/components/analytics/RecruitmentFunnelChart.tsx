import React from 'react';
import { motion } from 'framer-motion';
import { Filter, ArrowDown, UserCheck, AlertCircle } from 'lucide-react';
import { SPRING_GENTLE } from '../animations';

export interface FunnelStageData {
  stage: string;
  count: number;
  conversionFromTotal: number;
  conversionFromPrevious?: number;
}

interface RecruitmentFunnelChartProps {
  funnel: FunnelStageData[];
  totalApplications: number;
  isLoading?: boolean;
}

const STAGE_CONFIG: Record<string, { label: string; color: string; bgGradient: string }> = {
  APPLIED: {
    label: '1. Applied (Top of Funnel)',
    color: 'bg-brand-500',
    bgGradient: 'from-brand-600 to-brand-500',
  },
  SCREENING: {
    label: '2. Initial Screening',
    color: 'bg-indigo-500',
    bgGradient: 'from-indigo-600 to-indigo-500',
  },
  INTERVIEW: {
    label: '3. Technical & Team Interview',
    color: 'bg-blue-500',
    bgGradient: 'from-blue-600 to-blue-500',
  },
  SELECTED: {
    label: '4. Selected for Offer',
    color: 'bg-cyan-500',
    bgGradient: 'from-cyan-600 to-cyan-500',
  },
  OFFERED: {
    label: '5. Formal Offer Extended',
    color: 'bg-amber-500',
    bgGradient: 'from-amber-600 to-amber-500',
  },
  HIRED: {
    label: '6. Hired & Onboarding',
    color: 'bg-emerald-500',
    bgGradient: 'from-emerald-600 to-emerald-500',
  },
};

export const RecruitmentFunnelChart: React.FC<RecruitmentFunnelChartProps> = ({
  funnel,
  totalApplications,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4 animate-pulse">
        <div className="h-5 w-48 bg-slate-200 rounded" />
        <div className="space-y-4 pt-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <div className="h-3 w-32 bg-slate-200 rounded" />
                <div className="h-3 w-16 bg-slate-200 rounded" />
              </div>
              <div className="h-4 w-full bg-slate-100 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!funnel || funnel.length === 0 || totalApplications === 0) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200/90 shadow-xs text-center space-y-3">
        <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto border border-slate-200">
          <Filter className="w-6 h-6" />
        </div>
        <h4 className="font-semibold text-slate-800 text-sm">No Pipeline Candidates in Funnel</h4>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          No candidates matched your selected job, department, or date range filters. Try resetting your filter criteria above.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Filter className="w-4 h-4 text-brand-600" />
            Recruitment Conversion Funnel
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Stage-by-stage candidate throughput and relative drop-off rates across all 6 pipeline phases.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/70 shrink-0">
          <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Overall Throughput: </span>
          <span className="font-bold text-slate-900">
            {totalApplications > 0
              ? `${(((funnel.find((f) => f.stage === 'HIRED')?.count || 0) / totalApplications) * 100).toFixed(1)}%`
              : '0.0%'}
          </span>
        </div>
      </div>

      <div className="space-y-5">
        {funnel.map((item, index) => {
          const config = STAGE_CONFIG[item.stage] || {
            label: item.stage,
            color: 'bg-slate-500',
            bgGradient: 'from-slate-600 to-slate-500',
          };

          // Relative width bounded between 4% minimum visibility and 100%
          const barWidth =
            totalApplications > 0
              ? Math.max(4, Math.min(100, (item.count / totalApplications) * 100))
              : 0;

          const isHiredStage = item.stage === 'HIRED';

          return (
            <motion.div
              key={item.stage}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...SPRING_GENTLE, delay: index * 0.04 }}
              className="space-y-1.5 group"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800">{config.label}</span>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-mono text-[11px] font-medium">
                    {item.count} {item.count === 1 ? 'candidate' : 'candidates'}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-slate-500 font-mono text-xs">
                  {index > 0 && item.conversionFromPrevious !== undefined && (
                    <span
                      className={`text-[11px] font-sans flex items-center gap-0.5 ${
                        item.conversionFromPrevious >= 50
                          ? 'text-emerald-600'
                          : 'text-amber-600'
                      }`}
                      title="Conversion from previous stage"
                    >
                      <ArrowDown className="w-3 h-3 rotate-[-45deg]" />
                      {item.conversionFromPrevious.toFixed(1)}% step-thru
                    </span>
                  )}
                  <span className="font-semibold text-slate-800">
                    {item.conversionFromTotal.toFixed(1)}% of total
                  </span>
                </div>
              </div>

              {/* Progress Track */}
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${barWidth}%` }}
                  transition={{ duration: 0.6, delay: index * 0.05 }}
                  className={`h-full rounded-full bg-gradient-to-r ${config.bgGradient} shadow-xs transition-all`}
                />
              </div>

              {isHiredStage && item.count > 0 && (
                <p className="text-[11px] text-emerald-700 flex items-center gap-1 mt-1 pl-1">
                  <UserCheck className="w-3 h-3" />
                  Successfully closed {item.count} offer(s) with completed digital signatures.
                </p>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
