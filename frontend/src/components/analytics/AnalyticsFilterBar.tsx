import React from 'react';
import { Filter, Calendar, RotateCcw, RefreshCw, Briefcase, Building2 } from 'lucide-react';
import { DatePreset, FilterOptions, AnalyticsFilterState } from '../../hooks/useAnalytics';

interface AnalyticsFilterBarProps {
  filters: AnalyticsFilterState;
  filterOptions: FilterOptions;
  onFilterChange: (key: keyof AnalyticsFilterState, value: string) => void;
  onPresetChange: (preset: DatePreset) => void;
  onReset: () => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

export const AnalyticsFilterBar: React.FC<AnalyticsFilterBarProps> = ({
  filters,
  filterOptions,
  onFilterChange,
  onPresetChange,
  onReset,
  onRefresh,
  isLoading,
}) => {
  const presets: { id: DatePreset; label: string }[] = [
    { id: 'ALL', label: 'All Time' },
    { id: '90D', label: 'Last 90 Days' },
    { id: '30D', label: 'Last 30 Days' },
    { id: '7D', label: 'Last 7 Days' },
  ];

  const hasActiveFilters =
    Boolean(filters.jobId) ||
    Boolean(filters.department) ||
    Boolean(filters.startDate) ||
    Boolean(filters.endDate) ||
    filters.datePreset !== 'ALL';

  return (
    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
          <Filter className="w-4 h-4 text-brand-600" />
          <span>Analytics Filters & Cohort Slicing</span>
        </div>

        {/* Date presets pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onPresetChange(preset.id)}
              className={`px-3 py-1 rounded-xl text-xs font-medium transition ${
                filters.datePreset === preset.id
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
              }`}
            >
              {preset.label}
            </button>
          ))}

          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="p-1.5 rounded-xl border border-slate-200 text-slate-500 hover:text-brand-600 hover:bg-slate-50 transition ml-1 disabled:opacity-50"
            title="Refresh analytics data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Department Filter */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            Department
          </label>
          <select
            value={filters.department}
            onChange={(e) => onFilterChange('department', e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          >
            <option value="">All Departments</option>
            {filterOptions.departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        {/* Job Requisition Filter */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
            Job Requisition
          </label>
          <select
            value={filters.jobId}
            onChange={(e) => onFilterChange('jobId', e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 truncate"
          >
            <option value="">All Requisitions ({filterOptions.jobs.length})</option>
            {filterOptions.jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
          </select>
        </div>

        {/* Start Date */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            From (UTC)
          </label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => onFilterChange('startDate', e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          >
          </input>
        </div>

        {/* End Date */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            To (UTC)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => onFilterChange('endDate', e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
            {hasActiveFilters && (
              <button
                type="button"
                onClick={onReset}
                className="p-2 rounded-xl text-xs text-rose-600 hover:bg-rose-50 border border-rose-200 transition shrink-0"
                title="Reset all filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
