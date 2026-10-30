import crypto from "crypto";

export interface AttemptRecord {
  attemptId: string;
  userId: string;
  activityId: string;
  status: "in_progress" | "completed" | "abandoned";
  createdAt: number;
  completedAt?: number;
  authoritativeScore?: number;
  breakdown?: any;
  progressEngineStatus?: "success" | "skipped" | "error";
  progressEngineError?: string;
}

// In-memory attempts store (indexed by attemptId)
const attemptsStore = new Map<string, AttemptRecord>();

// Concurrency mutex for in-flight completions to prevent race-condition replays
const inFlightCompletions = new Map<string, Promise<any>>();

// Cleanup stale attempts older than 24 hours every 15 minutes
setInterval(() => {
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  for (const [id, attempt] of attemptsStore.entries()) {
    if (attempt.createdAt < oneDayAgo) {
      attemptsStore.delete(id);
    }
  }
}, 15 * 60 * 1000);

/**
 * Creates a new secure, server-issued attempt ID for a user.
 */
export function createServerAttempt(userId: string, activityId: string = "S003"): AttemptRecord {
  const attemptId = crypto.randomUUID();
  const now = Date.now();

  const record: AttemptRecord = {
    attemptId,
    userId,
    activityId,
    status: "in_progress",
    createdAt: now,
  };

  attemptsStore.set(attemptId, record);
  return record;
}

/**
 * Retrieves an attempt record by ID.
 */
export function getAttempt(attemptId: string): AttemptRecord | undefined {
  if (!attemptId || typeof attemptId !== "string") return undefined;
  return attemptsStore.get(attemptId);
}

/**
 * Marks any existing in-progress attempts for this user as abandoned (e.g. upon reset).
 */
export function abandonUserAttempts(userId: string, activityId: string = "S003"): void {
  for (const attempt of attemptsStore.values()) {
    if (attempt.userId === userId && attempt.activityId === activityId && attempt.status === "in_progress") {
      attempt.status = "abandoned";
    }
  }
}

/**
 * Executes a completion operation with atomic concurrency locking.
 * If another request for the same attemptId is already executing, waits for it to complete.
 * If already completed, returns the previously cached authoritative result immediately (idempotency).
 */
export async function executeAtomicCompletion<T>(
  attemptId: string,
  handler: () => Promise<T>
): Promise<{ result: T; wasReplay: boolean }> {
  const attempt = attemptsStore.get(attemptId);
  if (!attempt) {
    throw new Error("Attempt not found");
  }

  // 1. If already completed, return cached result (Replay / Idempotent path)
  if (attempt.status === "completed") {
    return {
      result: {
        authoritativeScore: attempt.authoritativeScore,
        breakdown: attempt.breakdown,
        completedAt: attempt.completedAt,
        progressEngineStatus: attempt.progressEngineStatus,
        replay: true,
      } as unknown as T,
      wasReplay: true,
    };
  }

  // 2. If another completion request is currently executing in-flight, await it
  const existingInFlight = inFlightCompletions.get(attemptId);
  if (existingInFlight) {
    const res = await existingInFlight;
    return { result: res, wasReplay: true };
  }

  // 3. Execute handler with lock
  const executionPromise = (async () => {
    try {
      const res = await handler();
      return res;
    } finally {
      inFlightCompletions.delete(attemptId);
    }
  })();

  inFlightCompletions.set(attemptId, executionPromise);
  const result = await executionPromise;
  return { result, wasReplay: false };
}

/**
 * Finalizes an attempt record as completed.
 */
export function finalizeAttempt(
  attemptId: string,
  data: {
    authoritativeScore: number;
    breakdown: any;
    progressEngineStatus: "success" | "skipped" | "error";
    progressEngineError?: string;
  }
): AttemptRecord | undefined {
  const attempt = attemptsStore.get(attemptId);
  if (!attempt) return undefined;

  attempt.status = "completed";
  attempt.completedAt = Date.now();
  attempt.authoritativeScore = data.authoritativeScore;
  attempt.breakdown = data.breakdown;
  attempt.progressEngineStatus = data.progressEngineStatus;
  attempt.progressEngineError = data.progressEngineError;

  return attempt;
}
