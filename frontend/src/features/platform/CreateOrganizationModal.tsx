import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { platformService } from '../../services/platformService';
import { Modal } from '../../components/ui/modal';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Alert } from '../../components/ui/alert';
import { Building2, UserPlus } from 'lucide-react';

// =============================================================================
// Create Organization Modal
// Platform Administrator dialog to provision a new CRM tenant workspace & assign admin
// =============================================================================

const createOrgSchema = z.object({
  name: z.string().trim().min(2, 'Organization name must be at least 2 characters'),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/, 'Slug must consist of lowercase letters, numbers, and hyphens')
    .optional()
    .or(z.literal('')),
  adminFullName: z.string().trim().min(2, 'Admin full name must be at least 2 characters'),
  adminEmail: z.string().trim().toLowerCase().email('Please enter a valid work email address'),
  status: z.enum(['ACTIVE', 'SUSPENDED']).default('ACTIVE'),
});

type CreateOrgFormValues = z.infer<typeof createOrgSchema>;

export interface CreateOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateOrganizationModal: React.FC<CreateOrganizationModalProps> = ({
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
  } = useForm<CreateOrgFormValues>({
    resolver: zodResolver(createOrgSchema),
    defaultValues: {
      name: '',
      slug: '',
      adminFullName: '',
      adminEmail: '',
      status: 'ACTIVE',
    },
  });

  // Step 1: Submit new organization payload
  const onSubmit = async (values: CreateOrgFormValues) => {
    try {
      setErrorMessage(null);
      console.log(
        `[CreateOrganizationModal] Step 1: Platform Admin provisioning organization "${values.name}" with admin ${values.adminEmail} (status=${values.status})`
      );

      // Step 2: Call backend platform API
      await platformService.createOrganization({
        name: values.name.trim(),
        slug: values.slug ? values.slug.trim().toLowerCase() : undefined,
        adminFullName: values.adminFullName.trim(),
        adminEmail: values.adminEmail.trim().toLowerCase(),
        status: values.status,
      });

      console.log('[CreateOrganizationModal] Step 2: Organization created successfully.');
      reset();
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to provision organization.';
      console.error('[CreateOrganizationModal] Error creating organization:', msg);
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
      title="Create Organization"
      description="Provision a new tenant organization and invite its initial Organization Administrator."
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errorMessage && (
          <Alert variant="error" title="Provisioning Error">
            {errorMessage}
          </Alert>
        )}

        {/* Step 3: Organization Details */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wider">
            Organization Details
          </h4>

          <Input
            label="Organization Name"
            placeholder="e.g. Acme Corporation"
            error={errors.name?.message}
            {...register('name')}
          />

          <Input
            label="Organization Slug (Optional)"
            placeholder="e.g. acme-corp"
            error={errors.slug?.message}
            {...register('slug')}
          />

          <div>
            <label className="block text-xs font-medium text-surface-700 mb-1">
              Organization Status
            </label>
            <select
              {...register('status')}
              className="w-full px-3 py-2 bg-white border border-surface-300 rounded-lg text-xs text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="ACTIVE">ACTIVE (Default)</option>
              <option value="SUSPENDED">SUSPENDED</option>
            </select>
          </div>
        </div>

        {/* Step 4: Initial Organization Administrator */}
        <div className="pt-2 border-t border-surface-100 space-y-3">
          <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wider">
            Initial Administrator
          </h4>

          <Input
            label="Full Name"
            placeholder="e.g. Alex Morgan"
            error={errors.adminFullName?.message}
            {...register('adminFullName')}
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="e.g. alex.morgan@acme.com"
            error={errors.adminEmail?.message}
            {...register('adminEmail')}
          />
        </div>

        {/* Step 5: Form Action Buttons */}
        <div className="pt-3 flex items-center justify-end gap-3 border-t border-surface-100">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            <UserPlus className="w-4 h-4 mr-1.5" />
            Create Organization & Invite Admin
          </Button>
        </div>
      </form>
    </Modal>
  );
};
