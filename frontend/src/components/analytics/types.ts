export type PipelineStageKey =
  | 'APPLIED'
  | 'SCREENING'
  | 'INTERVIEW'
  | 'SELECTED'
  | 'OFFERED'
  | 'HIRED';

export interface FunnelStageData {
  stage: PipelineStageKey;
  label: string;
  stageNumber: number;
  count: number;
  cumulativeConversionPct: number;
  stepConversionPct: number;
  dropoffCount: number;
  dropoffPct: number;
  avgDaysInStage: number;
  accentColor: string;
  barGradient: string;
  badgeBg: string;
  description: string;
  topDropoffReason?: string;
}

export interface AnalyticsKpiData {
  totalApplicants: {
    value: number;
    trendPct: number;
    trendDirection: 'up' | 'down' | 'neutral';
    subtext: string;
    formula: string;
  };
  activePipeline: {
    value: number;
    throughputPct: number;
    subtext: string;
    stageSpreadText: string;
    formula: string;
  };
  offerAcceptance: {
    ratePct: number;
    acceptedCount: number;
    totalDecided: number;
    benchmarkDiffPct: number;
    subtext: string;
    formula: string;
  };
  timeToHire: {
    averageDays: number;
    daysDeltaVsTarget: number;
    subtext: string;
    targetDays: number;
    formula: string;
  };
}

export interface StepConversionItem {
  fromStage: PipelineStageKey;
  toStage: PipelineStageKey;
  label: string;
  inflowCount: number;
  advancedCount: number;
  dropoffCount: number;
  conversionPct: number;
  dropoffPct: number;
  avgDurationDays: number;
  healthStatus: 'OPTIMAL' | 'HEALTHY' | 'MONITOR' | 'BOTTLENECK';
}

export interface DepartmentVelocityItem {
  department: string;
  avgDaysToHire: number;
  activeRequisitions: number;
  totalHires: number;
  targetBenchmarkDays: number;
}

export interface AnalyticsFilterState {
  timeRange: '30d' | '90d' | 'ytd' | 'all';
  department: string;
  jobId: string;
}

export interface RequisitionOption {
  id: string;
  title: string;
  department: string;
  totalApplicants: number;
  activeCandidates: number;
}
