import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { platformService } from '../../services/platformService';
import { Modal } from '../../components/ui/modal';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Alert } from '../../components/ui/alert';
import { Building2 } from 'lucide-react';

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
    },
  });

  // Step 1: Submit new organization payload
  const onSubmit = async (values: CreateOrgFormValues) => {
    try {
      setErrorMessage(null);
      console.log(
        `[CreateOrganizationModal] Step 1: Platform Admin provisioning organization "${values.name}" with admin ${values.adminEmail}`
      );

      // Step 2: Call backend platform API
      await platformService.createOrganization({
        name: values.name.trim(),
        slug: values.slug ? values.slug.trim().toLowerCase() : undefined,
        adminFullName: values.adminFullName.trim(),
        adminEmail: values.adminEmail.trim().toLowerCase(),
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
      title="Create New Organization"
      description="Provision a new tenant organization and assign its initial Organization Administrator."
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errorMessage && (
          <Alert variant="error" title="Provisioning Error">
            {errorMessage}
          </Alert>
        )}

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
            label="Custom URL Slug (Optional)"
            placeholder="e.g. acme-corp"
            error={errors.slug?.message}
            {...register('slug')}
          />
        </div>

        <div className="pt-2 border-t border-surface-100 space-y-3">
          <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wider">
            Initial Organization Administrator
          </h4>

          <Input
            label="Admin Full Name"
            placeholder="e.g. Alex Morgan"
            error={errors.adminFullName?.message}
            {...register('adminFullName')}
          />

          <Input
            label="Admin Work Email"
            type="email"
            placeholder="e.g. alex.morgan@acme.com"
            error={errors.adminEmail?.message}
            {...register('adminEmail')}
          />
        </div>

        <div className="pt-3 flex items-center justify-end gap-3 border-t border-surface-100">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            <Building2 className="w-4 h-4 mr-1.5" />
            Provision Organization
          </Button>
        </div>
      </form>
    </Modal>
  );
};
