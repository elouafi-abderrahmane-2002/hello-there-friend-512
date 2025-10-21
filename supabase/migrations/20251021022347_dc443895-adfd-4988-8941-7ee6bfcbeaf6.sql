-- ============================================
-- ENTERPRISE FEATURES DATABASE MIGRATION
-- ============================================

-- 1. User Roles System
-- ============================================
CREATE TYPE public.app_role AS ENUM ('admin', 'analyst', 'viewer');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  granted_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- 2. Audit Logs
-- ============================================
CREATE TYPE public.audit_action AS ENUM (
  'user_login', 'user_logout',
  'device_create', 'device_update', 'device_delete',
  'alert_create', 'alert_update', 'alert_dismiss',
  'cve_fetch', 'export_data',
  'settings_update', 'role_grant', 'role_revoke',
  'integration_connect', 'integration_disconnect'
);

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action audit_action NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and analysts can view audit logs"
ON public.audit_logs FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'analyst')
);

-- Index for performance
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);

-- 3. Custom Alert Rules
-- ============================================
CREATE TABLE public.alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parc_id UUID NOT NULL REFERENCES public.parcs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  severity_threshold public.severity NOT NULL DEFAULT 'medium',
  device_types TEXT[],
  vendor_filter TEXT[],
  auto_dismiss_low BOOLEAN DEFAULT false,
  email_notification BOOLEAN DEFAULT true,
  webhook_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.alert_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage alert rules for their parcs"
ON public.alert_rules FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.parcs
    WHERE parcs.id = alert_rules.parc_id
    AND parcs.user_id = auth.uid()
  )
);

-- 4. Saved Filters
-- ============================================
CREATE TABLE public.saved_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  filter_type TEXT NOT NULL, -- 'alerts', 'devices', 'cves'
  filter_config JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_filters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own saved filters"
ON public.saved_filters FOR ALL
USING (auth.uid() = user_id);

-- 5. Device Groups
-- ============================================
CREATE TABLE public.device_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parc_id UUID NOT NULL REFERENCES public.parcs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.device_group_members (
  device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.device_groups(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (device_id, group_id)
);

ALTER TABLE public.device_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage device groups in their parcs"
ON public.device_groups FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.parcs
    WHERE parcs.id = device_groups.parc_id
    AND parcs.user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage device group members"
ON public.device_group_members FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.devices
    JOIN public.parcs ON parcs.id = devices.parc_id
    WHERE devices.id = device_group_members.device_id
    AND parcs.user_id = auth.uid()
  )
);

-- 6. CVE Tags
-- ============================================
CREATE TABLE public.cve_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cve_id UUID NOT NULL REFERENCES public.cves(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(cve_id, user_id, tag)
);

ALTER TABLE public.cve_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own CVE tags"
ON public.cve_tags FOR ALL
USING (auth.uid() = user_id);

-- 7. Export History
-- ============================================
CREATE TABLE public.export_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  export_type TEXT NOT NULL, -- 'alerts', 'devices', 'cves', 'audit_logs'
  format TEXT NOT NULL, -- 'csv', 'pdf', 'json'
  filters JSONB,
  record_count INTEGER,
  file_size INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.export_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own export history"
ON public.export_history FOR SELECT
USING (auth.uid() = user_id);

-- 8. Add tags column to alerts for categorization
ALTER TABLE public.alerts ADD COLUMN tags TEXT[];
ALTER TABLE public.alerts ADD COLUMN risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100);
ALTER TABLE public.alerts ADD COLUMN assigned_to UUID REFERENCES auth.users(id);

-- 9. Add notes to devices
ALTER TABLE public.devices ADD COLUMN notes TEXT;
ALTER TABLE public.devices ADD COLUMN tags TEXT[];

-- 10. Triggers for updated_at
CREATE TRIGGER update_alert_rules_updated_at
  BEFORE UPDATE ON public.alert_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_device_groups_updated_at
  BEFORE UPDATE ON public.device_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 11. Function to log audit events
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_action audit_action,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    details
  ) VALUES (
    auth.uid(),
    p_action,
    p_entity_type,
    p_entity_id,
    p_details
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- 12. Create view for dashboard analytics
CREATE OR REPLACE VIEW public.dashboard_analytics AS
SELECT 
  p.user_id,
  COUNT(DISTINCT d.id) as total_devices,
  COUNT(DISTINCT CASE WHEN a.status != 'dismissed' THEN a.id END) as active_alerts,
  COUNT(DISTINCT CASE WHEN a.status = 'new' THEN a.id END) as new_alerts,
  COUNT(DISTINCT CASE WHEN c.severity = 'critical' AND a.status != 'dismissed' THEN a.id END) as critical_alerts,
  COUNT(DISTINCT CASE WHEN c.severity = 'high' AND a.status != 'dismissed' THEN a.id END) as high_alerts,
  AVG(c.cvss_score) as avg_cvss_score,
  MAX(a.created_at) as last_alert_time
FROM public.parcs p
LEFT JOIN public.devices d ON d.parc_id = p.id AND d.is_active = true
LEFT JOIN public.alerts a ON a.parc_id = p.id
LEFT JOIN public.cves c ON c.id = a.cve_id
GROUP BY p.user_id;