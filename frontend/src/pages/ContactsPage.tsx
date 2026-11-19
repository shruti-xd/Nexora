import React from 'react';
import { Plus } from 'lucide-react';
import { ContactList } from '../features/contacts/ContactList';
import { ContactModal } from '../features/contacts/ContactModal';
import { Button } from '../components/ui/button';

export const ContactsPage: React.FC = () => {
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-surface-900">Contacts</h1>
          <p className="text-sm text-surface-500 mt-1">
            Click any contact to view stakeholder details and log calls, emails, or tasks.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="self-start sm:self-auto">
          <Plus className="h-4 w-4" /> New Contact
        </Button>
      </div>
      <ContactList refreshKey={refreshKey} />
      <ContactModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => setRefreshKey((key) => key + 1)}
      />
    </div>
  );
};
