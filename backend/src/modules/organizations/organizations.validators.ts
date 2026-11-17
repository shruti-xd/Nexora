import { z } from 'zod';

// =============================================================================
// Organization Module Validators
// Zod schemas for organization settings updates
// =============================================================================

export const updateOrganizationSchema = z.object({
  name: z
    .string({ required_error: 'Organization name is required' })
    .trim()
    .min(2, 'Organization name must be at least 2 characters')
    .max(100, 'Organization name cannot exceed 100 characters'),
});
