import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Alert } from '../../components/ui/alert';
import { Account, AccountFormData } from '../../types';
import { accountService } from '../../services/accountService';
import { useAuth } from '../../contexts/AuthContext';

const accountSchema = z.object({
  name: z.string().trim().min(1, 'Account name is required').max(255, 'Name is too long'),
  website: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  industry: z.string().trim().optional(),
  annual_revenue: z.string().trim().optional(),
  employee_count: z.string().trim().optional(),
  billing_address: z.string().trim().optional(),
});

type AccountFormValues = z.infer<typeof accountSchema>;

export interface AccountFormProps {
  account?: Account | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AccountForm: React.FC<AccountFormProps> = ({ account, onSuccess, onCancel }) => {
  const { organization } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: account?.name ?? '',
      website: account?.website ?? '',
      phone: account?.phone ?? '',
      industry: account?.industry ?? '',
      annual_revenue: account?.annual_revenue?.toString() ?? '',
      employee_count: account?.employee_count?.toString() ?? '',
      billing_address: account?.billing_address ?? '',
    },
  });

  const onSubmit = async (values: AccountFormValues) => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const revenue =
        values.annual_revenue && values.annual_revenue.trim().length > 0
          ? Number(values.annual_revenue)
          : null;

      if (revenue !== null && !Number.isFinite(revenue)) {
        throw new Error('Annual revenue must be a valid number.');
      }

      const employeeCount =
        values.employee_count && values.employee_count.trim().length > 0
          ? Number(values.employee_count)
          : null;

      if (
        employeeCount !== null &&
        (!Number.isInteger(employeeCount) || employeeCount < 0)
      ) {
        throw new Error('Employee count must be a non-negative whole number.');
      }

      const formData: AccountFormData = {
        name: values.name,
        website: values.website || null,
        phone: values.phone || null,
        industry: values.industry || null,
        annual_revenue: revenue,
        employee_count: employeeCount,
        billing_address: values.billing_address || null,
      };

      if (account) {
        await accountService.updateAccount(account.id, formData);
      } else {
        if (!organization) {
          throw new Error('Please sign in and select a workspace before creating an account.');
        }
        await accountService.createAccount(formData, organization.id);
      }

      onSuccess();
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save the account.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {errorMessage && <Alert variant="error" title="Could not save account">{errorMessage}</Alert>}

      <Input
        label="Name"
        placeholder="Acme Corporation"
        error={errors.name?.message}
        {...register('name')}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Website"
          placeholder="https://example.com"
          error={errors.website?.message}
          {...register('website')}
        />
        <Input
          label="Phone"
          placeholder="+1 555 0100"
          error={errors.phone?.message}
          {...register('phone')}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Industry"
          placeholder="Technology"
          error={errors.industry?.message}
          {...register('industry')}
        />
        <Input
          label="Annual Revenue"
          type="number"
          step="0.01"
          placeholder="1000000"
          error={errors.annual_revenue?.message}
          {...register('annual_revenue')}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Employee Count"
          type="number"
          min="0"
          step="1"
          placeholder="50"
          error={errors.employee_count?.message}
          {...register('employee_count')}
        />
        <Input
          label="Billing Address"
          placeholder="123 Main St, City"
          error={errors.billing_address?.message}
          {...register('billing_address')}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-surface-100">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {account ? 'Save Changes' : 'Create Account'}
        </Button>
      </div>
    </form>
  );
};
