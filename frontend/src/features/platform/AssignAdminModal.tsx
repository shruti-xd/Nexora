import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { platformService } from '../../services/platformService';
import { PlatformOrganization } from '../../types';
import { Modal } from '../../components/ui/modal';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Alert } from '../../components/ui/alert';
import { UserCheck } from 'lucide-react';

// =============================================================================
// Assign Organization Admin Modal
// Allows Platform Admin to assign or invite an Organization Admin for an organization
// =============================================================================

const assignAdminSchema = z.object({
  adminFullName: z.string().trim().min(2, 'Admin full name must be at least 2 characters'),
  adminEmail: z.string().trim().toLowerCase().email('Please enter a valid work email address'),
});

type AssignAdminFormValues = z.infer<typeof assignAdminSchema>;

export interface AssignAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  org: PlatformOrganization | null;
  onSuccess: () => void;
}

export const AssignAdminModal: React.FC<AssignAdminModalProps> = ({
  isOpen,
  onClose,
  org,
  onSuccess,
}) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AssignAdminFormValues>({
    resolver: zodResolver(assignAdminSchema),
    defaultValues: {
      adminFullName: '',
      adminEmail: '',
    },
  });

  if (!org) return null;

  // Step 1: Submit new admin assignment
  const onSubmit = async (values: AssignAdminFormValues) => {
    try {
      setErrorMessage(null);
      console.log(
        `[AssignAdminModal] Step 1: Assigning admin ${values.adminEmail} to organization "${org.name}" (${org.id})`
      );

      // Step 2: Call backend platform API
      await platformService.assignAdmin(org.id, {
        adminEmail: values.adminEmail.trim().toLowerCase(),
        adminFullName: values.adminFullName.trim(),
      });

      console.log('[AssignAdminModal] Step 2: Admin assigned successfully.');
      reset();
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to assign administrator.';
      console.error('[AssignAdminModal] Admin assignment error:', msg);
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
      title="Assign Organization Administrator"
      description={`Designate or invite a primary administrator for ${org.name}.`}
      className="max-w-md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errorMessage && (
          <Alert variant="error" title="Assignment Error">
            {errorMessage}
          </Alert>
        )}

        <Input
          label="Administrator Full Name"
          placeholder="e.g. Elena Rostova"
          error={errors.adminFullName?.message}
          {...register('adminFullName')}
        />

        <Input
          label="Administrator Work Email"
          type="email"
          placeholder="e.g. elena@company.com"
          error={errors.adminEmail?.message}
          {...register('adminEmail')}
        />

        <div className="pt-2 flex items-center justify-end gap-3 border-t border-surface-100">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            <UserCheck className="w-4 h-4 mr-1.5" />
            Assign Admin
          </Button>
        </div>
      </form>
    </Modal>
  );
};
