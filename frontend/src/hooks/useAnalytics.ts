import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../services/apiClient';

export interface FunnelStageData {
  stage: string;
  count: number;
  conversionFromTotal: number;
  conversionFromPrevious?: number;
}

export interface AnalyticsMetrics {
  totalApplications: number;
  activePipeline: number;
  hiredCount: number;
  rejectedCount: number;
  avgTimeToHireDays: number;
  offerAcceptanceRate: number;
  totalOffers: number;
  acceptedOffers: number;
  declinedOffers: number;
  interviewsScheduled: number;
  interviewsCompleted: number;
  interviewCompletionRate: number;
}

export interface AnalyticsSummary {
  companyId: string;
  filters: {
    jobId: string | null;
    department: string | null;
    startDate: string | null;
    endDate: string | null;
  };
  metrics: AnalyticsMetrics;
  funnel: FunnelStageData[];
}

export type DatePreset = '7D' | '30D' | '90D' | 'ALL' | 'CUSTOM';

export interface AnalyticsFilterState {
  jobId: string;
  department: string;
  startDate: string;
  endDate: string;
  datePreset: DatePreset;
}

export interface FilterOptions {
  jobs: Array<{ id: string; title: string; department: string }>;
  departments: string[];
}

const DEFAULT_METRICS: AnalyticsMetrics = {
  totalApplications: 0,
  activePipeline: 0,
  hiredCount: 0,
  rejectedCount: 0,
  avgTimeToHireDays: 0,
  offerAcceptanceRate: 0,
  totalOffers: 0,
  acceptedOffers: 0,
  declinedOffers: 0,
  interviewsScheduled: 0,
  interviewsCompleted: 0,
  interviewCompletionRate: 0,
};

export function useAnalytics() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    jobs: [],
    departments: [],
  });

  const [filters, setFiltersState] = useState<AnalyticsFilterState>({
    jobId: '',
    department: '',
    startDate: '',
    endDate: '',
    datePreset: 'ALL',
  });

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Fetch filter options (departments & jobs) on mount
  useEffect(() => {
    async function loadFilterOptions() {
      try {
        const res = await apiClient.get<{ success: boolean; data: FilterOptions }>('/analytics/filters');
        if (isMountedRef.current && res.data && res.data.data) {
          setFilterOptions(res.data.data);
        }
      } catch (err: any) {
        console.warn('[Analytics Filters] Failed to load facets:', err.message);
      }
    }
    loadFilterOptions();
  }, []);

  // Calculate dates based on preset
  const applyDatePreset = useCallback((preset: DatePreset) => {
    const now = new Date();
    let start = '';
    let end = '';

    if (preset === '7D') {
      const d = new Date(now.getTime() - 7 * 86400000);
      start = d.toISOString().split('T')[0];
      end = now.toISOString().split('T')[0];
    } else if (preset === '30D') {
      const d = new Date(now.getTime() - 30 * 86400000);
      start = d.toISOString().split('T')[0];
      end = now.toISOString().split('T')[0];
    } else if (preset === '90D') {
      const d = new Date(now.getTime() - 90 * 86400000);
      start = d.toISOString().split('T')[0];
      end = now.toISOString().split('T')[0];
    } else if (preset === 'ALL') {
      start = '';
      end = '';
    }

    setFiltersState((prev) => ({
      ...prev,
      datePreset: preset,
      startDate: start,
      endDate: end,
    }));
  }, []);

  const setFilter = useCallback((key: keyof AnalyticsFilterState, value: string) => {
    setFiltersState((prev) => ({
      ...prev,
      [key]: value,
      ...(key === 'startDate' || key === 'endDate' ? { datePreset: 'CUSTOM' as DatePreset } : {}),
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState({
      jobId: '',
      department: '',
      startDate: '',
      endDate: '',
      datePreset: 'ALL',
    });
  }, []);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params: Record<string, any> = {};
    if (filters.jobId) params.jobId = filters.jobId;
    if (filters.department) params.department = filters.department;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;

    try {
      const response = await apiClient.get<{ success: boolean; data: AnalyticsSummary }>(
        '/analytics/summary',
        { params }
      );

      if (isMountedRef.current && response.data?.data) {
        setData(response.data.data);
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        const msg = err.response?.data?.message || err.message || 'Failed to load recruitment analytics';
        setError(msg);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [filters]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    data,
    metrics: data?.metrics || DEFAULT_METRICS,
    funnel: data?.funnel || [],
    loading,
    error,
    filters,
    filterOptions,
    setFilter,
    applyDatePreset,
    resetFilters,
    refetch: fetchAnalytics,
  };
}
