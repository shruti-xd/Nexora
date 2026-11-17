import { supabaseAdmin } from '../config/supabase.js';
import { Logger } from '../utils/logger.js';

// =============================================================================
// Audit Service
// Persists administrative, authentication, and CRM event audit records
// =============================================================================

export interface LogAuditParams {
  organizationId?: string | null;
  userId?: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  metadata?: Record<string, unknown>;
}

export class AuditService {
  public static async log(params: LogAuditParams): Promise<void> {
    try {
      // Step 1: Initialize audit logging event parameters
      Logger.info(`[AuditService] Recording audit log event: ${params.action} on ${params.resource}:${params.resourceId || 'N/A'}`);

      // Step 2: Write audit entry to database
      const { error } = await supabaseAdmin.from('audit_logs').insert({
        organization_id: params.organizationId ?? null,
        user_id: params.userId ?? null,
        action: params.action,
        resource: params.resource,
        resource_id: params.resourceId ?? null,
        metadata: params.metadata ?? {},
      });

      // Step 3: Handle potential persistence error peacefully
      if (error) {
        Logger.warn(`[AuditService] Non-blocking warning: Failed to persist audit record: ${error.message}`, {
          error,
          params,
        });
      } else {
        Logger.info(`[AuditService] Audit log recorded successfully for action: ${params.action}`);
      }
    } catch (err: unknown) {
      // Step 4: Peaceful error handling (audit failure should not break primary transaction)
      const errorMsg = err instanceof Error ? err.message : String(err);
      Logger.warn(`[AuditService] Non-fatal exception while writing audit log: ${errorMsg}`);
    }
  }
}
