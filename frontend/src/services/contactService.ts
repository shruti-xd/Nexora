import { supabase } from '../lib/supabase';
import { Contact, ContactFormData } from '../types';

function getError(error: unknown, fallback: string): Error {
  if (error instanceof Error) return error;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') return new Error(message);
  }
  return new Error(fallback);
}

async function requireSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw getError(error, 'Failed to verify the authenticated session.');
  if (!data.session) throw new Error('Please sign in before managing contacts.');
}

export const contactService = {
  async getContacts(): Promise<Contact[]> {
    const { data: sessionData } = await supabase.auth.getSession();
    const currentUserId = sessionData.session?.user.id;

    const { data, error } = await supabase
      .from('contacts')
      .select('*, accounts(id,name), profiles(id,full_name,email)')
      .order('created_at', { ascending: false });
    if (error) throw getError(error, 'Failed to load contacts.');

    const contacts = (data || []) as Contact[];
    if (currentUserId) {
      const unownedIds = contacts
        .filter((contact) => !contact.owner_id)
        .map((contact) => contact.id);

      if (unownedIds.length > 0) {
        await Promise.all(
          unownedIds.map((id) =>
            supabase.from('contacts').update({ owner_id: currentUserId }).eq('id', id)
          )
        );

        const refreshed = await supabase
          .from('contacts')
          .select('*, accounts(id,name), profiles(id,full_name,email)')
          .order('created_at', { ascending: false });
        if (!refreshed.error) return (refreshed.data || []) as Contact[];
      }
    }

    return contacts;
  },

  async getContactById(id: string): Promise<Contact> {
    const { data, error } = await supabase
      .from('contacts')
      .select('*, accounts(id,name), profiles(id,full_name,email)')
      .eq('id', id)
      .single();
    if (error) throw getError(error, 'Failed to load the contact.');
    return data as Contact;
  },

  async createContact(contact: ContactFormData, organizationId: string): Promise<Contact> {
    await requireSession();
    const { data, error } = await supabase
      .from('contacts')
      .insert({ ...contact, organization_id: organizationId })
      .select('*, accounts(id,name), profiles(id,full_name,email)')
      .single();
    if (error) throw getError(error, 'Failed to create the contact.');
    return data as Contact;
  },

  async updateContact(id: string, contact: Partial<ContactFormData>): Promise<Contact> {
    await requireSession();
    const { data, error } = await supabase
      .from('contacts')
      .update(contact)
      .eq('id', id)
      .select('*, accounts(id,name), profiles(id,full_name,email)')
      .single();
    if (error) throw getError(error, 'Failed to update the contact.');
    return data as Contact;
  },

  async deleteContact(id: string): Promise<void> {
    await requireSession();
    const { error } = await supabase.from('contacts').delete().eq('id', id);
    if (error) throw getError(error, 'Failed to delete the contact.');
  },
};
