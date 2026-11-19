// =============================================================================
// Database Types
// Type definitions reflecting database entities in Supabase PostgreSQL
// =============================================================================

export type OrganizationStatus = 'ACTIVE' | 'SUSPENDED';
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'ACTIVE';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  status: OrganizationStatus;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string | null;
  is_active: boolean;
  is_platform_admin: boolean;
  invitation_status: InvitationStatus;
  created_at: string;
  updated_at: string;
}

export type RoleName = 'ADMIN' | 'MANAGER' | 'SALES_REP' | 'VIEWER';

export interface Role {
  id: string;
  name: RoleName;
  description?: string | null;
  is_system_role: boolean;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description?: string | null;
  created_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role_id: string;
  is_active: boolean;
  invitation_status: 'PENDING' | 'ACCEPTED';
  invited_by?: string | null;
  invited_at?: string | null;
  joined_at: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  role?: Role;
  profile?: Profile;
  organization?: Organization;
}

export interface AuditLog {
  id: string;
  organization_id?: string | null;
  user_id?: string | null;
  action: string;
  resource: string;
  resource_id?: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}
