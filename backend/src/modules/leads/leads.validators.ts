import { z } from 'zod';

// =============================================================================
// Leads Request Validation Schemas
// =============================================================================

export const leadStatusSchema = z.enum([
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'UNQUALIFIED',
]);

export const leadRatingSchema = z.enum([
  'HOT',
  'WARM',
  'COLD',
]);

export const leadSourceSchema = z.enum([
  'WEBSITE',
  'REFERRAL',
  'SOCIAL_MEDIA',
  'EMAIL_CAMPAIGN',
  'ADVERTISEMENT',
  'COLD_CALL',
  'EVENT',
  'PARTNER',
  'OTHER',
]);

export const createLeadSchema = z.object({
  firstName: z.string().trim().max(100).optional().nullable(),
  lastName: z.string().trim().min(1, 'Last name is required').max(100),
  company: z.string().trim().min(1, 'Company is required').max(255),
  title: z.string().trim().max(100).optional().nullable(),
  email: z.string().trim().email('Invalid email address').optional().nullable().or(z.literal('')),
  phone: z.string().trim().max(50).optional().nullable(),
  mobile: z.string().trim().max(50).optional().nullable(),
  website: z.string().trim().max(255).optional().nullable(),
  industry: z.string().trim().max(100).optional().nullable(),
  source: leadSourceSchema.default('OTHER'),
  status: leadStatusSchema.default('NEW'),
  rating: leadRatingSchema.default('WARM'),
  annualRevenue: z.number().nonnegative().optional().nullable(),
  employeeCount: z.number().int().nonnegative().optional().nullable(),
  description: z.string().trim().optional().nullable(),
  street: z.string().trim().max(255).optional().nullable(),
  city: z.string().trim().max(100).optional().nullable(),
  state: z.string().trim().max(100).optional().nullable(),
  country: z.string().trim().max(100).optional().nullable(),
  postalCode: z.string().trim().max(20).optional().nullable(),
  ownerUserId: z.string().uuid().optional(),
});

export const updateLeadSchema = createLeadSchema.partial();

export const leadQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  status: leadStatusSchema.optional(),
  source: leadSourceSchema.optional(),
  rating: leadRatingSchema.optional(),
  ownerId: z.string().uuid().optional(),
  sortBy: z.enum(['created_at', 'last_name', 'company', 'status']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const convertLeadSchema = z
  .object({
    createNewAccount: z.boolean().default(true),
    existingAccountId: z.string().uuid().optional().nullable(),
    accountName: z.string().trim().min(1).max(255).optional().nullable(),
    createNewContact: z.boolean().default(true),
    existingContactId: z.string().uuid().optional().nullable(),
    contactFirstName: z.string().trim().max(100).optional().nullable(),
    contactLastName: z.string().trim().max(100).optional().nullable(),
    contactEmail: z.string().trim().email().optional().nullable().or(z.literal('')),
    contactPhone: z.string().trim().max(50).optional().nullable(),
  })
  .refine(
    (data) => {
      if (!data.createNewAccount && !data.existingAccountId) {
        return false;
      }
      return true;
    },
    {
      message: 'Existing account ID is required when not creating a new account',
      path: ['existingAccountId'],
    }
  )
  .refine(
    (data) => {
      if (!data.createNewContact && !data.existingContactId) {
        return false;
      }
      return true;
    },
    {
      message: 'Existing contact ID is required when not creating a new contact',
      path: ['existingContactId'],
    }
  );
