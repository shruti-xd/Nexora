import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, Globe, Phone, Pencil } from 'lucide-react';
import { Account } from '../types';
import { accountService } from '../services/accountService';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Alert } from '../components/ui/alert';
import { AccountModal } from '../features/accounts/AccountModal';

export const AccountDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [account, setAccount] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

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
    <div className="space-y-6">
      <Link to="/accounts" className="inline-flex items-center gap-2 text-sm font-medium text-surface-600 hover:text-brand-700">
        <ArrowLeft className="w-4 h-4" />
        Back to Accounts
      </Link>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-brand-600" />
              {account.name}
            </CardTitle>
          </div>
          <Button variant="outline" onClick={() => setIsEditOpen(true)}>
            <Pencil className="w-4 h-4" />
            Edit
          </Button>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5 text-sm">
            <div>
              <dt className="text-surface-500">Website</dt>
              <dd className="mt-1 font-medium text-surface-900">
                {account.website ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-surface-400" />{account.website}
                  </span>
                ) : '-'}
              </dd>
            </div>
            <div>
              <dt className="text-surface-500">Phone</dt>
              <dd className="mt-1 font-medium text-surface-900">
                {account.phone ? <span className="inline-flex items-center gap-1.5"><Phone className="w-4 h-4 text-surface-400" />{account.phone}</span> : '-'}
              </dd>
            </div>
            <div>
              <dt className="text-surface-500">Industry</dt>
              <dd className="mt-1 font-medium text-surface-900">{account.industry || '-'}</dd>
            </div>
            <div>
              <dt className="text-surface-500">Annual Revenue</dt>
              <dd className="mt-1 font-medium text-surface-900">
                {account.annual_revenue !== null
                  ? new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(account.annual_revenue)
                  : '-'}
              </dd>
            </div>
            <div>
              <dt className="text-surface-500">Employee Count</dt>
              <dd className="mt-1 font-medium text-surface-900">{account.employee_count ?? '-'}</dd>
            </div>
            <div>
              <dt className="text-surface-500">Billing Address</dt>
              <dd className="mt-1 font-medium text-surface-900">{account.billing_address || '-'}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <AccountModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        account={account}
        onSuccess={() => void fetchAccount()}
      />
    </div>
  );
};
