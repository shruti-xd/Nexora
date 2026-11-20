import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { platformService } from '../services/platformService';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Alert } from '../components/ui/alert';
import {
  Building2,
  UserPlus,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Mail,
  Lock,
} from 'lucide-react';

// =============================================================================
// Platform Create Organization Page
// Dedicated page for Platform Administrators to provision organizations & initial admins
// =============================================================================

const createOrgFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Organization name must be at least 2 characters')
    .max(100, 'Organization name cannot exceed 100 characters'),
  slug: z
    .string()
    .trim()
    .min(2, 'Slug must be at least 2 characters')
    .max(100, 'Slug cannot exceed 100 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must consist only of lowercase letters, numbers, and hyphens')
    .optional()
    .or(z.literal('')),
  adminFullName: z
    .string()
    .trim()
    .min(2, 'Administrator full name must be at least 2 characters')
    .max(100, 'Administrator full name cannot exceed 100 characters'),
  adminEmail: z
    .string()
    .trim()
    .toLowerCase()
    .email('Please enter a valid work email address'),
  status: z.enum(['ACTIVE', 'SUSPENDED']).default('ACTIVE'),
});

type CreateOrgFormValues = z.infer<typeof createOrgFormSchema>;

export const PlatformCreateOrgPage: React.FC = () => {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<any | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateOrgFormValues>({
    resolver: zodResolver(createOrgFormSchema),
    defaultValues: {
      name: '',
      slug: '',
      adminFullName: '',
      adminEmail: '',
      status: 'ACTIVE',
    },
  });

  const orgName = watch('name');

  // Step 1: Auto-generate slug from name if slug hasn't been manually set
  const handleAutoGenerateSlug = () => {
    if (orgName) {
      const generated = orgName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      console.log(`[PlatformCreateOrgPage] Auto-generating slug: "${generated}" from name: "${orgName}"`);
      setValue('slug', generated, { shouldValidate: true });
    }
  };

  // Step 2: Handle form submission to provision organization & invite admin
  const onSubmit = async (values: CreateOrgFormValues) => {
    try {
      setErrorMessage(null);
      console.log(
        `[PlatformCreateOrgPage] Step 2: Submitting organization provisioning request for: "${values.name}"`
      );

      const payload = {
        name: values.name.trim(),
        slug: values.slug ? values.slug.trim().toLowerCase() : undefined,
        adminFullName: values.adminFullName.trim(),
        adminEmail: values.adminEmail.trim().toLowerCase(),
        status: values.status,
      };

      const result = await platformService.createOrganization(payload);
      console.log('[PlatformCreateOrgPage] Step 2 completed: Provisioning response received:', result);

      setSuccessResult(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create organization.';
      console.error('[PlatformCreateOrgPage] Provisioning failed:', msg);
      setErrorMessage(msg);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-surface-500">
        <Link
          to="/platform-admin/organizations"
          className="hover:text-surface-800 flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Organizations</span>
        </Link>
        <span>/</span>
        <span className="text-surface-800 font-medium">New Organization</span>
      </div>

      {/* Header */}
      <div className="border-b border-surface-200 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
            <ShieldCheck className="w-3 h-3" />
            Provisioning Wizard
          </span>
        </div>
        <h1 className="text-2xl font-bold text-surface-900 tracking-tight">
          Create New Organization
        </h1>
        <p className="text-xs text-surface-500 mt-1">
          Provision a dedicated multi-tenant CRM workspace, assign its initial Organization Administrator, and configure access governance.
        </p>
      </div>

      {/* Success Notification Card */}
      {successResult && (
        <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-emerald-900">
                Organization Provisioned Successfully!
              </h3>
              <p className="text-xs text-emerald-700 mt-0.5">
                The tenant workspace has been created and an invitation email was dispatched to the initial Organization Administrator.
              </p>
            </div>
          </div>

          <div className="p-3 bg-white/80 rounded-lg border border-emerald-200 text-xs text-surface-800 space-y-1">
            <p><strong>Organization Name:</strong> {successResult.name || successResult.organization?.name}</p>
            <p><strong>URL Slug:</strong> /{successResult.slug || successResult.organization?.slug}</p>
            <p><strong>Initial Admin:</strong> {successResult.admin?.email || successResult.adminEmail}</p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              size="sm"
              onClick={() =>
                navigate(`/platform-admin/organizations/${successResult.id || successResult.organization?.id}`)
              }
              className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              View Organization Details
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/platform-admin/organizations')}
              className="text-xs"
            >
              Return to Listing
            </Button>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <Alert variant="error" title="Provisioning Error">
          {errorMessage}
        </Alert>
      )}

      {/* Step 3: Provisioning Form */}
      {!successResult && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Card 1: Organization Details */}
          <div className="bg-white p-6 border border-surface-200 rounded-xl shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-surface-100">
              <Building2 className="w-4 h-4 text-purple-600" />
              <h2 className="text-sm font-bold text-surface-900">Organization Information</h2>
            </div>

            <div className="space-y-4">
              <div>
                <Input
                  label="Organization Name *"
                  placeholder="e.g. Acme Corporation"
                  error={errors.name?.message}
                  {...register('name')}
                />
                <p className="text-[11px] text-surface-400 mt-1">
                  The primary legal or business title for this customer's workspace.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-surface-700">
                    Organization Slug (Optional)
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoGenerateSlug}
                    className="text-[11px] text-purple-600 hover:text-purple-800 font-medium"
                  >
                    Auto-generate from name
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-surface-400 font-mono">
                    nexora.io/
                  </span>
                  <input
                    type="text"
                    placeholder="acme-corporation"
                    className="w-full pl-22 pr-3 py-2 bg-white border border-surface-300 rounded-lg text-xs font-mono text-surface-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    {...register('slug')}
                  />
                </div>
                {errors.slug?.message && (
                  <p className="text-[11px] text-red-600 mt-1">{errors.slug.message}</p>
                )}
                <p className="text-[11px] text-surface-400 mt-1">
                  Used for tenant identification and URL routing. Must be alphanumeric with hyphens.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-surface-700 mb-1">
                  Initial Workspace Status
                </label>
                <select
                  {...register('status')}
                  className="w-full px-3 py-2 bg-white border border-surface-300 rounded-lg text-xs text-surface-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="ACTIVE">ACTIVE (Workspace immediately usable)</option>
                  <option value="SUSPENDED">SUSPENDED (Workspace disabled until reviewed)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Card 2: Initial Organization Administrator */}
          <div className="bg-white p-6 border border-surface-200 rounded-xl shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-surface-100">
              <UserPlus className="w-4 h-4 text-purple-600" />
              <h2 className="text-sm font-bold text-surface-900">Initial Administrator</h2>
            </div>

            <div className="p-3 bg-purple-50/60 border border-purple-100 rounded-lg text-xs text-purple-800 flex items-start gap-2.5">
              <Mail className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Automated Invitation Workflow</p>
                <p className="text-[11px] text-purple-700 mt-0.5">
                  An email invitation will be dispatched to this administrator to set their password. They will be granted full ADMIN permissions inside this organization.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <Input
                label="Full Name *"
                placeholder="e.g. Alex Morgan"
                error={errors.adminFullName?.message}
                {...register('adminFullName')}
              />

              <Input
                label="Work Email Address *"
                type="email"
                placeholder="e.g. alex.morgan@acme.com"
                error={errors.adminEmail?.message}
                {...register('adminEmail')}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/platform-admin/organizations')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <UserPlus className="w-4 h-4 mr-1.5" />
              Create Organization & Invite Admin
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
