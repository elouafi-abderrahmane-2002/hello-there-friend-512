import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NVDCveItem {
  cve: {
    id: string;
    descriptions: Array<{
      lang: string;
      value: string;
    }>;
    published: string;
    references: Array<{
      url: string;
    }>;
    metrics?: {
      cvssMetricV31?: Array<{
        cvssData: {
          baseScore: number;
        };
      }>;
      cvssMetricV30?: Array<{
        cvssData: {
          baseScore: number;
        };
      }>;
      cvssMetricV2?: Array<{
        cvssData: {
          baseScore: number;
        };
      }>;
    };
  };
}

interface NVDResponse {
  vulnerabilities: NVDCveItem[];
  totalResults: number;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting CVE fetch process...');
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the most recent CVE from our database to determine start date
    const { data: latestCve } = await supabase
      .from('cves')
      .select('published_at')
      .order('published_at', { ascending: false })
      .limit(1)
      .single();

    // Calculate date range - get CVEs from last 7 days or since last CVE
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    const startDate = latestCve ? new Date(latestCve.published_at) : sevenDaysAgo;
    
    const startDateStr = startDate.toISOString();
    const endDateStr = now.toISOString();

    console.log(`Fetching CVEs from ${startDateStr} to ${endDateStr}`);

    // Fetch CVEs from NVD API
    const nvdUrl = `https://services.nvd.nist.gov/rest/json/cves/2.0?pubStartDate=${startDateStr}&pubEndDate=${endDateStr}&resultsPerPage=100`;
    
    const nvdResponse = await fetch(nvdUrl, {
      headers: {
        'User-Agent': 'ThreatPulse-CVE-Monitor/1.0'
      }
    });

    if (!nvdResponse.ok) {
      throw new Error(`NVD API error: ${nvdResponse.status} ${nvdResponse.statusText}`);
    }

    const nvdData: NVDResponse = await nvdResponse.json();
    console.log(`Found ${nvdData.vulnerabilities.length} CVEs from NVD`);

    let insertedCount = 0;
    let skippedCount = 0;

    // Process each CVE
    for (const item of nvdData.vulnerabilities) {
      const cve = item.cve;
      
      // Check if CVE already exists
      const { data: existingCve } = await supabase
        .from('cves')
        .select('id')
        .eq('cve_id', cve.id)
        .single();

      if (existingCve) {
        skippedCount++;
        continue;
      }

      // Extract CVSS score
      let cvssScore = null;
      if (cve.metrics?.cvssMetricV31?.[0]) {
        cvssScore = cve.metrics.cvssMetricV31[0].cvssData.baseScore;
      } else if (cve.metrics?.cvssMetricV30?.[0]) {
        cvssScore = cve.metrics.cvssMetricV30[0].cvssData.baseScore;
      } else if (cve.metrics?.cvssMetricV2?.[0]) {
        cvssScore = cve.metrics.cvssMetricV2[0].cvssData.baseScore;
      }

      // Determine severity based on CVSS score
      let severity = 'low';
      if (cvssScore !== null) {
        if (cvssScore >= 9.0) severity = 'critical';
        else if (cvssScore >= 7.0) severity = 'high';
        else if (cvssScore >= 4.0) severity = 'medium';
      }

      // Get description (prefer English)
      const description = cve.descriptions.find(d => d.lang === 'en')?.value || 
                         cve.descriptions[0]?.value || 
                         'No description available';

      // Extract reference links
      const referenceLinks = cve.references.map(ref => ref.url);

      // Extract affected products from description (simple keyword matching)
      const affectedProducts: string[] = [];
      const productKeywords = ['linux', 'windows', 'apache', 'nginx', 'mysql', 'postgresql', 'docker', 'kubernetes', 'vmware', 'cisco', 'microsoft', 'oracle', 'ibm'];
      
      for (const keyword of productKeywords) {
        if (description.toLowerCase().includes(keyword)) {
          affectedProducts.push(keyword);
        }
      }

      // Insert CVE into database
      const { error } = await supabase
        .from('cves')
        .insert({
          cve_id: cve.id,
          description: description.substring(0, 2000), // Limit description length
          cvss_score: cvssScore,
          severity: severity,
          published_at: cve.published,
          affected_products: affectedProducts,
          reference_links: referenceLinks.slice(0, 10) // Limit number of references
        });

      if (error) {
        console.error(`Error inserting CVE ${cve.id}:`, error);
      } else {
        insertedCount++;
        console.log(`Inserted CVE: ${cve.id}`);
      }
    }

    console.log(`CVE fetch complete. Inserted: ${insertedCount}, Skipped: ${skippedCount}`);

    // Now check for matching devices and create alerts
    await generateAlerts(supabase);

    return new Response(JSON.stringify({
      success: true,
      message: `Processed ${nvdData.vulnerabilities.length} CVEs. Inserted: ${insertedCount}, Skipped: ${skippedCount}`,
      inserted: insertedCount,
      skipped: skippedCount
    }), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
    });

  } catch (error: any) {
    console.error('Error in fetch-cves function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
    });
  }
};

async function generateAlerts(supabase: any) {
  console.log('Starting alert generation...');
  
  try {
    // Get recent CVEs (last 24 hours) that might affect devices
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: recentCves } = await supabase
      .from('cves')
      .select('*')
      .gte('created_at', oneDayAgo);

    if (!recentCves || recentCves.length === 0) {
      console.log('No recent CVEs found for alert generation');
      return;
    }

    // Get all active devices
    const { data: devices } = await supabase
      .from('devices')
      .select('*')
      .eq('is_active', true);

    if (!devices || devices.length === 0) {
      console.log('No active devices found');
      return;
    }

    let alertsCreated = 0;

    // Check each CVE against each device
    for (const cve of recentCves) {
      for (const device of devices) {
        // Check if this device might be affected by this CVE
        const isAffected = checkDeviceAffected(device, cve);
        
        if (isAffected) {
          // Check if alert already exists
          const { data: existingAlert } = await supabase
            .from('alerts')
            .select('id')
            .eq('device_id', device.id)
            .eq('cve_id', cve.id)
            .single();

          if (!existingAlert) {
            // Create new alert
            const { error } = await supabase
              .from('alerts')
              .insert({
                parc_id: device.parc_id,
                device_id: device.id,
                cve_id: cve.id,
                status: 'new',
                notified_email: false
              });

            if (error) {
              console.error(`Error creating alert for device ${device.name} and CVE ${cve.cve_id}:`, error);
            } else {
              alertsCreated++;
              console.log(`Created alert: ${device.name} - ${cve.cve_id}`);
            }
          }
        }
      }
    }

    console.log(`Alert generation complete. Created ${alertsCreated} new alerts`);
  } catch (error) {
    console.error('Error generating alerts:', error);
  }
}

function checkDeviceAffected(device: any, cve: any): boolean {
  // Simple matching logic - can be enhanced
  const deviceType = device.device_type.toLowerCase();
  const description = cve.description.toLowerCase();
  const affectedProducts = cve.affected_products || [];

  // Check if device type or vendor is mentioned in CVE
  if (description.includes(deviceType)) {
    return true;
  }

  if (device.vendor && description.includes(device.vendor.toLowerCase())) {
    return true;
  }

  if (device.os_version && description.includes(device.os_version.toLowerCase())) {
    return true;
  }

  // Check affected products array
  for (const product of affectedProducts) {
    if (deviceType.includes(product) || 
        (device.vendor && device.vendor.toLowerCase().includes(product)) ||
        (device.os_version && device.os_version.toLowerCase().includes(product))) {
      return true;
    }
  }

  return false;
}

serve(handler);