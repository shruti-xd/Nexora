import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { platformService } from '../../services/platformService';
import { PlatformOrganization } from '../../types';
import { Modal } from '../../components/ui/modal';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Alert } from '../../components/ui/alert';
import { Edit3 } from 'lucide-react';

// =============================================================================
// Edit Organization Modal
// Dialog for Platform Administrators to update organization name and slug
// =============================================================================

const editOrgSchema = z.object({
  name: z.string().trim().min(2, 'Organization name must be at least 2 characters'),
  slug: z
    .string()
    .trim()
    .min(2, 'Slug must be at least 2 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must consist of lowercase letters, numbers, and hyphens'),
});

type EditOrgFormValues = z.infer<typeof editOrgSchema>;

export interface EditOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  org: PlatformOrganization | null;
  onSuccess: () => void;
}

export const EditOrganizationModal: React.FC<EditOrganizationModalProps> = ({
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
  } = useForm<EditOrgFormValues>({
    resolver: zodResolver(editOrgSchema),
    defaultValues: {
      name: org?.name || '',
      slug: org?.slug || '',
    },
  });

  useEffect(() => {
    if (org) {
      reset({
        name: org.name,
        slug: org.slug,
      });
    }
  }, [org, reset]);

  if (!org) return null;

  // Step 1: Submit organization metadata update
  const onSubmit = async (values: EditOrgFormValues) => {
    try {
      setErrorMessage(null);
      console.log(
        `[EditOrganizationModal] Step 1: Updating org ${org.id} (Name: "${values.name}", Slug: "${values.slug}")`
      );

      // Step 2: Call backend platform API (PATCH /api/v1/platform/organizations/:id)
      await platformService.updateOrganization(org.id, {
        name: values.name.trim(),
        slug: values.slug.trim().toLowerCase(),
      });

      console.log('[EditOrganizationModal] Step 2: Organization metadata updated successfully.');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update organization.';
      console.error('[EditOrganizationModal] Update error:', msg);
      setErrorMessage(msg);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Organization Details"
      description={`Update workspace title and custom URL slug for ${org.name}.`}
      className="max-w-md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errorMessage && (
          <Alert variant="error" title="Update Failed">
            {errorMessage}
          </Alert>
        )}

        <Input
          label="Organization Name *"
          placeholder="e.g. Acme Corporation"
          error={errors.name?.message}
          {...register('name')}
        />

        <div>
          <label className="block text-xs font-medium text-surface-700 mb-1">
            Organization Slug *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-xs text-surface-400 font-mono">
              /
            </span>
            <input
              type="text"
              className="w-full pl-6 pr-3 py-2 bg-white border border-surface-300 rounded-lg text-xs font-mono text-surface-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              {...register('slug')}
            />
          </div>
          {errors.slug?.message && (
            <p className="text-[11px] text-red-600 mt-1">{errors.slug.message}</p>
          )}
        </div>

        <div className="pt-3 flex items-center justify-end gap-3 border-t border-surface-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            <Edit3 className="w-4 h-4 mr-1.5" />
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};
