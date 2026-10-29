import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase, getSupabaseProfile, isSupabaseConfigured } from '../supabase';
import { UserProfile } from '../types';
import { getOrCreateUser } from '../utils/auth';
import { apiFetch, safeReadResponse } from '../utils/api';

interface RuntimeState {
  user: any | null;
  profile: UserProfile | null;
  isLoading: boolean;
  activityProgress: any[];
  attemptId: string | null;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  saveStageLocally: (stageData: any) => void;
  startAttempt: () => Promise<string | null>;
  syncCompletion: (evidence?: any) => Promise<{ success: boolean; authoritativeScore: number; breakdown: any; replay?: boolean } | null>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}

const RuntimeContext = createContext<RuntimeState | null>(null);

export const RuntimeProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    return {
      username: "Beta_Innovator_9", college: "Stanford Design Lab", level: "Explorer",
      xp: 60, unlockedBadgeIds: ["problem-hunter"], problemsSolved: 0, ideasGenerated: 0, prototypesBuilt: 0, isOnboarded: false
    };
  });
  const [isLoading, setIsLoading] = useState(true);
  const [attemptId, setAttemptId] = useState<string | null>(() => {
    return localStorage.getItem("zupskill_sim_attempt_id");
  });
  const [activityProgress, setActivityProgress] = useState<any[]>(() => {
    const drafts = localStorage.getItem("zupskill_sim_draft_progress");
    if (drafts) {
      try { return JSON.parse(drafts); } catch(e) {}
    }
    return [];
  });

  const loadUserProfile = useCallback(async (authUser: any) => {
    try {
      const currentUser = await getOrCreateUser(authUser);
      if (!currentUser) {
        console.error("Failed to initialize central user record.");
        return;
      }
      
      const cacheKey = `zupskill_sim_profile_${currentUser.id}`;
      const cached = localStorage.getItem(cacheKey);
      
      let localProfile = null;
      if (cached) {
         try { localProfile = JSON.parse(cached); } catch(e) {}
      }

      if (localProfile) {
        // Use local cache to prevent Supabase egress
        setProfile({
          ...localProfile,
          uid: currentUser.id,
          username: localProfile.username || currentUser.full_name || currentUser.email?.split("@")[0] || "Innovator",
          email: currentUser.email || "",
          photoURL: currentUser.avatar_url || ""
        });
        return;
      }

      const cloudProfile = await getSupabaseProfile(currentUser.id);
      if (cloudProfile) {
        setProfile({
          ...cloudProfile,
          uid: currentUser.id,
          username: cloudProfile.username || currentUser.full_name || currentUser.email?.split("@")[0] || "Innovator",
          email: currentUser.email || "",
          photoURL: currentUser.avatar_url || ""
        });
      } else {
        setProfile({
          uid: currentUser.id,
          username: currentUser.full_name || currentUser.email?.split("@")[0] || "Innovator",
          email: currentUser.email || "", photoURL: currentUser.avatar_url || "",
          level: "Explorer", xp: 60, unlockedBadgeIds: ["problem-hunter"], isOnboarded: false,
          problemsSolved: 0, ideasGenerated: 0, prototypesBuilt: 0
        });
      }
    } catch (err) {
      console.error("Profile load error:", err);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const initializeAuth = async () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const code = searchParams.get('code');
        if (code) {
          console.log("[AUTH] User selected account");
          await supabase.auth.exchangeCodeForSession(code);
          console.log("[AUTH] Authentication successful");
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch (e) {}

      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      if (data.session?.user) {
        console.log("[AUTH] Found existing session");
      }
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        await loadUserProfile(data.session.user);
      }
      setIsLoading(false);
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`[AUTH] Auth state changed: ${event}`);
      if (!mounted) return;
      if (event === 'INITIAL_SESSION') return;
      if (event === 'SIGNED_IN') {
        console.log("[AUTH] Authentication successful");
      }
      setUser(session?.user ?? null);
      if (session?.user) {
        setIsLoading(true);
        loadUserProfile(session.user).finally(() => {
          if (mounted) setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadUserProfile]);

  const saveStageLocally = useCallback((stageData: any) => {
    setActivityProgress(prev => {
      const exists = prev.findIndex(p => p.task_id === stageData.task_id);
      let updated = [...prev];
      if (exists !== -1) {
        updated[exists] = stageData;
      } else {
        updated.push(stageData);
      }
      localStorage.setItem("zupskill_sim_draft_progress", JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Sync user-scoped attempt ID when authenticated user changes
  useEffect(() => {
    if (user?.id) {
      const userKey = `zupskill_sim_attempt_id_${user.id}`;
      const saved = localStorage.getItem(userKey);
      if (saved) {
        setAttemptId(saved);
      } else {
        // Discard any cross-user stale attempt in legacy storage
        const generic = localStorage.getItem("zupskill_sim_attempt_id");
        if (generic) {
          localStorage.removeItem("zupskill_sim_attempt_id");
        }
        setAttemptId(null);
      }
    } else {
      setAttemptId(null);
    }
  }, [user?.id]);

  const startAttempt = useCallback(async (): Promise<string | null> => {
    if (!user) {
      console.warn("[SIMULATOR] Cannot start attempt: User is not authenticated.");
      return null;
    }
    try {
      console.log("[SIMULATOR] Requesting attempt ticket from /api/simulator/attempt/start...");
      const res = await apiFetch("/api/simulator/attempt/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const result = await safeReadResponse(res);
      if (result.ok && result.data?.attemptId) {
        console.log("[SIMULATOR] Acquired server attempt ticket:", result.data.attemptId);
        setAttemptId(result.data.attemptId);
        if (user?.id) {
          localStorage.setItem(`zupskill_sim_attempt_id_${user.id}`, result.data.attemptId);
        }
        localStorage.setItem("zupskill_sim_attempt_id", result.data.attemptId);
        return result.data.attemptId;
      } else {
        console.error("[SIMULATOR ERROR] Failed to start simulator attempt:", {
          status: result.status,
          statusText: result.statusText,
          error: result.error,
          body: result.text,
          data: result.data
        });
      }
    } catch (err) {
      console.error("[SIMULATOR ERROR] Exception starting simulator attempt:", err);
    }
    return null;
  }, [user]);

  const syncCompletion = useCallback(async (evidence?: any): Promise<{ success: boolean; authoritativeScore: number; breakdown: any; replay?: boolean; dbPersisted?: boolean } | null> => {
    if (!user) {
      console.error("[SIMULATOR ERROR] syncCompletion aborted: No authenticated user session found.");
      return null;
    }

    // Ensure we have a server-issued attempt ID for the current authenticated user
    const userKey = `zupskill_sim_attempt_id_${user.id}`;
    let currentAttemptId = attemptId || localStorage.getItem(userKey) || localStorage.getItem("zupskill_sim_attempt_id");
    if (!currentAttemptId) {
      console.log("[SIMULATOR] No attemptId in state/storage, requesting new attempt ticket...");
      currentAttemptId = await startAttempt();
    }

    if (!currentAttemptId) {
      console.error("[SIMULATOR ERROR] Cannot complete simulation without a valid server attempt ticket.");
      return null;
    }

    const submitPayload = async (targetAttemptId: string) => {
      const payload = {
        attemptId: targetAttemptId,
        problemObservations: evidence?.problemObservations || [],
        refinedHowMightWe: evidence?.refinedHowMightWe || "",
        ideas: evidence?.ideas || [],
        selectedPrototype: evidence?.selectedPrototype || null,
        testingData: evidence?.testingData || {},
        aiThoughtfulness: evidence?.aiThoughtfulness || 0,
        selectedTopic: evidence?.selectedTopic || null,
        stages: activityProgress
      };

      console.log("[SIMULATOR] Submitting completion payload to /api/simulator/complete for attempt:", targetAttemptId);
      return apiFetch("/api/simulator/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    };

    try {
      let res = await submitPayload(currentAttemptId);

      // Automatic recovery if attempt ticket is expired (404) or belonged to a previous user (403)
      if (!res.ok && (res.status === 403 || res.status === 404)) {
        console.warn(`[SIMULATOR RECOVERY] Attempt ticket ${currentAttemptId} rejected (${res.status}). Acquiring fresh attempt ticket for user ${user.id}...`);
        localStorage.removeItem("zupskill_sim_attempt_id");
        localStorage.removeItem(userKey);
        setAttemptId(null);

        const freshAttemptId = await startAttempt();
        if (freshAttemptId) {
          console.log("[SIMULATOR RECOVERY] Retrying completion with fresh attempt ticket:", freshAttemptId);
          res = await submitPayload(freshAttemptId);
        }
      }

      const result = await safeReadResponse(res);
      if (result.ok && result.data && result.data.success === true) {
        const data = result.data;
        console.log("[SIMULATOR SUCCESS] Server confirmed simulation completion & Supabase persistence:", data);
        // Clear local draft progress ONLY upon verified server confirmation
        setActivityProgress([]);
        localStorage.removeItem("zupskill_sim_draft_progress");

        // Notify parent iframe / window of completion for ZupSkill integration
        try {
          if (window.parent && window.parent !== window) {
            window.parent.postMessage({
              type: "ZUPSKILL_SIMULATOR_COMPLETED",
              simulatorId: "S003",
              activityId: "S003",
              activityName: "Design Thinking",
              score: data.authoritativeScore,
              breakdown: data.breakdown,
              success: true
            }, "*");
          }
        } catch (e) {
          console.warn("Could not postMessage to parent window:", e);
        }

        return data;
      } else {
        console.error("[SIMULATOR ERROR] Server authoritative completion failed:", {
          status: result.status,
          statusText: result.statusText,
          error: result.error,
          body: result.text,
          data: result.data
        });
        return null;
      }
    } catch (err) {
      console.error("[SIMULATOR ERROR] Exception during server completion:", err);
      return null;
    }
  }, [user, attemptId, startAttempt, activityProgress]);

  const signOut = useCallback(async () => {
    console.log("[AUTH] Logout initiated");
    await supabase.auth.signOut();
    console.log("[AUTH] Supabase session cleared");
    setUser(null);
    setProfile(null);
    setActivityProgress([]);
    setAttemptId(null);
    localStorage.removeItem("zupskill_sim_attempt_id");
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("zupskill_sim_")) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
    console.log("[AUTH] Local auth state cleared");
  }, []);

  const signInWithGoogle = useCallback(async () => {
    console.log("[AUTH] Google OAuth initiated");
    if (!isSupabaseConfigured) {
      alert("Please connect Supabase first");
      return;
    }
    console.log("[AUTH] Account chooser requested");
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { 
        redirectTo: window.location.origin + window.location.pathname,
        queryParams: {
          prompt: 'select_account'
        }
      }
    });
  }, []);

  useEffect(() => {
    if (profile && profile.uid) {
      localStorage.setItem(`zupskill_sim_profile_${profile.uid}`, JSON.stringify(profile));
    }
  }, [profile]);

  return (
    <RuntimeContext.Provider value={{
      user, profile, isLoading, activityProgress, attemptId, setProfile,
      saveStageLocally, startAttempt, syncCompletion, signOut, signInWithGoogle
    }}>
      {children}
    </RuntimeContext.Provider>
  );
};

export const useRuntime = () => {
  const ctx = useContext(RuntimeContext);
  if (!ctx) throw new Error("useRuntime must be used within RuntimeProvider");
  return ctx;
};
