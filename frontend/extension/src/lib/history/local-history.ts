/**
 * Local transaction history (chrome.storage).
 * Free: last 5 entries. Pro: soft-capped (effectively unlimited until cloud DB).
 */

export interface HistoryEntry {
  id: string;
  signature: string | null;
  type: string;
  from_address: string;
  to_address: string;
  amount: string;
  token_address?: string | null;
  risk_score: number;
  risk_level: string;
  risk_reasons: string[];
  status: string;
  analyzed_at: string;
  created_at: string;
  source?: string;
}

const KEY = 'vetraHistory';

/** Free plan: only the last N transactions stay in local storage. */
export const FREE_HISTORY_LIMIT = 5;

/**
 * Pro plan: no product limit for now (cloud DB later).
 * Soft cap avoids blowing chrome.storage.local quota (~10MB).
 */
export const PRO_HISTORY_SOFT_LIMIT = 2000;

async function resolveHistoryCap(): Promise<number> {
  try {
    const { authState } = await chrome.storage.local.get('authState');
    const plan = String(
      authState?.user?.subscription_plan ||
        authState?.subscription_plan ||
        'free'
    ).toLowerCase();
    if (plan === 'pro' || plan === 'premium') return PRO_HISTORY_SOFT_LIMIT;
  } catch {
    /* ignore */
  }
  return FREE_HISTORY_LIMIT;
}

export async function appendLocalHistory(entry: HistoryEntry): Promise<void> {
  try {
    const cap = await resolveHistoryCap();
    const { [KEY]: raw } = await chrome.storage.local.get(KEY);
    const list: HistoryEntry[] = Array.isArray(raw) ? raw : [];
    const next = [entry, ...list.filter((e) => e.id !== entry.id)].slice(0, cap);
    await chrome.storage.local.set({ [KEY]: next });
  } catch (e) {
    console.warn('appendLocalHistory failed', e);
  }
}

export async function updateLocalHistoryStatus(
  id: string,
  status: string
): Promise<void> {
  try {
    const { [KEY]: raw } = await chrome.storage.local.get(KEY);
    const list: HistoryEntry[] = Array.isArray(raw) ? raw : [];
    const next = list.map((e) => (e.id === id ? { ...e, status } : e));
    await chrome.storage.local.set({ [KEY]: next });
  } catch (e) {
    console.warn('updateLocalHistoryStatus failed', e);
  }
}

export async function getLocalHistory(limit?: number): Promise<HistoryEntry[]> {
  try {
    const cap = limit ?? (await resolveHistoryCap());
    const { [KEY]: raw } = await chrome.storage.local.get(KEY);
    const list: HistoryEntry[] = Array.isArray(raw) ? raw : [];
    return list.slice(0, cap);
  } catch {
    return [];
  }
}

/** Trim stored history after plan downgrade (pro → free). */
export async function enforceHistoryQuota(): Promise<void> {
  try {
    const cap = await resolveHistoryCap();
    const { [KEY]: raw } = await chrome.storage.local.get(KEY);
    const list: HistoryEntry[] = Array.isArray(raw) ? raw : [];
    if (list.length > cap) {
      await chrome.storage.local.set({ [KEY]: list.slice(0, cap) });
    }
  } catch (e) {
    console.warn('enforceHistoryQuota failed', e);
  }
}

export function normalizeTxType(raw?: string): string {
  const s = String(raw || '').toLowerCase();
  if (['transfer', 'swap', 'approve', 'mint', 'burn', 'other'].includes(s)) return s;
  if (s.includes('transfer') || s === 'signtransaction') return 'transfer';
  if (s.includes('swap')) return 'swap';
  if (s.includes('approve')) return 'approve';
  if (s.includes('mint')) return 'mint';
  if (s.includes('burn')) return 'burn';
  return 'other';
}

/** Merge API rows + local rows (dedupe by id/signature), newest first. */
export function mergeHistory(
  apiRows: any[],
  localRows: HistoryEntry[],
  limit = 50
): any[] {
  const map = new Map<string, any>();
  for (const row of localRows) {
    const key = row.id || row.signature || JSON.stringify(row);
    map.set(String(key), row);
  }
  for (const row of apiRows || []) {
    const key = row.id || row.signature || JSON.stringify(row);
    map.set(String(key), { ...map.get(String(key)), ...row });
  }
  return Array.from(map.values())
    .sort((a, b) => {
      const ta = new Date(a.analyzed_at || a.created_at || 0).getTime();
      const tb = new Date(b.analyzed_at || b.created_at || 0).getTime();
      return tb - ta;
    })
    .slice(0, limit);
}
