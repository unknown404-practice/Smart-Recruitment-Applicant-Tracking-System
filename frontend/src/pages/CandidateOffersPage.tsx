import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CandidateOffer,
  OnboardingTask,
  OnboardingStats,
  fetchMyOffers,
  fetchMyOnboardingTasks,
  respondToOffer,
  toggleOnboardingTask,
} from '../services/onboardingService';
import { CandidateOfferReviewCard } from '../components/candidate/CandidateOfferReviewCard';
import { OnboardingChecklistCard } from '../components/candidate/OnboardingChecklistCard';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Gift,
  ListTodo,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';
import { ROUTES } from '../constants/routes';

export const CandidateOffersPage: React.FC = () => {
  const { dbUser, user } = useAuth();
  const { success, error, info } = useToast();

  const [offers, setOffers] = useState<CandidateOffer[]>([]);
  const [tasks, setTasks] = useState<OnboardingTask[]>([]);
  const [stats, setStats] = useState<OnboardingStats>({
    total: 0,
    completed: 0,
    pending: 0,
    percentComplete: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'offers' | 'onboarding'>('offers');

  const candidateName = dbUser?.full_name || user?.displayName || 'Candidate';

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [fetchedOffers, fetchedTaskData] = await Promise.all([
        fetchMyOffers().catch(() => []),
        fetchMyOnboardingTasks().catch(() => ({
          tasks: [],
          stats: { total: 0, completed: 0, pending: 0, percentComplete: 0 },
        })),
      ]);

      setOffers(fetchedOffers);
      setTasks(fetchedTaskData.tasks);
      setStats(fetchedTaskData.stats);

      // If there are onboarding tasks or accepted offers, switch to onboarding tab if no active issued offers
      const hasIssuedOffer = fetchedOffers.some((o) => o.status === 'ISSUED');
      if (!hasIssuedOffer && fetchedTaskData.tasks.length > 0) {
        setActiveTab('onboarding');
      }
    } catch (err: any) {
      console.error('Error loading offers or onboarding data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Accept Offer Handler
  const handleAcceptOffer = async (offerId: string, signature: string) => {
    try {
      const result = await respondToOffer(offerId, 'ACCEPT', { signature });
      success('Congratulations! Offer accepted successfully. Welcome to the team!');

      // Update offer status in local state
      setOffers((prev) =>
        prev.map((o) =>
          o.id === offerId
            ? { ...o, status: 'ACCEPTED', acceptedAt: new Date().toISOString() }
            : o
        )
      );

      // If new onboarding tasks were returned, populate them
      if (result.onboardingTasks && result.onboardingTasks.length > 0) {
        setTasks(result.onboardingTasks);
        setStats({
          total: result.onboardingTasks.length,
          completed: 0,
          pending: result.onboardingTasks.length,
          percentComplete: 0,
        });
        setActiveTab('onboarding');
      } else {
        // Reload tasks
        const fresh = await fetchMyOnboardingTasks();
        setTasks(fresh.tasks);
        setStats(fresh.stats);
        setActiveTab('onboarding');
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to accept offer';
      error(msg);
      throw err;
    }
  };

  // Decline Offer Handler
  const handleDeclineOffer = async (offerId: string, reason: string) => {
    try {
      await respondToOffer(offerId, 'DECLINE', { reason });
      info('Offer has been declined. The hiring team has been notified.');

      setOffers((prev) =>
        prev.map((o) =>
          o.id === offerId
            ? { ...o, status: 'DECLINED', declinedAt: new Date().toISOString(), declinedReason: reason }
            : o
        )
      );
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to decline offer';
      error(msg);
      throw err;
    }
  };

  // Optimistic Toggle Handler
  const handleToggleTask = async (taskId: string, isCompleted: boolean) => {
    // 1. Optimistic update
    const previousTasks = [...tasks];
    const previousStats = { ...stats };

    const updatedTasks = tasks.map((t) =>
      t.id === taskId
        ? {
            ...t,
            isCompleted,
            is_completed: isCompleted,
            completedAt: isCompleted ? new Date().toISOString() : null,
          }
        : t
    );

    const newCompleted = updatedTasks.filter((t) => t.isCompleted || (t as any).is_completed).length;
    const newTotal = updatedTasks.length;
    const newPercent = newTotal > 0 ? Math.round((newCompleted / newTotal) * 100) : 0;

    setTasks(updatedTasks);
    setStats({
      total: newTotal,
      completed: newCompleted,
      pending: newTotal - newCompleted,
      percentComplete: newPercent,
    });

    try {
      await toggleOnboardingTask(taskId, isCompleted);
      success(isCompleted ? 'Task marked complete' : 'Task marked incomplete');
    } catch (err: any) {
      // Revert optimistic update
      setTasks(previousTasks);
      setStats(previousStats);
      const msg = err.response?.data?.error?.message || 'Failed to update task status';
      error(msg);
    }
  };

  const activeIssuedOffer = offers.find((o) => o.status === 'ISSUED');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Offer Letters & Onboarding
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Candidate Zone
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review employment offers, complete digital acceptance signatures, and track your onboarding milestones.
          </p>
        </div>

        <Link to={ROUTES.CANDIDATE}>
          <Button variant="outline" size="sm" className="text-xs font-bold gap-1.5 self-start sm:self-auto">
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Animated Sliding Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-4 sm:space-x-8">
          <button
            onClick={() => setActiveTab('offers')}
            className={`relative py-3.5 px-3 font-bold text-sm whitespace-nowrap transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'offers'
                ? 'text-brand-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Gift className="w-4 h-4" />
            Employment Offers
            {offers.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                {offers.length}
              </span>
            )}
            {activeIssuedOffer && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
            {activeTab === 'offers' && (
              <motion.div
                layoutId="offers-active-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600"
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              />
            )}
          </button>

          <button
            onClick={() => setActiveTab('onboarding')}
            className={`relative py-3.5 px-3 font-bold text-sm whitespace-nowrap transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'onboarding'
                ? 'text-brand-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ListTodo className="w-4 h-4" />
            Onboarding Checklist
            {tasks.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                {stats.completed}/{stats.total}
              </span>
            )}
            {activeTab === 'onboarding' && (
              <motion.div
                layoutId="offers-active-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600"
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              />
            )}
          </button>
        </nav>
      </div>

      {/* Animated Tab Content Transition */}
      <AnimatePresence mode="wait">
        {activeTab === 'offers' ? (
          <motion.div
            key="offers-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {isLoading ? (
              <div className="py-16 text-center text-sm text-slate-400">Loading offer details...</div>
            ) : offers.length === 0 ? (
              <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 text-slate-400 w-16 h-16 mx-auto flex items-center justify-center">
                  <Gift className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-800">No active offers issued yet</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    When a company selects you for an offer, your formal compensation package and letter will appear here for review and digital signature.
                  </p>
                </div>
                <Link to={ROUTES.JOBS}>
                  <Button size="sm" className="text-xs font-bold gap-1 mt-2">
                    Browse Open Positions
                  </Button>
                </Link>
              </div>
            ) : (
              offers.map((offer) => (
                <CandidateOfferReviewCard
                  key={offer.id}
                  offer={offer}
                  candidateName={candidateName}
                  onAcceptOffer={(signature) => handleAcceptOffer(offer.id, signature)}
                  onDeclineOffer={(reason) => handleDeclineOffer(offer.id, reason)}
                  onViewTasksClick={() => setActiveTab('onboarding')}
                />
              ))
            )}
          </motion.div>
        ) : (
          <motion.div
            key="onboarding-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <OnboardingChecklistCard
              tasks={tasks}
              stats={stats}
              onToggleTask={handleToggleTask}
              isLoading={isLoading}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
