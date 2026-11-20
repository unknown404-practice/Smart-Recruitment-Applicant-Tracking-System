import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../services/apiClient';
import { ActivityItem, ActivityPagination, ActivityFilterParams, ActivityResponse } from '../components/activity/types';

interface UseActivityFeedOptions {
  initialFilters?: ActivityFilterParams;
  autoFetch?: boolean;
}

export function useActivityFeed(options: UseActivityFeedOptions = {}) {
  const { initialFilters = {}, autoFetch = true } = options;

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [pagination, setPagination] = useState<ActivityPagination>({
    page: initialFilters.page || 1,
    limit: initialFilters.limit || 20,
    total: 0,
    totalPages: 1,
    hasMore: false,
  });
  const [filters, setFiltersState] = useState<ActivityFilterParams>({
    page: 1,
    limit: 20,
    ...initialFilters,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchActivities = useCallback(
    async (overrideFilters?: ActivityFilterParams) => {
      setLoading(true);
      setError(null);

      const queryParams = {
        ...filters,
        ...overrideFilters,
      };

      // Strip empty values
      const cleanParams: Record<string, any> = {};
      Object.entries(queryParams).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          cleanParams[key] = val;
        }
      });

      try {
        const response = await apiClient.get<ActivityResponse>('/activity', {
          params: cleanParams,
        });

        if (isMountedRef.current && response.data?.success) {
          setActivities(response.data.data || []);
          if (response.data.pagination) {
            setPagination(response.data.pagination);
          }
        }
      } catch (err: any) {
        if (isMountedRef.current) {
          const errMsg =
            err.response?.data?.error?.message ||
            err.response?.data?.message ||
            err.message ||
            'Failed to load activity logs';
          setError(errMsg);
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    },
    [filters]
  );

  const setFilters = useCallback((newFilters: Partial<ActivityFilterParams>) => {
    setFiltersState((prev) => ({
      ...prev,
      ...newFilters,
      page: newFilters.page ?? 1, // reset page to 1 on filter changes unless explicitly paging
    }));
  }, []);

  const setPage = useCallback((page: number) => {
    setFiltersState((prev) => ({ ...prev, page }));
  }, []);

  const refresh = useCallback(() => {
    return fetchActivities();
  }, [fetchActivities]);

  useEffect(() => {
    if (autoFetch) {
      fetchActivities();
    }
  }, [filters, autoFetch, fetchActivities]);

  return {
    activities,
    pagination,
    filters,
    loading,
    error,
    setFilters,
    setPage,
    refresh,
  };
}
