import re

with open('src/contexts/RuntimeContext.tsx', 'r') as f:
    content = f.read()

target = """  const signInWithGoogle = useCallback(async () => {
    if (!isSupabaseConfigured) {
      alert("Please connect Supabase first");
      return;
    }
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin }
    });
  }, []);"""

replacement = """  const signInWithGoogle = useCallback(async () => {
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

content = content.replace(target, replacement)

with open('src/contexts/RuntimeContext.tsx', 'w') as f:
    f.write(content)
