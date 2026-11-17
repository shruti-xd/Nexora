import { Profile, Organization, OrganizationMember, RoleName } from './db.types.js';

// =============================================================================
// API DTO Types
// Types for requests, responses, and user context
// =============================================================================

export interface AuthUserContext {
  id: string;
  email: string;
  profile: Profile;
  activeOrganization: Organization;
  membership: OrganizationMember;
  role: RoleName;
  permissions: string[];
}

export interface RegisterDTO {
  fullName: string;
  email: string;
  password: string;
  organizationName: string;
}

export interface UpdateProfileDTO {
  fullName?: string;
  avatarUrl?: string;
}

export interface UpdateOrganizationDTO {
  name: string;
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
}
