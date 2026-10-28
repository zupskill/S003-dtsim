import { supabase } from "../supabase";

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
