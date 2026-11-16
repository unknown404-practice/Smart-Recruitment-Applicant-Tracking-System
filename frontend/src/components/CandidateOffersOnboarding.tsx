import React, { useState } from 'react';
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  ClipboardCheck,
  Building2,
  Calendar,
} from 'lucide-react';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { useCandidateWorkflow, CandidateOffer } from '../hooks/useCandidateWorkflow';

const formatDate = (value?: string | null) => {
  if (!value) return 'Not specified';

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Not specified'
    : date.toLocaleDateString();
};

const formatSalary = (offer: CandidateOffer) => {
  const amount = Number(offer.salary_amount);

  if (!Number.isFinite(amount)) return 'Not specified';

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: offer.currency || 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const CandidateOffersOnboarding: React.FC = () => {
  const {
    offers,
    tasks,
    loading,
    error,
    respondingOfferIds,
    pendingTaskIds,
    fetchWorkflow,
    respondToOffer,
    updateTask,
  } = useCandidateWorkflow();

  const [selectedOffer, setSelectedOffer] = useState<CandidateOffer | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const issuedOffers = offers.filter((offer) => offer.status === 'ISSUED');
  const previousOffers = offers.filter((offer) => offer.status !== 'ISSUED');
  const completedTasks = tasks.filter((task) => task.isCompleted).length;

  const openAcceptanceModal = (offer: CandidateOffer) => {
    setSelectedOffer(offer);
    setAcceptedTerms(false);
  };

  const closeAcceptanceModal = () => {
    if (selectedOffer && respondingOfferIds.has(selectedOffer.id)) return;
    setSelectedOffer(null);
    setAcceptedTerms(false);
  };

  const handleAcceptOffer = async () => {
    if (!selectedOffer || !acceptedTerms) return;

    const succeeded = await respondToOffer(
      selectedOffer.id,
      'ACCEPTED',
      true
    );

    if (succeeded) {
      setSelectedOffer(null);
      setAcceptedTerms(false);
    }
  };

  const handleDeclineOffer = async (offer: CandidateOffer) => {
    const confirmed = window.confirm(
      'Are you sure you want to decline this employment offer? This action cannot be undone.'
    );

    if (!confirmed) return;

    await respondToOffer(offer.id, 'DECLINED');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-slate-500">
        Loading your offers and onboarding tasks...
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Offers & Onboarding
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Review employment offers and track your onboarding progress.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={fetchWorkflow}>
          Refresh
        </Button>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-rose-800">
              Some information could not be loaded
            </p>
            <p className="text-xs text-rose-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-600" />
            Employment Offers
          </h3>
          <span className="text-xs font-semibold text-slate-500">
            {issuedOffers.length} awaiting response
          </span>
        </div>

        {issuedOffers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <FileText className="w-8 h-8 text-slate-400 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">
              No pending employment offers
            </p>
            <p className="text-xs text-slate-500 mt-1">
              New offers will appear here when an employer issues them.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {issuedOffers.map((offer) => (
              <div
                key={offer.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-slate-900">
                      {offer.job_title || 'Employment Offer'}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" />
                      {offer.company_name || 'Company not specified'}
                    </p>
                  </div>
                  <span className="text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-1">
                    Issued
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3">
                  <div>
                    <p className="text-xs text-slate-500">Offered salary</p>
                    <p className="text-sm font-bold text-slate-900 mt-1">
                      {formatSalary(offer)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Start date</p>
                    <p className="text-sm font-semibold text-slate-900 mt-1">
                      {formatDate(offer.start_date)}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-slate-500">Response deadline</p>
                    <p className="text-sm font-semibold text-slate-900 mt-1">
                      {formatDate(offer.expires_at)}
                    </p>
                  </div>
                </div>

                {offer.offer_letter_html && (
                  <div className="text-xs text-slate-500">
                    <FileText className="w-3.5 h-3.5 inline mr-1" />
                    Offer letter available
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() => openAcceptanceModal(offer)}
                    disabled={respondingOfferIds.has(offer.id)}
                  >
                    Accept Offer
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeclineOffer(offer)}
                    isLoading={respondingOfferIds.has(offer.id)}
                  >
                    Decline
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {previousOffers.length > 0 && (
          <div className="space-y-3 pt-2">
            <h4 className="text-sm font-bold text-slate-700">
              Previous Offers
            </h4>
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
              {previousOffers.map((offer) => (
                <div
                  key={offer.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-4"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {offer.job_title || 'Employment Offer'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {offer.company_name || 'Company not specified'}
                    </p>
                  </div>
                  <span className={`text-xs font-bold rounded-full px-2.5 py-1 w-fit ${
                    offer.status === 'ACCEPTED'
                      ? 'bg-emerald-50 text-emerald-700'
                      : offer.status === 'DECLINED'
                        ? 'bg-rose-50 text-rose-700'
                        : 'bg-slate-100 text-slate-600'
                  }`}>
                    {offer.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-brand-600" />
            Onboarding Tasks
          </h3>
          <span className="text-xs font-semibold text-slate-500">
            {completedTasks} of {tasks.length} completed
          </span>
        </div>

        {tasks.length > 0 && (
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{
                width: `${(completedTasks / tasks.length) * 100}%`,
              }}
            />
          </div>
        )}

        {tasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <ClipboardCheck className="w-8 h-8 text-slate-400 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">
              No onboarding tasks assigned yet
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Your employer's onboarding checklist will appear here.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
            {tasks.map((task) => (
              <label
                key={task.id}
                className={`flex items-start gap-3 p-4 cursor-pointer transition-colors ${
                  pendingTaskIds.has(task.id)
                    ? 'opacity-60 cursor-wait'
                    : 'hover:bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={task.isCompleted}
                  disabled={pendingTaskIds.has(task.id)}
                  onChange={(event) =>
                    updateTask(task.id, event.target.checked)
                  }
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${
                    task.isCompleted
                      ? 'text-slate-400 line-through'
                      : 'text-slate-800'
                  }`}>
                    {task.title}
                  </p>
                  {task.description && (
                    <p className="text-xs text-slate-500 mt-1">
                      {task.description}
                    </p>
                  )}
                  {task.dueDate && (
                    <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Due {formatDate(task.dueDate)}
                    </p>
                  )}
                </div>
                <span className="shrink-0">
                  {pendingTaskIds.has(task.id) ? (
                    <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
                  ) : task.isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Clock className="w-5 h-5 text-slate-300" />
                  )}
                </span>
              </label>
            ))}
          </div>
        )}
      </section>

      <Modal
        isOpen={!!selectedOffer}
        onClose={closeAcceptanceModal}
        title="Confirm Employment Offer Acceptance"
        subtitle="Review your decision before submitting your response."
        size="md"
        footer={
          <>
            <Button
              variant="outline"
              onClick={closeAcceptanceModal}
              disabled={!!selectedOffer && respondingOfferIds.has(selectedOffer.id)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAcceptOffer}
              disabled={!acceptedTerms || !!selectedOffer && respondingOfferIds.has(selectedOffer.id)}
              isLoading={!!selectedOffer && respondingOfferIds.has(selectedOffer.id)}
            >
              Confirm Acceptance
            </Button>
          </>
        }
      >
        {selectedOffer && (
          <div className="space-y-5">
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
              <p className="text-sm font-bold text-slate-900">
                {selectedOffer.job_title || 'Employment Offer'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {selectedOffer.company_name || 'Company not specified'}
              </p>
              <p className="text-sm font-semibold text-slate-800 mt-3">
                {formatSalary(selectedOffer)}
              </p>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(event) => setAcceptedTerms(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm text-slate-700 leading-relaxed">
                I accept the terms and conditions of this employment offer
              </span>
            </label>

            {!acceptedTerms && (
              <p className="text-xs text-amber-700">
                Select the checkbox to enable offer acceptance.
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CandidateOffersOnboarding;
