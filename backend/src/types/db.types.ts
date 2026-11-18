// =============================================================================
// Database Types
// Type definitions reflecting database entities in Supabase PostgreSQL
// =============================================================================

export interface Organization {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string | null;
  is_active: boolean;
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

export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Unqualified' | 'Converted';
export type LeadSource = 'Direct' | 'Inbound' | 'Referral' | 'Website' | 'Event' | 'Outbound';

export interface Lead {
  id: string;
  organization_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  company: string;
  title?: string | null;
  status: LeadStatus;
  source?: string | null;
  estimated_value: number;
  lead_score: number;
  custom_fields: Record<string, unknown>;
  owner_id?: string | null;
  converted_at?: string | null;
  converted_account_id?: string | null;
  converted_contact_id?: string | null;
  converted_opportunity_id?: string | null;
  created_at: string;
  updated_at: string;
  // Joins
  owner?: Profile;
}

export interface Account {
  id: string;
  organization_id: string;
  name: string;
  industry?: string | null;
  website?: string | null;
  city?: string | null;
  annual_revenue?: number | null;
  tier?: string | null;
  owner_id?: string | null;
  custom_fields: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  organization_id: string;
  account_id?: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  title?: string | null;
  is_decision_maker: boolean;
  owner_id?: string | null;
  custom_fields: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Opportunity {
  id: string;
  organization_id: string;
  account_id?: string | null;
  primary_contact_id?: string | null;
  name: string;
  stage: string;
  amount: number;
  probability: number;
  close_date: string;
  owner_id?: string | null;
  custom_fields: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type ActivityType = 'Task' | 'Call' | 'Meeting' | 'Email' | 'Note';
export type ActivityRelatedType = 'Lead' | 'Account' | 'Contact' | 'Opportunity';

export interface Activity {
  id: string;
  organization_id: string;
  type: ActivityType;
  subject: string;
  description?: string | null;
  related_type: ActivityRelatedType;
  related_id: string;
  owner_id?: string | null;
  due_date?: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
  owner?: Profile;
}

