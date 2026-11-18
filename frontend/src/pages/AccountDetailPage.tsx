import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Globe,
  Phone,
  Pencil,
  Users,
  BadgeDollarSign,
  MapPin,
} from 'lucide-react';
import { Account } from '../types';
import { accountService } from '../services/accountService';
import { Button } from '../components/ui/button';
import { Alert } from '../components/ui/alert';
import { AccountModal } from '../features/accounts/AccountModal';

export const AccountDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [account, setAccount] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [detailTab, setDetailTab] = useState<'overview' | 'details'>('overview');

  const fetchAccount = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setErrorMessage(null);
      setAccount(await accountService.getAccountById(id));
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load the account.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchAccount();
  }, [id]);

  if (isLoading) {
    return <p className="text-sm text-surface-500">Loading account...</p>;
  }

  if (errorMessage) {
    return <Alert variant="error" title="Account unavailable">{errorMessage}</Alert>;
  }

  if (!account) {
    return <Alert variant="warning" title="Account not found">The requested account could not be found.</Alert>;
  }

  return (
    <div className="space-y-5">
      <Link to="/accounts" className="inline-flex items-center gap-2 text-sm font-medium text-surface-600 hover:text-brand-700">
        <ArrowLeft className="w-4 h-4" />
        Back to Accounts
      </Link>

      <div className="bg-white rounded-2xl border border-surface-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-5 bg-surface-900 text-white flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-500/30 text-brand-100 border border-brand-400/30">
                Account
              </span>
              {account.industry && (
                <span className="text-xs text-surface-300">{account.industry}</span>
              )}
            </div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Building2 className="w-5 h-5 text-brand-300" />
              {account.name}
            </h2>
            {account.website && (
              <p className="text-xs text-surface-300 mt-1">{account.website}</p>
            )}
          </div>
          <Button
            variant="outline"
            onClick={() => setIsEditOpen(true)}
            className="border-surface-700 bg-surface-800 text-white hover:bg-surface-700 hover:text-white"
          >
            <Pencil className="w-4 h-4" />
            Edit
          </Button>
        </div>

        <div className="px-5 pt-3 border-b border-surface-200 flex items-center gap-6 bg-white">
          {([
            ['overview', 'Account Overview'],
            ['details', 'Details & Fields'],
          ] as const).map(([tab, label]) => (
            <button
              key={tab}
              type="button"
              onClick={() => setDetailTab(tab)}
              className={`pb-2.5 text-xs font-bold border-b-2 transition ${
                detailTab === tab
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-surface-500 hover:text-surface-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-5">
          {detailTab === 'overview' ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-surface-50 border border-surface-200/80">
                  <Users className="w-4 h-4 text-surface-400 mb-2" />
                  <div className="text-[11px] font-semibold text-surface-500">Employees</div>
                  <div className="text-sm font-bold text-surface-900 mt-1">{account.employee_count ?? '-'}</div>
                </div>
                <div className="p-4 rounded-xl bg-surface-50 border border-surface-200/80">
                  <BadgeDollarSign className="w-4 h-4 text-surface-400 mb-2" />
                  <div className="text-[11px] font-semibold text-surface-500">Annual Revenue</div>
                  <div className="text-sm font-bold text-brand-600 mt-1">
                    {account.annual_revenue !== null
                      ? new Intl.NumberFormat(undefined, {
                          style: 'currency',
                          currency: 'USD',
                          maximumFractionDigits: 0,
                        }).format(account.annual_revenue)
                      : '-'}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-surface-50 border border-surface-200/80">
                  <MapPin className="w-4 h-4 text-surface-400 mb-2" />
                  <div className="text-[11px] font-semibold text-surface-500">Billing Address</div>
                  <div className="text-sm font-bold text-surface-900 mt-1">{account.billing_address || '-'}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {[
                  { label: 'Website', value: account.website || '-', icon: Globe },
                  { label: 'Phone', value: account.phone || '-', icon: Phone },
                  { label: 'Industry', value: account.industry || '-', icon: Building2 },
                  { label: 'Employee Count', value: account.employee_count?.toString() || '-', icon: Users },
                  { label: 'Annual Revenue', value: account.annual_revenue?.toString() || '-', icon: BadgeDollarSign },
                  { label: 'Billing Address', value: account.billing_address || '-', icon: MapPin },
                ].map(({ label, value, icon: Icon }) => (
                  <div
                    key={label}
                    className="p-3 rounded-xl bg-surface-50 border border-surface-200/80"
                  >
                    <div className="text-[11px] font-semibold text-surface-500 flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </div>
                    <div className="text-sm font-semibold text-surface-900 mt-1">{value}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {[
                ['Account Name', account.name],
                ['Industry', account.industry || '-'],
                ['Website', account.website || '-'],
                ['Phone', account.phone || '-'],
                ['Annual Revenue', account.annual_revenue?.toString() || '-'],
                ['Employee Count', account.employee_count?.toString() || '-'],
                ['Billing Address', account.billing_address || '-'],
                ['Created', account.created_at ? new Date(account.created_at).toLocaleDateString() : '-'],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="p-3 rounded-xl bg-surface-50 border border-surface-200/80"
                >
                  <div className="text-[11px] font-semibold text-surface-500">{label}</div>
                  <div className="text-sm font-semibold text-surface-900 mt-1 break-words">{value}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AccountModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        account={account}
        onSuccess={() => void fetchAccount()}
      />
    </div>
  );
};
