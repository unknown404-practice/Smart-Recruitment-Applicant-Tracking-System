import React from 'react';
import {
  Calendar,
  Briefcase,
  Building2,
  Download,
  RotateCcw,
} from 'lucide-react';
import { AnalyticsFilterState, RequisitionOption } from './types';

export interface AnalyticsFilterBarProps {
  filters: AnalyticsFilterState;
  requisitions: RequisitionOption[];
  departments: string[];
  onChange: (updated: Partial<AnalyticsFilterState>) => void;
  onReset: () => void;
  onRefresh: () => void;
  onExport: () => void;
  isRefreshing?: boolean;
}

export const AnalyticsFilterBar: React.FC<AnalyticsFilterBarProps> = ({
  filters,
  requisitions,
  departments,
  onChange,
  onReset,
  onRefresh,
  onExport,
  isRefreshing = false,
}) => {
  const isFiltered =
    filters.timeRange !== 'all' ||
    filters.department !== 'ALL' ||
    filters.jobId !== 'ALL';

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Time Range Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filters.timeRange}
              onChange={(e) =>
                onChange({
                  timeRange: e.target.value as AnalyticsFilterState['timeRange'],
                })
              }
              className="bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">All Time</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="ytd">Year to Date (2026)</option>
            </select>
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filters.department}
              onChange={(e) => onChange({ department: e.target.value })}
              className="bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Requisition Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filters.jobId}
              onChange={(e) => onChange({ jobId: e.target.value })}
              className="bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer max-w-[220px] truncate"
            >
              <option value="ALL">All Requisitions ({requisitions.length})</option>
              {requisitions.map((req) => (
                <option key={req.id} value={req.id}>
                  {req.title}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters */}
          {isFiltered && (
            <button
              type="button"
              onClick={onReset}
              className="px-2.5 py-1.5 text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-xl transition font-medium flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Filters
            </button>
          )}
        </div>

        {/* Right Actions: Refresh & Export */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-brand-600' : ''}`} />
            Refresh
          </button>

          <button
            type="button"
            onClick={onExport}
            className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Export KPI Report (CSV)
          </button>
        </div>
      </div>
    </div>
  );
};
