import { z } from 'zod';

// =============================================================================
// User Module Validators
// Zod schemas for user queries, role assignment, and status modification
// =============================================================================

export const getUsersQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1)),
  limit: z.string().optional().transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 10)),
  search: z.string().optional(),
});

export const userIdParamSchema = z.object({
  id: z.string().uuid('Invalid user UUID format'),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(['ADMIN', 'MANAGER', 'SALES_REP', 'VIEWER'], {
    errorMap: () => ({ message: 'Role must be one of: ADMIN, MANAGER, SALES_REP, VIEWER' }),
  }),
});

export const updateUserStatusSchema = z.object({
  isActive: z.boolean({ required_error: 'isActive status boolean is required' }),
});
