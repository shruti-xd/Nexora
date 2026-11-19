import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/modal';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Alert } from '../../components/ui/alert';
import { Account, AccountType, CreateAccountPayload } from '../../types';
import { accountsService } from '../../services/accountsService';
import { Building2, Globe, Mail, Phone, DollarSign, Users, MapPin } from 'lucide-react';

// =============================================================================
// Account Form Modal Component
// Supports creating new accounts and editing existing account details
// =============================================================================

export interface AccountFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (account: Account) => void;
  accountToEdit?: Account | null;
}

export const AccountFormModal: React.FC<AccountFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  accountToEdit,
}) => {
  const isEditMode = Boolean(accountToEdit);

  // Form states
  const [name, setName] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('PROSPECT');
  const [industry, setIndustry] = useState('');
  const [website, setWebsite] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [annualRevenue, setAnnualRevenue] = useState('');
  const [employeeCount, setEmployeeCount] = useState('');
  const [description, setDescription] = useState('');

  // Address states
  const [billingStreet, setBillingStreet] = useState('');
  const [billingCity, setBillingCity] = useState('');
  const [billingState, setBillingState] = useState('');
  const [billingCountry, setBillingCountry] = useState('');
  const [billingPostalCode, setBillingPostalCode] = useState('');

  const [shippingStreet, setShippingStreet] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [shippingState, setShippingState] = useState('');
  const [shippingCountry, setShippingCountry] = useState('');
  const [shippingPostalCode, setShippingPostalCode] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize or reset form values
  useEffect(() => {
    if (accountToEdit) {
      setName(accountToEdit.name || '');
      setAccountType(accountToEdit.accountType || 'PROSPECT');
      setIndustry(accountToEdit.industry || '');
      setWebsite(accountToEdit.website || '');
      setPhone(accountToEdit.phone || '');
      setEmail(accountToEdit.email || '');
      setAnnualRevenue(accountToEdit.annualRevenue != null ? String(accountToEdit.annualRevenue) : '');
      setEmployeeCount(accountToEdit.employeeCount != null ? String(accountToEdit.employeeCount) : '');
      setDescription(accountToEdit.description || '');

      setBillingStreet(accountToEdit.billingStreet || '');
      setBillingCity(accountToEdit.billingCity || '');
      setBillingState(accountToEdit.billingState || '');
      setBillingCountry(accountToEdit.billingCountry || '');
      setBillingPostalCode(accountToEdit.billingPostalCode || '');

      setShippingStreet(accountToEdit.shippingStreet || '');
      setShippingCity(accountToEdit.shippingCity || '');
      setShippingState(accountToEdit.shippingState || '');
      setShippingCountry(accountToEdit.shippingCountry || '');
      setShippingPostalCode(accountToEdit.shippingPostalCode || '');
    } else {
      setName('');
      setAccountType('PROSPECT');
      setIndustry('');
      setWebsite('');
      setPhone('');
      setEmail('');
      setAnnualRevenue('');
      setEmployeeCount('');
      setDescription('');
      setBillingStreet('');
      setBillingCity('');
      setBillingState('');
      setBillingCountry('');
      setBillingPostalCode('');
      setShippingStreet('');
      setShippingCity('');
      setShippingState('');
      setShippingCountry('');
      setShippingPostalCode('');
    }
    setErrorMessage(null);
  }, [accountToEdit, isOpen]);

  // Step 1: Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Account name is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      console.log(`[AccountFormModal] Step 1: Submitting account form (Mode: ${isEditMode ? 'EDIT' : 'CREATE'})`);

      const payload: CreateAccountPayload = {
        name: name.trim(),
        accountType,
        industry: industry.trim() || undefined,
        website: website.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        annualRevenue: annualRevenue ? parseFloat(annualRevenue) : undefined,
        employeeCount: employeeCount ? parseInt(employeeCount, 10) : undefined,
        description: description.trim() || undefined,
        billingStreet: billingStreet.trim() || undefined,
        billingCity: billingCity.trim() || undefined,
        billingState: billingState.trim() || undefined,
        billingCountry: billingCountry.trim() || undefined,
        billingPostalCode: billingPostalCode.trim() || undefined,
        shippingStreet: shippingStreet.trim() || undefined,
        shippingCity: shippingCity.trim() || undefined,
        shippingState: shippingState.trim() || undefined,
        shippingCountry: shippingCountry.trim() || undefined,
        shippingPostalCode: shippingPostalCode.trim() || undefined,
      };

      let result: Account;
      if (isEditMode && accountToEdit) {
        result = await accountsService.updateAccount(accountToEdit.id, payload);
        console.log(`[AccountFormModal] Step 1: Account ${accountToEdit.id} updated successfully`);
      } else {
        result = await accountsService.createAccount(payload);
        console.log(`[AccountFormModal] Step 1: Account created successfully: ${result.id}`);
      }

      onSuccess(result);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save account details';
      console.error('[AccountFormModal] Step 1 Failed:', msg);
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Copy billing address to shipping address helper
  const copyBillingToShipping = () => {
    console.log('[AccountFormModal] Copying billing address to shipping address');
    setShippingStreet(billingStreet);
    setShippingCity(billingCity);
    setShippingState(billingState);
    setShippingCountry(billingCountry);
    setShippingPostalCode(billingPostalCode);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Account' : 'New Account'}
      description={
        isEditMode
          ? 'Update the company or organization profile information.'
          : 'Create a new business account in your organization workspace.'
      }
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto px-1">
        {errorMessage && (
          <Alert variant="error" className="py-2">
            {errorMessage}
          </Alert>
        )}

        {/* Section 1: Basic Information */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-500 border-b border-surface-200 pb-1">
            General Information
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-surface-700 mb-1">
                Account Name <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="e.g. Acme Corporation"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-surface-700 mb-1">Account Type</label>
              <select
                value={accountType}
                onChange={(e) => setAccountType(e.target.value as AccountType)}
                className="w-full text-sm rounded-lg border border-surface-200 bg-white px-3 py-2 text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="PROSPECT">Prospect</option>
                <option value="CUSTOMER">Customer</option>
                <option value="PARTNER">Partner</option>
                <option value="RESELLER">Reseller</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-surface-700 mb-1">Industry</label>
              <Input
                type="text"
                placeholder="e.g. Technology, Healthcare"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
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
              <label className="block text-xs font-medium text-surface-700 mb-1">Phone</label>
              <Input
                type="tel"
                placeholder="+1 (555) 012-3456"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-surface-700 mb-1">Company Email</label>
              <Input
                type="email"
                placeholder="info@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-surface-700 mb-1">Annual Revenue ($)</label>
              <Input
                type="number"
                placeholder="e.g. 5000000"
                value={annualRevenue}
                onChange={(e) => setAnnualRevenue(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-surface-700 mb-1">Employees</label>
              <Input
                type="number"
                placeholder="e.g. 150"
                value={employeeCount}
                onChange={(e) => setEmployeeCount(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-surface-700 mb-1">Description</label>
            <textarea
              rows={2}
              className="w-full text-sm rounded-lg border border-surface-200 bg-white p-2.5 text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Notes or business context about this account..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        {/* Section 2: Addresses */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between border-b border-surface-200 pb-1">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-500">
              Address Details
            </h4>
            <button
              type="button"
              onClick={copyBillingToShipping}
              className="text-xs text-brand-600 hover:text-brand-700 font-medium"
            >
              Copy Billing to Shipping
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Billing Address */}
            <div className="space-y-2 bg-surface-50 p-2.5 rounded-lg border border-surface-100">
              <span className="text-xs font-semibold text-surface-700">Billing Address</span>
              <Input
                placeholder="Street Address"
                value={billingStreet}
                onChange={(e) => setBillingStreet(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="City"
                  value={billingCity}
                  onChange={(e) => setBillingCity(e.target.value)}
                />
                <Input
                  placeholder="State/Province"
                  value={billingState}
                  onChange={(e) => setBillingState(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Postal Code"
                  value={billingPostalCode}
                  onChange={(e) => setBillingPostalCode(e.target.value)}
                />
                <Input
                  placeholder="Country"
                  value={billingCountry}
                  onChange={(e) => setBillingCountry(e.target.value)}
                />
              </div>
            </div>

            {/* Shipping Address */}
            <div className="space-y-2 bg-surface-50 p-2.5 rounded-lg border border-surface-100">
              <span className="text-xs font-semibold text-surface-700">Shipping Address</span>
              <Input
                placeholder="Street Address"
                value={shippingStreet}
                onChange={(e) => setShippingStreet(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="City"
                  value={shippingCity}
                  onChange={(e) => setShippingCity(e.target.value)}
                />
                <Input
                  placeholder="State/Province"
                  value={shippingState}
                  onChange={(e) => setShippingState(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Postal Code"
                  value={shippingPostalCode}
                  onChange={(e) => setShippingPostalCode(e.target.value)}
                />
                <Input
                  placeholder="Country"
                  value={shippingCountry}
                  onChange={(e) => setShippingCountry(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-surface-200">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Account'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
