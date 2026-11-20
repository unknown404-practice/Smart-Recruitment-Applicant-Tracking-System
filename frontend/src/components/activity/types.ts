export type ActivityType =
  | 'STAGE_TRANSITION'
  | 'INTERVIEW_EVENT'
  | 'OFFER_EVENT'
  | 'NOTIFICATION_DISPATCH'
  | 'ONBOARDING_UPDATE';

export interface ActivityItem {
  id: string;
  activity_type: ActivityType;
  entity_type: string;
  entity_id: string;
  company_id?: string;
  actor_id?: string;
  actor_name: string;
  actor_email: string;
  actor_role: string;
  candidate_id?: string;
  candidate_name?: string;
  candidate_email?: string;
  job_id?: string;
  job_title?: string;
  application_id?: string;
  action: string;
  title: string;
  description: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface ActivityPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface ActivityResponse {
  success: boolean;
  data: ActivityItem[];
  pagination: ActivityPagination;
}

export interface ActivityFilterParams {
  page?: number;
  limit?: number;
  activityType?: ActivityType | '';
  companyId?: string;
  candidateId?: string;
  applicationId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}
