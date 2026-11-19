import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usersService } from '../../services/usersService';
import { RoleName } from '../../types';
import { Modal } from '../../components/ui/modal';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Button } from '../../components/ui/button';
import { Alert } from '../../components/ui/alert';
import { UserPlus } from 'lucide-react';

// =============================================================================
// Invite User Modal Component
// Allows Organization Admins to invite new members to their CRM workspace
// =============================================================================

const inviteSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters'),
  email: z.string().trim().toLowerCase().email('Please enter a valid email address'),
  role: z.enum(['ADMIN', 'MANAGER', 'SALES_REP', 'VIEWER']),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

export interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const InviteUserModal: React.FC<InviteUserModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      fullName: '',
      email: '',
      role: 'SALES_REP',
    },
  });

  // Step 1: Submit invitation to backend
  const onSubmit = async (values: InviteFormValues) => {
    try {
      setErrorMessage(null);
      console.log(`[InviteUserModal] Step 1: Submitting invitation for ${values.email} as ${values.role}`);

      // Step 2: Dispatch API call
      await usersService.inviteUser({
        fullName: values.fullName.trim(),
        email: values.email.trim().toLowerCase(),
        role: values.role as RoleName,
      });

      console.log('[InviteUserModal] Step 2: Member successfully invited!');
      reset();
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send invitation. Please try again.';
      console.error('[InviteUserModal] Error inviting user:', msg);
      setErrorMessage(msg);
    }
  };

  const handleClose = () => {
    reset();
    setErrorMessage(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Invite Team Member"
      description="Send an invitation to grant a new user access to this organization workspace."
      className="max-w-md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errorMessage && (
          <Alert variant="error" title="Invitation Error">
            {errorMessage}
          </Alert>
        )}

        <Input
          label="Full Name"
          placeholder="e.g. Sarah Connor"
          error={errors.fullName?.message}
          {...register('fullName')}
        />

        <Input
          label="Work Email Address"
          type="email"
          placeholder="e.g. sarah@company.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <Select
          label="Assigned Role"
          error={errors.role?.message}
          options={[
            { value: 'SALES_REP', label: 'Sales Representative — Standard CRM user' },
            { value: 'MANAGER', label: 'Manager — Team supervisor with elevated view' },
            { value: 'VIEWER', label: 'Viewer — Read-only auditor' },
            { value: 'ADMIN', label: 'Administrator — Full organization control' },
          ]}
          {...register('role')}
        />

        <div className="pt-2 flex items-center justify-end gap-3 border-t border-surface-100">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            <UserPlus className="w-4 h-4 mr-1.5" />
            Send Invitation
          </Button>
        </div>
      </form>
    </Modal>
  );
};
