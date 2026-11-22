import React from 'react';
import { motion } from 'framer-motion';
import { Users, CheckCircle, Clock, CalendarCheck, TrendingUp, HelpCircle } from 'lucide-react';
import { SPRING_GENTLE } from '../animations';

export interface AnalyticsMetricsProps {
  metrics: {
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
  };
  isLoading?: boolean;
}

export const AnalyticsKpiCards: React.FC<AnalyticsMetricsProps> = ({ metrics, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs animate-pulse space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-3 w-24 bg-slate-200 rounded" />
              <div className="h-6 w-6 bg-slate-200 rounded-full" />
            </div>
            <div className="h-7 w-20 bg-slate-200 rounded" />
            <div className="h-3 w-32 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      id: 'kpi-applications',
      title: 'Total Applications',
      value: metrics.totalApplications.toLocaleString(),
      subtext: `${metrics.activePipeline} active candidates in pipeline`,
      icon: Users,
      color: 'text-brand-600',
      bgColor: 'bg-brand-50 border-brand-100',
      formula: 'Count of all candidate applications submitted for company job requisitions within selected range.',
      trend: `${metrics.hiredCount} successfully hired`,
      trendPositive: true,
    },
    {
      id: 'kpi-offer-acceptance',
      title: 'Offer Acceptance Rate',
      value: `${metrics.offerAcceptanceRate.toFixed(1)}%`,
      subtext: `${metrics.acceptedOffers} accepted / ${metrics.acceptedOffers + metrics.declinedOffers} decided`,
      icon: CheckCircle,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 border-emerald-100',
      formula: '(Accepted Offers ÷ (Accepted + Declined Offers)) × 100%. Protected with zero-division guards.',
      trend: metrics.offerAcceptanceRate >= 80 ? 'Above target benchmark (80%)' : 'Below 80% benchmark target',
      trendPositive: metrics.offerAcceptanceRate >= 80,
    },
    {
      id: 'kpi-time-to-hire',
      title: 'Average Time to Hire',
      value: `${metrics.avgTimeToHireDays.toFixed(1)} Days`,
      subtext: metrics.hiredCount > 0 ? `Calculated across ${metrics.hiredCount} hires` : 'Awaiting first hire in period',
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 border-amber-100',
      formula: 'Average of (hired_at - applied_at) in elapsed days for all hired candidates in cohort.',
      trend: metrics.avgTimeToHireDays > 0 && metrics.avgTimeToHireDays <= 30 ? 'High velocity (< 30 days)' : 'Standard pacing',
      trendPositive: metrics.avgTimeToHireDays <= 30,
    },
    {
      id: 'kpi-interview-reliability',
      title: 'Interview Completion Rate',
      value: `${metrics.interviewCompletionRate.toFixed(1)}%`,
      subtext: `${metrics.interviewsCompleted} of ${metrics.interviewsScheduled} interviews completed`,
      icon: CalendarCheck,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 border-indigo-100',
      formula: '(Completed Interview Events ÷ Total Scheduled Interviews) × 100%.',
      trend: `${metrics.interviewsScheduled} total events scheduled`,
      trendPositive: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING_GENTLE, delay: idx * 0.05 }}
            className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow relative group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {card.title}
              </span>
              <div
                className={`p-2 rounded-xl border ${card.bgColor} ${card.color} flex items-center justify-center shrink-0`}
              >
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-900 tracking-tight">
                  {card.value}
                </span>
                <div className="relative group/tooltip">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-300 hover:text-slate-500 cursor-help transition" />
                  <div className="absolute right-0 bottom-full mb-2 hidden group-hover/tooltip:block w-56 p-2 bg-slate-900 text-white text-[11px] rounded-lg shadow-xl z-20 pointer-events-none">
                    <p className="font-semibold text-slate-200 mb-0.5">Formula:</p>
                    <p className="text-slate-300 leading-relaxed">{card.formula}</p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-500 truncate" title={card.subtext}>
                {card.subtext}
              </p>

              <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-medium">
                <TrendingUp
                  className={`w-3.5 h-3.5 ${card.trendPositive ? 'text-emerald-500' : 'text-amber-500'}`}
                />
                <span className={card.trendPositive ? 'text-emerald-700' : 'text-amber-700'}>
                  {card.trend}
                </span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
