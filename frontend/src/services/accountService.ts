import { supabase } from '../lib/supabase';
import { Account, AccountFormData } from '../types';

function getErrorMessage(error: unknown, fallback: string): Error {
  if (error instanceof Error) return error;

  if (typeof error === 'object' && error !== null) {
    const supabaseError = error as { message?: unknown; details?: unknown; hint?: unknown; code?: unknown };
    if (typeof supabaseError.message === 'string' && supabaseError.message.trim()) {
      const code = typeof supabaseError.code === 'string' ? ` (${supabaseError.code})` : '';
      return new Error(`${supabaseError.message}${code}`);
    }
  }

  return new Error(fallback);
}

async function requireAuthenticatedSession(): Promise<void> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw getErrorMessage(error, 'Failed to verify the authenticated session.');
  if (!data.session) throw new Error('Please sign in before saving an account.');
}

export const accountService = {
  async getAccounts(): Promise<Account[]> {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw getErrorMessage(error, 'Failed to load accounts.');
    }

    return data as Account[];
  },

  async getAccountById(id: string): Promise<Account> {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw getErrorMessage(error, 'Failed to load the account.');
    }

    return data as Account;
  },

  async createAccount(account: AccountFormData, organizationId: string): Promise<Account> {
    await requireAuthenticatedSession();

    const { data, error } = await supabase
      .from('accounts')
      .insert({
        ...account,
        organization_id: organizationId,
      })
      .select('*')
      .single();

    if (error) {
      throw getErrorMessage(error, 'Failed to create the account.');
    }

    return data as Account;
  },

  async updateAccount(id: string, account: Partial<AccountFormData>): Promise<Account> {
    await requireAuthenticatedSession();

    const { data, error } = await supabase
      .from('accounts')
      .update(account)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw getErrorMessage(error, 'Failed to update the account.');
    }

    return data as Account;
  },

  async deleteAccount(id: string): Promise<void> {
    await requireAuthenticatedSession();

    const { error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', id);

    if (error) {
      throw getErrorMessage(error, 'Failed to delete the account.');
    }
  },
};
