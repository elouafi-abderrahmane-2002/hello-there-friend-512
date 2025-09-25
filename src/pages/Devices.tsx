import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Laptop, Trash2, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";

const deviceSchema = z.object({
  name: z.string().trim().min(1, "Device name is required").max(100, "Name must be less than 100 characters"),
  device_type: z.enum(['linux', 'windows', 'vmware', 'network', 'other'], {
    errorMap: () => ({ message: "Please select a valid device type" })
  }),
  os_version: z.string().trim().max(50, "OS version must be less than 50 characters").optional(),
  vendor: z.string().trim().max(50, "Vendor must be less than 50 characters").optional(),
});

type Device = {
  id: string;
  name: string;
  device_type: 'linux' | 'windows' | 'vmware' | 'network' | 'other';
  os_version?: string;
  vendor?: string;
  last_sync: string;
  rmm_source?: string;
  is_active: boolean;
  created_at: string;
};

type DeviceFormData = z.infer<typeof deviceSchema>;

export default function Devices() {
  const { user, profile } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingDevice, setIsAddingDevice] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState<DeviceFormData>({
    name: '',
    device_type: 'linux',
    os_version: '',
    vendor: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchDevices();
  }, [user]);

  const fetchDevices = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // For MVP, we'll get devices from the user's default parc
      // TODO: Add parc selection for multi-tenant users
      const { data: parcs } = await supabase
        .from('parcs')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (parcs && parcs.length > 0) {
        const { data: devicesData, error } = await supabase
          .from('devices')
          .select('*')
          .eq('parc_id', parcs[0].id)
          .order('created_at', { ascending: false });

        if (error) {
          toast({
            title: "Error fetching devices",
            description: error.message,
            variant: "destructive"
          });
        } else {
          setDevices(devicesData || []);
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load devices",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createDefaultParc = async () => {
    if (!user) return null;

    const parcName = profile?.plan === 'enterprise' ? 'Default Infrastructure' : 'Default Client';
    
    const { data, error } = await supabase
      .from('parcs')
      .insert({
        user_id: user.id,
        name: parcName
      })
      .select()
      .single();

    if (error) {
      throw new Error('Failed to create default parc');
    }

    return data.id;
  };

  const validateForm = (data: DeviceFormData): boolean => {
    try {
      deviceSchema.parse(data);
      setFormErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path) {
            errors[err.path[0]] = err.message;
          }
        });
        setFormErrors(errors);
      }
      return false;
    }
  };

  const handleAddDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm(formData)) {
      return;
    }

    setIsAddingDevice(true);
    
    try {
      // Get or create default parc
      let { data: parcs } = await supabase
        .from('parcs')
        .select('id')
        .eq('user_id', user?.id)
        .limit(1);

      let parcId = parcs?.[0]?.id;
      
      if (!parcId) {
        parcId = await createDefaultParc();
      }

      const { error } = await supabase
        .from('devices')
        .insert({
          parc_id: parcId,
          name: formData.name.trim(),
          device_type: formData.device_type,
          os_version: formData.os_version?.trim() || null,
          vendor: formData.vendor?.trim() || null
        });

      if (error) {
        toast({
          title: "Error adding device",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Device added",
          description: `${formData.name} has been added successfully`
        });
        setFormData({ name: '', device_type: 'linux', os_version: '', vendor: '' });
        setShowAddDialog(false);
        fetchDevices();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add device",
        variant: "destructive"
      });
    } finally {
      setIsAddingDevice(false);
    }
  };

  const handleDeleteDevice = async (deviceId: string, deviceName: string) => {
    try {
      const { error } = await supabase
        .from('devices')
        .delete()
        .eq('id', deviceId);

      if (error) {
        toast({
          title: "Error deleting device",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Device deleted",
          description: `${deviceName} has been removed`
        });
        fetchDevices();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete device",
        variant: "destructive"
      });
    }
  };

  const getDeviceTypeBadgeVariant = (type: Device['device_type']) => {
    const variants = {
      linux: 'default',
      windows: 'secondary', 
      vmware: 'outline',
      network: 'destructive',
      other: 'secondary'
    };
    return variants[type] as any;
  };

  const getDeviceTypeLabel = (type: Device['device_type']) => {
    const labels = {
      linux: 'Linux',
      windows: 'Windows',
      vmware: 'VMware',
      network: 'Network',
      other: 'Other'
    };
    return labels[type];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Devices</h1>
          <p className="text-muted-foreground">
            Manage your monitored devices and infrastructure
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={fetchDevices}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Device
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Device</DialogTitle>
                <DialogDescription>
                  Add a device to monitor for CVE alerts
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddDevice} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Device Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Web Server 01"
                    className={formErrors.name ? "border-destructive" : ""}
                  />
                  {formErrors.name && (
                    <p className="text-sm text-destructive">{formErrors.name}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="device_type">Device Type *</Label>
                  <Select
                    value={formData.device_type}
                    onValueChange={(value: Device['device_type']) => 
                      setFormData({ ...formData, device_type: value })
                    }
                  >
                    <SelectTrigger className={formErrors.device_type ? "border-destructive" : ""}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="linux">Linux Server</SelectItem>
                      <SelectItem value="windows">Windows Server</SelectItem>
                      <SelectItem value="vmware">VMware</SelectItem>
                      <SelectItem value="network">Network Device</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {formErrors.device_type && (
                    <p className="text-sm text-destructive">{formErrors.device_type}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vendor">Vendor</Label>
                  <Input
                    id="vendor"
                    value={formData.vendor}
                    onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                    placeholder="e.g., Dell, HP, Cisco"
                    className={formErrors.vendor ? "border-destructive" : ""}
                  />
                  {formErrors.vendor && (
                    <p className="text-sm text-destructive">{formErrors.vendor}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="os_version">OS Version</Label>
                  <Input
                    id="os_version"
                    value={formData.os_version}
                    onChange={(e) => setFormData({ ...formData, os_version: e.target.value })}
                    placeholder="e.g., Ubuntu 22.04, Windows Server 2019"
                    className={formErrors.os_version ? "border-destructive" : ""}
                  />
                  {formErrors.os_version && (
                    <p className="text-sm text-destructive">{formErrors.os_version}</p>
                  )}
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isAddingDevice}>
                    {isAddingDevice ? "Adding..." : "Add Device"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Devices Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Laptop className="h-5 w-5 mr-2" />
            Monitored Devices ({devices.length})
          </CardTitle>
          <CardDescription>
            Devices being monitored for CVE vulnerabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading devices...</div>
          ) : devices.length === 0 ? (
            <div className="text-center py-8">
              <Laptop className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No devices yet</h3>
              <p className="text-muted-foreground mb-4">
                Add your first device to start monitoring for CVE alerts
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Device
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>OS Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Sync</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((device) => (
                  <TableRow key={device.id}>
                    <TableCell className="font-medium">{device.name}</TableCell>
                    <TableCell>
                      <Badge variant={getDeviceTypeBadgeVariant(device.device_type)}>
                        {getDeviceTypeLabel(device.device_type)}
                      </Badge>
                    </TableCell>
                    <TableCell>{device.vendor || '-'}</TableCell>
                    <TableCell>{device.os_version || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={device.is_active ? "default" : "secondary"}>
                        {device.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(device.last_sync).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteDevice(device.id, device.name)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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