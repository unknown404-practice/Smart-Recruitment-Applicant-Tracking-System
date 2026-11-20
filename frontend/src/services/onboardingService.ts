import { apiClient } from './apiClient';

export type OfferStatus = 'DRAFT' | 'ISSUED' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';

export type TaskCategory = 'COMPLIANCE' | 'FINANCE' | 'EQUIPMENT' | 'LEGAL' | 'GENERAL';

export interface CandidateOffer {
  id: string;
  applicationId: string;
  application_id?: string;
  salaryAmount: number;
  salary_amount?: number;
  currency: string;
  startDate: string;
  start_date?: string;
  status: OfferStatus;
  offerLetterHtml: string;
  offer_letter_html?: string;
  issuedAt?: string | null;
  issued_at?: string | null;
  acceptedAt?: string | null;
  accepted_at?: string | null;
  declinedAt?: string | null;
  declined_at?: string | null;
  declinedReason?: string | null;
  declined_reason?: string | null;
  expiresAt?: string | null;
  expires_at?: string | null;
  jobTitle?: string;
  job_title?: string;
  companyName?: string;
  company_name?: string;
  candidateName?: string;
  candidate_name?: string;
  createdAt?: string;
  created_at?: string;
}

export interface OnboardingTask {
  id: string;
  candidateId: string;
  candidate_id?: string;
  offerId?: string | null;
  offer_id?: string | null;
  applicationId?: string | null;
  application_id?: string | null;
  title: string;
  description?: string | null;
  category: TaskCategory;
  isCompleted: boolean;
  is_completed?: boolean;
  dueDate?: string | null;
  due_date?: string | null;
  completedAt?: string | null;
  completed_at?: string | null;
  jobTitle?: string;
  job_title?: string;
  companyName?: string;
  company_name?: string;
  createdAt?: string;
  created_at?: string;
}

export interface OnboardingStats {
  total: number;
  completed: number;
  pending: number;
  percentComplete: number;
}

export interface OfferResponseResult {
  offer: CandidateOffer;
  application?: {
    id: string;
    currentStage: string;
    hiredAt?: string;
  };
  onboardingTasks?: OnboardingTask[];
}

/**
 * Retrieves offers accessible to current authenticated user (candidate)
 */
export async function fetchMyOffers(): Promise<CandidateOffer[]> {
  const response = await apiClient.get('/offers');
  const data = response.data?.data || response.data?.offers || response.data || [];
  return Array.isArray(data) ? data : [];
}

/**
 * Retrieves a single offer by ID with immutable HTML snapshot
 */
export async function fetchOfferById(id: string): Promise<CandidateOffer> {
  const response = await apiClient.get(`/offers/${id}`);
  return response.data?.data || response.data?.offer || response.data;
}

/**
 * Accepts or declines an employment offer
 */
export async function respondToOffer(
  offerId: string,
  action: 'ACCEPT' | 'DECLINE',
  payload?: { reason?: string; signature?: string }
): Promise<OfferResponseResult> {
  const response = await apiClient.post(`/offers/${offerId}/respond`, {
    action,
    reason: payload?.reason,
    signature: payload?.signature,
  });
  return response.data?.data || response.data;
}

/**
 * Retrieves onboarding checklist tasks for candidate
 */
export async function fetchMyOnboardingTasks(
  applicationId?: string
): Promise<{ tasks: OnboardingTask[]; stats: OnboardingStats }> {
  const url = applicationId ? `/onboarding/${applicationId}` : '/onboarding/me';
  const response = await apiClient.get(url);
  const data = response.data?.data || response.data;
  const tasks = data?.tasks || [];
  const stats = data?.stats || {
    total: tasks.length,
    completed: tasks.filter((t: OnboardingTask) => t.isCompleted || t.is_completed).length,
    pending: tasks.filter((t: OnboardingTask) => !t.isCompleted && !t.is_completed).length,
    percentComplete:
      tasks.length > 0
        ? Math.round(
            (tasks.filter((t: OnboardingTask) => t.isCompleted || t.is_completed).length /
              tasks.length) *
              100
          )
        : 0,
  };
  return { tasks, stats };
}

/**
 * Toggles an onboarding task's completion status
 */
export async function toggleOnboardingTask(
  taskId: string,
  isCompleted: boolean
): Promise<OnboardingTask> {
  const response = await apiClient.patch(`/onboarding/${taskId}`, {
    is_completed: isCompleted,
  });
  return response.data?.data || response.data?.task || response.data;
}
