import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Building2,
  Search,
  RefreshCw,
  Pencil,
  Trash2,
  ChevronRight,
  X,
  Globe,
  Phone,
  Users,
  BadgeDollarSign,
  MapPin,
  PhoneCall,
  Mail,
  FileText,
  Send,
  Check,
} from 'lucide-react';
import { Account } from '../../types';
import { accountService } from '../../services/accountService';
import { Button } from '../../components/ui/button';
import { Alert } from '../../components/ui/alert';
import { AccountModal } from './AccountModal';
import { useAuth } from '../../contexts/AuthContext';

export interface AccountListProps {
  refreshKey?: number;
}

export const AccountList: React.FC<AccountListProps> = ({ refreshKey = 0 }) => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [detailAccount, setDetailAccount] = useState<Account | null>(null);
  const [detailTab, setDetailTab] = useState<'activity' | 'details'>('activity');
  const [activityType, setActivityType] = useState<'Task' | 'Call' | 'Email' | 'Note'>('Task');
  const [activitySubject, setActivitySubject] = useState('');
  const [activityDescription, setActivityDescription] = useState('');
  const [activityDueDate, setActivityDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [activities, setActivities] = useState<Array<{
    id: string;
    type: 'Task' | 'Call' | 'Email' | 'Note';
    subject: string;
    description: string;
    dueDate: string;
    completed: boolean;
  }>>([]);

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

  const filteredAccounts = accounts.filter((account) => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return true;
    return [account.name, account.industry, account.website]
      .filter(Boolean)
      .some((value) => value?.toLowerCase().includes(query));
  });

  const openDetails = (account: Account) => {
    setDetailAccount(account);
    setDetailTab('activity');
    setActivitySubject('');
    setActivityDescription('');
  };

  return (
    <div className="space-y-4">
      {errorMessage && <Alert variant="error" title="Accounts Error">{errorMessage}</Alert>}

      <div className="bg-white p-3.5 rounded-xl border border-surface-200/90 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="h-4 w-4 text-surface-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search accounts by name, industry, city..."
              className="w-full pl-9 pr-3 py-1.5 border border-surface-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => void fetchAccounts()} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl border border-surface-200 p-12 text-center text-xs text-surface-500">
          Loading accounts...
        </div>
      ) : filteredAccounts.length === 0 ? (
        <div className="bg-white rounded-xl border border-surface-200 p-12 text-center space-y-2">
          <Building2 className="w-8 h-8 mx-auto text-surface-300" />
          <h4 className="text-sm font-semibold text-surface-800">
            {searchTerm ? 'No accounts matched your search' : 'No accounts found'}
          </h4>
          <p className="text-xs text-surface-500">
            {searchTerm
              ? 'Try adjusting the account name, industry, or website filter.'
              : 'Create your first account to start managing company records.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-surface-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-surface-50/80 border-b border-surface-200 text-surface-600 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Account Name</th>
                  <th className="py-3 px-4">Industry</th>
                  <th className="py-3 px-4">Website</th>
                  <th className="py-3 px-4">Annual Revenue</th>
                  <th className="py-3 px-4">Employees</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {filteredAccounts.map((account) => (
                  <tr
                    key={account.id}
                    className="hover:bg-surface-50/70 transition cursor-pointer group"
                  >
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => openDetails(account)}
                        className="font-semibold text-brand-600 hover:text-brand-800 text-left"
                      >
                        {account.name}
                      </button>
                      <div className="text-[11px] text-surface-500 mt-0.5 truncate max-w-[220px]">
                        {account.billing_address || 'No billing address'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-surface-800">
                      {account.industry || '-'}
                    </td>
                    <td className="py-3.5 px-4">
                      {account.website ? (
                        <a
                          href={account.website.startsWith('http') ? account.website : `https://${account.website}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(event) => event.stopPropagation()}
                          className="text-brand-600 hover:text-brand-700"
                        >
                          {account.website.replace(/^https?:\/\//, '')}
                        </a>
                      ) : '-'}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-surface-800">
                      {account.annual_revenue !== null
                        ? new Intl.NumberFormat(undefined, {
                            style: 'currency',
                            currency: 'USD',
                            maximumFractionDigits: 0,
                          }).format(account.annual_revenue)
                        : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-surface-600">
                      {account.employee_count ?? '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right" onClick={(event) => event.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingAccount(account);
                            setIsEditOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-surface-400 hover:text-surface-700 hover:bg-surface-100"
                          title="Edit account"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(account)}
                          className="p-1.5 rounded-lg text-surface-400 hover:text-red-600 hover:bg-red-50"
                          title="Delete account"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openDetails(account)}
                          className="p-1.5 rounded-lg text-surface-400 hover:text-surface-700 hover:bg-surface-100"
                          title="View account"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {detailAccount && createPortal(
        <div className="fixed inset-0 z-[100] flex justify-end bg-surface-950/15" style={{ top: 0, right: 0, bottom: 0, left: 0, height: '100vh' }}>
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl border-l border-surface-200 flex flex-col overflow-hidden">
            <div className="px-5 py-5 bg-surface-900 text-white flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-500/30 text-brand-100 border border-brand-400/30">
                    Account
                  </span>
                  <span className="text-xs text-surface-300">
                    Owner: {user?.fullName || 'Workspace Owner'}
                  </span>
                </div>
                <h2 className="text-lg font-bold mt-1.5">{detailAccount.name}</h2>
                <p className="text-xs text-surface-300 mt-1">
                  {[detailAccount.industry, detailAccount.billing_address]
                    .filter(Boolean)
                    .join(' · ') || 'Account details'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingAccount(detailAccount);
                    setIsEditOpen(true);
                  }}
                  className="p-2 rounded-lg bg-surface-800 hover:bg-surface-700 text-surface-200"
                  title="Edit account"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDetailAccount(null)}
                  className="p-2 rounded-lg bg-surface-800 hover:bg-surface-700 text-surface-200"
                  title="Close account details"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="px-5 pt-3 border-b border-surface-200 flex items-center gap-6 bg-white">
              <button
                type="button"
                onClick={() => setDetailTab('activity')}
                className={`pb-2.5 text-xs font-bold border-b-2 transition ${
                  detailTab === 'activity'
                    ? 'border-brand-600 text-brand-600'
                    : 'border-transparent text-surface-500 hover:text-surface-800'
                }`}
              >
                Activity Timeline ({activities.length})
              </button>
              <button
                type="button"
                onClick={() => setDetailTab('details')}
                className={`pb-2.5 text-xs font-bold border-b-2 transition ${
                  detailTab === 'details'
                    ? 'border-brand-600 text-brand-600'
                    : 'border-transparent text-surface-500 hover:text-surface-800'
                }`}
              >
                Details &amp; Custom Fields
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {detailTab === 'activity' ? (
                <>
                  <div className="p-3.5 rounded-xl border border-surface-200 bg-surface-50/50">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex gap-1.5">
                        {(['Task', 'Call', 'Email', 'Note'] as const).map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setActivityType(type)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                              activityType === type
                                ? 'bg-brand-600 text-white border-brand-600'
                                : 'bg-white text-surface-600 border-surface-200'
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                      <input
                        type="date"
                        value={activityDueDate}
                        onChange={(event) => setActivityDueDate(event.target.value)}
                        className="h-9 px-2.5 rounded-lg border border-surface-200 bg-white text-xs"
                      />
                    </div>
                    <input
                      value={activitySubject}
                      onChange={(event) => setActivitySubject(event.target.value)}
                      placeholder={`Log a ${activityType.toLowerCase()} subject for ${detailAccount.name}...`}
                      className="mt-3 h-10 w-full px-3 rounded-lg border border-surface-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <textarea
                      value={activityDescription}
                      onChange={(event) => setActivityDescription(event.target.value)}
                      placeholder="Optional notes, call summary, or next action..."
                      rows={2}
                      className="mt-2 w-full px-3 py-2 rounded-lg border border-surface-200 bg-white text-xs resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <div className="mt-2 flex justify-end">
                      <button
                        type="button"
                        disabled={!activitySubject.trim()}
                        onClick={() => {
                          setActivities((items) => [
                            ...items,
                            {
                              id: `${Date.now()}`,
                              type: activityType,
                              subject: activitySubject.trim(),
                              description: activityDescription.trim(),
                              dueDate: activityDueDate,
                              completed: false,
                            },
                          ]);
                          setActivitySubject('');
                          setActivityDescription('');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-semibold disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Save {activityType}
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-surface-500 mb-2">
                      Account Activity History ({activities.length})
                    </h4>
                    {activities.length === 0 ? (
                      <div className="p-8 text-center rounded-xl border border-dashed border-surface-200 text-xs text-surface-500">
                        No activities logged on this account yet.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {activities.map((activity) => (
                          <div key={activity.id} className="p-3.5 rounded-xl bg-white border border-surface-200 shadow-2xs flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2.5 min-w-0">
                              {activity.type === 'Task' ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setActivities((items) =>
                                      items.map((item) =>
                                        item.id === activity.id
                                          ? { ...item, completed: !item.completed }
                                          : item
                                      )
                                    )
                                  }
                                  className={`mt-0.5 h-4 w-4 rounded border flex-shrink-0 flex items-center justify-center ${
                                    activity.completed
                                      ? 'bg-emerald-600 border-emerald-600 text-white'
                                      : 'border-surface-300 bg-white'
                                  }`}
                                >
                                  {activity.completed && <Check className="h-3 w-3" />}
                                </button>
                              ) : activity.type === 'Call' ? (
                                <PhoneCall className="w-4 h-4 text-sky-600 mt-0.5" />
                              ) : activity.type === 'Email' ? (
                                <Mail className="w-4 h-4 text-brand-600 mt-0.5" />
                              ) : (
                                <FileText className="w-4 h-4 text-amber-600 mt-0.5" />
                              )}
                            <div className="min-w-0">
                              <div className={`text-sm font-semibold ${activity.completed ? 'line-through text-surface-400' : 'text-surface-900'}`}>
                                {activity.subject}
                              </div>
                              {activity.description && (
                                <p className="text-xs text-surface-600 mt-0.5">{activity.description}</p>
                              )}
                              <div className="text-[11px] text-surface-400 mt-1">Due {activity.dueDate}</div>
                            </div>
                            </div>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-surface-100 text-surface-700">
                              {activity.type}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      ['Account Name', detailAccount.name],
                      ['Industry', detailAccount.industry || '-'],
                      ['Headquarters', detailAccount.city || '-'],
                      ['Website', detailAccount.website || '-'],
                      ['Annual Revenue', detailAccount.annual_revenue !== null
                        ? new Intl.NumberFormat(undefined, {
                            style: 'currency',
                            currency: 'USD',
                            maximumFractionDigits: 0,
                          }).format(detailAccount.annual_revenue)
                        : '-'],
                      ['Customer Tier', detailAccount.tier || 'Growth'],
                    ].map(([label, value]) => (
                      <div key={label} className="p-3 rounded-xl bg-surface-50 border border-surface-200/80">
                        <div className="text-[11px] font-semibold text-surface-500">{label}</div>
                        {label === 'Customer Tier' ? (
                          <span className="inline-flex mt-1 px-2 py-0.5 rounded text-xs font-medium bg-brand-50 text-brand-700 border border-brand-100">
                            {value}
                          </span>
                        ) : (
                          <div className="text-sm font-semibold text-surface-900 mt-1 break-words">{value}</div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="pt-3 border-t border-surface-200">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-surface-500 mb-2">
                      Account Information
                    </h4>
                    <div className="space-y-1.5 text-xs">
                      <div className="p-2.5 rounded-xl border border-surface-200 flex justify-between">
                        <span className="font-semibold text-surface-500">Phone</span>
                        <span className="font-medium text-surface-800">{detailAccount.phone || '-'}</span>
                      </div>
                      <div className="p-2.5 rounded-xl border border-surface-200 flex justify-between">
                        <span className="font-semibold text-surface-500">Billing Address</span>
                        <span className="font-medium text-surface-800">{detailAccount.billing_address || '-'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      <AccountModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        account={editingAccount}
        onSuccess={() => {
          const updatedId = editingAccount?.id;
          void fetchAccounts();
          if (updatedId) {
            void accountService.getAccountById(updatedId).then((updatedAccount) => {
              setDetailAccount(updatedAccount);
            });
          }
        }}
      />
    </div>
  );
};
