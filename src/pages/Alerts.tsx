import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, Shield, Search, Filter, ExternalLink, CheckCircle, Download, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { useAuditLog } from "@/hooks/useAuditLog";
import { useRoles } from "@/hooks/useRoles";
import { exportToCSV, generateAlertExport } from "@/utils/exportData";

type Alert = {
  id: string;
  status: 'new' | 'read' | 'dismissed';
  notified_email: boolean;
  created_at: string;
  cves: {
    id: string;
    cve_id: string;
    description: string;
    cvss_score: number;
    severity: 'critical' | 'high' | 'medium' | 'low';
    published_at: string;
    reference_links: string[];
  };
  devices: {
    id: string;
    name: string;
    device_type: string;
    vendor?: string;
    os_version?: string;
  };
};

export default function Alerts() {
  const { user } = useAuth();
  const { canEdit } = useRoles();
  const { logAudit } = useAuditLog();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedAlerts, setSelectedAlerts] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchAlerts();
  }, [user]);

  const fetchAlerts = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data: parcs } = await supabase
        .from('parcs')
        .select('id')
        .eq('user_id', user.id);

      if (parcs && parcs.length > 0) {
        const parcIds = parcs.map(p => p.id);
        
        const { data: alertsData, error } = await supabase
          .from('alerts')
          .select(`
            id,
            status,
            notified_email,
            created_at,
            cves:cve_id (
              id,
              cve_id,
              description,
              cvss_score,
              severity,
              published_at,
              reference_links
            ),
            devices:device_id (
              id,
              name,
              device_type,
              vendor,
              os_version
            )
          `)
          .in('parc_id', parcIds)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching alerts:', error);
          toast({
            title: "Error fetching alerts",
            description: error.message,
            variant: "destructive"
          });
        } else {
          setAlerts(alertsData || []);
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load alerts",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({ status: 'read' })
        .eq('id', alertId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to mark alert as read",
          variant: "destructive"
        });
      } else {
        fetchAlerts();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update alert",
        variant: "destructive"
      });
    }
  };

  const dismissAlert = async (alertId: string) => {
    if (!canEdit) return;
    try {
      const { error } = await supabase
        .from('alerts')
        .update({ status: 'dismissed' })
        .eq('id', alertId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to dismiss alert",
          variant: "destructive"
        });
      } else {
        await logAudit({
          action: 'alert_dismiss',
          entityType: 'alert',
          entityId: alertId
        });
        toast({
          title: "Alert dismissed",
          description: "The alert has been dismissed"
        });
        fetchAlerts();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to dismiss alert",
        variant: "destructive"
      });
    }
  };

  const handleBulkDismiss = async () => {
    if (!canEdit || selectedAlerts.size === 0) return;
    try {
      const { error } = await supabase
        .from('alerts')
        .update({ status: 'dismissed' })
        .in('id', Array.from(selectedAlerts));

      if (error) throw error;

      await logAudit({
        action: 'alert_dismiss',
        entityType: 'alert',
        details: { count: selectedAlerts.size }
      });

      toast({
        title: "Alerts dismissed",
        description: `${selectedAlerts.size} alerts dismissed successfully`
      });
      setSelectedAlerts(new Set());
      fetchAlerts();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to dismiss alerts",
        variant: "destructive"
      });
    }
  };

  const handleExport = () => {
    const exportData = generateAlertExport(filteredAlerts);
    exportToCSV(exportData, `alerts-${new Date().toISOString()}`);
    logAudit({
      action: 'export_data',
      entityType: 'alerts',
      details: { count: exportData.length }
    });
    toast({
      title: "Export successful",
      description: `${exportData.length} alerts exported`
    });
  };

  const toggleSelectAll = () => {
    if (selectedAlerts.size === filteredAlerts.length) {
      setSelectedAlerts(new Set());
    } else {
      setSelectedAlerts(new Set(filteredAlerts.map(a => a.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelection = new Set(selectedAlerts);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedAlerts(newSelection);
  };

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'new': return 'destructive';
      case 'read': return 'default';
      case 'dismissed': return 'secondary';
      default: return 'secondary';
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = searchQuery === '' || 
      alert.cves.cve_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.cves.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.devices.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSeverity = severityFilter === 'all' || alert.cves.severity === severityFilter;
    const matchesStatus = statusFilter === 'all' || alert.status === statusFilter;
    
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const alertCounts = {
    total: alerts.length,
    new: alerts.filter(a => a.status === 'new').length,
    critical: alerts.filter(a => a.cves.severity === 'critical').length,
    high: alerts.filter(a => a.cves.severity === 'high').length
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Security Alerts</h1>
          <p className="text-muted-foreground">
            Monitor and manage CVE alerts for your devices
          </p>
        </div>
        <div className="flex gap-2">
          {selectedAlerts.size > 0 && canEdit && (
            <Button onClick={handleBulkDismiss} variant="destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Dismiss {selectedAlerts.size} Selected
            </Button>
          )}
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Alert Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alertCounts.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Alerts</CardTitle>
            <Shield className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{alertCounts.new}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alertCounts.critical}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Severity</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alertCounts.high}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search CVE ID, description, or device..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="read">Read</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Alerts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Security Alerts ({filteredAlerts.length})</CardTitle>
          <CardDescription>
            Recent CVE alerts for your monitored devices
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading alerts...</div>
          ) : filteredAlerts.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {alerts.length === 0 ? "No alerts yet" : "No alerts match your filters"}
              </h3>
              <p className="text-muted-foreground">
                {alerts.length === 0 
                  ? "Add devices to start monitoring for CVE alerts"
                  : "Try adjusting your search or filter criteria"
                }
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    {canEdit && (
                      <Checkbox
                        checked={selectedAlerts.size === filteredAlerts.length && filteredAlerts.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    )}
                  </TableHead>
                  <TableHead>CVE ID</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>CVSS Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAlerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell>
                      {canEdit && (
                        <Checkbox
                          checked={selectedAlerts.has(alert.id)}
                          onCheckedChange={() => toggleSelect(alert.id)}
                        />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <span>{alert.cves.cve_id}</span>
                        {alert.cves.reference_links && alert.cves.reference_links.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(alert.cves.reference_links[0], '_blank')}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{alert.devices.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {alert.devices.device_type} {alert.devices.vendor && `• ${alert.devices.vendor}`}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getSeverityBadgeVariant(alert.cves.severity)}>
                        {alert.cves.severity.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono">{alert.cves.cvss_score?.toFixed(1) || 'N/A'}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(alert.status)}>
                        {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(alert.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        {alert.status === 'new' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(alert.id)}
                            title="Mark as read"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        {alert.status !== 'dismissed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => dismissAlert(alert.id)}
                            title="Dismiss alert"
                            className="text-muted-foreground"
                          >
                            ✕
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}