import React, { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { CreateLeadPayload, LeadStatus, LeadSource } from '../../../types/lead.types';
import { useAuth } from '../../../contexts/AuthContext';

// =============================================================================
// Lead Create Modal
// Captures new inbound or sales prospect into the organization pipeline
// =============================================================================

interface LeadCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (payload: CreateLeadPayload) => Promise<void>;
  isSubmitting?: boolean;
}

export const LeadCreateModal: React.FC<LeadCreateModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  isSubmitting = false,
}) => {
  const { user } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<LeadStatus>('New');
  const [source, setSource] = useState<LeadSource>('Direct');
  const [estimatedValue, setEstimatedValue] = useState<number>(25000);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Clear form state whenever the modal opens
  React.useEffect(() => {
    if (isOpen) {
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setCompany('');
      setTitle('');
      setStatus('New');
      setSource('Direct');
      setEstimatedValue(25000);
      setErrorMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !company.trim()) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    try {
      await onCreate({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        company: company.trim(),
        title: title.trim() || undefined,
        status,
        source,
        estimatedValue: Number(estimatedValue) || 0,
        ownerId: user?.id,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create lead';
      setErrorMessage(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-indigo-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/50 flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold">New Sales Lead</h3>
              <p className="text-xs text-indigo-100">Capture lead contact details and estimated deal value</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-indigo-200 hover:text-white hover:bg-indigo-500 transition"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-surface-700 mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jane"
                className="w-full px-3 py-2 border border-surface-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-700 mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Smith"
                className="w-full px-3 py-2 border border-surface-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-surface-700 mb-1">
                Work Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane.smith@enterprise.com"
                className="w-full px-3 py-2 border border-surface-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-700 mb-1">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 234-5678"
                className="w-full px-3 py-2 border border-surface-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-surface-700 mb-1">
                Company <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Acme Technologies"
                className="w-full px-3 py-2 border border-surface-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-700 mb-1">Job Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VP of Engineering"
                className="w-full px-3 py-2 border border-surface-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-surface-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as LeadStatus)}
                className="w-full px-3 py-2 border border-surface-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Qualified">Qualified</option>
                <option value="Unqualified">Unqualified</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-700 mb-1">Source</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as LeadSource)}
                className="w-full px-3 py-2 border border-surface-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="Direct">Direct</option>
                <option value="Inbound">Inbound</option>
                <option value="Referral">Referral</option>
                <option value="Website">Website</option>
                <option value="Event">Event</option>
                <option value="Outbound">Outbound</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-700 mb-1">Est. Value ($)</label>
              <input
                type="number"
                min={0}
                step={500}
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(Number(e.target.value))}
                className="w-full px-3 py-2 border border-surface-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Footer buttons */}
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
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
