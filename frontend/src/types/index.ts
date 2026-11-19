// =============================================================================
// Frontend Type Definitions
// =============================================================================

export type RoleName = 'ADMIN' | 'MANAGER' | 'SALES_REP' | 'VIEWER';
export type OrganizationStatus = 'ACTIVE' | 'SUSPENDED';
export type InvitationStatus = 'PENDING' | 'ACCEPTED';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  isActive: boolean;
  isPlatformAdmin?: boolean;
  invitationStatus?: string;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  status?: OrganizationStatus;
  createdAt: string;
  updatedAt?: string;
  memberCount?: number;
  currentUserRole?: RoleName;
}

export interface Membership {
  id: string;
  role: RoleName;
  isActive: boolean;
  invitationStatus?: InvitationStatus;
  invitedBy?: string | null;
  invitedAt?: string | null;
  joinedAt: string;
}

export interface AuthContextType {
  user: UserProfile | null;
  organization: Organization | null;
  membership: Membership | null;
  role: RoleName | null;
  permissions: string[];
  isLoading: boolean;
  isAuthenticated: boolean;
  isPlatformAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export interface OrganizationMember {
  membershipId: string;
  userId: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  role: RoleName;
  roleDescription?: string | null;
  isMemberActive: boolean;
  isProfileActive: boolean;
  invitationStatus: InvitationStatus;
  invitedBy?: string | null;
  invitedAt?: string | null;
  joinedAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error?: {
    code: string;
    details: unknown;
  };
}

// =============================================================================
// Platform Administration Types
// =============================================================================

export interface PlatformOrganization {
  id: string;
  name: string;
  slug: string;
  status: OrganizationStatus;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
  memberCount?: number;
  initialAdmin?: {
    id: string;
    email: string;
    fullName: string;
  } | null;
}

export interface CreateOrganizationPayload {
  name: string;
  slug?: string;
  adminFullName: string;
  adminEmail: string;
}

export interface UpdateOrganizationPayload {
  name: string;
  slug: string;
}

export interface UpdateOrgStatusPayload {
  status: OrganizationStatus;
}

export interface AssignAdminPayload {
  adminEmail: string;
  adminFullName?: string;
}

// =============================================================================
// User Invitation Types
// =============================================================================

export interface InviteUserPayload {
  fullName: string;
  email: string;
  role: RoleName;
}


// =============================================================================
// CRM Module 02 Types: Leads, Accounts & Contacts
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

export interface Account {
  id: string;
  organizationId: string;
  ownerUserId?: string | null;
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
  contactCount?: number;
  owner?: {
    id: string;
    fullName: string;
    email: string;
  };
}

export interface Contact {
  id: string;
  organizationId: string;
  accountId?: string | null;
  ownerUserId?: string | null;
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

export interface Lead {
  id: string;
  organizationId: string;
  ownerUserId?: string | null;
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

export interface CreateAccountPayload {
  name: string;
  accountType?: AccountType;
  industry?: string;
  website?: string;
  phone?: string;
  email?: string;
  annualRevenue?: number;
  employeeCount?: number;
  description?: string;
  billingStreet?: string;
  billingCity?: string;
  billingState?: string;
  billingCountry?: string;
  billingPostalCode?: string;
  shippingStreet?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingCountry?: string;
  shippingPostalCode?: string;
  ownerUserId?: string;
}

export type UpdateAccountPayload = Partial<CreateAccountPayload>;

export interface AccountQueryFilters {
  page?: number;
  limit?: number;
  search?: string;
  accountType?: AccountType;
  industry?: string;
  ownerId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateContactPayload {
  accountId?: string | null;
  firstName?: string;
  lastName: string;
  title?: string;
  department?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  description?: string;
  mailingStreet?: string;
  mailingCity?: string;
  mailingState?: string;
  mailingCountry?: string;
  mailingPostalCode?: string;
  otherStreet?: string;
  otherCity?: string;
  otherState?: string;
  otherCountry?: string;
  otherPostalCode?: string;
  ownerUserId?: string;
}

export type UpdateContactPayload = Partial<CreateContactPayload>;

export interface ContactQueryFilters {
  page?: number;
  limit?: number;
  search?: string;
  accountId?: string;
  ownerId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateLeadPayload {
  firstName?: string;
  lastName: string;
  company: string;
  title?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  website?: string;
  industry?: string;
  source?: LeadSource;
  status?: LeadStatus;
  rating?: LeadRating;
  annualRevenue?: number;
  employeeCount?: number;
  description?: string;
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  ownerUserId?: string;
}

export type UpdateLeadPayload = Partial<CreateLeadPayload>;

export interface LeadQueryFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: LeadStatus;
  source?: LeadSource;
  rating?: LeadRating;
  isConverted?: boolean;
  ownerId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ConvertLeadPayload {
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
