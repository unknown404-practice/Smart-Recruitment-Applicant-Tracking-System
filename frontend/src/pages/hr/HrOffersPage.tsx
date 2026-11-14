import React, { useMemo, useState } from 'react';
import {
  Gift,
  FileCheck,
  Plus,
  X,
  Send,
  Eye,
  LoaderCircle,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import {
  OfferRecord,
  useOffers,
} from '../../hooks/useOffers';

const getLocalDate = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDate = (value?: string | null): string => {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
};

const formatSalary = (amount: number, currency: string): string =>
  `${currency} ${Number(amount).toLocaleString()}`;

const statusStyles: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700 border-slate-200',
  ISSUED: 'bg-amber-50 text-amber-700 border-amber-200',
  ACCEPTED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  DECLINED: 'bg-rose-50 text-rose-700 border-rose-200',
  EXPIRED: 'bg-slate-100 text-slate-500 border-slate-200',
};

export const HrOffersPage: React.FC = () => {
  const {
    offers,
    applications,
    loading,
    loadingApplications,
    submitting,
    issuingId,
    error,
    fetchOffers,
    createOffer,
    issueOffer,
  } = useOffers();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<OfferRecord | null>(null);
  const [offerToIssue, setOfferToIssue] = useState<OfferRecord | null>(null);

  const [applicationId, setApplicationId] = useState('');
  const [salaryAmount, setSalaryAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [startDate, setStartDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [formError, setFormError] = useState('');

  const selectedApplication = useMemo(
    () => applications.find((application) => application.id === applicationId),
    [applications, applicationId]
  );

  const resetForm = () => {
    setApplicationId('');
    setSalaryAmount('');
    setCurrency('USD');
    setStartDate('');
    setExpiryDate('');
    setFormError('');
  };

  const validateForm = (): string | null => {
    if (!applicationId) {
      return 'Please select an application.';
    }

    const salary = Number(salaryAmount);
    if (!salaryAmount || !Number.isSafeInteger(salary) || salary <= 0) {
      return 'Salary must be a positive whole number.';
    }

    if (!startDate) {
      return 'Please select an offer start date.';
    }

    if (startDate <= getLocalDate()) {
      return 'The offer start date must be in the future.';
    }

    if (!expiryDate) {
      return 'Please select an offer expiry date.';
    }

    if (expiryDate <= startDate) {
      return 'The expiry date must be after the start date.';
    }

    return null;
  };

  const handleCreateOffer = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      await createOffer({
        applicationId,
        salaryAmount: Number(salaryAmount),
        currency,
        startDate,
        expiryDate,
      });

      resetForm();
      setShowCreateModal(false);
    } catch (err: any) {
      setFormError(err.message || 'Unable to create the offer.');
    }
  };

  const handleIssueOffer = async () => {
    if (!offerToIssue) return;

    try {
      await issueOffer(offerToIssue.id);
      setOfferToIssue(null);
    } catch {
      // The hook displays the API error notification.
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Offers & Approvals</h1>
          <p className="text-sm text-slate-500 mt-1">
            Create offer drafts, review compensation, and issue employment offers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchOffers}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition"
          >
            <Plus className="w-4 h-4" />
            Create Offer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Offers', value: offers.length },
          { label: 'Draft Offers', value: offers.filter((offer) => offer.status === 'DRAFT').length },
          { label: 'Issued Offers', value: offers.filter((offer) => offer.status === 'ISSUED').length },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500">{item.label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{item.value}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="flex items-start gap-2 p-4 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Offer Records</h2>
          <p className="text-xs text-slate-500 mt-1">
            Offers belonging to your company.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 p-12 text-slate-500 text-sm">
            <LoaderCircle className="w-5 h-5 animate-spin" />
            Loading offers...
          </div>
        ) : offers.length === 0 ? (
          <div className="text-center p-12">
            <Gift className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-800">No offers yet</h3>
            <p className="text-sm text-slate-500 mt-1">
              Create an offer for a candidate from an existing application.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {offers.map((offer) => (
              <div
                key={offer.id}
                className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-2 min-w-0">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                      <Gift className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 truncate">
                        {offer.candidate_name || 'Candidate'}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {offer.job_title || 'Position'} · {offer.id.slice(0, 8)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <span className="font-semibold text-slate-800">
                      {formatSalary(offer.salary_amount, offer.currency)}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full border font-medium ${statusStyles[offer.status] || statusStyles.DRAFT}`}
                    >
                      {offer.status}
                    </span>
                    <span className="text-slate-500">
                      Start: {formatDate(offer.start_date)}
                    </span>
                    <span className="text-slate-500">
                      Expires: {formatDate(offer.expires_at)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedOffer(offer)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View Letter
                  </button>

                  {offer.status === 'DRAFT' && (
                    <button
                      type="button"
                      onClick={() => setOfferToIssue(offer)}
                      disabled={issuingId === offer.id}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                    >
                      {issuingId === offer.id ? (
                        <LoaderCircle className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      Issue Offer
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-40 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Create Offer Draft</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Creating a draft does not send an email.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-lg text-slate-400 hover:bg-slate-100"
                aria-label="Close create offer form"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOffer} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Candidate application
                </label>
                <select
                  value={applicationId}
                  onChange={(event) => setApplicationId(event.target.value)}
                  disabled={loadingApplications}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">
                    {loadingApplications ? 'Loading applications...' : 'Select an application'}
                  </option>
                  {applications.map((application) => (
                    <option key={application.id} value={application.id}>
                      {application.candidate?.name || 'Candidate'} · {application.job?.title || 'Position'}
                    </option>
                  ))}
                </select>
                {!loadingApplications && applications.length === 0 && (
                  <p className="text-xs text-amber-700 mt-1">
                    No applications are available for your account.
                  </p>
                )}
                {selectedApplication && (
                  <p className="text-xs text-slate-500 mt-1">
                    {selectedApplication.candidate?.email || ''}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Salary amount
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={salaryAmount}
                    onChange={(event) => setSalaryAmount(event.target.value)}
                    placeholder="e.g. 75000"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(event) => setCurrency(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="USD">USD</option>
                    <option value="INR">INR</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Start date
                  </label>
                  <input
                    type="date"
                    min={getLocalDate()}
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Expiry date
                  </label>
                  <input
                    type="date"
                    min={startDate || getLocalDate()}
                    value={expiryDate}
                    onChange={(event) => setExpiryDate(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {formError && (
                <p className="text-sm text-rose-600" role="alert">
                  {formError}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || loadingApplications || applications.length === 0}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                >
                  {submitting && <LoaderCircle className="w-4 h-4 animate-spin" />}
                  Save Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedOffer && (
        <div className="fixed inset-0 z-40 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Offer Letter Preview</h2>
              <button
                type="button"
                onClick={() => setSelectedOffer(null)}
                className="p-2 rounded-lg text-slate-400 hover:bg-slate-100"
                aria-label="Close offer preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-sm text-slate-700">
              <div>
                <p className="text-xs text-slate-500">Candidate</p>
                <p className="font-semibold text-slate-900">{selectedOffer.candidate_name}</p>
                <p className="text-slate-500">{selectedOffer.candidate_email}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Position</p>
                <p className="font-semibold text-slate-900">{selectedOffer.job_title}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Compensation</p>
                <p className="font-semibold text-slate-900">
                  {formatSalary(selectedOffer.salary_amount, selectedOffer.currency)}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500">Start date</p>
                  <p className="font-medium">{formatDate(selectedOffer.start_date)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Expiry date</p>
                  <p className="font-medium">{formatDate(selectedOffer.expires_at)}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500">Status</p>
                <span className={`inline-flex mt-1 px-2 py-1 rounded-full border text-xs font-medium ${statusStyles[selectedOffer.status] || statusStyles.DRAFT}`}>
                  {selectedOffer.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 border-t border-slate-100 pt-4">
                This preview displays the saved offer details. Issuing the offer records the issuance and triggers the configured notification workflow.
              </p>
            </div>
          </div>
        </div>
      )}

      {offerToIssue && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <FileCheck className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Confirm Offer Issuance</h2>
            </div>

            <p className="text-sm text-slate-600">
              Issue the offer for <strong>{offerToIssue.candidate_name}</strong> for the
              position of <strong>{offerToIssue.job_title}</strong>?
            </p>
            <p className="text-sm text-slate-500 mt-3">
              This will mark the offer as issued and trigger the configured candidate notification workflow.
            </p>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setOfferToIssue(null)}
                disabled={issuingId === offerToIssue.id}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleIssueOffer}
                disabled={issuingId === offerToIssue.id}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
              >
                {issuingId === offerToIssue.id ? (
                  <LoaderCircle className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Confirm & Issue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
