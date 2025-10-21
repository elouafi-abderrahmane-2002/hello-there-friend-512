-- Fix the security definer view issue
-- Drop the existing view and recreate without security definer
DROP VIEW IF EXISTS public.dashboard_analytics;

-- Create a security definer function instead
CREATE OR REPLACE FUNCTION public.get_dashboard_analytics(_user_id UUID)
RETURNS TABLE (
  total_devices BIGINT,
  active_alerts BIGINT,
  new_alerts BIGINT,
  critical_alerts BIGINT,
  high_alerts BIGINT,
  avg_cvss_score NUMERIC,
  last_alert_time TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT d.id)::BIGINT as total_devices,
    COUNT(DISTINCT CASE WHEN a.status != 'dismissed' THEN a.id END)::BIGINT as active_alerts,
    COUNT(DISTINCT CASE WHEN a.status = 'new' THEN a.id END)::BIGINT as new_alerts,
    COUNT(DISTINCT CASE WHEN c.severity = 'critical' AND a.status != 'dismissed' THEN a.id END)::BIGINT as critical_alerts,
    COUNT(DISTINCT CASE WHEN c.severity = 'high' AND a.status != 'dismissed' THEN a.id END)::BIGINT as high_alerts,
    AVG(c.cvss_score) as avg_cvss_score,
    MAX(a.created_at) as last_alert_time
  FROM public.parcs p
  LEFT JOIN public.devices d ON d.parc_id = p.id AND d.is_active = true
  LEFT JOIN public.alerts a ON a.parc_id = p.id
  LEFT JOIN public.cves c ON c.id = a.cve_id
  WHERE p.user_id = _user_id
  GROUP BY p.user_id;
END;
$$;