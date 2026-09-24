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
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
    } catch (err) {
      console.warn("[API] Auth session token retrieval error:", err);
    }
  }

  return fetch(input, { ...init, headers });
}
