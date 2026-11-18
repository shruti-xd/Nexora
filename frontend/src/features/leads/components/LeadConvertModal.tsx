import React, { useState } from 'react';
import { X, Building2, UserCheck, TrendingUp, Check } from 'lucide-react';
import { Lead, ConvertLeadPayload } from '../../../types/lead.types';

// =============================================================================
// Lead Conversion Modal
// Converts qualified lead into Account, Contact, and optional Opportunity
// =============================================================================

interface LeadConvertModalProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
  onConvert: (payload: ConvertLeadPayload) => Promise<void>;
  isSubmitting?: boolean;
}

export const LeadConvertModal: React.FC<LeadConvertModalProps> = ({
  lead,
  isOpen,
  onClose,
  onConvert,
  isSubmitting = false,
}) => {
  const [createOpportunity, setCreateOpportunity] = useState(true);
  const [oppName, setOppName] = useState(`${lead.company} — Enterprise Deal`);
  const [oppAmount, setOppAmount] = useState<number>(lead.estimated_value || 50000);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    try {
      await onConvert({
        createOpportunity,
        oppName: createOpportunity ? oppName.trim() : undefined,
        oppAmount: createOpportunity ? Number(oppAmount) : undefined,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lead conversion failed';
      setErrorMessage(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-2xl border border-surface-200 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-700 to-teal-800 text-white flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold tracking-tight">Convert Qualified Lead</h3>
            <p className="text-xs text-emerald-100 mt-0.5">
              {lead.first_name} {lead.last_name} · {lead.company}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-600/50 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Target Account Preview */}
          <div className="p-3.5 rounded-xl bg-surface-50 border border-surface-200 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <span className="font-semibold text-surface-900 block">Account Record</span>
              <p className="text-surface-600 mt-0.5">
                Creates new Company Account: <strong className="text-surface-900">{lead.company}</strong>
              </p>
            </div>
          </div>

          {/* Contact Preview */}
          <div className="p-3.5 rounded-xl bg-surface-50 border border-surface-200 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
              <UserCheck className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <span className="font-semibold text-surface-900 block">Contact Record</span>
              <p className="text-surface-600 mt-0.5">
                Creates primary contact: <strong className="text-surface-900">{lead.first_name} {lead.last_name}</strong> ({lead.email})
              </p>
            </div>
          </div>

          {/* Opportunity Toggle & Fields */}
          <div className="space-y-3 pt-1">
            <label className="flex items-center gap-2.5 text-xs font-semibold text-surface-800 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={createOpportunity}
                onChange={(e) => setCreateOpportunity(e.target.checked)}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-surface-300"
              />
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-brand-600" />
                Create Deal / Opportunity in pipeline upon conversion
              </span>
            </label>

            {createOpportunity && (
              <div className="pl-6 space-y-3 border-l-2 border-brand-200 ml-2">
                <div>
                  <label className="block text-[11px] font-semibold text-surface-700 mb-1">
                    Opportunity Name
                  </label>
                  <input
                    type="text"
                    value={oppName}
                    onChange={(e) => setOppName(e.target.value)}
                    required
                    placeholder="e.g. Acme Corp — Enterprise Deployment"
                    className="w-full px-3 py-2 border border-surface-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-surface-700 mb-1">
                    Deal Amount ($)
                  </label>
                  <input
                    type="number"
                    value={oppAmount}
                    onChange={(e) => setOppAmount(Number(e.target.value))}
                    min={0}
                    step={100}
                    className="w-full px-3 py-2 border border-surface-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="pt-3 flex justify-end gap-2.5 border-t border-surface-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-surface-200 text-xs font-semibold text-surface-700 hover:bg-surface-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Converting...' : 'Convert Lead'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
