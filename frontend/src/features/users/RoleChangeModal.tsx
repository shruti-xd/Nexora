import React, { useState } from 'react';
import { Modal } from '../../components/ui/modal';
import { Button } from '../../components/ui/button';
import { Select } from '../../components/ui/select';
import { Alert } from '../../components/ui/alert';
import { usersService } from '../../services/usersService';
import { OrganizationMember, RoleName } from '../../types';

// =============================================================================
// Role Change Modal Component
// Allows organization Admins to update user roles with safety checks
// =============================================================================

export interface RoleChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: OrganizationMember | null;
  currentUserId?: string;
  onSuccess: () => void;
}

export const RoleChangeModal: React.FC<RoleChangeModalProps> = ({
  isOpen,
  onClose,
  member,
  currentUserId,
  onSuccess,
}) => {
  const [selectedRole, setSelectedRole] = useState<RoleName>(member?.role || 'VIEWER');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync selected role when member changes
  React.useEffect(() => {
    if (member) {
      setSelectedRole(member.role);
      setErrorMessage(null);
    }
  }, [member]);

  if (!member) return null;

  const isSelf = member.userId === currentUserId;

  const roleOptions: Array<{ value: RoleName; label: string }> = [
    { value: 'ADMIN', label: 'Admin (Full access to all CRM resources & settings)' },
    { value: 'MANAGER', label: 'Manager (Team management & CRM record oversight)' },
    { value: 'SALES_REP', label: 'Sales Rep (Manage assigned leads, accounts & deals)' },
    { value: 'VIEWER', label: 'Viewer (Read-only access across CRM records)' },
  ];

  // Step 1: Submit role change request to backend
  const handleUpdate = async () => {
    if (isSelf) {
      setErrorMessage('You cannot modify your own role.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);
      console.log(`[RoleChangeModal] Step 1: Updating role for ${member.fullName} (${member.userId}) to ${selectedRole}`);

      await usersService.updateRole(member.userId, selectedRole);

      console.log('[RoleChangeModal] Role updated successfully.');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update user role.';
      console.error('[RoleChangeModal] Error updating role:', msg);
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Change Member Role"
      description={`Update access privileges for ${member.fullName}`}
    >
      <div className="space-y-4">
        {errorMessage && (
          <Alert variant="error" title="Action Denied">
            {errorMessage}
          </Alert>
        )}

        {isSelf && (
          <Alert variant="warning" title="Self-Modification Restricted">
            You cannot alter your own administrative role. Another administrator must make this change.
          </Alert>
        )}

        <div className="bg-surface-50 p-3 rounded-lg border border-surface-200 text-xs space-y-1">
          <p className="font-semibold text-surface-900">{member.fullName}</p>
          <p className="text-surface-500">{member.email}</p>
          <p className="text-surface-600">Current Role: <span className="font-mono font-medium">{member.role}</span></p>
        </div>

        <Select
          label="Select New Role"
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value as RoleName)}
          options={roleOptions}
          disabled={isSelf || isLoading}
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-surface-100">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleUpdate}
            isLoading={isLoading}
            disabled={isSelf || selectedRole === member.role}
          >
            Save Role
          </Button>
        </div>
      </div>
    </Modal>
  );
};
