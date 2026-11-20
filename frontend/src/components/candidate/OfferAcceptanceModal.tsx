import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { CandidateOffer } from '../../services/onboardingService';
import { CheckCircle2, ShieldCheck, PenTool, AlertCircle } from 'lucide-react';

export interface OfferAcceptanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  offer: CandidateOffer;
  candidateName: string;
  onConfirmAccept: (signature: string) => Promise<void>;
}

export const OfferAcceptanceModal: React.FC<OfferAcceptanceModalProps> = ({
  isOpen,
  onClose,
  offer,
  candidateName,
  onConfirmAccept,
}) => {
  const [hasAgreed, setHasAgreed] = useState(false);
  const [signatureName, setSignatureName] = useState(candidateName || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const formattedSalary = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: offer.currency || 'USD',
    maximumFractionDigits: 0,
  }).format(offer.salaryAmount || (offer as any).salary_amount || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasAgreed) {
      setErrorMessage('Please check the acknowledgment box to accept the offer terms.');
      return;
    }
    if (!signatureName.trim()) {
      setErrorMessage('Please provide your full legal name as your digital signature.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await onConfirmAccept(signatureName.trim());
      onClose();
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.error?.message ||
          err.message ||
          'Failed to submit offer acceptance. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Accept Formal Employment Offer" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Banner summary */}
        <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-200/80 rounded-2xl p-4.5 flex items-start gap-3.5">
          <div className="p-2 rounded-xl bg-emerald-600 text-white shrink-0 mt-0.5">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              {offer.jobTitle || (offer as any).job_title || 'Position'} at{' '}
              {offer.companyName || (offer as any).company_name || 'Organization'}
            </h4>
            <p className="text-xs text-slate-600 mt-1">
              Annual Base Salary: <span className="font-bold text-emerald-700">{formattedSalary}</span> | Target Start Date:{' '}
              <span className="font-bold text-slate-800">
                {offer.startDate || (offer as any).start_date || 'Immediate'}
              </span>
            </p>
          </div>
        </div>

        {/* Legal terms statement */}
        <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 space-y-2 text-xs text-slate-600 leading-relaxed max-h-40 overflow-y-auto">
          <p className="font-semibold text-slate-800 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Terms of Digital Acceptance & Employment Acknowledgment
          </p>
          <p>
            By signing and submitting this acceptance form, I hereby confirm that I have reviewed the formal offer letter and agree to all terms, compensation structures, policies, and contingencies set forth by the hiring company.
          </p>
          <p>
            I understand that this digital signature carries the same legal validity, authority, and binding effect as a handwritten physical signature pursuant to the Electronic Signatures in Global and National Commerce Act (E-SIGN).
          </p>
        </div>

        {/* Acceptance Checkbox */}
        <div className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 transition-colors">
          <input
            id="offer-terms-checkbox"
            type="checkbox"
            checked={hasAgreed}
            onChange={(e) => {
              setHasAgreed(e.target.checked);
              if (e.target.checked) setErrorMessage(null);
            }}
            className="w-4.5 h-4.5 mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer shrink-0"
          />
          <label htmlFor="offer-terms-checkbox" className="text-xs font-medium text-slate-800 cursor-pointer select-none">
            <span className="font-bold text-slate-900">I accept the terms and conditions of this employment offer</span> and authorize the company to begin my onboarding workflow.
          </label>
        </div>

        {/* Digital Signature Field */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <PenTool className="w-3.5 h-3.5 text-slate-500" />
            Digital Signature (Type Full Legal Name)
          </label>
          <input
            type="text"
            value={signatureName}
            onChange={(e) => setSignatureName(e.target.value)}
            placeholder="e.g. Alex Morgan"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            required
          />

          {/* Signature Preview */}
          {signatureName && (
            <div className="p-3 bg-slate-50 border border-dashed border-slate-300 rounded-xl flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Digital Signature Preview:
              </span>
              <span className="text-lg font-serif italic text-emerald-800 px-3 py-1 font-bold">
                {signatureName}
              </span>
            </div>
          )}
        </div>

        {/* Error notice */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            disabled={!hasAgreed || !signatureName.trim() || isSubmitting}
            isLoading={isSubmitting}
          >
            Accept & Sign Offer
          </Button>
        </div>
      </form>
    </Modal>
  );
};
