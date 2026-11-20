import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../services/apiClient';
import { useToast } from '../context/ToastContext';

export interface CandidateOffer {
  id: string;
  application_id: string;
  salary_amount: number;
  currency: string;
  start_date: string;
  offer_letter_html?: string | null;
  status: 'DRAFT' | 'ISSUED' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
  issued_at?: string | null;
  expires_at?: string | null;
  created_at: string;
  candidate_name?: string;
  candidate_email?: string;
  job_title?: string;
  company_name?: string | null;
}

export interface OnboardingTask {
  id: string;
  offerId?: string | null;
  title: string;
  description?: string | null;
  isCompleted: boolean;
  dueDate?: string | null;
  completedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

type OfferResponse = 'ACCEPTED' | 'DECLINED';

export const useCandidateWorkflow = (enabled = true) => {
  const toast = useToast();

  const [offers, setOffers] = useState<CandidateOffer[]>([]);
  const [tasks, setTasks] = useState<OnboardingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [respondingOfferIds, setRespondingOfferIds] = useState<Set<string>>(new Set());
  const respondingOfferIdsRef = useRef<Set<string>>(new Set());
  const [pendingTaskIds, setPendingTaskIds] = useState<Set<string>>(new Set());

  const pendingTaskIdsRef = useRef<Set<string>>(new Set());

  const getErrorMessage = (err: any, fallback: string) =>
    err.response?.data?.error?.message ||
    err.response?.data?.message ||
    err.message ||
    fallback;

  const fetchWorkflow = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [offerResult, taskResult] = await Promise.allSettled([
      apiClient.get('/offers'),
      apiClient.get('/onboarding'),
    ]);

    if (offerResult.status === 'fulfilled') {
      const data = offerResult.value.data?.data;
      setOffers(Array.isArray(data) ? data : []);
    } else {
      setOffers([]);
    }

    if (taskResult.status === 'fulfilled') {
      const data = taskResult.value.data?.data?.tasks;
      setTasks(Array.isArray(data) ? data : []);
    } else {
      setTasks([]);
    }

    if (
      offerResult.status === 'rejected' ||
      taskResult.status === 'rejected'
    ) {
      const message =
        offerResult.status === 'rejected'
          ? getErrorMessage(offerResult.reason, 'Failed to load offers')
          : getErrorMessage(taskResult.status === 'rejected' ? taskResult.reason : null, 'Failed to load onboarding tasks');

      setError(message);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    if (enabled) {
      fetchWorkflow();
    } else {
      setLoading(false);
    }
  }, [enabled, fetchWorkflow]);

  const respondToOffer = useCallback(
    async (
      offerId: string,
      response: OfferResponse,
      acceptedTerms = false
    ) => {
      if (response === 'ACCEPTED' && !acceptedTerms) {
        toast.error(
          'You must accept the terms and conditions before accepting this offer.',
          'Acceptance Required'
        );
        return false;
      }

      if (respondingOfferIdsRef.current.has(offerId)) return false;

      respondingOfferIdsRef.current.add(offerId);
      setRespondingOfferIds(new Set(respondingOfferIdsRef.current));

      try {
        await apiClient.post(`/offers/${offerId}/respond`, {
          response,
          ...(response === 'ACCEPTED' ? { acceptedTerms: true } : {}),
        });

        setOffers((previous) =>
          previous.map((offer) =>
            offer.id === offerId ? { ...offer, status: response } : offer
          )
        );

        // Invalidate and refresh both offers and onboarding tasks cache when offer response completes
        if (response === 'ACCEPTED') {
          await fetchWorkflow();
        }

        toast.success(
          response === 'ACCEPTED'
            ? 'Your employment offer has been accepted.'
            : 'Your employment offer has been declined.',
          response === 'ACCEPTED' ? 'Offer Accepted' : 'Offer Declined'
        );

        return true;
      } catch (err: any) {
        toast.error(
          getErrorMessage(err, 'Failed to submit your offer response.'),
          'Offer Response Failed'
        );
        return false;
      } finally {
        respondingOfferIdsRef.current.delete(offerId);
        setRespondingOfferIds(new Set(respondingOfferIdsRef.current));
      }
    },
    [toast]
  );

  const updateTask = useCallback(
    async (taskId: string, isCompleted: boolean) => {
      if (pendingTaskIdsRef.current.has(taskId)) {
        return false;
      }

      const previousTask = tasks.find((task) => task.id === taskId);
      if (!previousTask || previousTask.isCompleted === isCompleted) {
        return false;
      }

      pendingTaskIdsRef.current.add(taskId);
      setPendingTaskIds(new Set(pendingTaskIdsRef.current));

      setTasks((previous) =>
        previous.map((task) =>
          task.id === taskId
            ? { ...task, isCompleted, completedAt: isCompleted ? new Date().toISOString() : null }
            : task
        )
      );

      try {
        const response = await apiClient.patch(`/onboarding/${taskId}`, {
          isCompleted,
        });

        const updatedTask = response.data?.data?.task;

        if (updatedTask) {
          setTasks((previous) =>
            previous.map((task) =>
              task.id === taskId ? updatedTask : task
            )
          );
        }

        toast.success(
          isCompleted ? 'Onboarding task completed.' : 'Onboarding task reopened.',
          'Onboarding Updated'
        );

        return true;
      } catch (err: any) {
        setTasks((previous) =>
          previous.map((task) =>
            task.id === taskId ? previousTask : task
          )
        );

        toast.error(
          getErrorMessage(err, 'Failed to update onboarding task.'),
          'Update Failed'
        );

        return false;
      } finally {
        pendingTaskIdsRef.current.delete(taskId);
        setPendingTaskIds(new Set(pendingTaskIdsRef.current));
      }
    },
    [tasks, toast]
  );

  return {
    offers,
    tasks,
    loading,
    error,
    respondingOfferIds,
    pendingTaskIds,
    fetchWorkflow,
    respondToOffer,
    updateTask,
  };
};
