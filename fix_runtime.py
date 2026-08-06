import re

with open('src/contexts/RuntimeContext.tsx', 'r') as f:
    content = f.read()

# 1. useState for profile
target_state = """  const [profile, setProfile] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem("zupskill_sim_profile");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      username: "Beta_Innovator_9", college: "Stanford Design Lab", level: "Explorer",
      xp: 60, unlockedBadgeIds: ["problem-hunter"], problemsSolved: 0, ideasGenerated: 0, prototypesBuilt: 0, isOnboarded: false
    };
  });"""

replacement_state = """  const [profile, setProfile] = useState<UserProfile | null>(null);"""

content = content.replace(target_state, replacement_state)

# 2. loadUserProfile
target_load = """  const loadUserProfile = useCallback(async (authUser: any) => {
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
  }, []);"""

replacement_load = """  const loadUserProfile = useCallback(async (authUser: any) => {
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
  }, []);"""

content = content.replace(target_load, replacement_load)

# 3. useEffect for saving
target_effect = """  useEffect(() => {
    if (profile) {
      localStorage.setItem("zupskill_sim_profile", JSON.stringify(profile));
    }
  }, [profile]);"""

replacement_effect = """  useEffect(() => {
    if (profile && profile.uid) {
      localStorage.setItem(`zupskill_sim_profile_${profile.uid}`, JSON.stringify(profile));
    }
  }, [profile]);"""

content = content.replace(target_effect, replacement_effect)

with open('src/contexts/RuntimeContext.tsx', 'w') as f:
    f.write(content)
