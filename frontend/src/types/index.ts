// =============================================================================
// Frontend Type Definitions
// =============================================================================

export type RoleName = 'ADMIN' | 'MANAGER' | 'SALES_REP' | 'VIEWER';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt?: string;
  memberCount?: number;
  currentUserRole?: RoleName;
}

export interface Membership {
  id: string;
  role: RoleName;
  isActive: boolean;
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
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterFormData) => Promise<void>;
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
  joinedAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface RegisterFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  organizationName: string;
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

export interface Account {
  id: string;
  organization_id: string;
  name: string;
  website: string | null;
  phone: string | null;
  industry: string | null;
  city: string | null;
  tier: string | null;
  owner_id: string | null;
  annual_revenue: number | null;
  employee_count: number | null;
  billing_address: string | null;
  created_at: string;
  updated_at: string;
}

export type AccountFormData = Omit<Account, 'id' | 'organization_id' | 'created_at' | 'updated_at'>;

export interface Contact {
  id: string;
  organization_id: string;
  account_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  title: string | null;
  is_decision_maker: boolean;
  owner_id: string | null;
  custom_fields: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  accounts?: { id: string; name: string } | null;
  profiles?: { id: string; full_name: string; email: string } | null;
}

export interface ContactFormData {
  account_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  title: string | null;
  is_decision_maker: boolean;
  owner_id: string | null;
  custom_fields: Record<string, unknown>;
}
