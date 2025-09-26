import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Laptop, Shield, TrendingUp, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface DashboardStats {
  totalDevices: number;
  activeAlerts: number;
  newCVEs: number;
  criticalAlerts: number;
  highAlerts: number;
}

interface RecentAlert {
  id: string;
  status: string;
  created_at: string;
  cves: {
    cve_id: string;
    severity: string;
    description: string;
  };
  devices: {
    name: string;
    device_type: string;
  };
}

interface SeverityCount {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalDevices: 0,
    activeAlerts: 0,
    newCVEs: 0,
    criticalAlerts: 0,
    highAlerts: 0,
  });
  const [recentAlerts, setRecentAlerts] = useState<RecentAlert[]>([]);
  const [severityBreakdown, setSeverityBreakdown] = useState<SeverityCount>({
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingCVEs, setIsFetchingCVEs] = useState(false);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      await Promise.all([
        fetchStats(),
        fetchRecentAlerts(),
        fetchSeverityBreakdown(),
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!user) return;

    // Get user's parcs
    const { data: parcs } = await supabase
      .from('parcs')
      .select('id')
      .eq('user_id', user.id);

    if (!parcs?.length) return;

    const parcIds = parcs.map(p => p.id);

    // Fetch total devices
    const { count: deviceCount } = await supabase
      .from('devices')
      .select('*', { count: 'exact', head: true })
      .in('parc_id', parcIds)
      .eq('is_active', true);

    // Fetch active alerts
    const { count: alertCount } = await supabase
      .from('alerts')
      .select('*', { count: 'exact', head: true })
      .in('parc_id', parcIds)
      .neq('status', 'dismissed');

    // Fetch critical and high alerts
    const { data: severityAlerts } = await supabase
      .from('alerts')
      .select(`
        id,
        cves!inner(severity)
      `)
      .in('parc_id', parcIds)
      .neq('status', 'dismissed');

    const criticalCount = severityAlerts?.filter(a => a.cves.severity === 'critical').length || 0;
    const highCount = severityAlerts?.filter(a => a.cves.severity === 'high').length || 0;

    // Fetch new CVEs in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { count: newCVECount } = await supabase
      .from('cves')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString());

    setStats({
      totalDevices: deviceCount || 0,
      activeAlerts: alertCount || 0,
      newCVEs: newCVECount || 0,
      criticalAlerts: criticalCount,
      highAlerts: highCount,
    });
  };

  const fetchRecentAlerts = async () => {
    if (!user) return;

    // Get user's parcs
    const { data: parcs } = await supabase
      .from('parcs')
      .select('id')
      .eq('user_id', user.id);

    if (!parcs?.length) return;

    const parcIds = parcs.map(p => p.id);

    const { data: alerts } = await supabase
      .from('alerts')
      .select(`
        id,
        status,
        created_at,
        cves:cve_id(
          cve_id,
          severity,
          description
        ),
        devices:device_id(
          name,
          device_type
        )
      `)
      .in('parc_id', parcIds)
      .order('created_at', { ascending: false })
      .limit(5);

    setRecentAlerts(alerts || []);
  };

  const fetchSeverityBreakdown = async () => {
    if (!user) return;

    // Get user's parcs
    const { data: parcs } = await supabase
      .from('parcs')
      .select('id')
      .eq('user_id', user.id);

    if (!parcs?.length) return;

    const parcIds = parcs.map(p => p.id);

    const { data: alerts } = await supabase
      .from('alerts')
      .select(`
        id,
        cves!inner(severity)
      `)
      .in('parc_id', parcIds)
      .neq('status', 'dismissed');

    const breakdown = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    alerts?.forEach(alert => {
      const severity = alert.cves.severity;
      if (severity in breakdown) {
        breakdown[severity as keyof SeverityCount]++;
      }
    });

    setSeverityBreakdown(breakdown);
  };

  const handleFetchCVEs = async () => {
    setIsFetchingCVEs(true);
    try {
      const { error } = await supabase.functions.invoke('fetch-cves');
      
      if (error) {
        throw error;
      }
      
      toast.success('CVEs fetched successfully');
      // Reload dashboard data to reflect any new alerts
      loadDashboardData();
    } catch (error: any) {
      console.error('Error fetching CVEs:', error);
      toast.error(`Failed to fetch CVEs: ${error.message}`);
    } finally {
      setIsFetchingCVEs(false);
    }
  };

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'default';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your security posture and threat alerts
          </p>
        </div>
        <Button
          onClick={handleFetchCVEs}
          disabled={isFetchingCVEs}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isFetchingCVEs ? 'animate-spin' : ''}`} />
          {isFetchingCVEs ? 'Fetching CVEs...' : 'Fetch Latest CVEs'}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Devices
            </CardTitle>
            <Laptop className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDevices}</div>
            <p className="text-xs text-muted-foreground">
              Monitored devices
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Alerts
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeAlerts}</div>
            <p className="text-xs text-muted-foreground">
              {stats.criticalAlerts} critical, {stats.highAlerts} high
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              New CVEs (7d)
            </CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newCVEs}</div>
            <p className="text-xs text-muted-foreground">
              This week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Coverage Score
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalDevices > 0 ? '100%' : '0%'}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalDevices > 0 ? 'All devices monitored' : 'No devices'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Alerts and Severity Breakdown */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
            <CardDescription>
              Latest CVE alerts for your devices
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentAlerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No alerts yet. Add devices to start monitoring for CVEs.
              </div>
            ) : (
              <div className="space-y-4">
                {recentAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={getSeverityBadgeVariant(alert.cves.severity)}>
                          {alert.cves.severity}
                        </Badge>
                        <span className="font-medium">{alert.cves.cve_id}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {alert.devices.name} ({alert.devices.device_type})
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {alert.cves.description}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(alert.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Severity Breakdown</CardTitle>
            <CardDescription>
              Distribution of alert severities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge variant="destructive">Critical</Badge>
                  <span className="text-sm">{severityBreakdown.critical} alerts</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge className="bg-orange-500 hover:bg-orange-600">High</Badge>
                  <span className="text-sm">{severityBreakdown.high} alerts</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge className="bg-yellow-500 hover:bg-yellow-600">Medium</Badge>
                  <span className="text-sm">{severityBreakdown.medium} alerts</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">Low</Badge>
                  <span className="text-sm">{severityBreakdown.low} alerts</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}