import { z } from 'zod';

// =============================================================================
// Contacts Request Validation Schemas
// =============================================================================

export const createContactSchema = z.object({
  accountId: z.string().uuid().optional().nullable(),
  firstName: z.string().trim().max(100).optional().nullable(),
  lastName: z.string().trim().min(1, 'Last name is required').max(100),
  title: z.string().trim().max(100).optional().nullable(),
  department: z.string().trim().max(100).optional().nullable(),
  email: z.string().trim().email('Invalid email address').optional().nullable().or(z.literal('')),
  phone: z.string().trim().max(50).optional().nullable(),
  mobile: z.string().trim().max(50).optional().nullable(),
  description: z.string().trim().optional().nullable(),
  // Mailing Address
  mailingStreet: z.string().trim().max(255).optional().nullable(),
  mailingCity: z.string().trim().max(100).optional().nullable(),
  mailingState: z.string().trim().max(100).optional().nullable(),
  mailingCountry: z.string().trim().max(100).optional().nullable(),
  mailingPostalCode: z.string().trim().max(20).optional().nullable(),
  // Other Address
  otherStreet: z.string().trim().max(255).optional().nullable(),
  otherCity: z.string().trim().max(100).optional().nullable(),
  otherState: z.string().trim().max(100).optional().nullable(),
  otherCountry: z.string().trim().max(100).optional().nullable(),
  otherPostalCode: z.string().trim().max(20).optional().nullable(),
  ownerUserId: z.string().uuid().optional(),
});

export const updateContactSchema = createContactSchema.partial();

export const contactQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  accountId: z.string().uuid().optional(),
  ownerId: z.string().uuid().optional(),
  sortBy: z.enum(['created_at', 'last_name', 'first_name']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
