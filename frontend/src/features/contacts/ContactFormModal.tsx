import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/modal';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Alert } from '../../components/ui/alert';
import { Contact, CreateContactPayload, Account } from '../../types';
import { contactsService } from '../../services/contactsService';
import { accountsService } from '../../services/accountsService';
import { User, Building2, Mail, Phone, MapPin, Briefcase } from 'lucide-react';

// =============================================================================
// Contact Form Modal Component
// Supports creating new contacts and editing existing contacts with account link
// =============================================================================

export interface ContactFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (contact: Contact) => void;
  contactToEdit?: Contact | null;
  defaultAccountId?: string;
  defaultAccountName?: string;
}

export const ContactFormModal: React.FC<ContactFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  contactToEdit,
  defaultAccountId,
  defaultAccountName,
}) => {
  const isEditMode = Boolean(contactToEdit);

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [accountId, setAccountId] = useState('');
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [mobile, setMobile] = useState('');
  const [description, setDescription] = useState('');

  // Address
  const [mailingStreet, setMailingStreet] = useState('');
  const [mailingCity, setMailingCity] = useState('');
  const [mailingState, setMailingState] = useState('');
  const [mailingCountry, setMailingCountry] = useState('');
  const [mailingPostalCode, setMailingPostalCode] = useState('');

  // Accounts list for dropdown
  const [availableAccounts, setAvailableAccounts] = useState<Account[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch accounts for association dropdown
  useEffect(() => {
    if (isOpen) {
      accountsService
        .listAccounts({ limit: 100 })
        .then((res) => setAvailableAccounts(res.accounts))
        .catch((err) => console.error('[ContactFormModal] Failed to load accounts:', err));
    }
  }, [isOpen]);

  // Reset or fill form on open
  useEffect(() => {
    if (contactToEdit) {
      setFirstName(contactToEdit.firstName || '');
      setLastName(contactToEdit.lastName || '');
      setAccountId(contactToEdit.accountId || '');
      setTitle(contactToEdit.title || '');
      setDepartment(contactToEdit.department || '');
      setEmail(contactToEdit.email || '');
      setPhone(contactToEdit.phone || '');
      setMobile(contactToEdit.mobile || '');
      setDescription(contactToEdit.description || '');

      setMailingStreet(contactToEdit.mailingStreet || '');
      setMailingCity(contactToEdit.mailingCity || '');
      setMailingState(contactToEdit.mailingState || '');
      setMailingCountry(contactToEdit.mailingCountry || '');
      setMailingPostalCode(contactToEdit.mailingPostalCode || '');
    } else {
      setFirstName('');
      setLastName('');
      setAccountId(defaultAccountId || '');
      setTitle('');
      setDepartment('');
      setEmail('');
      setPhone('');
      setMobile('');
      setDescription('');
      setMailingStreet('');
      setMailingCity('');
      setMailingState('');
      setMailingCountry('');
      setMailingPostalCode('');
    }
    setErrorMessage(null);
  }, [contactToEdit, isOpen, defaultAccountId]);

  // Step 1: Submit contact form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lastName.trim()) {
      setErrorMessage('Last name is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      console.log(`[ContactFormModal] Step 1: Submitting contact form (Mode: ${isEditMode ? 'EDIT' : 'CREATE'})`);

      const payload: CreateContactPayload = {
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim(),
        accountId: accountId || null,
        title: title.trim() || undefined,
        department: department.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        mobile: mobile.trim() || undefined,
        description: description.trim() || undefined,
        mailingStreet: mailingStreet.trim() || undefined,
        mailingCity: mailingCity.trim() || undefined,
        mailingState: mailingState.trim() || undefined,
        mailingCountry: mailingCountry.trim() || undefined,
        mailingPostalCode: mailingPostalCode.trim() || undefined,
      };

      let result: Contact;
      if (isEditMode && contactToEdit) {
        result = await contactsService.updateContact(contactToEdit.id, payload);
        console.log(`[ContactFormModal] Step 1: Contact ${contactToEdit.id} updated`);
      } else {
        result = await contactsService.createContact(payload);
        console.log(`[ContactFormModal] Step 1: Contact created: ${result.id}`);
      }

      onSuccess(result);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save contact details';
      console.error('[ContactFormModal] Step 1 Failed:', msg);
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Contact' : 'New Contact'}
      description={
        isEditMode
          ? 'Update contact personal details and account association.'
          : defaultAccountName
          ? `Create a contact associated with ${defaultAccountName}.`
          : 'Create a new business contact record.'
      }
      className="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto px-1">
        {errorMessage && (
          <Alert variant="error" className="py-2">
            {errorMessage}
          </Alert>
        )}

        {/* Section 1: Name & Association */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-500 border-b border-surface-200 pb-1">
            Contact Information
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-surface-700 mb-1">First Name</label>
              <Input
                type="text"
                placeholder="e.g. Jane"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-surface-700 mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="e.g. Doe"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-surface-700 mb-1">
                Associated Account
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full text-sm rounded-lg border border-surface-200 bg-white px-3 py-2 text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">— No Account (Unassociated) —</option>
                {availableAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.accountType})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-surface-700 mb-1">Job Title</label>
              <Input
                type="text"
                placeholder="e.g. VP of Sales"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-surface-700 mb-1">Department</label>
              <Input
                type="text"
                placeholder="e.g. Sales, Marketing"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-surface-700 mb-1">Email</label>
              <Input
                type="email"
                placeholder="jane.doe@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-surface-700 mb-1">Phone</label>
              <Input
                type="tel"
                placeholder="+1 (555) 0199"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-surface-700 mb-1">Mobile</label>
              <Input
                type="tel"
                placeholder="+1 (555) 0188"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Mailing Address */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-500 border-b border-surface-200 pb-1">
            Mailing Address
          </h4>

          <div className="space-y-2 bg-surface-50 p-3 rounded-lg border border-surface-100">
            <Input
              placeholder="Street Address"
              value={mailingStreet}
              onChange={(e) => setMailingStreet(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="City"
                value={mailingCity}
                onChange={(e) => setMailingCity(e.target.value)}
              />
              <Input
                placeholder="State/Province"
                value={mailingState}
                onChange={(e) => setMailingState(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Postal Code"
                value={mailingPostalCode}
                onChange={(e) => setMailingPostalCode(e.target.value)}
              />
              <Input
                placeholder="Country"
                value={mailingCountry}
                onChange={(e) => setMailingCountry(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-surface-700 mb-1">Description / Notes</label>
          <textarea
            rows={2}
            className="w-full text-sm rounded-lg border border-surface-200 bg-white p-2.5 text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="Background information, relationship history..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-surface-200">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Contact'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
