import { supabase } from '@/integrations/supabase/client';

export type AuditAction = 
  | 'user_login' | 'user_logout'
  | 'device_create' | 'device_update' | 'device_delete'
  | 'alert_create' | 'alert_update' | 'alert_dismiss'
  | 'cve_fetch' | 'export_data'
  | 'settings_update' | 'role_grant' | 'role_revoke'
  | 'integration_connect' | 'integration_disconnect';

interface LogAuditParams {
  action: AuditAction;
  entityType?: string;
  entityId?: string;
  details?: Record<string, any>;
}

export function useAuditLog() {
  const logAudit = async ({
    action,
    entityType,
    entityId,
    details
  }: LogAuditParams) => {
    try {
      await supabase.rpc('log_audit_event', {
        p_action: action,
        p_entity_type: entityType,
        p_entity_id: entityId,
        p_details: details ? JSON.stringify(details) : null
      });
    } catch (error) {
      console.error('Failed to log audit event:', error);
    }
  };

  return { logAudit };
}
