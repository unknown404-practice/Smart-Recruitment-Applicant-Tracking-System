import React from 'react';
import { TrendingDown, Target, Building2, CheckCircle2 } from 'lucide-react';
import { DepartmentVelocityItem } from './types';

export interface HiringVelocityCardProps {
  departmentVelocities: DepartmentVelocityItem[];
  overallAvgDays: number;
}

export const HiringVelocityCard: React.FC<HiringVelocityCardProps> = ({
  departmentVelocities,
  overallAvgDays,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Velocity Stage Distribution */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">
              Time-to-Hire Stage Breakdown
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
              Avg {overallAvgDays} Days
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Average calendar days candidates spend progressing through each recruitment milestone.
          </p>
        </div>

        <div className="space-y-3.5">
          {[
            { stage: 'Screening & Qualification', days: 2.8, color: 'bg-indigo-500', pct: 15 },
            { stage: 'Technical & Team Interviews', days: 7.4, color: 'bg-cyan-500', pct: 39 },
            { stage: 'Executive Committee Review', days: 2.2, color: 'bg-teal-500', pct: 12 },
            { stage: 'Offer Delivery & Negotiation', days: 3.6, color: 'bg-amber-500', pct: 19 },
            { stage: 'Offer Acceptance & Onboarding Kickoff', days: 2.4, color: 'bg-emerald-500', pct: 15 },
          ].map((item) => (
            <div key={item.stage} className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-slate-700">{item.stage}</span>
                <span className="font-mono font-bold text-slate-900">
                  {item.days} Days ({item.pct}%)
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${item.color} rounded-full transition-all duration-500`}
                  style={{ width: `${item.pct * 2}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
            <TrendingDown className="w-4 h-4 text-emerald-600" />
            3.4 days faster than organizational Q3 baseline
          </span>
          <span className="font-mono text-slate-400 text-[11px]">SLA Target: ≤ 25d</span>
        </div>
      </div>

      {/* 2. Department Velocity Comparison */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">
              Department Hiring Velocity
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
              Department Comparison
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Average hiring duration compared against department SLA benchmarks.
          </p>
        </div>

        <div className="space-y-3">
          {departmentVelocities.map((dept) => {
            const isAhead = dept.avgDaysToHire <= dept.targetBenchmarkDays;
            return (
              <div
                key={dept.department}
                className="p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 flex items-center justify-between transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-bold text-slate-900">
                      {dept.department}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {dept.activeRequisitions} requisitions • {dept.totalHires} candidates hired
                  </p>
                </div>

                <div className="text-right space-y-1">
                  <p className="text-sm font-extrabold text-slate-900 font-mono">
                    {dept.avgDaysToHire} <span className="text-xs font-normal text-slate-500">Days</span>
                  </p>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-0.5 ${
                      isAhead
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {isAhead ? (
                      <>
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        {dept.targetBenchmarkDays - dept.avgDaysToHire}d ahead of SLA
                      </>
                    ) : (
                      <>
                        <Target className="w-2.5 h-2.5" />
                        +{dept.avgDaysToHire - dept.targetBenchmarkDays}d over SLA
                      </>
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="text-slate-500">Fastest department:</span>
          <span className="font-bold text-emerald-700">Sales & Operations (14.2 Days)</span>
        </div>
      </div>
    </div>
  );
};
