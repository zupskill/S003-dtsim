import { supabase } from "../supabase";

export interface SafeResponseResult {
  ok: boolean;
  status: number;
  statusText: string;
  data: any | null;
  text: string;
  error: string;
}

/**
 * Robust, authenticated fetch wrapper for simulator API requests.
 * Automatically injects the Supabase access token as a Bearer Authorization header.
 */
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers = new Headers(
    init?.headers || (typeof input === "object" && "headers" in input ? (input as any).headers : {})
  );

  if (!headers.has("Authorization")) {
    try {
      let { data: { session } } = await supabase.auth.getSession();

      // If token is expired or close to expiry (within 30 seconds), refresh session
      if (session && session.expires_at && (session.expires_at * 1000) < Date.now() + 30000) {
        const { data: refreshData } = await supabase.auth.refreshSession();
        if (refreshData?.session) {
          session = refreshData.session;
        }
      }

      const token = session?.access_token;
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
    } catch (err) {
      console.warn("[API] Auth session token retrieval error:", err);
    }
  }

  return fetch(input, { ...init, headers });
}

/**
 * Safely parses response body (JSON or text) and extracts status, data, and diagnostic errors.
 * Never throws on non-JSON or HTML error responses.
 */
export async function safeReadResponse(res: Response): Promise<SafeResponseResult> {
  const status = res.status;
  const statusText = res.statusText;
  const ok = res.ok;
  let text = "";
  let data: any = null;

  try {
    text = await res.text();
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }
    }
  } catch (err: any) {
    text = `Failed to read response body: ${err?.message || String(err)}`;
  }

  let error = "";
  if (!ok || (data && data.success === false)) {
    error =
      data?.error ||
      data?.message ||
      (text && !text.startsWith("<") ? text.slice(0, 200) : "") ||
      statusText ||
      `HTTP Error ${status}`;
  }

  return { ok, status, statusText, data, text, error };
}
