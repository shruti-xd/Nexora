import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Modal } from '../../components/ui/modal';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Alert } from '../../components/ui/alert';
import { Lead, Account, Contact, ConvertLeadPayload, ConvertLeadResult } from '../../types';
import { leadsService } from '../../services/leadsService';
import { accountsService } from '../../services/accountsService';
import { contactsService } from '../../services/contactsService';
import { CheckCircle2, Building2, UserSquare2, ArrowRight, Sparkles } from 'lucide-react';

// =============================================================================
// Lead Convert Modal Component
// Salesforce-style interactive conversion modal converting a Lead to Account + Contact
// =============================================================================

export interface LeadConvertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: ConvertLeadResult) => void;
  lead: Lead | null;
}

export const LeadConvertModal: React.FC<LeadConvertModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  lead,
}) => {
  const navigate = useNavigate();

  // Mode selections
  const [createNewAccount, setCreateNewAccount] = useState(true);
  const [accountName, setAccountName] = useState('');
  const [existingAccountId, setExistingAccountId] = useState('');

  const [createNewContact, setCreateNewContact] = useState(true);
  const [contactFirstName, setContactFirstName] = useState('');
  const [contactLastName, setContactLastName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [existingContactId, setExistingContactId] = useState('');

  // Dropdown options
  const [availableAccounts, setAvailableAccounts] = useState<Account[]>([]);
  const [availableContacts, setAvailableContacts] = useState<Contact[]>([]);

  // State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [conversionResult, setConversionResult] = useState<ConvertLeadResult | null>(null);

  // Initialize form when lead changes
  useEffect(() => {
    if (lead) {
      setCreateNewAccount(true);
      setAccountName(lead.company || '');
      setExistingAccountId('');

      setCreateNewContact(true);
      setContactFirstName(lead.firstName || '');
      setContactLastName(lead.lastName || '');
      setContactEmail(lead.email || '');
      setContactPhone(lead.phone || lead.mobile || '');
      setExistingContactId('');

      setErrorMessage(null);
      setConversionResult(null);
    }
  }, [lead, isOpen]);

  // Load existing accounts & contacts when modal opens
  useEffect(() => {
    if (isOpen) {
      accountsService
        .listAccounts({ limit: 100 })
        .then((res) => setAvailableAccounts(res.accounts))
        .catch((err) => console.error('[LeadConvertModal] Failed to load accounts:', err));

      contactsService
        .listContacts({ limit: 100 })
        .then((res) => setAvailableContacts(res.contacts))
        .catch((err) => console.error('[LeadConvertModal] Failed to load contacts:', err));
    }
  }, [isOpen]);

  // Step 1: Submit lead conversion
  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;

    if (createNewAccount && !accountName.trim()) {
      setErrorMessage('Account name is required for new account.');
      return;
    }
    if (!createNewAccount && !existingAccountId) {
      setErrorMessage('Please select an existing account.');
      return;
    }
    if (createNewContact && !contactLastName.trim()) {
      setErrorMessage('Contact last name is required for new contact.');
      return;
    }
    if (!createNewContact && !existingContactId) {
      setErrorMessage('Please select an existing contact.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      console.log(`[LeadConvertModal] Step 1: Initiating atomic conversion for lead ${lead.id}`);

      const payload: ConvertLeadPayload = {
        createNewAccount,
        accountName: createNewAccount ? accountName.trim() : undefined,
        existingAccountId: !createNewAccount ? existingAccountId : undefined,
        createNewContact,
        contactFirstName: createNewContact ? contactFirstName.trim() || undefined : undefined,
        contactLastName: createNewContact ? contactLastName.trim() : undefined,
        contactEmail: createNewContact ? contactEmail.trim() || undefined : undefined,
        contactPhone: createNewContact ? contactPhone.trim() || undefined : undefined,
        existingContactId: !createNewContact ? existingContactId : undefined,
      };

      const result = await leadsService.convertLead(lead.id, payload);
      console.log('[LeadConvertModal] Step 1: Conversion successful:', result);

      setConversionResult(result);
      onSuccess(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lead conversion failed';
      console.error('[LeadConvertModal] Step 1 Failed:', msg);
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!lead) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Convert Lead"
      description={`Convert "${[lead.firstName, lead.lastName].filter(Boolean).join(' ')}" from ${lead.company} into an Account and Contact.`}
      className="max-w-xl"
    >
      {/* If conversion succeeded, show congratulatory screen */}
      {conversionResult ? (
        <div className="py-6 text-center space-y-5">
          <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600 border border-emerald-100">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-surface-900">Lead Converted Successfully!</h3>
            <p className="text-xs text-surface-500 mt-1">
              The lead has been qualified and linked to your customer database.
            </p>
          </div>

          <div className="space-y-3 bg-surface-50 p-4 rounded-xl border border-surface-200 text-left text-sm max-w-md mx-auto">
            <div className="flex items-center justify-between">
              <span className="text-xs text-surface-500 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-brand-600" />
                Account Record
              </span>
              <Link
                to={`/accounts/${conversionResult.accountId}`}
                className="font-semibold text-brand-600 hover:underline flex items-center gap-1 text-xs"
              >
                View Account <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="flex items-center justify-between border-t border-surface-200 pt-2.5">
              <span className="text-xs text-surface-500 flex items-center gap-1.5">
                <UserSquare2 className="w-4 h-4 text-emerald-600" />
                Contact Record
              </span>
              <Link
                to={`/contacts/${conversionResult.contactId}`}
                className="font-semibold text-emerald-600 hover:underline flex items-center gap-1 text-xs"
              >
                View Contact <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          <div className="pt-2">
            <Button onClick={onClose} className="px-6">
              Done
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleConvert} className="space-y-5 max-h-[75vh] overflow-y-auto px-1">
          {errorMessage && (
            <Alert variant="error" className="py-2">
              {errorMessage}
            </Alert>
          )}

          {/* Section 1: Account Decision */}
          <div className="space-y-3 bg-surface-50/75 p-4 rounded-xl border border-surface-200">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-brand-600" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-700">
                1. Account Association
              </h4>
            </div>

            <div className="flex items-center gap-4 text-xs font-medium text-surface-700">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="accountOption"
                  checked={createNewAccount}
                  onChange={() => setCreateNewAccount(true)}
                  className="text-brand-600 focus:ring-brand-500"
                />
                Create New Account
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="accountOption"
                  checked={!createNewAccount}
                  onChange={() => setCreateNewAccount(false)}
                  className="text-brand-600 focus:ring-brand-500"
                />
                Attach to Existing Account
              </label>
            </div>

            {createNewAccount ? (
              <div>
                <label className="block text-xs font-medium text-surface-600 mb-1">
                  Account Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  required
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-surface-600 mb-1">
                  Select Existing Account <span className="text-red-500">*</span>
                </label>
                <select
                  value={existingAccountId}
                  onChange={(e) => setExistingAccountId(e.target.value)}
                  className="w-full text-sm rounded-lg border border-surface-200 bg-white px-3 py-2 text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                >
                  <option value="">— Select Account —</option>
                  {availableAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.accountType})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Section 2: Contact Decision */}
          <div className="space-y-3 bg-surface-50/75 p-4 rounded-xl border border-surface-200">
            <div className="flex items-center gap-2">
              <UserSquare2 className="w-4 h-4 text-emerald-600" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-700">
                2. Contact Association
              </h4>
            </div>

            <div className="flex items-center gap-4 text-xs font-medium text-surface-700">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="contactOption"
                  checked={createNewContact}
                  onChange={() => setCreateNewContact(true)}
                  className="text-brand-600 focus:ring-brand-500"
                />
                Create New Contact
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="contactOption"
                  checked={!createNewContact}
                  onChange={() => setCreateNewContact(false)}
                  className="text-brand-600 focus:ring-brand-500"
                />
                Link to Existing Contact
              </label>
            </div>

            {createNewContact ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-surface-600 mb-1">First Name</label>
                    <Input
                      value={contactFirstName}
                      onChange={(e) => setContactFirstName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-surface-600 mb-1">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={contactLastName}
                      onChange={(e) => setContactLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-surface-600 mb-1">Email</label>
                    <Input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-surface-600 mb-1">Phone</label>
                    <Input
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-surface-600 mb-1">
                  Select Existing Contact <span className="text-red-500">*</span>
                </label>
                <select
                  value={existingContactId}
                  onChange={(e) => setExistingContactId(e.target.value)}
                  className="w-full text-sm rounded-lg border border-surface-200 bg-white px-3 py-2 text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                >
                  <option value="">— Select Contact —</option>
                  {availableContacts.map((cnt) => (
                    <option key={cnt.id} value={cnt.id}>
                      {[cnt.firstName, cnt.lastName].filter(Boolean).join(' ')} {cnt.email ? `(${cnt.email})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-200">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              {isSubmitting ? 'Converting...' : 'Convert Lead'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
