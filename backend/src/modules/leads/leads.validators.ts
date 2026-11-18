import { z } from 'zod';

// =============================================================================
// Lead Module Validators
// Zod schemas for query parameters, creation, update, and conversion
// =============================================================================

export const leadQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1)),
  limit: z.string().optional().transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 10)),
  search: z.string().optional(),
  status: z.enum(['All', 'New', 'Contacted', 'Qualified', 'Unqualified', 'Converted']).optional(),
  ownerId: z.string().uuid().optional(),
});

export const leadIdParamSchema = z.object({
  id: z.string().uuid('Invalid lead UUID format'),
});

export const createLeadSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Valid email is required'),
  phone: z.string().max(50).optional().nullable(),
  company: z.string().min(1, 'Company is required').max(255),
  title: z.string().max(150).optional().nullable(),
  status: z.enum(['New', 'Contacted', 'Qualified', 'Unqualified', 'Converted']).default('New'),
  source: z.enum(['Direct', 'Inbound', 'Referral', 'Website', 'Event', 'Outbound']).default('Direct'),
  estimatedValue: z.number().min(0).default(0),
  leadScore: z.number().min(0).max(100).default(0),
  customFields: z.record(z.unknown()).optional().default({}),
  ownerId: z.string().uuid().optional().nullable(),
});

export const updateLeadSchema = createLeadSchema.partial();

export const convertLeadSchema = z.object({
  existingAccountId: z.string().uuid().optional().nullable(),
  createOpportunity: z.boolean().default(true),
  oppName: z.string().max(255).optional(),
  oppAmount: z.number().min(0).optional(),
});

export const createActivitySchema = z.object({
  type: z.enum(['Task', 'Call', 'Meeting', 'Email', 'Note']),
  subject: z.string().min(1, 'Subject is required').max(255),
  description: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  completed: z.boolean().default(false),
});
