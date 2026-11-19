import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/modal';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Alert } from '../../components/ui/alert';
import { Lead, LeadSource, LeadStatus, LeadRating, CreateLeadPayload } from '../../types';
import { leadsService } from '../../services/leadsService';
import { Users2, Building2, Mail, Phone, Globe, MapPin, Tag, Flame } from 'lucide-react';

// =============================================================================
// Lead Form Modal Component
// Supports creating new leads and editing existing lead details
// =============================================================================

export interface LeadFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (lead: Lead) => void;
  leadToEdit?: Lead | null;
}

export const LeadFormModal: React.FC<LeadFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  leadToEdit,
}) => {
  const isEditMode = Boolean(leadToEdit);

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [title, setTitle] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [mobile, setMobile] = useState('');
  const [website, setWebsite] = useState('');
  const [industry, setIndustry] = useState('');
  const [source, setSource] = useState<LeadSource>('WEBSITE');
  const [status, setStatus] = useState<LeadStatus>('NEW');
  const [rating, setRating] = useState<LeadRating>('WARM');
  const [annualRevenue, setAnnualRevenue] = useState('');
  const [employeeCount, setEmployeeCount] = useState('');
  const [description, setDescription] = useState('');

  // Address
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [postalCode, setPostalCode] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize or reset form values
  useEffect(() => {
    if (leadToEdit) {
      setFirstName(leadToEdit.firstName || '');
      setLastName(leadToEdit.lastName || '');
      setCompany(leadToEdit.company || '');
      setTitle(leadToEdit.title || '');
      setEmail(leadToEdit.email || '');
      setPhone(leadToEdit.phone || '');
      setMobile(leadToEdit.mobile || '');
      setWebsite(leadToEdit.website || '');
      setIndustry(leadToEdit.industry || '');
      setSource(leadToEdit.source || 'WEBSITE');
      setStatus(leadToEdit.status || 'NEW');
      setRating(leadToEdit.rating || 'WARM');
      setAnnualRevenue(leadToEdit.annualRevenue != null ? String(leadToEdit.annualRevenue) : '');
      setEmployeeCount(leadToEdit.employeeCount != null ? String(leadToEdit.employeeCount) : '');
      setDescription(leadToEdit.description || '');

      setStreet(leadToEdit.street || '');
      setCity(leadToEdit.city || '');
      setState(leadToEdit.state || '');
      setCountry(leadToEdit.country || '');
      setPostalCode(leadToEdit.postalCode || '');
    } else {
      setFirstName('');
      setLastName('');
      setCompany('');
      setTitle('');
      setEmail('');
      setPhone('');
      setMobile('');
      setWebsite('');
      setIndustry('');
      setSource('WEBSITE');
      setStatus('NEW');
      setRating('WARM');
      setAnnualRevenue('');
      setEmployeeCount('');
      setDescription('');
      setStreet('');
      setCity('');
      setState('');
      setCountry('');
      setPostalCode('');
    }
    setErrorMessage(null);
  }, [leadToEdit, isOpen]);

  // Step 1: Submit lead form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lastName.trim() || !company.trim()) {
      setErrorMessage('Last name and Company are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      console.log(`[LeadFormModal] Step 1: Submitting lead form (Mode: ${isEditMode ? 'EDIT' : 'CREATE'})`);

      const payload: CreateLeadPayload = {
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim(),
        company: company.trim(),
        title: title.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        mobile: mobile.trim() || undefined,
        website: website.trim() || undefined,
        industry: industry.trim() || undefined,
        source,
        status,
        rating,
        annualRevenue: annualRevenue ? parseFloat(annualRevenue) : undefined,
        employeeCount: employeeCount ? parseInt(employeeCount, 10) : undefined,
        description: description.trim() || undefined,
        street: street.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        country: country.trim() || undefined,
        postalCode: postalCode.trim() || undefined,
      };

      let result: Lead;
      if (isEditMode && leadToEdit) {
        result = await leadsService.updateLead(leadToEdit.id, payload);
        console.log(`[LeadFormModal] Step 1: Lead ${leadToEdit.id} updated`);
      } else {
        result = await leadsService.createLead(payload);
        console.log(`[LeadFormModal] Step 1: Lead created: ${result.id}`);
      }

      onSuccess(result);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save lead details';
      console.error('[LeadFormModal] Step 1 Failed:', msg);
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Lead' : 'New Lead'}
      description={
        isEditMode
          ? 'Update prospective customer or opportunity information.'
          : 'Capture a new potential customer or business enquiry.'
      }
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto px-1">
        {errorMessage && (
          <Alert variant="error" className="py-2">
            {errorMessage}
          </Alert>
        )}

        {/* Section 1: Lead Identification */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-500 border-b border-surface-200 pb-1">
            Lead Details
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-surface-700 mb-1">First Name</label>
              <Input
                type="text"
                placeholder="e.g. Michael"
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
                placeholder="e.g. Scott"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-surface-700 mb-1">
                Company <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="e.g. Dunder Mifflin Paper Co."
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-surface-700 mb-1">Job Title</label>
              <Input
                type="text"
                placeholder="e.g. Regional Manager"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-surface-700 mb-1">Email</label>
              <Input
                type="email"
                placeholder="m.scott@dundermifflin.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-surface-700 mb-1">Phone</label>
              <Input
                type="tel"
                placeholder="+1 (555) 0122"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-surface-700 mb-1">Mobile</label>
              <Input
                type="tel"
                placeholder="+1 (555) 0133"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-surface-700 mb-1">Website</label>
              <Input
                type="url"
                placeholder="https://example.com"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-surface-700 mb-1">Industry</label>
              <Input
                type="text"
                placeholder="e.g. Manufacturing, Retail"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Pipeline Classification */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-500 border-b border-surface-200 pb-1">
            Status & Classification
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-surface-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as LeadStatus)}
                className="w-full text-sm rounded-lg border border-surface-200 bg-white px-3 py-2 text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="NEW">New</option>
                <option value="CONTACTED">Contacted</option>
                <option value="QUALIFIED">Qualified</option>
                <option value="UNQUALIFIED">Unqualified</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-surface-700 mb-1">Rating</label>
              <select
                value={rating}
                onChange={(e) => setRating(e.target.value as LeadRating)}
                className="w-full text-sm rounded-lg border border-surface-200 bg-white px-3 py-2 text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="HOT">Hot 🔥</option>
                <option value="WARM">Warm ⚡</option>
                <option value="COLD">Cold ❄️</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-surface-700 mb-1">Source</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as LeadSource)}
                className="w-full text-sm rounded-lg border border-surface-200 bg-white px-3 py-2 text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="WEBSITE">Website</option>
                <option value="REFERRAL">Referral</option>
                <option value="SOCIAL_MEDIA">Social Media</option>
                <option value="EMAIL_CAMPAIGN">Email Campaign</option>
                <option value="ADVERTISEMENT">Advertisement</option>
                <option value="COLD_CALL">Cold Call</option>
                <option value="EVENT">Event</option>
                <option value="PARTNER">Partner</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-surface-700 mb-1">Annual Revenue ($)</label>
              <Input
                type="number"
                placeholder="e.g. 1000000"
                value={annualRevenue}
                onChange={(e) => setAnnualRevenue(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-surface-700 mb-1">Employee Count</label>
              <Input
                type="number"
                placeholder="e.g. 50"
                value={employeeCount}
                onChange={(e) => setEmployeeCount(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Section 3: Address */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-500 border-b border-surface-200 pb-1">
            Address Details
          </h4>

          <div className="space-y-2 bg-surface-50 p-3 rounded-lg border border-surface-100">
            <Input
              placeholder="Street Address"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
              <Input
                placeholder="State/Province"
                value={state}
                onChange={(e) => setState(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Postal Code"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
              />
              <Input
                placeholder="Country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
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
            placeholder="Enquiry details, requirements, budget considerations..."
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
            {isSubmitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Lead'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
