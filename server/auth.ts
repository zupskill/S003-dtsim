import { Request, Response, NextFunction } from "express";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

// Helper to get or create Supabase Auth Client dynamically
function getSupabaseAuthClient(): SupabaseClient | null {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  try {
    return createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        fetch: (url, options) => {
          return fetch(url, {
            ...options,
            signal: AbortSignal.timeout(3000)
          });
        }
      }
    });
  } catch (err) {
    console.warn("[AUTH] Failed to create Supabase auth client:", err);
    return null;
  }
}

// Short-lived token cache (60 seconds) to avoid network latency while maintaining security
interface VerifiedTokenCache {
  user: any;
  expiresAt: number;
}
const tokenVerificationCache = new Map<string, VerifiedTokenCache>();

export interface AuthenticatedRequest extends Request {
  user?: any;
  userId?: string;
}

/**
 * Diagnostic helper to safely decode Base64/Base64Url JWT payload for logging/diagnostics.
 * CRITICAL SECURITY: This must NEVER be used for authentication or authorization.
 */
export function decodeJwtPayloadForDiagnostics(token: string): any | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = Buffer.from(base64, "base64").toString("utf8");
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export async function requireSupabaseAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    // 1. Missing Authorization header
    if (!authHeader) {
      res.status(401).json({ error: "Unauthorized: Missing Authorization header", success: false });
      return;
    }

    // 2. Malformed or Empty Bearer Token
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!match) {
      res.status(401).json({ error: "Unauthorized: Missing, empty, or malformed Bearer token", success: false });
      return;
    }

    const token = match[1].trim();
    if (!token) {
      res.status(401).json({ error: "Unauthorized: Empty Bearer token", success: false });
      return;
    }

    // Development/Test harness support for non-production environments
    if (process.env.NODE_ENV !== "production" && token.startsWith("test_user_token_")) {
      let userId = token.replace("test_user_token_", "");
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId)) {
        userId = "4ba2e060-4ea9-4153-9b5c-c65094c2433c";
      }
      req.user = { id: userId, email: `${userId}@test.local` };
      req.userId = userId;
      next();
      return;
    }

    // Check in-memory verification cache (stores only cryptographically verified users)
    const cached = tokenVerificationCache.get(token);
    if (cached && Date.now() < cached.expiresAt) {
      req.user = cached.user;
      req.userId = cached.user.id;
      next();
      return;
    }

    // Dynamic resolution of Supabase Auth Client
    const client = getSupabaseAuthClient();
    if (!client) {
      // Fail closed if server authentication service / Supabase credentials are missing
      res.status(503).json({
        error: "Server authentication service unavailable: Supabase credentials not configured",
        success: false
      });
      return;
    }

    // Cryptographically verify token with Supabase Auth getUser(token) (with 5s timeout guard)
    const authPromise = client.auth.getUser(token);
    const timeoutPromise = new Promise<{ data: any; error: any }>((_, reject) =>
      setTimeout(() => reject(new Error("Supabase auth verification timeout")), 5000)
    );

    const { data, error } = await Promise.race([authPromise, timeoutPromise]).catch((err: any) => ({
      data: null,
      error: err
    }));

    if (error || !data?.user?.id) {
      if (error) {
        console.warn("[AUTH] Supabase auth verification failed:", error.message || error);
      }
      res.status(401).json({
        error: "Unauthorized: Invalid, expired, or untrusted Bearer token",
        success: false
      });
      return;
    }

    // Cache cryptographically verified token for 60 seconds
    tokenVerificationCache.set(token, {
      user: data.user,
      expiresAt: Date.now() + 60 * 1000
    });

    req.user = data.user;
    req.userId = data.user.id;
    next();
  } catch (err: any) {
    console.error("[AUTH EXCEPTION] Error in requireSupabaseAuth:", err?.message || err);
    res.status(401).json({ error: "Unauthorized: Authentication verification failed", success: false });
  }
}
