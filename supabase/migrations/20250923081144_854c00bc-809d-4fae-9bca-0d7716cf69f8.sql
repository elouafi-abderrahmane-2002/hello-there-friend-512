-- Create custom types
CREATE TYPE public.user_plan AS ENUM ('enterprise', 'multi_tenant');
CREATE TYPE public.device_type AS ENUM ('linux', 'windows', 'vmware', 'network', 'other');
CREATE TYPE public.severity AS ENUM ('critical', 'high', 'medium', 'low');
CREATE TYPE public.alert_status AS ENUM ('new', 'read', 'dismissed');
CREATE TYPE public.integration_type AS ENUM ('datto', 'ninjaone', 'nable');

-- Create profiles table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  plan public.user_plan NOT NULL DEFAULT 'enterprise',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create clients table (only for multi-tenant users)
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create parcs table (device collections)
CREATE TABLE public.parcs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Constraint: either client_id is set (multi-tenant) or null (enterprise)
  CONSTRAINT parc_ownership_check CHECK (
    (client_id IS NOT NULL) OR (client_id IS NULL)
  )
);

-- Create devices table
CREATE TABLE public.devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parc_id UUID NOT NULL REFERENCES public.parcs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  device_type public.device_type NOT NULL,
  os_version TEXT,
  vendor TEXT,
  last_sync TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  rmm_source TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create CVEs table
CREATE TABLE public.cves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cve_id TEXT UNIQUE NOT NULL,
  description TEXT,
  cvss_score DECIMAL(3,1),
  severity public.severity NOT NULL,
  published_at TIMESTAMP WITH TIME ZONE,
  affected_products TEXT[],
  reference_links TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create alerts table
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parc_id UUID NOT NULL REFERENCES public.parcs(id) ON DELETE CASCADE,
  device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
  cve_id UUID NOT NULL REFERENCES public.cves(id) ON DELETE CASCADE,
  status public.alert_status DEFAULT 'new',
  notified_email BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(device_id, cve_id)
);

-- Create integrations table
CREATE TABLE public.integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parc_id UUID NOT NULL REFERENCES public.parcs(id) ON DELETE CASCADE,
  integration_type public.integration_type NOT NULL,
  api_key_encrypted TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_sync TIMESTAMP WITH TIME ZONE,
  sync_error TEXT,
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(parc_id, integration_type)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parcs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view and update own profile" ON public.profiles
  FOR ALL USING (auth.uid() = id);

-- RLS Policies for clients
CREATE POLICY "Users can manage their own clients" ON public.clients
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for parcs
CREATE POLICY "Users can manage their own parcs" ON public.parcs
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for devices
CREATE POLICY "Users can manage devices in their parcs" ON public.devices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.parcs 
      WHERE parcs.id = devices.parc_id 
      AND parcs.user_id = auth.uid()
    )
  );

-- RLS Policies for CVEs (public read access)
CREATE POLICY "Anyone can view CVEs" ON public.cves
  FOR SELECT USING (TRUE);

CREATE POLICY "Service role can manage CVEs" ON public.cves
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for alerts
CREATE POLICY "Users can manage alerts for their parcs" ON public.alerts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.parcs 
      WHERE parcs.id = alerts.parc_id 
      AND parcs.user_id = auth.uid()
    )
  );

-- RLS Policies for integrations
CREATE POLICY "Users can manage integrations for their parcs" ON public.integrations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.parcs 
      WHERE parcs.id = integrations.parc_id 
      AND parcs.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_clients_user_id ON public.clients(user_id);
CREATE INDEX idx_parcs_user_id ON public.parcs(user_id);
CREATE INDEX idx_parcs_client_id ON public.parcs(client_id);
CREATE INDEX idx_devices_parc_id ON public.devices(parc_id);
CREATE INDEX idx_devices_type ON public.devices(device_type);
CREATE INDEX idx_cves_severity ON public.cves(severity);
CREATE INDEX idx_cves_published_at ON public.cves(published_at);
CREATE INDEX idx_alerts_parc_id ON public.alerts(parc_id);
CREATE INDEX idx_alerts_status ON public.alerts(status);
CREATE INDEX idx_alerts_created_at ON public.alerts(created_at);

-- Create function to handle profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', '')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user profiles
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_parcs_updated_at BEFORE UPDATE ON public.parcs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_devices_updated_at BEFORE UPDATE ON public.devices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON public.alerts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON public.integrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();