import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase, getSupabaseProfile, isSupabaseConfigured } from '../supabase';
import { UserProfile } from '../types';
import { getOrCreateUser } from '../utils/auth';

interface RuntimeState {
  user: any | null;
  profile: UserProfile | null;
  isLoading: boolean;
  activityProgress: any[];
  setProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  saveStageLocally: (stageData: any) => void;
  syncCompletion: (finalScore: number) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}

const RuntimeContext = createContext<RuntimeState | null>(null);

export const RuntimeProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem("zupskill_sim_profile");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      username: "Beta_Innovator_9", college: "Stanford Design Lab", level: "Explorer",
      xp: 60, unlockedBadgeIds: ["problem-hunter"], problemsSolved: 0, ideasGenerated: 0, prototypesBuilt: 0, isOnboarded: false
    };
  });
  const [isLoading, setIsLoading] = useState(true);
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
      
      const cloudProfile = await getSupabaseProfile(currentUser.id);
      if (cloudProfile) {
        setProfile((prev: any) => ({
          ...prev, ...cloudProfile,
          username: cloudProfile.username || currentUser.full_name || currentUser.email?.split("@")[0] || "Innovator",
          email: currentUser.email || "",
          photoURL: currentUser.avatar_url || "",
          lastCompletedSimulation: cloudProfile.lastCompletedSimulation || prev?.lastCompletedSimulation
        }));
      } else {
        setProfile((prev: any) => ({
          ...prev, uid: currentUser.id,
          username: currentUser.full_name || currentUser.email?.split("@")[0] || "Innovator",
          email: currentUser.email || "", photoURL: currentUser.avatar_url || "",
          level: "Explorer", xp: 60, unlockedBadgeIds: ["problem-hunter"], isOnboarded: false
        }));
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
          await supabase.auth.exchangeCodeForSession(code);
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch (e) {}

      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        await loadUserProfile(data.session.user);
      }
      setIsLoading(false);
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === 'INITIAL_SESSION') return;
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

  const syncCompletion = useCallback(async (finalScore: number) => {
    if (!user || !isSupabaseConfigured) return;
    
    if (activityProgress.length > 0) {
      const payloads = activityProgress.map(p => ({
        ...p,
        user_id: user.id,
        updated_at: new Date().toISOString(),
        task_id: parseFloat(p.task_id)
      }));
      try {
        const { error } = await supabase.from("activity_designthinking").insert(payloads);
        if (error) console.error("Final sync failed:", error);
      } catch (err) {
        console.error(err);
      }
    }
    
    try {
      await supabase.functions.invoke("progress-engine", {
        body: {
          action: "complete_simulator",
          activity_id: "S003",
          activity_name: "Design Thinking",
          final_score: finalScore
        }
      });
    } catch (err) {
      console.error("Failed to update achievements", err);
    }
    
    setActivityProgress([]);
    localStorage.removeItem("zupskill_sim_draft_progress");
  }, [user, activityProgress]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!isSupabaseConfigured) {
      alert("Please connect Supabase first");
      return;
    }
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin }
    });
  }, []);

  useEffect(() => {
    if (profile) {
      localStorage.setItem("zupskill_sim_profile", JSON.stringify(profile));
    }
  }, [profile]);

  return (
    <RuntimeContext.Provider value={{
      user, profile, isLoading, activityProgress, setProfile,
      saveStageLocally, syncCompletion, signOut, signInWithGoogle
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
