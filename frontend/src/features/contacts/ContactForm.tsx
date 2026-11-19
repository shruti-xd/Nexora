import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Alert } from '../../components/ui/alert';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Account, Contact, ContactFormData } from '../../types';
import { contactService } from '../../services/contactService';
import { accountService } from '../../services/accountService';
import { useAuth } from '../../contexts/AuthContext';

const contactSchema = z.object({
  first_name: z.string().trim().min(1, 'First name is required').max(100),
  last_name: z.string().trim().min(1, 'Last name is required').max(100),
  email: z.string().trim().email('Enter a valid email address'),
  phone: z.string().trim().optional(),
  title: z.string().trim().optional(),
  account_id: z.string().optional(),
  is_decision_maker: z.boolean(),
});

type ContactFormValues = z.infer<typeof contactSchema>;

interface ContactFormProps {
  contact?: Contact | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const ContactForm: React.FC<ContactFormProps> = ({ contact, onSuccess, onCancel }) => {
  const { organization, user } = useAuth();
  const [accounts, setAccounts] = React.useState<Account[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      first_name: contact?.first_name ?? '',
      last_name: contact?.last_name ?? '',
      email: contact?.email ?? '',
      phone: contact?.phone ?? '',
      title: contact?.title ?? '',
      account_id: contact?.account_id ?? '',
      is_decision_maker: contact?.is_decision_maker ?? false,
    },
  });

  React.useEffect(() => {
    accountService.getAccounts().then(setAccounts).catch((error: unknown) => {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load accounts.');
    });
  }, []);

  const onSubmit = async (values: ContactFormValues) => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const payload: ContactFormData = {
        account_id: values.account_id || null,
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        phone: values.phone || null,
        title: values.title || null,
        is_decision_maker: values.is_decision_maker,
        owner_id: contact?.owner_id ?? user?.id ?? null,
        custom_fields: contact?.custom_fields ?? {},
      };

      if (contact) {
        await contactService.updateContact(contact.id, payload);
      } else {
        if (!organization) throw new Error('Please sign in and select a workspace.');
        await contactService.createContact(payload, organization.id);
      }
      onSuccess();
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save the contact.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {errorMessage && <Alert variant="error" title="Could not save contact">{errorMessage}</Alert>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="First Name *" {...register('first_name')} error={errors.first_name?.message} />
        <Input label="Last Name *" {...register('last_name')} error={errors.last_name?.message} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Email *" type="email" {...register('email')} error={errors.email?.message} />
        <Input label="Phone" {...register('phone')} error={errors.phone?.message} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Role / Title" {...register('title')} error={errors.title?.message} />
        <div>
          <label className="block text-xs font-semibold text-surface-600 mb-1.5">Account</label>
          <select
            className="flex h-10 w-full rounded-lg border border-surface-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            {...register('account_id')}
          >
            <option value="">No account</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>{account.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-surface-700 mb-1.5">Custom Fields (Contact)</label>
        <label className="flex h-10 items-center gap-2 rounded-lg border border-surface-300 px-3 text-sm">
          <input type="checkbox" {...register('is_decision_maker')} className="accent-brand-600" />
          Economic Buyer
        </label>
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t border-surface-100">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>Cancel</Button>
        <Button type="submit" isLoading={isLoading}>{contact ? 'Save Changes' : 'Create Contact'}</Button>
      </div>
    </form>
  );
};
