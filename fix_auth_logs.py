import re

with open('src/contexts/RuntimeContext.tsx', 'r') as f:
    content = f.read()

target_signout = """  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setActivityProgress([]);
    for (const key in localStorage) {
      if (key.startsWith("zupskill_sim_")) {
        localStorage.removeItem(key);
      }
    }
  }, []);"""

replacement_signout = """  const signOut = useCallback(async () => {
    console.log("[AUTH] Logout initiated");
    await supabase.auth.signOut();
    console.log("[AUTH] Supabase session cleared");
    setUser(null);
    setProfile(null);
    setActivityProgress([]);
    for (const key in localStorage) {
      if (key.startsWith("zupskill_sim_")) {
        localStorage.removeItem(key);
      }
    }
    console.log("[AUTH] Local auth state cleared");
  }, []);"""

content = content.replace(target_signout, replacement_signout)

target_signin = """  const signInWithGoogle = useCallback(async () => {
    if (!isSupabaseConfigured) {
      alert("Please connect Supabase first");
      return;
    }
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { 
        redirectTo: window.location.origin,
        queryParams: {
          prompt: 'select_account'
        }
      }
    });
  }, []);"""

replacement_signin = """  const signInWithGoogle = useCallback(async () => {
    console.log("[AUTH] Google OAuth initiated");
    if (!isSupabaseConfigured) {
      alert("Please connect Supabase first");
      return;
    }
    console.log("[AUTH] Account chooser requested");
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { 
        redirectTo: window.location.origin,
        queryParams: {
          prompt: 'select_account'
        }
      }
    });
  }, []);"""

content = content.replace(target_signin, replacement_signin)

with open('src/contexts/RuntimeContext.tsx', 'w') as f:
    f.write(content)
