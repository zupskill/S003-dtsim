import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

target = """  // FULL DEVELOPER/TESTING RESET
  const handleConfirmFullReset = () => {
    // 1. Clear all local storage keys starting with zupskill_
    const keysToRemove: string[] = [];"""

replacement = """  // FULL DEVELOPER/TESTING RESET
  const handleConfirmFullReset = async () => {
    console.log("[RESET] User confirmed reset");
    console.log("[RESET] Deleting current user's activity rows...");
    
    if (user) {
      try {
        const { supabase } = await import("./supabase");
        const { error, count } = await supabase
          .from("activity_designthinking")
          .delete({ count: 'exact' })
          .eq("user_id", user.id)
          .eq("activity_id", "S003");
        
        if (error) {
          console.error("[RESET] Delete failed. Supabase error:", error);
          console.log("Proceeding with local reset...");
        } else {
          console.log(`[RESET] Delete successful (${count || 0} rows removed)`);
        }
      } catch (err) {
        console.error("[RESET] Delete failed. Exception:", err);
        console.log("Proceeding with local reset...");
      }
    }

    console.log("[RESET] Clearing local state");
    // 1. Clear all local storage keys starting with zupskill_
    const keysToRemove: string[] = [];"""

content = content.replace(target, replacement)

target2 = """    setActiveScreen("landing");
    setShowResetConfirm(false);

    showToast("Session cleared & Reset complete! 🔄", "info");
  };"""

replacement2 = """    setActiveScreen("landing");
    setShowResetConfirm(false);

    console.log("[RESET] Reset complete");
    showToast("Session cleared & Reset complete! 🔄", "info");
  };"""

content = content.replace(target2, replacement2)

with open('src/App.tsx', 'w') as f:
    f.write(content)
