import { Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";

const supabaseAuthClient = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    })
  : null;

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

export async function requireSupabaseAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  // 1. Missing Authorization header
  if (!authHeader) {
    res.status(401).json({ error: "Unauthorized: Missing Authorization header" });
    return;
  }

  // 2. Malformed or Empty Bearer Token
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    res.status(401).json({ error: "Unauthorized: Missing, empty, or malformed Bearer token" });
    return;
  }

  const token = match[1].trim();
  if (!token) {
    res.status(401).json({ error: "Unauthorized: Empty Bearer token" });
    return;
  }

  // Development/Test harness support for non-production environments
  if (process.env.NODE_ENV !== "production" && token.startsWith("test_user_token_")) {
    const userId = token.replace("test_user_token_", "");
    req.user = { id: userId, email: `${userId}@test.local` };
    req.userId = userId;
    next();
    return;
  }

  // Check in-memory verification cache
  const cached = tokenVerificationCache.get(token);
  if (cached && Date.now() < cached.expiresAt) {
    req.user = cached.user;
    req.userId = cached.user.id;
    next();
    return;
  }

  if (!supabaseAuthClient) {
    // If Supabase is completely unconfigured, reject unauthorized access
    res.status(500).json({ error: "Server authentication service unconfigured" });
    return;
  }

  try {
    const { data, error } = await supabaseAuthClient.auth.getUser(token);

    if (error || !data?.user) {
      // 3 & 4. Malformed or Invalid/Expired JWT
      res.status(401).json({
        error: "Unauthorized: Invalid or expired Bearer token",
        details: error?.message || "User not found"
      });
      return;
    }

    // Cache valid token for 60 seconds
    tokenVerificationCache.set(token, {
      user: data.user,
      expiresAt: Date.now() + 60 * 1000
    });

    req.user = data.user;
    req.userId = data.user.id;
    next();
  } catch (err: any) {
    res.status(401).json({ error: "Unauthorized: Authentication verification failed" });
  }
}
