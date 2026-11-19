import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { accountsService } from '../../services/accountsService';
import { Account, AccountType, PaginationMeta } from '../../types';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Alert } from '../../components/ui/alert';
import { AccountFormModal } from './AccountFormModal';
import {
  Building2,
  Plus,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Trash2,
  Edit,
  Eye,
  Users,
  Globe,
  Phone,
} from 'lucide-react';

// =============================================================================
// Account List Component
// Organization Accounts directory with search, filter, sorting & pagination
// =============================================================================

export const AccountList: React.FC = () => {
  const navigate = useNavigate();
  const { role, user } = useAuth();
  const canDelete = role === 'ADMIN' || role === 'MANAGER';
  const canCreate = role !== 'VIEWER';

  // Data states
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [industryFilter, setIndustryFilter] = useState('');

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Step 1: Fetch accounts from API
  const fetchAccounts = useCallback(
    async (page: number, search?: string, type?: string, ind?: string) => {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        console.log(`[AccountList] Step 1: Fetching accounts (Page=${page}, Search="${search || ''}", Type="${type || 'ALL'}")`);

        const res = await accountsService.listAccounts({
          page,
          limit: 10,
          search: search || undefined,
          accountType: type && type !== 'ALL' ? (type as AccountType) : undefined,
          industry: ind || undefined,
        });

        console.log(`[AccountList] Step 1: Retrieved ${res.accounts.length} accounts (Total: ${res.pagination.totalItems})`);
        setAccounts(res.accounts);
        setPagination(res.pagination);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to fetch accounts';
        console.error('[AccountList] Step 1 Failed:', msg);
        setErrorMessage(msg);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchAccounts(pagination.page, searchTerm, typeFilter, industryFilter);
  }, [fetchAccounts, pagination.page, typeFilter, industryFilter]);

  // Step 2: Handle search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(`[AccountList] Step 2: Searching accounts for: "${searchTerm}"`);
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchAccounts(1, searchTerm, typeFilter, industryFilter);
  };

  // Step 3: Handle soft delete
  const handleDeleteAccount = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete account "${name}"? This will not delete associated contacts.`)) {
      return;
    }

    try {
      setDeletingId(id);
      setErrorMessage(null);
      console.log(`[AccountList] Step 3: Deleting account ID: ${id}`);
      await accountsService.deleteAccount(id);
      setSuccessNotice(`Account "${name}" was deleted successfully.`);
      fetchAccounts(pagination.page, searchTerm, typeFilter, industryFilter);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete account';
      console.error('[AccountList] Step 3 Failed:', msg);
      setErrorMessage(msg);
    } finally {
      setDeletingId(null);
    }
  };

  // Account Type Badge Helper
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

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-brand-600" />
            <h1 className="text-2xl font-bold text-surface-900">Accounts</h1>
          </div>
          <p className="text-sm text-surface-500 mt-1">
            Manage company relationships, corporate profiles, and associated contacts.
          </p>
        </div>

        {canCreate && (
          <Button
            onClick={() => {
              setEditingAccount(null);
              setIsFormModalOpen(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Account
          </Button>
        )}
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

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-surface-200 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-surface-400" />
            <input
              type="text"
              placeholder="Search by company name, email, phone, city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-surface-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="text-sm rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-surface-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="ALL">All Account Types</option>
              <option value="PROSPECT">Prospect</option>
              <option value="CUSTOMER">Customer</option>
              <option value="PARTNER">Partner</option>
              <option value="RESELLER">Reseller</option>
              <option value="OTHER">Other</option>
            </select>

            <Button type="submit" variant="outline" className="px-3">
              Search
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setTypeFilter('ALL');
                setIndustryFilter('');
                fetchAccounts(1, '', 'ALL', '');
              }}
              title="Reset Filters"
              className="p-2"
            >
              <RefreshCw className="w-4 h-4 text-surface-500" />
            </Button>
          </div>
        </form>
      </div>

      {/* Accounts Table */}
      <div className="bg-white rounded-xl border border-surface-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-50/75 border-b border-surface-200 text-xs font-semibold uppercase tracking-wider text-surface-500">
                <th className="py-3 px-4">Account Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Industry</th>
                <th className="py-3 px-4">Contacts</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Owner</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-surface-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-600" />
                    Loading accounts...
                  </td>
                </tr>
              ) : accounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <Building2 className="w-10 h-10 mx-auto text-surface-300 mb-2" />
                    <p className="text-surface-700 font-medium">No accounts found</p>
                    <p className="text-surface-400 text-xs mt-1">
                      {searchTerm || typeFilter !== 'ALL'
                        ? 'Try modifying your search or filter criteria.'
                        : 'Create your first business account to get started.'}
                    </p>
                  </td>
                </tr>
              ) : (
                accounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-surface-50/50 transition-colors">
                    <td className="py-3 px-4 font-medium text-surface-900">
                      <button
                        onClick={() => navigate(`/accounts/${acc.id}`)}
                        className="text-left font-semibold text-brand-600 hover:text-brand-800 hover:underline flex items-center gap-1.5"
                      >
                        {acc.name}
                      </button>
                      {acc.website && (
                        <a
                          href={acc.website.startsWith('http') ? acc.website : `https://${acc.website}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-surface-400 hover:text-surface-600 flex items-center gap-1 mt-0.5"
                        >
                          <Globe className="w-3 h-3" />
                          {acc.website.replace(/^https?:\/\//, '')}
                        </a>
                      )}
                    </td>
                    <td className="py-3 px-4">{renderTypeBadge(acc.accountType)}</td>
                    <td className="py-3 px-4 text-surface-600">{acc.industry || '—'}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-surface-600 bg-surface-100 px-2 py-0.5 rounded-full">
                        <Users className="w-3 h-3" />
                        {acc.contactCount || 0}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-surface-600 text-xs">
                      {[acc.billingCity, acc.billingCountry].filter(Boolean).join(', ') || '—'}
                    </td>
                    <td className="py-3 px-4 text-surface-600 text-xs">
                      {acc.owner ? acc.owner.fullName : '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/accounts/${acc.id}`)}
                          title="View Details"
                          className="p-1.5 text-surface-500 hover:text-brand-600"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {canCreate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingAccount(acc);
                              setIsFormModalOpen(true);
                            }}
                            title="Edit Account"
                            className="p-1.5 text-surface-500 hover:text-amber-600"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteAccount(acc.id, acc.name)}
                            disabled={deletingId === acc.id}
                            title="Delete Account"
                            className="p-1.5 text-surface-500 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination.totalItems > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-surface-200 bg-surface-50/50 text-xs text-surface-500">
            <div>
              Showing <span className="font-medium text-surface-700">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
              <span className="font-medium text-surface-700">
                {Math.min(pagination.page * pagination.limit, pagination.totalItems)}
              </span>{' '}
              of <span className="font-medium text-surface-700">{pagination.totalItems}</span> accounts
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                disabled={pagination.page <= 1 || isLoading}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Previous
              </Button>
              <span className="text-surface-700">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                disabled={pagination.page >= pagination.totalPages || isLoading}
                className="flex items-center gap-1"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Account Create/Edit Form Modal */}
      <AccountFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingAccount(null);
        }}
        onSuccess={(saved) => {
          console.log('[AccountList] Account saved:', saved.id);
          setSuccessNotice(`Account "${saved.name}" successfully ${editingAccount ? 'updated' : 'created'}.`);
          fetchAccounts(pagination.page, searchTerm, typeFilter, industryFilter);
        }}
        accountToEdit={editingAccount}
      />
    </div>
  );
};
