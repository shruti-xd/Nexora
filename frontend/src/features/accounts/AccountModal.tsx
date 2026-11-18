import React from 'react';
import { X } from 'lucide-react';
import { Account } from '../../types';
import { AccountForm } from './AccountForm';

export interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  account?: Account | null;
  onSuccess: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  account,
  onSuccess,
}) => (
  isOpen ? (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-surface-950/15" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-surface-200 overflow-hidden">
        <div className="h-14 px-5 flex items-center justify-between bg-surface-900 text-white">
          <h3 className="text-base font-bold">{account ? 'Edit Account' : 'Create Account'}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-surface-300 hover:text-white hover:bg-surface-800"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 max-h-[75vh] overflow-y-auto">
          <AccountForm
            account={account}
            onCancel={onClose}
            onSuccess={() => {
              onSuccess();
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  ) : null
);
