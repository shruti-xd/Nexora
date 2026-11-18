import { Lead, LeadStatus, LeadSource, Activity } from '../../types/db.types.js';

// =============================================================================
// Lead Module Types & DTOs
// =============================================================================

export interface CreateLeadDTO {
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

export interface UpdateLeadDTO {
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

export interface ConvertLeadDTO {
  existingAccountId?: string;
  createOpportunity?: boolean;
  oppName?: string;
  oppAmount?: number;
}

export interface ConvertLeadResult {
  leadId: string;
  accountId: string;
  contactId: string;
  opportunityId?: string | null;
}

export interface LeadQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  ownerId?: string;
}

export interface CreateActivityDTO {
  type: 'Task' | 'Call' | 'Meeting' | 'Email' | 'Note';
  subject: string;
  description?: string;
  dueDate?: string;
  completed?: boolean;
}
