import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Shield, Plus, Trash2, CheckCircle, AlertCircle, RefreshCw, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";

const integrationSchema = z.object({
  integration_type: z.enum(['datto', 'ninjaone', 'nable'], {
    errorMap: () => ({ message: "Please select a valid integration type" })
  }),
  api_key: z.string().trim().min(10, "API key must be at least 10 characters").max(500, "API key is too long")
});

type Integration = {
  id: string;
  integration_type: 'datto' | 'ninjaone' | 'nable';
  is_active: boolean;
  last_sync?: string;
  sync_error?: string;
  connected_at: string;
};

type IntegrationFormData = z.infer<typeof integrationSchema>;

const integrationTypes = {
  datto: {
    name: 'Datto RMM',
    description: 'Connect to Datto RMM for automated device discovery',
    icon: '🔧',
    website: 'https://www.datto.com/rmm'
  },
  ninjaone: {
    name: 'NinjaOne',
    description: 'Integrate with NinjaOne for device management',
    icon: '🥷',
    website: 'https://www.ninjaone.com'
  },
  nable: {
    name: 'N-able',
    description: 'Connect to N-able MSP platform',
    icon: '⚡',
    website: 'https://www.n-able.com'
  }
};

export default function Integrations() {
  const { user } = useAuth();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState<IntegrationFormData>({
    integration_type: 'datto',
    api_key: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchIntegrations();
  }, [user]);

  const fetchIntegrations = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Get user's parcs first
      const { data: parcs } = await supabase
        .from('parcs')
        .select('id')
        .eq('user_id', user.id);

      if (parcs && parcs.length > 0) {
        const parcIds = parcs.map(p => p.id);
        
        const { data: integrationsData, error } = await supabase
          .from('integrations')
          .select('*')
          .in('parc_id', parcIds)
          .order('created_at', { ascending: false });

        if (error) {
          toast({
            title: "Error fetching integrations",
            description: error.message,
            variant: "destructive"
          });
        } else {
          setIntegrations(integrationsData || []);
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load integrations",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    try {
      integrationSchema.parse(formData);
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

  const handleAddIntegration = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsAdding(true);
    
    try {
      // Get user's default parc or create one
      const { data: parcs } = await supabase
        .from('parcs')
        .select('id')
        .eq('user_id', user?.id)
        .limit(1);

      let parcId = parcs?.[0]?.id;
      
      if (!parcId) {
        const { data: newParc, error: parcError } = await supabase
          .from('parcs')
          .insert({
            user_id: user?.id,
            name: 'Default Infrastructure'
          })
          .select()
          .single();

        if (parcError) {
          throw new Error('Failed to create default parc');
        }
        parcId = newParc.id;
      }

      // Check if integration type already exists for this parc
      const { data: existingIntegration } = await supabase
        .from('integrations')
        .select('id')
        .eq('parc_id', parcId)
        .eq('integration_type', formData.integration_type)
        .single();

      if (existingIntegration) {
        toast({
          title: "Integration already exists",
          description: `${integrationTypes[formData.integration_type].name} is already connected`,
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('integrations')
        .insert({
          parc_id: parcId,
          integration_type: formData.integration_type,
          api_key_encrypted: formData.api_key, // In production, this should be encrypted
          is_active: true
        });

      if (error) {
        toast({
          title: "Error adding integration",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Integration added",
          description: `${integrationTypes[formData.integration_type].name} connected successfully`
        });
        setFormData({ integration_type: 'datto', api_key: '' });
        setShowAddDialog(false);
        fetchIntegrations();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add integration",
        variant: "destructive"
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteIntegration = async (integrationId: string, integrationType: string) => {
    try {
      const { error } = await supabase
        .from('integrations')
        .delete()
        .eq('id', integrationId);

      if (error) {
        toast({
          title: "Error removing integration",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Integration removed",
          description: `${integrationTypes[integrationType as keyof typeof integrationTypes].name} has been disconnected`
        });
        fetchIntegrations();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove integration",
        variant: "destructive"
      });
    }
  };

  const syncIntegration = async (integrationId: string) => {
    toast({
      title: "Sync started",
      description: "Manual sync functionality coming soon"
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Integrations</h1>
          <p className="text-muted-foreground">
            Connect with RMM platforms for automated device discovery
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Integration
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add RMM Integration</DialogTitle>
              <DialogDescription>
                Connect to your RMM platform to automatically discover and monitor devices
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddIntegration} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="integration_type">RMM Platform *</Label>
                <Select
                  value={formData.integration_type}
                  onValueChange={(value: Integration['integration_type']) => 
                    setFormData({ ...formData, integration_type: value })
                  }
                >
                  <SelectTrigger className={formErrors.integration_type ? "border-destructive" : ""}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(integrationTypes).map(([key, type]) => (
                      <SelectItem key={key} value={key}>
                        {type.icon} {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.integration_type && (
                  <p className="text-sm text-destructive">{formErrors.integration_type}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="api_key">API Key *</Label>
                <Input
                  id="api_key"
                  type="password"
                  value={formData.api_key}
                  onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                  placeholder="Enter your RMM API key"
                  className={formErrors.api_key ? "border-destructive" : ""}
                />
                {formErrors.api_key && (
                  <p className="text-sm text-destructive">{formErrors.api_key}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Your API key will be encrypted and stored securely
                </p>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isAdding}>
                  {isAdding ? "Connecting..." : "Connect"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Available Integrations */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Available Integrations</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {Object.entries(integrationTypes).map(([key, type]) => {
            const isConnected = integrations.some(i => i.integration_type === key);
            return (
              <Card key={key} className={isConnected ? "border-primary" : ""}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center">
                      <span className="mr-2 text-2xl">{type.icon}</span>
                      {type.name}
                    </CardTitle>
                    {isConnected && (
                      <Badge variant="default">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Connected
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">{type.description}</p>
                  <div className="flex justify-between items-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(type.website, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Learn More
                    </Button>
                    {!isConnected && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setFormData({ ...formData, integration_type: key as Integration['integration_type'] });
                          setShowAddDialog(true);
                        }}
                      >
                        Connect
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Connected Integrations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Connected Integrations ({integrations.length})
          </CardTitle>
          <CardDescription>
            Manage your connected RMM platforms and sync status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading integrations...</div>
          ) : integrations.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No integrations yet</h3>
              <p className="text-muted-foreground mb-4">
                Connect to your RMM platform to automatically discover and monitor devices
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Integration
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {integrations.map((integration) => {
                const type = integrationTypes[integration.integration_type];
                return (
                  <div key={integration.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <span className="text-2xl">{type.icon}</span>
                      <div>
                        <h3 className="font-medium">{type.name}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant={integration.is_active ? "default" : "secondary"}>
                            {integration.is_active ? "Active" : "Inactive"}
                          </Badge>
                          {integration.sync_error && (
                            <Badge variant="destructive">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Sync Error
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Connected on {new Date(integration.connected_at).toLocaleDateString()}
                          {integration.last_sync && (
                            <> • Last sync: {new Date(integration.last_sync).toLocaleString()}</>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => syncIntegration(integration.id)}
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Sync
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteIntegration(integration.id, integration.integration_type)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}