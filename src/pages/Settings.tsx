import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Settings as SettingsIcon, User, Bell, Shield, Mail, Save, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

export default function Settings() {
  const { user, profile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: profile?.full_name || '',
    email: user?.email || ''
  });
  
  // Notification settings (these would be stored in a separate table in production)
  const [notificationSettings, setNotificationSettings] = useState({
    email_alerts: true,
    immediate_critical: true,
    daily_digest: false,
    weekly_summary: true,
    severity_threshold: 'medium' as 'critical' | 'high' | 'medium' | 'low'
  });

  const [securitySettings, setSecuritySettings] = useState({
    two_factor_enabled: false,
    session_timeout: '24' // hours
  });

  useEffect(() => {
    if (profile) {
      setProfileData({
        full_name: profile.full_name || '',
        email: user?.email || ''
      });
    }
  }, [profile, user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profileData.full_name.trim()
        })
        .eq('id', user.id);

      if (error) {
        toast({
          title: "Error updating profile",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Profile updated",
          description: "Your profile has been saved successfully"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestCVEFetch = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-cves');
      
      if (error) {
        toast({
          title: "Error testing CVE fetch",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "CVE fetch successful",
          description: `${data.inserted} new CVEs inserted, ${data.skipped} skipped`
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to test CVE fetch",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account preferences and security settings
        </p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Update your account details and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={profileData.full_name}
                onChange={(e) => setProfileData({...profileData, full_name: e.target.value})}
                placeholder="Enter your full name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={profileData.email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Email address cannot be changed. Contact support if needed.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Account Plan</Label>
            <div className="flex items-center space-x-2">
              <Badge variant={profile?.plan === 'enterprise' ? 'default' : 'secondary'}>
                {profile?.plan === 'enterprise' ? 'Enterprise' : 'Multi-Tenant MSP'}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {profile?.plan === 'enterprise' 
                  ? 'Single organization monitoring' 
                  : 'Multi-client MSP account'
                }
              </span>
            </div>
          </div>

          <Button onClick={handleSaveProfile} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Configure how and when you receive security alerts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Receive CVE alerts via email
                </p>
              </div>
              <Switch
                checked={notificationSettings.email_alerts}
                onCheckedChange={(checked) => 
                  setNotificationSettings({...notificationSettings, email_alerts: checked})
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Immediate Critical Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Get instant notifications for critical vulnerabilities
                </p>
              </div>
              <Switch
                checked={notificationSettings.immediate_critical}
                onCheckedChange={(checked) => 
                  setNotificationSettings({...notificationSettings, immediate_critical: checked})
                }
                disabled={!notificationSettings.email_alerts}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Daily Digest</Label>
                <p className="text-sm text-muted-foreground">
                  Daily summary of new vulnerabilities
                </p>
              </div>
              <Switch
                checked={notificationSettings.daily_digest}
                onCheckedChange={(checked) => 
                  setNotificationSettings({...notificationSettings, daily_digest: checked})
                }
                disabled={!notificationSettings.email_alerts}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Weekly Summary</Label>
                <p className="text-sm text-muted-foreground">
                  Weekly overview of security posture
                </p>
              </div>
              <Switch
                checked={notificationSettings.weekly_summary}
                onCheckedChange={(checked) => 
                  setNotificationSettings({...notificationSettings, weekly_summary: checked})
                }
                disabled={!notificationSettings.email_alerts}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Alert Severity Threshold</Label>
            <Select
              value={notificationSettings.severity_threshold}
              onValueChange={(value: typeof notificationSettings.severity_threshold) => 
                setNotificationSettings({...notificationSettings, severity_threshold: value})
              }
              disabled={!notificationSettings.email_alerts}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="critical">Critical Only</SelectItem>
                <SelectItem value="high">High and Above</SelectItem>
                <SelectItem value="medium">Medium and Above</SelectItem>
                <SelectItem value="low">All Severities</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Only receive alerts for vulnerabilities at or above this severity level
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Security Settings
          </CardTitle>
          <CardDescription>
            Manage your account security and authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security to your account
              </p>
            </div>
            <Badge variant="secondary">Coming Soon</Badge>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Session Timeout</Label>
            <Select
              value={securitySettings.session_timeout}
              onValueChange={(value) => 
                setSecuritySettings({...securitySettings, session_timeout: value})
              }
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Hour</SelectItem>
                <SelectItem value="8">8 Hours</SelectItem>
                <SelectItem value="24">24 Hours</SelectItem>
                <SelectItem value="168">1 Week</SelectItem>
                <SelectItem value="720">1 Month</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Automatically sign out after period of inactivity
            </p>
          </div>
        </CardContent>
      </Card>

      {/* System Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <SettingsIcon className="h-5 w-5 mr-2" />
            System Settings
          </CardTitle>
          <CardDescription>
            System maintenance and testing tools
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Test CVE Data Fetch</Label>
              <p className="text-sm text-muted-foreground">
                Manually trigger CVE data synchronization from NVD
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={handleTestCVEFetch}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? "Fetching..." : "Test Fetch"}
            </Button>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Database Status</Label>
            <div className="flex items-center space-x-2">
              <Badge variant="default">Connected</Badge>
              <span className="text-sm text-muted-foreground">
                All systems operational
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}