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
 * Resolves the canonical backend API Base URL.
 * 1. Checks VITE_API_BASE_URL environment variable.
 * 2. If running on experience.zupskill.com (or any zupskill.com domain other than the standalone vercel app),
 *    defaults to https://s003-dtsim.vercel.app where the S003 Express backend is deployed.
 * 3. In standalone / preview / dev environments, returns empty string so relative paths work directly.
 */
export function getApiBaseUrl(): string {
  const envUrl = (import.meta as any).env?.VITE_API_BASE_URL;
  if (envUrl && typeof envUrl === "string" && envUrl.trim().length > 0) {
    return envUrl.trim().replace(/\/+$/, "");
  }

  if (typeof window !== "undefined" && window.location) {
    const hostname = window.location.hostname;
    // When embedded or hosted on experience.zupskill.com or any non-vercel zupskill domain
    if (hostname.includes("zupskill.com") && !hostname.includes("vercel.app")) {
      return "https://s003-dtsim.vercel.app";
    }
  }

  return "";
}

/**
 * Normalizes any relative or absolute API path to the canonical backend endpoint.
 * Ensures consistent routing whether running on standalone Vercel, localhost, or embedded in experience.zupskill.com.
 */
export function resolveApiUrl(input: RequestInfo | URL): RequestInfo | URL {
  if (typeof input !== "string") {
    return input;
  }

  // If already an absolute URL (http:// or https://), leave as-is
  if (/^https?:\/\//i.test(input)) {
    return input;
  }

  const baseUrl = getApiBaseUrl();
  
  // Normalize path: convert './api/...' or 'api/...' or '/api/...' to '/api/...'
  let cleanPath = input.trim();
  if (cleanPath.startsWith("./")) {
    cleanPath = cleanPath.slice(1); // becomes '/api/...'
  }
  if (!cleanPath.startsWith("/")) {
    cleanPath = "/" + cleanPath;
  }

  if (!baseUrl) {
    return cleanPath;
  }

  return `${baseUrl}${cleanPath}`;
}

/**
 * Robust, authenticated fetch wrapper for simulator API requests.
 * Automatically injects the Supabase access token as a Bearer Authorization header.
 * Automatically resolves relative paths to the canonical backend origin (e.g. https://s003-dtsim.vercel.app).
 */
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const targetUrl = resolveApiUrl(input);

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

  return fetch(targetUrl, { ...init, headers });
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
