import { z } from 'zod';

// =============================================================================
// Accounts Request Validation Schemas
// =============================================================================

export const accountTypeSchema = z.enum([
  'PROSPECT',
  'CUSTOMER',
  'PARTNER',
  'RESELLER',
  'OTHER',
]);

export const createAccountSchema = z.object({
  name: z.string().trim().min(1, 'Account name is required').max(255),
  accountType: accountTypeSchema.default('PROSPECT'),
  industry: z.string().trim().max(100).optional().nullable(),
  website: z.string().trim().max(255).optional().nullable(),
  phone: z.string().trim().max(50).optional().nullable(),
  email: z.string().trim().email('Invalid email address').optional().nullable().or(z.literal('')),
  annualRevenue: z.number().nonnegative().optional().nullable(),
  employeeCount: z.number().int().nonnegative().optional().nullable(),
  description: z.string().trim().optional().nullable(),
  // Billing Address
  billingStreet: z.string().trim().max(255).optional().nullable(),
  billingCity: z.string().trim().max(100).optional().nullable(),
  billingState: z.string().trim().max(100).optional().nullable(),
  billingCountry: z.string().trim().max(100).optional().nullable(),
  billingPostalCode: z.string().trim().max(20).optional().nullable(),
  // Shipping Address
  shippingStreet: z.string().trim().max(255).optional().nullable(),
  shippingCity: z.string().trim().max(100).optional().nullable(),
  shippingState: z.string().trim().max(100).optional().nullable(),
  shippingCountry: z.string().trim().max(100).optional().nullable(),
  shippingPostalCode: z.string().trim().max(20).optional().nullable(),
  ownerUserId: z.string().uuid().optional(),
});

export const updateAccountSchema = createAccountSchema.partial();

export const accountQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  accountType: accountTypeSchema.optional(),
  industry: z.string().trim().optional(),
  ownerId: z.string().uuid().optional(),
  sortBy: z.enum(['created_at', 'name', 'annual_revenue']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
