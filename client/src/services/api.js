/**
 * SupplyChainIQ - Frontend API Service Layer
 * Resilient multi-target connection:
 * Automatically uses relative /api or falls back directly to http://127.0.0.1:5000/api
 */

const DIRECT_BACKEND = 'http://127.0.0.1:5000';

async function fetchWithFallback(endpoint, options = {}) {
  // 1. Try relative path first (seamless for both Vite proxy & Express static serving)
  try {
    const res = await fetch(`/api${endpoint}`, options);
    if (res.ok || res.status < 500) {
      return res;
    }
  } catch (err) {
    // Relative fetch failed, fall through to direct backend
  }

  // 2. Direct fallback to port 5000
  try {
    const directRes = await fetch(`${DIRECT_BACKEND}/api${endpoint}`, options);
    return directRes;
  } catch (directErr) {
    throw new Error(`Unable to reach backend service at /api${endpoint} or ${DIRECT_BACKEND}/api${endpoint}`);
  }
}

export async function fetchDashboardSummary() {
  const res = await fetchWithFallback('/dashboard/summary');
  if (!res.ok) throw new Error(`Dashboard summary error: ${res.statusText}`);
  return res.json();
}

export async function fetchProducts() {
  const res = await fetchWithFallback('/products');
  if (!res.ok) throw new Error(`Products fetch error: ${res.statusText}`);
  return res.json();
}

export async function fetchInventoryWorkbench() {
  const res = await fetchWithFallback('/inventory/workbench');
  if (!res.ok) throw new Error(`Workbench fetch error: ${res.statusText}`);
  return res.json();
}

export async function fetchProductForecast(skuCode) {
  const res = await fetchWithFallback(`/products/${skuCode}/timeseries-and-forecast`);
  if (!res.ok) throw new Error(`Product forecast error: ${res.statusText}`);
  return res.json();
}

export async function uploadAndValidateCSV(rows, batchId) {
  const res = await fetchWithFallback('/upload/parse-and-validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rows, batchId })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to validate batch');
  }
  return res.json();
}

export async function fetchQuarantineLogs(status) {
  const url = status ? `/quarantine/logs?status=${status}` : '/quarantine/logs';
  const res = await fetchWithFallback(url);
  if (!res.ok) throw new Error('Failed to fetch quarantine logs');
  return res.json();
}

export async function resolveQuarantineRecord(id, fixedData) {
  const res = await fetchWithFallback(`/quarantine/${id}/resolve`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fixedData })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.details || errorData.error || 'Failed to resolve record');
  }
  return res.json();
}

export async function autoFixAllQuarantine() {
  const res = await fetchWithFallback('/quarantine/auto-fix-all', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Auto-fix failed');
  return res.json();
}

export async function fetchPurchaseOrders() {
  const res = await fetchWithFallback('/purchase-orders');
  if (!res.ok) throw new Error('Failed to fetch purchase orders');
  return res.json();
}

export async function createPurchaseOrder(poData) {
  const res = await fetchWithFallback('/purchase-orders/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(poData)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to create PO');
  }
  return res.json();
}

export async function updatePurchaseOrderStatus(poNumber, status) {
  const res = await fetchWithFallback(`/purchase-orders/${poNumber}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  if (!res.ok) throw new Error('Failed to update PO status');
  return res.json();
}

export async function fetchMessySampleCSV() {
  const res = await fetchWithFallback('/demo/messy-csv');
  if (!res.ok) throw new Error('Failed to fetch sample messy CSV');
  return res.text();
}

export async function resetDatabaseSeed() {
  const res = await fetchWithFallback('/seed/reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to reset database seed');
  return res.json();
}

export async function fetchForecastingStatus() {
  const res = await fetchWithFallback('/forecasting/status');
  if (!res.ok) throw new Error('Failed to fetch forecasting engine status');
  return res.json();
}

export async function fetchForecastingBenchmark() {
  const res = await fetchWithFallback('/forecasting/benchmark');
  if (!res.ok) throw new Error('Failed to fetch forecasting benchmark results');
  return res.json();
}
