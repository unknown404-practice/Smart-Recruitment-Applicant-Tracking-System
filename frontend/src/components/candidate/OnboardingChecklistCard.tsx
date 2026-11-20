import React, { useState } from 'react';
import { OnboardingTask, OnboardingStats } from '../../services/onboardingService';
import {
  CheckCircle2,
  Sparkles,
  Shield,
  CreditCard,
  Laptop,
  Scale,
  Calendar,
  Check,
} from 'lucide-react';

export interface OnboardingChecklistCardProps {
  tasks: OnboardingTask[];
  stats?: OnboardingStats;
  onToggleTask: (taskId: string, isCompleted: boolean) => Promise<void>;
  isLoading?: boolean;
}

export const OnboardingChecklistCard: React.FC<OnboardingChecklistCardProps> = ({
  tasks,
  stats,
  onToggleTask,
  isLoading = false,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [togglingTaskId, setTogglingTaskId] = useState<string | null>(null);

  const total = stats?.total ?? tasks.length;
  const completed =
    stats?.completed ?? tasks.filter((t) => t.isCompleted || (t as any).is_completed).length;
  const percentComplete =
    stats?.percentComplete ?? (total > 0 ? Math.round((completed / total) * 100) : 0);

  const categories: Array<{ id: string; label: string; count: number }> = [
    { id: 'ALL', label: 'All Tasks', count: tasks.length },
    {
      id: 'COMPLIANCE',
      label: 'Compliance',
      count: tasks.filter((t) => (t.category || '').toUpperCase() === 'COMPLIANCE').length,
    },
    {
      id: 'FINANCE',
      label: 'Finance & Payroll',
      count: tasks.filter((t) => (t.category || '').toUpperCase() === 'FINANCE').length,
    },
    {
      id: 'EQUIPMENT',
      label: 'Workstation',
      count: tasks.filter((t) => (t.category || '').toUpperCase() === 'EQUIPMENT').length,
    },
    {
      id: 'LEGAL',
      label: 'Legal & IP',
      count: tasks.filter((t) => (t.category || '').toUpperCase() === 'LEGAL').length,
    },
  ];

  const filteredTasks =
    selectedCategory === 'ALL'
      ? tasks
      : tasks.filter((t) => (t.category || '').toUpperCase() === selectedCategory);

  const getCategoryIcon = (category: string) => {
    switch ((category || '').toUpperCase()) {
      case 'COMPLIANCE':
        return <Shield className="w-3.5 h-3.5 text-blue-600" />;
      case 'FINANCE':
        return <CreditCard className="w-3.5 h-3.5 text-emerald-600" />;
      case 'EQUIPMENT':
        return <Laptop className="w-3.5 h-3.5 text-purple-600" />;
      case 'LEGAL':
        return <Scale className="w-3.5 h-3.5 text-amber-600" />;
      default:
        return <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  const getCategoryBadgeVariant = (category: string) => {
    switch ((category || '').toUpperCase()) {
      case 'COMPLIANCE':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'FINANCE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'EQUIPMENT':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'LEGAL':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const handleToggle = async (task: OnboardingTask) => {
    const isCurrentlyCompleted = task.isCompleted || (task as any).is_completed;
    const targetStatus = !isCurrentlyCompleted;

    setTogglingTaskId(task.id);
    try {
      await onToggleTask(task.id, targetStatus);
    } finally {
      setTogglingTaskId(null);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden space-y-6 p-6 sm:p-8">
      {/* Top Header & Completion Meter */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                New Hire Onboarding Checklist
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Floor 19
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              Please complete all assigned onboarding paperwork and equipment selections before your start date.
            </p>
          </div>

          {/* Progress fraction pill */}
          <div className="flex items-center gap-2 self-start sm:self-auto px-3.5 py-1.5 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-bold text-slate-600">Progress:</span>
            <span className="text-sm font-black text-slate-900">
              {completed} of {total}
            </span>
            <span className="text-xs font-mono font-bold text-emerald-600">
              ({percentComplete}%)
            </span>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200/60 p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${
                percentComplete === 100
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                  : percentComplete >= 50
                  ? 'bg-gradient-to-r from-brand-500 to-indigo-600'
                  : 'bg-gradient-to-r from-amber-400 to-brand-500'
              }`}
              style={{ width: `${percentComplete}%` }}
            />
          </div>
        </div>

        {/* 100% Complete Celebration Banner */}
        {percentComplete === 100 && total > 0 && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-teal-500/15 border border-emerald-300 flex items-center gap-3 text-xs text-emerald-950 animate-fadeIn">
            <div className="p-2 rounded-xl bg-emerald-600 text-white shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="font-extrabold text-sm text-emerald-900">All onboarding tasks completed!</p>
              <p className="text-emerald-800">
                Your hiring team has been notified. You are all set for your official start date.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isSelected ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Task Checklist Items */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading onboarding checklist...</div>
        ) : filteredTasks.length === 0 ? (
          <div className="py-10 text-center rounded-2xl border border-dashed border-slate-200 p-6">
            <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No onboarding tasks in this category</p>
            <p className="text-xs text-slate-500 mt-1">Select another filter above to view pending items.</p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isCompleted = task.isCompleted || (task as any).is_completed;
            const isToggling = togglingTaskId === task.id;
            const dueDateStr = task.dueDate || (task as any).due_date;
            const completedAtStr = task.completedAt || (task as any).completed_at;

            return (
              <div
                key={task.id}
                onClick={() => !isToggling && handleToggle(task)}
                className={`group p-4 sm:p-4.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
                  isCompleted
                    ? 'bg-emerald-50/30 border-emerald-200/60 hover:border-emerald-300'
                    : 'bg-white border-slate-200 hover:border-brand-300 hover:shadow-xs'
                }`}
              >
                {/* Custom Checkbox */}
                <button
                  type="button"
                  disabled={isToggling}
                  aria-label={isCompleted ? `Mark ${task.title} as incomplete` : `Mark ${task.title} as complete`}
                  className={`w-6 h-6 rounded-lg mt-0.5 flex items-center justify-center border-2 transition-all shrink-0 ${
                    isCompleted
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                      : 'border-slate-300 group-hover:border-brand-500 bg-white text-transparent'
                  }`}
                >
                  <Check className={`w-3.5 h-3.5 stroke-[3] ${isCompleted ? 'opacity-100' : 'opacity-0'}`} />
                </button>

                {/* Content */}
                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-sm font-bold tracking-tight transition-colors ${
                        isCompleted ? 'text-slate-500 line-through' : 'text-slate-900 group-hover:text-brand-700'
                      }`}
                    >
                      {task.title}
                    </span>

                    {/* Category Pill */}
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 ${getCategoryBadgeVariant(
                        task.category
                      )}`}
                    >
                      {getCategoryIcon(task.category)}
                      {task.category || 'GENERAL'}
                    </span>
                  </div>

                  {task.description && (
                    <p
                      className={`text-xs leading-relaxed ${
                        isCompleted ? 'text-slate-400' : 'text-slate-600'
                      }`}
                    >
                      {task.description}
                    </p>
                  )}

                  {/* Due date & Completed timestamp */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 pt-1">
                    {dueDateStr && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        Due: {new Date(dueDateStr).toLocaleDateString()}
                      </span>
                    )}
                    {isCompleted && completedAtStr && (
                      <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Completed {new Date(completedAtStr).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
