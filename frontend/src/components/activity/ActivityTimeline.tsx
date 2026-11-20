import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitCommit,
  Calendar,
  Award,
  Mail,
  CheckSquare,
  Search,
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Clock,
  User,
  Briefcase,
  ShieldCheck,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { ActivityItem, ActivityType, ActivityFilterParams, ActivityPagination } from './types';

interface ActivityTimelineProps {
  activities: ActivityItem[];
  pagination?: ActivityPagination;
  loading?: boolean;
  error?: string | null;
  filters?: ActivityFilterParams;
  onFilterChange?: (filters: Partial<ActivityFilterParams>) => void;
  onRefresh?: () => void;
  title?: string;
  subtitle?: string;
  compact?: boolean;
  showFilters?: boolean;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  activities,
  pagination,
  loading = false,
  error = null,
  filters = {},
  onFilterChange,
  onRefresh,
  title = 'System Activity Feed',
  subtitle = 'Immutable cross-workflow audit trail aggregating stage changes, interviews, offers, and notifications',
  compact = false,
  showFilters = true,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState<string>(filters.search || '');

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange?.({ search: searchInput.trim(), page: 1 });
  };

  const handleTypeSelect = (type: ActivityType | '') => {
    onFilterChange?.({ activityType: type, page: 1 });
  };

  const handlePrevPage = () => {
    if (pagination && pagination.page > 1) {
      onFilterChange?.({ page: pagination.page - 1 });
    }
  };

  const handleNextPage = () => {
    if (pagination && pagination.hasMore) {
      onFilterChange?.({ page: pagination.page + 1 });
    }
  };

  // Helper to render icon & badge according to event type
  const renderActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'STAGE_TRANSITION':
        return (
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center border border-blue-200 shrink-0">
            <GitCommit className="w-4 h-4" />
          </div>
        );
      case 'INTERVIEW_EVENT':
        return (
          <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center border border-purple-200 shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
        );
      case 'OFFER_EVENT':
        return (
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-200 shrink-0">
            <Award className="w-4 h-4" />
          </div>
        );
      case 'NOTIFICATION_DISPATCH':
        return (
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center border border-amber-200 shrink-0">
            <Mail className="w-4 h-4" />
          </div>
        );
      case 'ONBOARDING_UPDATE':
        return (
          <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center border border-teal-200 shrink-0">
            <CheckSquare className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200 shrink-0">
            <Clock className="w-4 h-4" />
          </div>
        );
    }
  };

  const getActivityBadgeColor = (type: ActivityType) => {
    switch (type) {
      case 'STAGE_TRANSITION':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'INTERVIEW_EVENT':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'OFFER_EVENT':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'NOTIFICATION_DISPATCH':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'ONBOARDING_UPDATE':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const filterTabs: { label: string; value: ActivityType | '' }[] = [
    { label: 'All Activities', value: '' },
    { label: 'Stage Changes', value: 'STAGE_TRANSITION' },
    { label: 'Interviews', value: 'INTERVIEW_EVENT' },
    { label: 'Offers', value: 'OFFER_EVENT' },
    { label: 'Notifications', value: 'NOTIFICATION_DISPATCH' },
    { label: 'Onboarding', value: 'ONBOARDING_UPDATE' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Header Container */}
      <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">{title}</h3>
              {pagination && (
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                  {pagination.total} {pagination.total === 1 ? 'event' : 'events'}
                </span>
              )}
            </div>
            {subtitle && <p className="text-xs sm:text-sm text-slate-500 mt-1">{subtitle}</p>}
          </div>

          <div className="flex items-center gap-2">
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-2xs disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Bar */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-200/60 space-y-3">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search activity by title, candidate, job, or reason..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition shadow-2xs"
              >
                Search
              </button>
              {filters.search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('');
                    onFilterChange?.({ search: '', page: 1 });
                  }}
                  className="px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 rounded-lg border border-slate-200 bg-white"
                >
                  Clear
                </button>
              )}
            </form>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
                <Filter className="w-3 h-3" /> Filter:
              </span>
              {filterTabs.map((tab) => {
                const isActive = (filters.activityType || '') === tab.value;
                return (
                  <button
                    key={tab.label}
                    type="button"
                    onClick={() => handleTypeSelect(tab.value)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-full transition whitespace-nowrap border shrink-0 ${
                      isActive
                        ? 'bg-brand-600 text-white border-brand-600 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="p-4 sm:p-6">
        {/* Error Banner */}
        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2.5 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <p className="flex-1 font-medium">{error}</p>
          </div>
        )}

        {/* Loading Skeletons */}
        {loading && activities.length === 0 ? (
          <div className="space-y-4 py-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="w-8 h-8 rounded-lg bg-slate-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-3 bg-slate-100 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          /* Empty State */
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto border border-slate-200">
              <Clock className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">No activity events recorded</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Workflow events including stage advancements, interview updates, offers, and email dispatches will appear here automatically.
            </p>
          </div>
        ) : (
          /* Visual Timeline List */
          <div className="relative pl-6 space-y-6 before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200/80">
            <AnimatePresence initial={false}>
              {activities.map((item) => {
                const isExpanded = expandedId === item.id;
                const formattedDate = new Date(item.created_at).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <motion.div
                    key={`${item.activity_type}-${item.id}`}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="relative group"
                  >
                    {/* Timeline Node Dot / Icon */}
                    <div className="absolute -left-6 top-1">
                      {compact ? (
                        <div className="w-2.5 h-2.5 rounded-full bg-brand-600 ring-4 ring-white" />
                      ) : (
                        renderActivityIcon(item.activity_type)
                      )}
                    </div>

                    {/* Event Card */}
                    <div
                      className={`ml-4 p-3.5 sm:p-4 rounded-xl border transition ${
                        isExpanded
                          ? 'border-brand-300 bg-brand-50/20 shadow-xs'
                          : 'border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-2xs'
                      }`}
                    >
                      {/* Top Row: Title, Action Badge & Timestamp */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold border ${getActivityBadgeColor(
                              item.activity_type
                            )}`}
                          >
                            {item.action || item.activity_type}
                          </span>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                            {item.title}
                          </h4>
                        </div>

                        <span className="text-[11px] text-slate-400 flex items-center gap-1 shrink-0">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {formattedDate}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {item.description}
                      </p>

                      {/* Metadata Chips: Candidate, Job, Actor */}
                      <div className="mt-2.5 flex items-center gap-3 flex-wrap text-[11px] text-slate-500">
                        {item.candidate_name && (
                          <div className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60 font-medium">
                            <User className="w-3 h-3 text-slate-400" />
                            <span>Candidate: {item.candidate_name}</span>
                          </div>
                        )}

                        {item.job_title && (
                          <div className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60 font-medium">
                            <Briefcase className="w-3 h-3 text-slate-400" />
                            <span>{item.job_title}</span>
                          </div>
                        )}

                        {item.actor_name && (
                          <div className="flex items-center gap-1 text-slate-400 ml-auto">
                            <ShieldCheck className="w-3 h-3 text-slate-400" />
                            <span>
                              {item.actor_name} ({item.actor_role})
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Expandable Details Accordion */}
                      {item.metadata && Object.keys(item.metadata).length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => toggleExpand(item.id)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-700 hover:text-brand-900 transition"
                          >
                            <span>{isExpanded ? 'Hide audit metadata' : 'View event payload & audit details'}</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-2 p-3 bg-slate-900 rounded-lg text-slate-100 font-mono text-[11px] overflow-x-auto"
                            >
                              <pre className="whitespace-pre-wrap">
                                {JSON.stringify(item.metadata, null, 2)}
                              </pre>
                            </motion.div>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      {pagination && pagination.totalPages > 1 && (
        <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
          <div>
            Page <span className="font-semibold text-slate-800">{pagination.page}</span> of{' '}
            <span className="font-semibold text-slate-800">{pagination.totalPages}</span> ({pagination.total} total)
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevPage}
              disabled={pagination.page <= 1 || loading}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white font-medium hover:bg-slate-50 transition disabled:opacity-40"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>
            <button
              type="button"
              onClick={handleNextPage}
              disabled={!pagination.hasMore || loading}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white font-medium hover:bg-slate-50 transition disabled:opacity-40"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
