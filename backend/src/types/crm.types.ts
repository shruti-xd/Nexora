// =============================================================================
// CRM Domain Types: Leads, Accounts & Contacts (Module 02)
// =============================================================================

export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'UNQUALIFIED';
export type LeadRating = 'HOT' | 'WARM' | 'COLD';
export type LeadSource =
  | 'WEBSITE'
  | 'REFERRAL'
  | 'SOCIAL_MEDIA'
  | 'EMAIL_CAMPAIGN'
  | 'ADVERTISEMENT'
  | 'COLD_CALL'
  | 'EVENT'
  | 'PARTNER'
  | 'OTHER';

export type AccountType = 'PROSPECT' | 'CUSTOMER' | 'PARTNER' | 'RESELLER' | 'OTHER';

// =============================================================================
// Entity Models
// =============================================================================

export interface AccountEntity {
  id: string;
  organizationId: string;
  ownerUserId: string;
  createdBy: string;
  name: string;
  accountType: AccountType;
  industry?: string | null;
  website?: string | null;
  phone?: string | null;
  email?: string | null;
  annualRevenue?: number | null;
  employeeCount?: number | null;
  description?: string | null;
  billingStreet?: string | null;
  billingCity?: string | null;
  billingState?: string | null;
  billingCountry?: string | null;
  billingPostalCode?: string | null;
  shippingStreet?: string | null;
  shippingCity?: string | null;
  shippingState?: string | null;
  shippingCountry?: string | null;
  shippingPostalCode?: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  owner?: {
    id: string;
    fullName: string;
    email: string;
  };
  contactCount?: number;
}

export interface ContactEntity {
  id: string;
  organizationId: string;
  accountId?: string | null;
  ownerUserId: string;
  createdBy: string;
  firstName?: string | null;
  lastName: string;
  title?: string | null;
  department?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  description?: string | null;
  mailingStreet?: string | null;
  mailingCity?: string | null;
  mailingState?: string | null;
  mailingCountry?: string | null;
  mailingPostalCode?: string | null;
  otherStreet?: string | null;
  otherCity?: string | null;
  otherState?: string | null;
  otherCountry?: string | null;
  otherPostalCode?: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  account?: {
    id: string;
    name: string;
  } | null;
  owner?: {
    id: string;
    fullName: string;
    email: string;
  };
}

export interface LeadEntity {
  id: string;
  organizationId: string;
  ownerUserId: string;
  createdBy: string;
  firstName?: string | null;
  lastName: string;
  company: string;
  title?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  website?: string | null;
  industry?: string | null;
  source: LeadSource;
  status: LeadStatus;
  rating: LeadRating;
  annualRevenue?: number | null;
  employeeCount?: number | null;
  description?: string | null;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  convertedAt?: string | null;
  convertedAccountId?: string | null;
  convertedContactId?: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  owner?: {
    id: string;
    fullName: string;
    email: string;
  };
  convertedAccount?: {
    id: string;
    name: string;
  } | null;
  convertedContact?: {
    id: string;
    firstName?: string | null;
    lastName: string;
  } | null;
}

// =============================================================================
// Query & Filter Options
// =============================================================================

export interface BaseCrmQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  ownerId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface LeadQueryOptions extends BaseCrmQueryOptions {
  status?: LeadStatus;
  source?: LeadSource;
  rating?: LeadRating;
  isConverted?: boolean;
}

export interface AccountQueryOptions extends BaseCrmQueryOptions {
  accountType?: AccountType;
  industry?: string;
}

export interface ContactQueryOptions extends BaseCrmQueryOptions {
  accountId?: string;
}

// =============================================================================
// Lead Conversion DTOs
// =============================================================================

export interface ConvertLeadDTO {
  createNewAccount: boolean;
  existingAccountId?: string;
  accountName?: string;
  createNewContact: boolean;
  existingContactId?: string;
  contactFirstName?: string;
  contactLastName?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface ConvertLeadResult {
  leadId: string;
  accountId: string;
  contactId: string;
  convertedAt: string;
}
