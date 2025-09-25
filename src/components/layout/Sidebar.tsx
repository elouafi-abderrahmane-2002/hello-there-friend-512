import { Shield, BarChart3, Users, Laptop, AlertTriangle, Settings, Building2 } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";

const navigationItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: BarChart3,
    always: true
  },
  {
    title: "Devices", 
    url: "/devices",
    icon: Laptop,
    always: true
  },
  {
    title: "Alerts",
    url: "/alerts", 
    icon: AlertTriangle,
    always: true
  },
  {
    title: "Clients",
    url: "/clients",
    icon: Building2,
    multiTenantOnly: true
  },
  {
    title: "Integrations",
    url: "/integrations",
    icon: Shield,
    always: true
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
    always: true
  }
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { profile } = useAuth();
  
  const currentPath = location.pathname;
  const isActive = (path: string) => currentPath === path;

  const filteredItems = navigationItems.filter(item => 
    item.always || (item.multiTenantOnly && profile?.plan === 'multi_tenant')
  );

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-primary/10 text-primary font-medium border-r-2 border-primary" 
      : "hover:bg-muted/50";

  return (
    <Sidebar className={state === "collapsed" ? "w-14" : "w-60"} collapsible="icon">
      <SidebarContent>
        <div className="p-4 border-b">
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-primary" />
            {state !== "collapsed" && (
              <div>
                <h1 className="text-xl font-bold gradient-text">ThreatPulse</h1>
                <p className="text-xs text-muted-foreground">CVE Monitoring</p>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end 
                      className={getNavCls({ isActive: isActive(item.url) })}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {state !== "collapsed" && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}