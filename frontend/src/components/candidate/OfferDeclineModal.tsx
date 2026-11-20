import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { CandidateOffer } from '../../services/onboardingService';
import { AlertTriangle, AlertCircle } from 'lucide-react';

export interface OfferDeclineModalProps {
  isOpen: boolean;
  onClose: () => void;
  offer: CandidateOffer;
  onConfirmDecline: (reason: string) => Promise<void>;
}

export const OfferDeclineModal: React.FC<OfferDeclineModalProps> = ({
  isOpen,
  onClose,
  offer,
  onConfirmDecline,
}) => {
  const [reasonCategory, setReasonCategory] = useState('Accepted another offer');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const fullReason = additionalNotes.trim()
      ? `${reasonCategory}: ${additionalNotes.trim()}`
      : reasonCategory;

    try {
      await onConfirmDecline(fullReason);
      onClose();
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.error?.message ||
          err.message ||
          'Failed to decline offer. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Decline Employment Offer" size="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Warning notification */}
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs text-rose-800 space-y-1">
            <p className="font-bold text-rose-900">This action is permanent and cannot be undone.</p>
            <p>
              Declining will inform the hiring team at{' '}
              <span className="font-semibold">
                {offer.companyName || (offer as any).company_name || 'the organization'}
              </span>{' '}
              and close this candidate application.
            </p>
          </div>
        </div>

        {/* Reason category */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">Primary Reason for Declining</label>
          <select
            value={reasonCategory}
            onChange={(e) => setReasonCategory(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            <option value="Accepted another offer">Accepted another offer</option>
            <option value="Compensation or benefits did not meet expectations">
              Compensation or benefits did not meet expectations
            </option>
            <option value="Role responsibilities differ from expectations">
              Role responsibilities differ from expectations
            </option>
            <option value="Location or remote work arrangement">Location or remote work arrangement</option>
            <option value="Personal or timing considerations">Personal or timing considerations</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Additional notes */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">Additional Feedback (Optional)</label>
          <textarea
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            rows={3}
            placeholder="Help the hiring team understand your decision..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Go Back
          </Button>
          <Button
            type="submit"
            className="bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
            disabled={isSubmitting}
            isLoading={isSubmitting}
          >
            Confirm & Decline Offer
          </Button>
        </div>
      </form>
    </Modal>
  );
};
