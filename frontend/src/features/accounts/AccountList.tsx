import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, RefreshCw, Pencil, Trash2, ExternalLink } from 'lucide-react';
import { Account } from '../../types';
import { accountService } from '../../services/accountService';
import { Button } from '../../components/ui/button';
import { Alert } from '../../components/ui/alert';
import { AccountModal } from './AccountModal';

export interface AccountListProps {
  refreshKey?: number;
}

export const AccountList: React.FC<AccountListProps> = ({ refreshKey = 0 }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const fetchAccounts = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      setAccounts(await accountService.getAccounts());
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load accounts.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAccounts();
  }, [fetchAccounts, refreshKey]);

  const handleDelete = async (account: Account) => {
    if (!window.confirm(`Delete ${account.name}?`)) return;

    try {
      await accountService.deleteAccount(account.id);
      await fetchAccounts();
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to delete the account.');
    }
  };

  return (
    <div className="space-y-4">
      {errorMessage && <Alert variant="error" title="Accounts Error">{errorMessage}</Alert>}

      <div className="bg-white border border-surface-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-surface-200 flex items-center justify-between">
          <h2 className="text-base font-semibold text-surface-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-brand-600" />
            Accounts
          </h2>
          <Button variant="outline" size="sm" onClick={() => void fetchAccounts()} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-50 text-[11px] font-semibold text-surface-600 uppercase tracking-wider">
                <th className="py-3 px-4">Account</th>
                <th className="py-3 px-4">Industry</th>
                <th className="py-3 px-4">Annual Revenue</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-surface-500">Loading accounts...</td>
                </tr>
              ) : accounts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-surface-500">No accounts found.</td>
                </tr>
              ) : accounts.map((account) => (
                <tr key={account.id} className="hover:bg-surface-50/50">
                  <td className="py-3.5 px-4">
                    <Link to={`/accounts/${account.id}`} className="font-semibold text-surface-900 hover:text-brand-700">
                      {account.name}
                    </Link>
                    {account.website && (
                      <a
                        href={account.website.startsWith('http') ? account.website : `https://${account.website}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-0.5 flex items-center gap-1 text-[11px] text-surface-500 hover:text-brand-600"
                      >
                        {account.website}<ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-surface-600">{account.industry || '-'}</td>
                  <td className="py-3.5 px-4 text-surface-600">
                    {account.annual_revenue !== null
                      ? new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(account.annual_revenue)
                      : '-'}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingAccount(account);
                          setIsEditOpen(true);
                        }}
                        title="Edit account"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => void handleDelete(account)}
                        title="Delete account"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AccountModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        account={editingAccount}
        onSuccess={() => void fetchAccounts()}
      />
    </div>
  );
};
