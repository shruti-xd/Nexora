import React from 'react';
import { Modal } from '../../components/ui/modal';
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
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={account ? 'Edit Account' : 'Create Account'}
    description={account ? `Update ${account.name}` : 'Add a new company account'}
  >
    <AccountForm
      account={account}
      onCancel={onClose}
      onSuccess={() => {
        onSuccess();
        onClose();
      }}
    />
  </Modal>
);
