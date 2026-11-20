import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CandidateOffer } from '../../services/onboardingService';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import {
  Briefcase,
  Building2,
  Calendar,
  DollarSign,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  Eye,
} from 'lucide-react';
import { OfferAcceptanceModal } from './OfferAcceptanceModal';
import { OfferDeclineModal } from './OfferDeclineModal';

export interface CandidateOfferReviewCardProps {
  offer: CandidateOffer;
  candidateName: string;
  onAcceptOffer: (signature: string) => Promise<void>;
  onDeclineOffer: (reason: string) => Promise<void>;
  onViewTasksClick?: () => void;
}

export const CandidateOfferReviewCard: React.FC<CandidateOfferReviewCardProps> = ({
  offer,
  candidateName,
  onAcceptOffer,
  onDeclineOffer,
  onViewTasksClick,
}) => {
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
  const [isDeclineModalOpen, setIsDeclineModalOpen] = useState(false);
  const [isDocumentPreviewOpen, setIsDocumentPreviewOpen] = useState(false);

  const status = offer.status || 'ISSUED';

  const formattedSalary = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: offer.currency || 'USD',
    maximumFractionDigits: 0,
  }).format(offer.salaryAmount || (offer as any).salary_amount || 0);

  const rawExpiry = offer.expiresAt || (offer as any).expires_at;
  const isExpiringSoon =
    rawExpiry && status === 'ISSUED' && new Date(rawExpiry).getTime() - Date.now() < 3 * 86400000;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden transition-all hover:border-brand-200 hover:shadow-md"
    >
      {/* Top Banner & Header */}
      <div className="p-6 sm:p-7 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white shadow-md shrink-0">
              <Briefcase className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {offer.jobTitle || (offer as any).job_title || 'Employment Offer'}
                </h3>
                {status === 'ACCEPTED' && (
                  <Badge variant="success" className="px-3 py-1 text-xs font-bold gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Offer Accepted (Hired)
                  </Badge>
                )}
                {status === 'DECLINED' && (
                  <Badge variant="danger" className="px-3 py-1 text-xs font-bold gap-1">
                    <XCircle className="w-3.5 h-3.5" />
                    Offer Declined
                  </Badge>
                )}
                {status === 'ISSUED' && (
                  <Badge variant="warning" className="px-3 py-1 text-xs font-bold gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Action Required
                  </Badge>
                )}
                {status === 'EXPIRED' && (
                  <Badge variant="default" className="px-3 py-1 text-xs font-bold">
                    Expired
                  </Badge>
                )}
              </div>
              <p className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-400" />
                {offer.companyName || (offer as any).company_name || 'Organization'}
              </p>
            </div>
          </div>

          {/* Document Preview Trigger */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDocumentPreviewOpen(true)}
            className="flex items-center gap-1.5 self-start sm:self-auto rounded-xl text-xs font-bold"
          >
            <Eye className="w-3.5 h-3.5" />
            View Offer Letter
          </Button>
        </div>

        {/* Offer Terms Breakdown Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* Compensation */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Annual Base Salary
            </span>
            <span className="text-xl font-black text-slate-900 flex items-center gap-1">
              <DollarSign className="w-5 h-5 text-emerald-600 shrink-0" />
              {formattedSalary}
              <span className="text-xs font-semibold text-slate-500 font-sans">
                {offer.currency || 'USD'}
              </span>
            </span>
          </div>

          {/* Anticipated Start Date */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Target Start Date
            </span>
            <span className="text-lg font-black text-slate-900 flex items-center gap-1.5">
              <Calendar className="w-4.5 h-4.5 text-brand-600 shrink-0" />
              {offer.startDate || (offer as any).start_date || 'To be scheduled'}
            </span>
          </div>

          {/* Expiration or Acceptance Timestamp */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              {status === 'ACCEPTED'
                ? 'Accepted On'
                : status === 'DECLINED'
                ? 'Declined On'
                : 'Offer Expiry'}
            </span>
            <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
              {status === 'ACCEPTED'
                ? new Date(offer.acceptedAt || (offer as any).accepted_at || Date.now()).toLocaleDateString()
                : status === 'DECLINED'
                ? new Date(offer.declinedAt || (offer as any).declined_at || Date.now()).toLocaleDateString()
                : rawExpiry
                ? new Date(rawExpiry).toLocaleDateString()
                : 'No fixed expiry'}
            </span>
          </div>
        </div>

        {/* Expiring soon warning alert */}
        {isExpiringSoon && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2.5 text-xs text-amber-800 font-medium">
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              This offer is set to expire soon ({new Date(rawExpiry).toLocaleDateString()}). Please accept or decline prior to the deadline.
            </span>
          </div>
        )}
      </div>

      {/* Action Footer Banner */}
      {status === 'ISSUED' && (
        <div className="bg-slate-50 border-t border-slate-200/90 p-5 sm:px-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs text-slate-600 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Review formal legal terms and submit your digital signature to confirm.</span>
          </div>
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDeclineModalOpen(true)}
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 text-xs font-bold"
            >
              Decline Offer
            </Button>
            <Button
              size="sm"
              onClick={() => setIsAcceptModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              Accept Offer
            </Button>
          </div>
        </div>
      )}

      {status === 'ACCEPTED' && (
        <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border-t border-emerald-200 p-5 sm:px-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-600 text-white shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <p className="font-bold text-emerald-950">Congratulations on joining the team!</p>
              <p className="text-emerald-800">
                Your onboarding checklist is active. Complete each task before your first day.
              </p>
            </div>
          </div>
          {onViewTasksClick && (
            <Button
              size="sm"
              onClick={onViewTasksClick}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shrink-0 self-end sm:self-auto"
            >
              Go to Onboarding Tasks
            </Button>
          )}
        </div>
      )}

      {status === 'DECLINED' && (
        <div className="bg-rose-50 border-t border-rose-200 p-4 sm:px-7 text-xs text-rose-800">
          <span className="font-bold text-rose-900">Offer Declined:</span>{' '}
          {offer.declinedReason || (offer as any).declined_reason || 'No additional feedback provided.'}
        </div>
      )}

      {/* Offer Letter Document Preview Modal */}
      <Modal
        isOpen={isDocumentPreviewOpen}
        onClose={() => setIsDocumentPreviewOpen(false)}
        title="Formal Employment Offer Letter"
        size="xl"
      >
        <div className="space-y-4">
          <div className="max-h-[65vh] overflow-y-auto border border-slate-200 rounded-2xl p-6 bg-white shadow-inner font-sans">
            {offer.offerLetterHtml || (offer as any).offer_letter_html ? (
              <div
                dangerouslySetInnerHTML={{
                  __html: offer.offerLetterHtml || (offer as any).offer_letter_html || '',
                }}
              />
            ) : (
              <div className="p-8 text-center text-slate-500 text-sm">
                <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                Offer letter text is loading or not available.
              </div>
            )}
          </div>
          <div className="flex justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsDocumentPreviewOpen(false)}>
              Close Document
            </Button>
          </div>
        </div>
      </Modal>

      {/* Accept Offer Digital Signature Modal */}
      <OfferAcceptanceModal
        isOpen={isAcceptModalOpen}
        onClose={() => setIsAcceptModalOpen(false)}
        offer={offer}
        candidateName={candidateName}
        onConfirmAccept={onAcceptOffer}
      />

      {/* Decline Offer Modal */}
      <OfferDeclineModal
        isOpen={isDeclineModalOpen}
        onClose={() => setIsDeclineModalOpen(false)}
        offer={offer}
        onConfirmDecline={onDeclineOffer}
      />
    </motion.div>
  );
};
