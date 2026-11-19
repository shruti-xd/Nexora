import { Profile, Organization, OrganizationMember, RoleName, OrganizationStatus } from './db.types.js';

// =============================================================================
// API DTO Types
// Types for requests, responses, and user context
// =============================================================================

export interface AuthUserContext {
  id: string;
  email: string;
  profile: Profile;
  isPlatformAdmin: boolean;
  activeOrganization?: Organization;
  membership?: OrganizationMember;
  role?: RoleName;
  permissions: string[];
}

export interface CreateOrganizationDTO {
  name: string;
  slug?: string;
  adminFullName: string;
  adminEmail: string;
}

export interface UpdateOrganizationDTO {
  name?: string;
  slug?: string;
}

export interface UpdateOrganizationStatusDTO {
  status: OrganizationStatus;
}

export interface AssignOrganizationAdminDTO {
  adminFullName: string;
  adminEmail: string;
}

export interface InviteUserDTO {
  fullName: string;
  email: string;
  role: RoleName;
}

export interface UpdateProfileDTO {
  fullName?: string;
  avatarUrl?: string | null;
}

export interface UpdateUserRoleDTO {
  role: RoleName;
}

export interface UpdateUserStatusDTO {
  isActive: boolean;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: RoleName;
  status?: 'active' | 'deactivated' | 'pending';
}
