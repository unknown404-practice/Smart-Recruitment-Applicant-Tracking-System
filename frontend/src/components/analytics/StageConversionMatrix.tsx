import React from 'react';
import {
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Activity,
} from 'lucide-react';
import { StepConversionItem } from './types';

export interface StageConversionMatrixProps {
  steps: StepConversionItem[];
}

export const StageConversionMatrix: React.FC<StageConversionMatrixProps> = ({ steps }) => {
  const getHealthBadge = (status: StepConversionItem['healthStatus']) => {
    switch (status) {
      case 'OPTIMAL':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Optimal
          </span>
        );
      case 'HEALTHY':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
            <Activity className="w-3 h-3 text-blue-600" />
            Healthy
          </span>
        );
      case 'MONITOR':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            Monitor
          </span>
        );
      case 'BOTTLENECK':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            Bottleneck
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Pipeline Step-by-Step Conversion Matrix
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Granular analysis of candidate progression and drop-off ratios at each stage boundary.
          </p>
        </div>
        <span className="text-xs font-mono text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
          6 Stages • 5 Transitions
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider bg-slate-50/70">
              <th className="py-3 px-4 font-semibold">Stage Transition</th>
              <th className="py-3 px-4 font-semibold text-center">Stage Inflow</th>
              <th className="py-3 px-4 font-semibold text-center">Advanced</th>
              <th className="py-3 px-4 font-semibold text-center">Drop-off</th>
              <th className="py-3 px-4 font-semibold text-center">Conversion %</th>
              <th className="py-3 px-4 font-semibold text-center">Drop-off %</th>
              <th className="py-3 px-4 font-semibold text-center">Avg Time</th>
              <th className="py-3 px-4 font-semibold text-right">Throughput Health</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {steps.map((step) => (
              <tr
                key={`${step.fromStage}-${step.toStage}`}
                className="hover:bg-slate-50/70 transition-colors"
              >
                <td className="py-3.5 px-4 font-semibold text-slate-900">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-700">{step.fromStage}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono text-brand-700 font-bold">{step.toStage}</span>
                  </div>
                </td>

                <td className="py-3.5 px-4 text-center font-medium text-slate-700">
                  {step.inflowCount}
                </td>

                <td className="py-3.5 px-4 text-center font-bold text-emerald-700">
                  {step.advancedCount}
                </td>

                <td className="py-3.5 px-4 text-center font-medium text-rose-600">
                  -{step.dropoffCount}
                </td>

                <td className="py-3.5 px-4 text-center">
                  <div className="inline-flex items-center gap-1 font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                    <TrendingUp className="w-3 h-3 text-emerald-600" />
                    {step.conversionPct}%
                  </div>
                </td>

                <td className="py-3.5 px-4 text-center">
                  <div className="inline-flex items-center gap-1 font-semibold text-rose-600">
                    <TrendingDown className="w-3 h-3 text-rose-500" />
                    {step.dropoffPct}%
                  </div>
                </td>

                <td className="py-3.5 px-4 text-center font-mono text-slate-600">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {step.avgDurationDays}d
                  </span>
                </td>

                <td className="py-3.5 px-4 text-right">
                  <div className="flex justify-end">{getHealthBadge(step.healthStatus)}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
