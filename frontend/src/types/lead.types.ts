// =============================================================================
// Lead Type Definitions
// =============================================================================

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
  source?: LeadSource | null;
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
  profiles?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string | null;
  } | null;
}

export interface CreateLeadPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company: string;
  title?: string;
  status?: LeadStatus;
  source?: LeadSource;
  estimatedValue?: number;
  leadScore?: number;
  customFields?: Record<string, unknown>;
  ownerId?: string;
}

export interface UpdateLeadPayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  status?: LeadStatus;
  source?: LeadSource;
  estimatedValue?: number;
  leadScore?: number;
  customFields?: Record<string, unknown>;
  ownerId?: string;
}

export interface ConvertLeadPayload {
  existingAccountId?: string;
  createOpportunity?: boolean;
  oppName?: string;
  oppAmount?: number;
}

export interface ConvertLeadResult {
  lead_id: string;
  account_id: string;
  contact_id: string;
  opportunity_id?: string | null;
}

export interface Activity {
  id: string;
  organization_id: string;
  type: 'Task' | 'Call' | 'Meeting' | 'Email' | 'Note';
  subject: string;
  description?: string | null;
  related_type: string;
  related_id: string;
  owner_id?: string | null;
  due_date?: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
  profiles?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string | null;
  } | null;
}

export interface CreateActivityPayload {
  type: 'Task' | 'Call' | 'Meeting' | 'Email' | 'Note';
  subject: string;
  description?: string;
  dueDate?: string;
  completed?: boolean;
}
