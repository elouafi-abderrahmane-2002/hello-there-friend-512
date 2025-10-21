export function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        // Handle values with commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToJSON(data: any[], filename: string) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.json`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function generateAlertExport(alerts: any[]) {
  return alerts.map(alert => ({
    cve_id: alert.cves.cve_id,
    severity: alert.cves.severity,
    cvss_score: alert.cves.cvss_score,
    device_name: alert.devices.name,
    device_type: alert.devices.device_type,
    status: alert.status,
    created_at: new Date(alert.created_at).toLocaleString(),
    description: alert.cves.description?.substring(0, 200)
  }));
}

export function generateDeviceExport(devices: any[]) {
  return devices.map(device => ({
    name: device.name,
    type: device.device_type,
    vendor: device.vendor || '',
    os_version: device.os_version || '',
    status: device.is_active ? 'Active' : 'Inactive',
    last_sync: new Date(device.last_sync).toLocaleString(),
    notes: device.notes || ''
  }));
}
