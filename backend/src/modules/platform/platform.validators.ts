import { z } from 'zod';

// =============================================================================
// Platform Module Validators
// Zod schemas for organization creation, updates, status toggles, and admin assignment
// =============================================================================

export const createOrganizationSchema = z.object({
  name: z
    .string({ required_error: 'Organization name is required' })
    .trim()
    .min(2, 'Organization name must be at least 2 characters')
    .max(100, 'Organization name cannot exceed 100 characters'),
  slug: z
    .string()
    .trim()
    .min(2, 'Slug must be at least 2 characters')
    .max(100, 'Slug cannot exceed 100 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must only contain lowercase letters, numbers, and hyphens')
    .optional(),
  adminFullName: z
    .string({ required_error: 'Organization Admin full name is required' })
    .trim()
    .min(2, 'Admin full name must be at least 2 characters')
    .max(100, 'Admin full name cannot exceed 100 characters'),
  adminEmail: z
    .string({ required_error: 'Organization Admin email is required' })
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address'),
});

export const updatePlatformOrganizationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Organization name must be at least 2 characters')
    .max(100, 'Organization name cannot exceed 100 characters')
    .optional(),
  slug: z
    .string()
    .trim()
    .min(2, 'Slug must be at least 2 characters')
    .max(100, 'Slug cannot exceed 100 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must only contain lowercase letters, numbers, and hyphens')
    .optional(),
});

export const updatePlatformOrganizationStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED'], {
    errorMap: () => ({ message: 'Status must be either ACTIVE or SUSPENDED' }),
  }),
});

export const assignOrganizationAdminSchema = z.object({
  adminFullName: z
    .string({ required_error: 'Admin full name is required' })
    .trim()
    .min(2, 'Admin full name must be at least 2 characters')
    .max(100, 'Admin full name cannot exceed 100 characters'),
  adminEmail: z
    .string({ required_error: 'Admin email is required' })
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address'),
});

export const platformOrgQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1)),
  limit: z.string().optional().transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 10)),
  search: z.string().optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED']).optional(),
});
