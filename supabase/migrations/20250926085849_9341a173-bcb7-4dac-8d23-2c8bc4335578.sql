-- Add CISA-specific fields to the CVEs table
ALTER TABLE public.cves 
ADD COLUMN vendor_project TEXT,
ADD COLUMN product TEXT,
ADD COLUMN vulnerability_name TEXT,
ADD COLUMN date_added TIMESTAMP WITH TIME ZONE,
ADD COLUMN due_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN known_ransomware_campaign_use TEXT,
ADD COLUMN required_action TEXT,
ADD COLUMN notes TEXT,
ADD COLUMN cwes TEXT[],
ADD COLUMN source TEXT DEFAULT 'nvd' CHECK (source IN ('nvd', 'cisa'));

-- Create index for better performance on source queries
CREATE INDEX idx_cves_source ON public.cves(source);
CREATE INDEX idx_cves_date_added ON public.cves(date_added);

-- Update existing records to have 'nvd' as source
UPDATE public.cves SET source = 'nvd' WHERE source IS NULL;