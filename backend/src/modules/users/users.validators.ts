import { z } from 'zod';

// =============================================================================
// User Module Validators
// Zod schemas for user queries, role assignment, status modification, and invitations
// =============================================================================

export const getUsersQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1)),
  limit: z.string().optional().transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 10)),
  search: z.string().optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'SALES_REP', 'VIEWER']).optional(),
  status: z.enum(['active', 'deactivated', 'pending']).optional(),
});

export const userIdParamSchema = z.object({
  id: z.string().uuid('Invalid user UUID format'),
});

export const inviteUserSchema = z.object({
  fullName: z
    .string({ required_error: 'Full name is required' })
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name cannot exceed 100 characters'),
  email: z
    .string({ required_error: 'Email address is required' })
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address'),
  role: z.enum(['ADMIN', 'MANAGER', 'SALES_REP', 'VIEWER'], {
    errorMap: () => ({ message: 'Role must be one of: ADMIN, MANAGER, SALES_REP, VIEWER' }),
  }),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(['ADMIN', 'MANAGER', 'SALES_REP', 'VIEWER'], {
    errorMap: () => ({ message: 'Role must be one of: ADMIN, MANAGER, SALES_REP, VIEWER' }),
  }),
});

export const updateUserStatusSchema = z.object({
  isActive: z.boolean({ required_error: 'isActive status boolean is required' }),
});
