import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase, getSupabaseProfile, isSupabaseConfigured } from '../supabase';
import { UserProfile } from '../types';
import { getOrCreateUser } from '../utils/auth';
import { apiFetch } from '../utils/api';

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
      const currentUser = await getOrCreateUser();
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

  const startAttempt = useCallback(async (): Promise<string | null> => {
    if (!user) return null;
    try {
      const res = await apiFetch("./api/simulator/attempt/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.attemptId) {
          setAttemptId(data.attemptId);
          localStorage.setItem("zupskill_sim_attempt_id", data.attemptId);
          return data.attemptId;
        }
      }
    } catch (err) {
      console.error("Failed to start simulator attempt:", err);
    }
    return null;
  }, [user]);

  const syncCompletion = useCallback(async (evidence?: any): Promise<{ success: boolean; authoritativeScore: number; breakdown: any; replay?: boolean } | null> => {
    if (!user) return null;

    // Ensure we have a server-issued attempt ID
    let currentAttemptId = attemptId || localStorage.getItem("zupskill_sim_attempt_id");
    if (!currentAttemptId) {
      currentAttemptId = await startAttempt();
    }

    if (!currentAttemptId) {
      console.error("Cannot complete simulation without a valid server attempt ticket.");
      return null;
    }

    try {
      const payload = {
        attemptId: currentAttemptId,
        problemObservations: evidence?.problemObservations || [],
        refinedHowMightWe: evidence?.refinedHowMightWe || "",
        ideas: evidence?.ideas || [],
        selectedPrototype: evidence?.selectedPrototype || null,
        testingData: evidence?.testingData || {},
        aiThoughtfulness: evidence?.aiThoughtfulness || 0,
        stages: activityProgress
      };

      const res = await apiFetch("./api/simulator/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        // Clear local draft progress upon verified server completion
        setActivityProgress([]);
        localStorage.removeItem("zupskill_sim_draft_progress");
        return data;
      } else {
        const errData = await res.json().catch(() => ({ error: "Server completion failed" }));
        console.error("Server authoritative completion error:", errData);
        return null;
      }
    } catch (err) {
      console.error("Exception during server completion:", err);
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
