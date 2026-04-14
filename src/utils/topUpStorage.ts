const STORAGE_KEY = 'topup_pending_payment';
const MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes

export interface TopUpPendingInfo {
  amount_kopeks: number;
  method_id: string;
  method_name: string;
  payment_id: string;
  created_at: number; // Date.now()
  /** Ozon SBP / other manual-credit flows */
  requires_manual_credit?: boolean;
  manual_credit_eta_minutes?: number | null;
  manual_credit_message?: string | null;
  support_contact_url?: string | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function saveTopUpPendingInfo(info: TopUpPendingInfo) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(info));
  } catch {}
}

export function loadTopUpPendingInfo(): TopUpPendingInfo | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      !isRecord(parsed) ||
      typeof parsed.amount_kopeks !== 'number' ||
      typeof parsed.method_id !== 'string' ||
      typeof parsed.method_name !== 'string' ||
      typeof parsed.payment_id !== 'string' ||
      typeof parsed.created_at !== 'number' ||
      parsed.amount_kopeks <= 0
    ) {
      return null;
    }
    // Discard stale entries
    if (Date.now() - (parsed.created_at as number) > MAX_AGE_MS) {
      clearTopUpPendingInfo();
      return null;
    }
    const out: TopUpPendingInfo = {
      amount_kopeks: parsed.amount_kopeks as number,
      method_id: parsed.method_id as string,
      method_name: parsed.method_name as string,
      payment_id: parsed.payment_id as string,
      created_at: parsed.created_at as number,
    };
    if (typeof parsed.requires_manual_credit === 'boolean') {
      out.requires_manual_credit = parsed.requires_manual_credit;
    }
    if (typeof parsed.manual_credit_eta_minutes === 'number') {
      out.manual_credit_eta_minutes = parsed.manual_credit_eta_minutes;
    }
    if (typeof parsed.manual_credit_message === 'string') {
      out.manual_credit_message = parsed.manual_credit_message;
    }
    if (typeof parsed.support_contact_url === 'string') {
      out.support_contact_url = parsed.support_contact_url;
    }
    return out;
  } catch {
    return null;
  }
}

export function clearTopUpPendingInfo() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {}
}
