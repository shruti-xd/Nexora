import React, { useState } from 'react';
import { Modal } from '../../components/ui/modal';
import { Button } from '../../components/ui/button';
import { Alert } from '../../components/ui/alert';
import { usersService } from '../../services/usersService';
import { OrganizationMember } from '../../types';

// =============================================================================
// Status Change Modal Component
// Manages team member activation and deactivation with safeguards
// =============================================================================

export interface StatusChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: OrganizationMember | null;
  currentUserId?: string;
  onSuccess: () => void;
}

export const StatusChangeModal: React.FC<StatusChangeModalProps> = ({
  isOpen,
  onClose,
  member,
  currentUserId,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  React.useEffect(() => {
    setErrorMessage(null);
  }, [member, isOpen]);

  if (!member) return null;

  const willActivate = !member.isMemberActive;
  const isSelf = member.userId === currentUserId;

  // Step 1: Submit status change request to backend
  const handleToggleStatus = async () => {
    if (isSelf && !willActivate) {
      setErrorMessage('You cannot deactivate your own account.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);
      console.log(`[StatusChangeModal] Step 1: Toggling status for ${member.fullName} (${member.userId}) to isActive=${willActivate}`);

      await usersService.updateStatus(member.userId, willActivate);

      console.log('[StatusChangeModal] Member status updated successfully.');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update member status.';
      console.error('[StatusChangeModal] Error toggling status:', msg);
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={willActivate ? 'Reactivate Team Member' : 'Deactivate Team Member'}
      description={`Confirm membership status change for ${member.fullName}`}
    >
      <div className="space-y-4">
        {errorMessage && (
          <Alert variant="error" title="Action Denied">
            {errorMessage}
          </Alert>
        )}

        {isSelf && !willActivate ? (
          <Alert variant="warning" title="Self-Deactivation Prohibited">
            You cannot deactivate your own account.
          </Alert>
        ) : willActivate ? (
          <p className="text-sm text-surface-600">
            Are you sure you want to reactivate <strong className="text-surface-900">{member.fullName}</strong>?
            They will regain immediate access to your workspace and permitted CRM records.
          </p>
        ) : (
          <p className="text-sm text-surface-600">
            Are you sure you want to deactivate <strong className="text-surface-900">{member.fullName}</strong>?
            They will be blocked from logging into the workspace until reactivated by an Administrator.
          </p>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-surface-100">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant={willActivate ? 'primary' : 'danger'}
            onClick={handleToggleStatus}
            isLoading={isLoading}
            disabled={isSelf && !willActivate}
          >
            {willActivate ? 'Reactivate Member' : 'Deactivate Member'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
