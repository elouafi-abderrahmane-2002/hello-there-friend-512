import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type AppRole = 'admin' | 'analyst' | 'viewer';

interface UserRole {
  id: string;
  role: AppRole;
  granted_at: string;
}

export function useRoles() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserRoles();
    } else {
      setRoles([]);
      setLoading(false);
    }
  }, [user]);

  const fetchUserRoles = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setRoles(data || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (role: AppRole): boolean => {
    return roles.some(r => r.role === role);
  };

  const isAdmin = (): boolean => hasRole('admin');
  const isAnalyst = (): boolean => hasRole('analyst');
  const isViewer = (): boolean => hasRole('viewer');

  const canEdit = (): boolean => isAdmin() || isAnalyst();
  const canViewAuditLogs = (): boolean => isAdmin() || isAnalyst();
  const canManageUsers = (): boolean => isAdmin();

  return {
    roles,
    loading,
    hasRole,
    isAdmin,
    isAnalyst,
    isViewer,
    canEdit,
    canViewAuditLogs,
    canManageUsers,
    refreshRoles: fetchUserRoles
  };
}
