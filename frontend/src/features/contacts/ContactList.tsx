import React from 'react';
import { Search, RefreshCw, Pencil, Trash2, ChevronRight, UserSquare2, Send } from 'lucide-react';
import { Contact } from '../../types';
import { contactService } from '../../services/contactService';
import { Alert } from '../../components/ui/alert';
import { Button } from '../../components/ui/button';
import { RecordDrawer } from '../../components/crm/RecordDrawer';
import { ContactModal } from './ContactModal';
import { useAuth } from '../../contexts/AuthContext';

export interface ContactListProps {
  refreshKey?: number;
}

export const ContactList: React.FC<ContactListProps> = ({ refreshKey = 0 }) => {
  const { user } = useAuth();
  const [contacts, setContacts] = React.useState<Contact[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [editingContact, setEditingContact] = React.useState<Contact | null>(null);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [detailContact, setDetailContact] = React.useState<Contact | null>(null);
  const [detailTab, setDetailTab] = React.useState('activity');

  const fetchContacts = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      setContacts(await contactService.getContacts());
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load contacts.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void fetchContacts();
  }, [fetchContacts, refreshKey]);

  const filtered = contacts.filter((contact) => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return true;
    return [
      contact.first_name,
      contact.last_name,
      contact.email,
      contact.title,
      contact.accounts?.name,
    ].filter(Boolean).some((value) => value?.toLowerCase().includes(query));
  });

  const openDetails = (contact: Contact) => {
    setDetailContact(contact);
    setDetailTab('activity');
  };

  const handleDelete = async (contact: Contact) => {
    if (!window.confirm(`Delete ${contact.first_name} ${contact.last_name}?`)) return;
    try {
      await contactService.deleteContact(contact.id);
      await fetchContacts();
      if (detailContact?.id === contact.id) setDetailContact(null);
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to delete the contact.');
    }
  };

  return (
    <div className="space-y-4">
      {errorMessage && <Alert variant="error" title="Contacts Error">{errorMessage}</Alert>}

      <div className="bg-white p-3.5 rounded-xl border border-surface-200/90 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="h-4 w-4 text-surface-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search contacts by name, email, or account..."
              className="w-full pl-9 pr-3 py-1.5 border border-surface-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => void fetchContacts()} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl border border-surface-200 p-12 text-center text-xs text-surface-500">
          Loading contacts...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-surface-200 p-12 text-center space-y-2">
          <UserSquare2 className="w-8 h-8 mx-auto text-surface-300" />
          <h4 className="text-sm font-semibold text-surface-800">
            {searchTerm ? 'No contacts matched your search' : 'No contacts found'}
          </h4>
          <p className="text-xs text-surface-500">
            {searchTerm ? 'Try adjusting your contact search.' : 'Create your first contact to add stakeholders.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-surface-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-surface-50/80 border-b border-surface-200 text-surface-600 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Role / Title</th>
                  <th className="py-3 px-4">Account</th>
                  <th className="py-3 px-4">Economic Buyer</th>
                  <th className="py-3 px-4">Owner</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {filtered.map((contact) => (
                  <tr key={contact.id} className="hover:bg-surface-50/70 transition cursor-pointer group">
                    <td className="py-3.5 px-4">
                      <button type="button" onClick={() => openDetails(contact)} className="font-semibold text-brand-600 hover:text-brand-800 text-left">
                        {contact.first_name} {contact.last_name}
                      </button>
                      <div className="text-[11px] text-surface-500 mt-0.5">{contact.email}</div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-surface-800">{contact.title || '-'}</td>
                    <td className="py-3.5 px-4 font-medium text-surface-800">{contact.accounts?.name || '-'}</td>
                    <td className="py-3.5 px-4 text-surface-600">{contact.is_decision_maker ? 'Yes' : 'No'}</td>
                    <td className="py-3.5 px-4 text-surface-600">{contact.profiles?.full_name || user?.fullName || 'Unassigned'}</td>
                    <td className="py-3.5 px-4 text-right" onClick={(event) => event.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button type="button" onClick={() => { setEditingContact(contact); setIsEditOpen(true); }} className="p-1.5 rounded-lg text-surface-400 hover:text-surface-700 hover:bg-surface-100" title="Edit contact">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => void handleDelete(contact)} className="p-1.5 rounded-lg text-surface-400 hover:text-red-600 hover:bg-red-50" title="Delete contact">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => openDetails(contact)} className="p-1.5 rounded-lg text-surface-400 hover:text-surface-700 hover:bg-surface-100" title="View contact">
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

      <RecordDrawer
        isOpen={!!detailContact}
        onClose={() => setDetailContact(null)}
        label="Contact"
        title={detailContact ? `${detailContact.first_name} ${detailContact.last_name}` : ''}
        subtitle={detailContact ? [detailContact.title, detailContact.accounts?.name].filter(Boolean).join(' · ') : ''}
        ownerName={detailContact?.profiles?.full_name || user?.fullName || 'Workspace Owner'}
        tabs={[
          { id: 'activity', label: 'Activity Timeline (0)' },
          { id: 'details', label: 'Details & Custom Fields' },
        ]}
        activeTab={detailTab}
        onTabChange={setDetailTab}
        onEdit={() => {
          if (detailContact) {
            setEditingContact(detailContact);
            setIsEditOpen(true);
          }
        }}
      >
        {detailTab === 'activity' ? (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl border border-surface-200 bg-surface-50/50">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-1.5">
                {['Task', 'Call', 'Email', 'Note'].map((type) => (
                  <button key={type} type="button" className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${type === 'Task' ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-surface-600 border-surface-200'}`}>
                    {type}
                  </button>
                ))}
              </div>
              <input className="mt-3 h-10 w-full px-3 rounded-lg border border-surface-200 bg-white text-xs" placeholder={`Log a task subject for ${detailContact?.first_name ?? 'this contact'}...`} />
              <textarea className="mt-2 w-full px-3 py-2 rounded-lg border border-surface-200 bg-white text-xs resize-none" rows={2} placeholder="Optional notes, call summary, or next action..." />
              <div className="mt-2 flex justify-end">
                <button type="button" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-semibold">
                  <Send className="w-3.5 h-3.5" /> Save Task
                </button>
              </div>
            </div>
          </div>
        ) : (
          detailContact && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {[
                ['First Name', detailContact.first_name],
                ['Last Name', detailContact.last_name],
                ['Email', detailContact.email],
                ['Phone', detailContact.phone || '-'],
                ['Role / Title', detailContact.title || '-'],
                ['Account', detailContact.accounts?.name || '-'],
              ].map(([label, value]) => (
                <div key={label} className="p-3 rounded-xl bg-surface-50 border border-surface-200/80">
                  <div className="text-[11px] font-semibold text-surface-500">{label}</div>
                  <div className="text-sm font-semibold text-surface-900 mt-1 break-words">{value}</div>
                </div>
              ))}
              <div className="p-3 rounded-xl bg-surface-50 border border-surface-200/80 sm:col-span-2">
                <div className="text-[11px] font-semibold text-surface-500">Economic Buyer</div>
                <span className="inline-flex mt-1 px-2 py-0.5 rounded text-xs font-medium bg-brand-50 text-brand-700 border border-brand-100">
                  {detailContact.is_decision_maker ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          )
        )}
      </RecordDrawer>

      <ContactModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        contact={editingContact}
        onSuccess={async () => {
          await fetchContacts();
          if (editingContact) {
            setDetailContact(await contactService.getContactById(editingContact.id));
          }
        }}
      />
    </div>
  );
};
