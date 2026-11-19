import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { accountsService } from '../services/accountsService';
import { Account, Contact, AccountType } from '../types';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Alert } from '../components/ui/alert';
import { AccountFormModal } from '../features/accounts/AccountFormModal';
import { ContactFormModal } from '../features/contacts/ContactFormModal';
import {
  Building2,
  ArrowLeft,
  Edit,
  Trash2,
  Plus,
  Users,
  Globe,
  Phone,
  Mail,
  DollarSign,
  MapPin,
  Calendar,
  User,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

// =============================================================================
// Account Detail Page Component
// Detailed view for Account entity, related contacts list, and actions
// =============================================================================

export const AccountDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { role } = useAuth();
  const canDelete = role === 'ADMIN' || role === 'MANAGER';
  const canEdit = role !== 'VIEWER';

  const [account, setAccount] = useState<Account | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);

  // Step 1: Fetch account and associated contacts
  const loadAccountData = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setErrorMessage(null);
      console.log(`[AccountDetailPage] Step 1: Loading account details for ID: ${id}`);

      const [accData, contactsData] = await Promise.all([
        accountsService.getAccountById(id),
        accountsService.getAccountContacts(id),
      ]);

      console.log(`[AccountDetailPage] Step 1: Loaded account "${accData.name}" with ${contactsData.length} contacts`);
      setAccount(accData);
      setContacts(contactsData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load account details';
      console.error('[AccountDetailPage] Step 1 Failed:', msg);
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadAccountData();
  }, [loadAccountData]);

  // Step 2: Handle account deletion
  const handleDelete = async () => {
    if (!account) return;
    if (!window.confirm(`Are you sure you want to delete account "${account.name}"?`)) {
      return;
    }

    try {
      console.log(`[AccountDetailPage] Step 2: Deleting account ${account.id}`);
      await accountsService.deleteAccount(account.id);
      navigate('/accounts');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete account';
      console.error('[AccountDetailPage] Step 2 Failed:', msg);
      setErrorMessage(msg);
    }
  };

  const renderTypeBadge = (type: AccountType) => {
    switch (type) {
      case 'CUSTOMER':
        return <Badge variant="success">Customer</Badge>;
      case 'PROSPECT':
        return <Badge variant="info">Prospect</Badge>;
      case 'PARTNER':
        return <Badge variant="warning">Partner</Badge>;
      case 'RESELLER':
        return <Badge variant="default">Reseller</Badge>;
      default:
        return <Badge variant="default">{type}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-brand-600 mb-3" />
        <p className="text-surface-600 text-sm">Loading account details...</p>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="py-16 text-center space-y-4">
        <Building2 className="w-12 h-12 text-surface-300 mx-auto" />
        <h2 className="text-xl font-semibold text-surface-800">Account Not Found</h2>
        <p className="text-surface-500 text-sm">The account you are looking for does not exist or has been deleted.</p>
        <Button variant="outline" onClick={() => navigate('/accounts')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Accounts
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate('/accounts')}
          className="inline-flex items-center text-sm font-medium text-surface-500 hover:text-brand-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Accounts
        </button>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <Alert variant="error">
          {errorMessage}
        </Alert>
      )}
      {successNotice && (
        <Alert variant="success">
          {successNotice}
        </Alert>
      )}

      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-xl border border-surface-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-brand-50 rounded-xl text-brand-600 border border-brand-100">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-surface-900">{account.name}</h1>
              {renderTypeBadge(account.accountType)}
            </div>
            <div className="flex items-center gap-4 text-xs text-surface-500 mt-2 flex-wrap">
              {account.industry && <span>Industry: <strong className="text-surface-700">{account.industry}</strong></span>}
              {account.website && (
                <a
                  href={account.website.startsWith('http') ? account.website : `https://${account.website}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand-600 hover:underline flex items-center gap-1"
                >
                  <Globe className="w-3.5 h-3.5" />
                  {account.website}
                </a>
              )}
              {account.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  {account.phone}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && (
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-1.5"
            >
              <Edit className="w-4 h-4 text-surface-600" />
              Edit Account
            </Button>
          )}
          {canDelete && (
            <Button
              variant="outline"
              onClick={handleDelete}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center gap-1.5 border-red-200"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Account Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview Info */}
          <div className="bg-white p-5 rounded-xl border border-surface-200 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-surface-900 uppercase tracking-wider text-surface-500 border-b border-surface-100 pb-2">
              Account Overview
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs text-surface-400 block">Annual Revenue</span>
                <span className="font-medium text-surface-800">
                  {account.annualRevenue != null ? `$${account.annualRevenue.toLocaleString()}` : '—'}
                </span>
              </div>

              <div>
                <span className="text-xs text-surface-400 block">Employee Count</span>
                <span className="font-medium text-surface-800">
                  {account.employeeCount != null ? account.employeeCount.toLocaleString() : '—'}
                </span>
              </div>

              <div>
                <span className="text-xs text-surface-400 block">Company Email</span>
                <span className="font-medium text-surface-800">{account.email || '—'}</span>
              </div>

              <div>
                <span className="text-xs text-surface-400 block">Account Owner</span>
                <span className="font-medium text-surface-800">
                  {account.owner ? account.owner.fullName : '—'}
                </span>
              </div>

              <div className="sm:col-span-2">
                <span className="text-xs text-surface-400 block">Description / Notes</span>
                <p className="text-surface-700 text-sm mt-1 whitespace-pre-line bg-surface-50 p-3 rounded-lg border border-surface-100">
                  {account.description || 'No description provided.'}
                </p>
              </div>
            </div>
          </div>

          {/* Addresses */}
          <div className="bg-white p-5 rounded-xl border border-surface-200 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-surface-900 uppercase tracking-wider text-surface-500 border-b border-surface-100 pb-2">
              Addresses
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
              <div className="bg-surface-50/50 p-4 rounded-lg border border-surface-100">
                <span className="text-xs font-semibold text-surface-700 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-brand-600" />
                  Billing Address
                </span>
                <div className="text-surface-600 text-xs space-y-1">
                  <div>{account.billingStreet || '—'}</div>
                  <div>{[account.billingCity, account.billingState, account.billingPostalCode].filter(Boolean).join(', ') || '—'}</div>
                  <div>{account.billingCountry || '—'}</div>
                </div>
              </div>

              <div className="bg-surface-50/50 p-4 rounded-lg border border-surface-100">
                <span className="text-xs font-semibold text-surface-700 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  Shipping Address
                </span>
                <div className="text-surface-600 text-xs space-y-1">
                  <div>{account.shippingStreet || '—'}</div>
                  <div>{[account.shippingCity, account.shippingState, account.shippingPostalCode].filter(Boolean).join(', ') || '—'}</div>
                  <div>{account.shippingCountry || '—'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Associated Contacts Section */}
          <div className="bg-white p-5 rounded-xl border border-surface-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-surface-100 pb-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-600" />
                <h3 className="text-sm font-semibold text-surface-900 uppercase tracking-wider text-surface-500">
                  Associated Contacts ({contacts.length})
                </h3>
              </div>
              {canEdit && (
                <Button
                  size="sm"
                  onClick={() => setIsAddContactModalOpen(true)}
                  className="flex items-center gap-1 text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Contact
                </Button>
              )}
            </div>

            {contacts.length === 0 ? (
              <div className="py-8 text-center bg-surface-50 rounded-lg border border-dashed border-surface-200">
                <Users className="w-8 h-8 text-surface-300 mx-auto mb-1.5" />
                <p className="text-xs font-medium text-surface-600">No contacts associated with this account yet</p>
                {canEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddContactModalOpen(true)}
                    className="mt-3 text-xs"
                  >
                    Add First Contact
                  </Button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-surface-100">
                {contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="py-3 flex items-center justify-between gap-4 hover:bg-surface-50/50 px-2 rounded-lg transition-colors"
                  >
                    <div>
                      <Link
                        to={`/contacts/${contact.id}`}
                        className="font-medium text-brand-600 hover:text-brand-800 text-sm hover:underline"
                      >
                        {[contact.firstName, contact.lastName].filter(Boolean).join(' ')}
                      </Link>
                      <p className="text-xs text-surface-500 mt-0.5">
                        {[contact.title, contact.department].filter(Boolean).join(' • ') || 'No title'}
                      </p>
                    </div>

                    <div className="text-right text-xs text-surface-500 space-y-0.5">
                      {contact.email && <div>{contact.email}</div>}
                      {contact.phone && <div>{contact.phone}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Metadata & System Info */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-surface-200 shadow-sm space-y-4 text-xs">
            <h3 className="font-semibold text-surface-500 uppercase tracking-wider border-b border-surface-100 pb-2">
              System Info
            </h3>

            <div className="space-y-3 text-surface-600">
              <div className="flex items-center justify-between">
                <span className="text-surface-400">Created At</span>
                <span className="font-medium text-surface-700">
                  {new Date(account.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-surface-400">Last Updated</span>
                <span className="font-medium text-surface-700">
                  {new Date(account.updatedAt).toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-surface-400">Account ID</span>
                <span className="font-mono text-surface-500 truncate max-w-[140px]" title={account.id}>
                  {account.id}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Account Modal */}
      <AccountFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={(updated) => {
          setAccount(updated);
          setSuccessNotice(`Account "${updated.name}" updated successfully.`);
        }}
        accountToEdit={account}
      />

      {/* Add Associated Contact Modal */}
      <ContactFormModal
        isOpen={isAddContactModalOpen}
        onClose={() => setIsAddContactModalOpen(false)}
        onSuccess={() => {
          setSuccessNotice('New contact successfully added and linked to this account.');
          loadAccountData();
        }}
        defaultAccountId={account.id}
        defaultAccountName={account.name}
      />
    </div>
  );
};
