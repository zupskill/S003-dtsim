import re

with open('src/contexts/RuntimeContext.tsx', 'r') as f:
    content = f.read()

target = """  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);"""

replacement = """  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setActivityProgress([]);
    localStorage.removeItem("zupskill_sim_profile");
    localStorage.removeItem("zupskill_sim_active_screen");
    localStorage.removeItem("zupskill_sim_draft_progress");
    localStorage.removeItem("zupskill_sim_current_stage");
  }, []);"""

content = content.replace(target, replacement)

with open('src/contexts/RuntimeContext.tsx', 'w') as f:
    f.write(content)
