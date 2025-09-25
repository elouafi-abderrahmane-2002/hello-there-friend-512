import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Building2, Trash2, Users, Laptop, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";
import { Link } from "react-router-dom";

const clientSchema = z.object({
  name: z.string().trim().min(1, "Client name is required").max(100, "Name must be less than 100 characters")
});

type Client = {
  id: string;
  name: string;
  created_at: string;
  parcs?: Array<{
    id: string;
    name: string;
    devices?: Array<{ id: string }>;
  }>;
};

export default function Clients() {
  const { user, profile } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [clientName, setClientName] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchClients();
  }, [user]);

  // Redirect if not multi-tenant plan
  if (profile?.plan !== 'multi_tenant') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground">
            Multi-client management for MSP accounts
          </p>
        </div>
        <Card>
          <CardContent className="text-center py-8">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Multi-tenant Plan Required</h3>
            <p className="text-muted-foreground mb-4">
              Client management is available for Multi-tenant (MSP) accounts only.
            </p>
            <p className="text-sm text-muted-foreground">
              Contact support to upgrade your account to access multi-client features.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const fetchClients = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data: clientsData, error } = await supabase
        .from('clients')
        .select(`
          id,
          name,
          created_at,
          parcs:parcs(
            id,
            name,
            devices:devices(id)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: "Error fetching clients",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setClients(clientsData || []);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load clients",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    try {
      clientSchema.parse({ name: clientName });
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

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsAddingClient(true);
    
    try {
      const { error } = await supabase
        .from('clients')
        .insert({
          user_id: user?.id,
          name: clientName.trim()
        });

      if (error) {
        toast({
          title: "Error adding client",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Client added",
          description: `${clientName} has been added successfully`
        });
        setClientName('');
        setShowAddDialog(false);
        fetchClients();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add client",
        variant: "destructive"
      });
    } finally {
      setIsAddingClient(false);
    }
  };

  const handleDeleteClient = async (clientId: string, clientName: string) => {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);

      if (error) {
        toast({
          title: "Error deleting client",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Client deleted",
          description: `${clientName} has been removed`
        });
        fetchClients();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete client",
        variant: "destructive"
      });
    }
  };

  const getClientStats = (client: Client) => {
    const parcCount = client.parcs?.length || 0;
    const deviceCount = client.parcs?.reduce((total, parc) => total + (parc.devices?.length || 0), 0) || 0;
    return { parcCount, deviceCount };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground">
            Manage your MSP clients and their device parcs
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
              <DialogDescription>
                Create a new client to manage their devices and security alerts
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddClient} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Client Name *</Label>
                <Input
                  id="name"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g., Acme Corporation"
                  className={formErrors.name ? "border-destructive" : ""}
                />
                {formErrors.name && (
                  <p className="text-sm text-destructive">{formErrors.name}</p>
                )}
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isAddingClient}>
                  {isAddingClient ? "Adding..." : "Add Client"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Client Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
            <Laptop className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clients.reduce((total, client) => {
                const { deviceCount } = getClientStats(client);
                return total + deviceCount;
              }, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Parcs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clients.reduce((total, client) => {
                const { parcCount } = getClientStats(client);
                return total + parcCount;
              }, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building2 className="h-5 w-5 mr-2" />
            Client List ({clients.length})
          </CardTitle>
          <CardDescription>
            Manage your MSP clients and monitor their security posture
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading clients...</div>
          ) : clients.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No clients yet</h3>
              <p className="text-muted-foreground mb-4">
                Add your first client to start managing their devices and security alerts
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Client
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Parcs</TableHead>
                  <TableHead>Devices</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => {
                  const { parcCount, deviceCount } = getClientStats(client);
                  return (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">
                        <Link to={`/clients/${client.id}`} className="hover:underline">
                          {client.name}
                        </Link>
                      </TableCell>
                      <TableCell>{parcCount}</TableCell>
                      <TableCell>{deviceCount}</TableCell>
                      <TableCell>
                        {new Date(client.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClient(client.id, client.name)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}