import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, AlertTriangle, Shield, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e'];

export default function Analytics() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [severityData, setSeverityData] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [deviceTypeData, setDeviceTypeData] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchSeverityDistribution(),
        fetchAlertTrends(),
        fetchDeviceTypeDistribution()
      ]);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSeverityDistribution = async () => {
    if (!user) return;

    const { data: parcs } = await supabase
      .from('parcs')
      .select('id')
      .eq('user_id', user.id);

    if (!parcs?.length) return;
    const parcIds = parcs.map(p => p.id);

    const { data } = await supabase
      .from('alerts')
      .select(`
        id,
        cves!inner(severity)
      `)
      .in('parc_id', parcIds)
      .neq('status', 'dismissed');

    const counts = { critical: 0, high: 0, medium: 0, low: 0 };
    data?.forEach(alert => {
      const severity = alert.cves.severity;
      if (severity in counts) {
        counts[severity as keyof typeof counts]++;
      }
    });

    setSeverityData([
      { name: 'Critical', value: counts.critical, color: '#ef4444' },
      { name: 'High', value: counts.high, color: '#f97316' },
      { name: 'Medium', value: counts.medium, color: '#eab308' },
      { name: 'Low', value: counts.low, color: '#22c55e' }
    ]);
  };

  const fetchAlertTrends = async () => {
    if (!user) return;

    const { data: parcs } = await supabase
      .from('parcs')
      .select('id')
      .eq('user_id', user.id);

    if (!parcs?.length) return;
    const parcIds = parcs.map(p => p.id);

    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const { data } = await supabase
      .from('alerts')
      .select('created_at, cves!inner(severity)')
      .in('parc_id', parcIds)
      .gte('created_at', last30Days.toISOString())
      .order('created_at');

    // Group by week
    const weeklyData: Record<string, any> = {};
    data?.forEach(alert => {
      const date = new Date(alert.created_at);
      const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
      const weekKey = weekStart.toLocaleDateString();

      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { week: weekKey, critical: 0, high: 0, medium: 0, low: 0 };
      }
      weeklyData[weekKey][alert.cves.severity]++;
    });

    setTrendData(Object.values(weeklyData));
  };

  const fetchDeviceTypeDistribution = async () => {
    if (!user) return;

    const { data: parcs } = await supabase
      .from('parcs')
      .select('id')
      .eq('user_id', user.id);

    if (!parcs?.length) return;
    const parcIds = parcs.map(p => p.id);

    const { data } = await supabase
      .from('devices')
      .select('device_type')
      .in('parc_id', parcIds)
      .eq('is_active', true);

    const counts: Record<string, number> = {};
    data?.forEach(device => {
      counts[device.device_type] = (counts[device.device_type] || 0) + 1;
    });

    setDeviceTypeData(
      Object.entries(counts).map(([type, count]) => ({
        type: type.charAt(0).toUpperCase() + type.slice(1),
        count
      }))
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Security Analytics</h1>
        <p className="text-muted-foreground">
          Advanced insights into your security posture
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {severityData.reduce((sum, item) => sum + item.value, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <Shield className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {severityData.find(d => d.name === 'Critical')?.value || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24h</div>
            <p className="text-xs text-muted-foreground">-12% from last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coverage</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98.5%</div>
            <p className="text-xs text-muted-foreground">+2.1% from last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Alert Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Alert Trends (Last 30 Days)</CardTitle>
            <CardDescription>Weekly breakdown of alert severity</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="critical" stroke="#ef4444" strokeWidth={2} />
                <Line type="monotone" dataKey="high" stroke="#f97316" strokeWidth={2} />
                <Line type="monotone" dataKey="medium" stroke="#eab308" strokeWidth={2} />
                <Line type="monotone" dataKey="low" stroke="#22c55e" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Severity Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Severity Distribution</CardTitle>
            <CardDescription>Current active alerts by severity</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Device Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Device Distribution</CardTitle>
            <CardDescription>Active devices by type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={deviceTypeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Risk Score Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Score Trend</CardTitle>
            <CardDescription>Average risk score over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey={(data) => (data.critical * 25 + data.high * 15 + data.medium * 10 + data.low * 5) / Math.max(1, data.critical + data.high + data.medium + data.low)}
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="Risk Score"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
