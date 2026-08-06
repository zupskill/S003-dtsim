import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# 1. Add import
if 'useRuntime' not in content:
    content = content.replace('import App from "./App.tsx";', '') # Not needed, just replacing below
    content = content.replace('export default function App() {', 'import { useRuntime } from "./contexts/RuntimeContext";\n\nexport default function App() {')

# 2. Remove states and auth effect
start_idx = content.find('  const [user, setUser] = useState<any>(null);')
end_idx = content.find('  // Redirect to Auth or Onboarding based on session status')

if start_idx != -1 and end_idx != -1:
    old_state_block = content[start_idx:end_idx]
    new_state_block = """  const { 
    user, profile, setProfile, isLoading: loadingAuth, 
    saveStageLocally, syncCompletion, signOut, signInWithGoogle 
  } = useRuntime();
"""
    content = content.replace(old_state_block, new_state_block)

# 3. Replace auth handlers
content = content.replace("""  const handleSignInWithGoogle = async () => {
    if (!isSupabaseConfigured) {
      alert("Please connect Supabase first (or add mock logic here)");
      return;
    }
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin
      }
    });
  };""", "")
content = content.replace("handleSignInWithGoogle", "signInWithGoogle")

content = content.replace("""  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };""", "")
content = content.replace("handleSignOut", "signOut")

# 4. Replace saveStageProgress calls
save_regex = r'import\("./supabase"\)\.then\(mod => mod\.saveStageProgress\(\{(.*?)\}\)\);'
content = re.sub(save_regex, r'saveStageLocally({\1});', content, flags=re.DOTALL)

# 5. Replace final sync in stage 6
final_sync_regex = r'try \{\s*const \{ saveStageProgress \} = await import\("./supabase"\);\s*await saveStageProgress\(\{(.*?)\}\);\s*\} catch \(err\) \{\s*console\.error\("Failed to save stage progress", err\);\s*\}\s*try \{\s*await supabase\.functions\.invoke\("progress-engine", \{(.*?)\}\);\s*\} catch \(err\) \{\s*console\.error\("Failed to update achievements", err\);\s*\}'
new_final_sync = """saveStageLocally({\\1});
                        await syncCompletion(overallScore);"""
content = re.sub(final_sync_regex, new_final_sync, content, flags=re.DOTALL)

with open('src/App.tsx', 'w') as f:
    f.write(content)
