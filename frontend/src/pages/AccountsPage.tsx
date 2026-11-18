import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../components/ui/button';
import { AccountList } from '../features/accounts/AccountList';
import { AccountModal } from '../features/accounts/AccountModal';

export const AccountsPage: React.FC = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-surface-900 tracking-tight">Accounts</h2>
          <p className="text-sm text-surface-500 mt-1">Manage customer and prospect companies.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4" />
          Create Account
        </Button>
      </div>

      <AccountList refreshKey={refreshKey} />

      <AccountModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => setRefreshKey((key) => key + 1)}
      />
    </div>
  );
};
