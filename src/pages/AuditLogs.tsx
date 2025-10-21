import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Search, Shield, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useRoles } from '@/hooks/useRoles';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { exportToCSV } from '@/utils/exportData';

interface AuditLog {
  id: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  details?: any;
  created_at: string;
  profiles?: {
    email: string;
    full_name?: string;
  };
}

export default function AuditLogs() {
  const { canViewAuditLogs, loading: rolesLoading } = useRoles();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');

  useEffect(() => {
    if (!rolesLoading && canViewAuditLogs) {
      fetchLogs();
    } else if (!rolesLoading && !canViewAuditLogs) {
      setIsLoading(false);
    }
  }, [rolesLoading, canViewAuditLogs]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      
      // Fetch user profiles for logs with user_id
      const userIds = [...new Set(data?.map(log => log.user_id).filter(Boolean))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds);

      // Merge profiles with logs
      const logsWithProfiles = data?.map(log => ({
        ...log,
        profiles: profiles?.find(p => p.id === log.user_id)
      })) || [];

      setLogs(logsWithProfiles as any);
    } catch (error: any) {
      console.error('Error fetching audit logs:', error);
      toast.error('Failed to load audit logs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    const exportData = filteredLogs.map(log => ({
      timestamp: new Date(log.created_at).toLocaleString(),
      user: log.profiles?.email || 'System',
      action: log.action,
      entity: log.entity_type || '',
      details: JSON.stringify(log.details || {})
    }));
    exportToCSV(exportData, `audit-logs-${new Date().toISOString()}`);
    toast.success('Audit logs exported successfully');
  };

  if (rolesLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Audit Logs</h1>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!canViewAuditLogs) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Audit Logs</h1>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
              <p className="text-muted-foreground">
                You need admin or analyst privileges to view audit logs.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchQuery === '' || 
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.profiles?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entity_type?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    
    return matchesSearch && matchesAction;
  });

  const getActionBadgeVariant = (action: string) => {
    if (action.includes('delete') || action.includes('dismiss')) return 'destructive';
    if (action.includes('create') || action.includes('grant')) return 'default';
    if (action.includes('update')) return 'secondary';
    return 'outline';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Audit Logs</h1>
          <p className="text-muted-foreground">
            Track all system activities and user actions
          </p>
        </div>
        <Button onClick={handleExport} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Logs
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by action, user, or entity..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="user_login">User Login</SelectItem>
                <SelectItem value="device_create">Device Create</SelectItem>
                <SelectItem value="device_delete">Device Delete</SelectItem>
                <SelectItem value="alert_dismiss">Alert Dismiss</SelectItem>
                <SelectItem value="cve_fetch">CVE Fetch</SelectItem>
                <SelectItem value="export_data">Export Data</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Activity Log ({filteredLogs.length})
          </CardTitle>
          <CardDescription>
            Comprehensive log of all system activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading logs...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No logs found</h3>
              <p className="text-muted-foreground">
                No audit logs match your search criteria
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-sm">
                      {new Date(log.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {log.profiles?.full_name || log.profiles?.email || 'System'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getActionBadgeVariant(log.action)}>
                        {log.action.replace(/_/g, ' ').toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {log.entity_type ? (
                        <span className="text-sm text-muted-foreground">
                          {log.entity_type}
                        </span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {log.details ? (
                        <span className="text-sm text-muted-foreground line-clamp-1">
                          {JSON.stringify(log.details)}
                        </span>
                      ) : (
                        '-'
                      )}
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
