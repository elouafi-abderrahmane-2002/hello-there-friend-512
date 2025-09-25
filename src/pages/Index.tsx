import { Button } from "@/components/ui/button";
import { Shield, BarChart3, Users, Lock } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold gradient-text">ThreatPulse</h1>
        </div>
        <Link to="/auth">
          <Button>Get Started</Button>
        </Link>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-16 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <h1 className="text-5xl font-bold leading-tight">
            Stay ahead of vulnerabilities
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Real-time CVE alerts for your infrastructure and clients. 
            Monitor devices, track vulnerabilities, and protect your organization.
          </p>
          
          <div className="flex justify-center space-x-4">
            <Link to="/auth">
              <Button size="lg" className="px-8">
                Start Monitoring
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="px-8">
              Learn More
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="mt-24 grid md:grid-cols-3 gap-8">
          <div className="p-6 rounded-lg border bg-card">
            <BarChart3 className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Real-time Monitoring</h3>
            <p className="text-muted-foreground">
              Continuous monitoring of CVE databases with instant alerts for your devices.
            </p>
          </div>
          
          <div className="p-6 rounded-lg border bg-card">
            <Users className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Multi-tenant Support</h3>
            <p className="text-muted-foreground">
              Manage multiple clients with isolated parcs and customized alerting.
            </p>
          </div>
          
          <div className="p-6 rounded-lg border bg-card">
            <Lock className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">RMM Integration</h3>
            <p className="text-muted-foreground">
              Connect with Datto RMM, NinjaOne, and other platforms for automated device discovery.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
