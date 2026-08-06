import { createClient } from "@supabase/supabase-js";
import { UserProfile } from "./types";
import { getOrCreateUser } from "./utils/auth";

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

const finalUrl = isSupabaseConfigured ? supabaseUrl : "https://placeholder-project.supabase.co";
const finalKey = isSupabaseConfigured ? supabaseAnonKey : "placeholder-key-xyz";

export const supabase = createClient(finalUrl, finalKey);

/**
 * Fetch unified profile and progress from Supabase
 */
export async function getSupabaseProfile(userId: string): Promise<UserProfile | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const { data: activities, error: activityErr } = await supabase
      .from("activity_designthinking")
      .select("*")
      .eq("user_id", userId)
      .eq("activity_id", "S003")
      .order("task_id", { ascending: true })
      .order("updated_at", { ascending: false });

    if (activityErr) {
      console.warn("Could not find activities.", activityErr);
    }
    
    if (!activities || activities.length === 0) {
      return null;
    }

    const testStage = activities.find(a => a.task_id === 5 && a.task_name === "Test") || activities.find(a => a.task_id === 5);
    const completedCount = testStage ? 1 : 0;
    
    let lastCompletedSimulation = null;
    if (testStage && testStage.task_name === "Test") {
      const stage1 = activities.find(a => a.task_id === 1);
      const stage2 = activities.find(a => a.task_id === 2);
      const stage3 = activities.find(a => a.task_id === 3);
      const stage4 = activities.find(a => a.task_id === 4);

      let parsedScores = { overallScore: testStage.score || 0, creativity: 0, understanding: 0, innovation: 0 };
      try {
        if (testStage.value3) {
          parsedScores = JSON.parse(testStage.value3);
        }
      } catch (e) {}

      let empathizeSummary = "";
      try {
         if (stage2?.value1) {
            const obs = JSON.parse(stage2.value1);
            if (obs.length > 0) empathizeSummary = obs[0].text;
         }
      } catch(e) {}
      
      let topIdeas: string[] = [];
      try {
         if (stage4?.value1) {
            const ideas = JSON.parse(stage4.value1);
            topIdeas = ideas.slice(0, 3).map((i: any) => i.text);
         }
      } catch(e) {}

      let overallScore = parsedScores.overallScore;
      let title = "Explorer";
      if (overallScore >= 91) title = "DT Innovation Master";
      else if (overallScore >= 76) title = "Innovation Builder";
      else if (overallScore >= 61) title = "Creative Thinker";
      else if (overallScore >= 41) title = "Problem Solver";

      lastCompletedSimulation = {
        simulationName: "DT Innovation Lab",
        completionDate: new Date(testStage.updated_at).toLocaleDateString(),
        challenge: stage1?.value2 || "Custom Challenge",
        empathizeSummary: empathizeSummary,
        problemStatement: stage3?.value1 || "Problem definition not found",
        topIdeas: topIdeas,
        prototypeSummary: testStage.value2 || "Prototype description not found",
        achievements: [title],
        overallScore: overallScore,
        completionTime: new Date(testStage.updated_at).getTime()
      };
    }

    return {
      uid: userId,
      email: "",
      username: "Innovator",
      photoURL: "",
      college: "",
      degree: "",
      yearOfStudy: "",
      primaryInterest: "",
      careerGoal: "",
      isOnboarded: true,
      xp: 60 + (completedCount * 100),
      level: completedCount >= 1 ? "Innovator" : "Explorer",
      unlockedBadgeIds: ["problem-hunter"],
      problemsSolved: completedCount,
      ideasGenerated: completedCount,
      prototypesBuilt: completedCount,
      phone: "",
      gender: "",
      city: "",
      yearOfBirth: "",
      lastCompletedSimulation
    };
  } catch (err) {
    console.error("Error retrieving Supabase profile:", err);
    return null;
  }
}

/**
 * Save / Update profile details in Supabase
 */
export async function saveSupabaseProfile(userId: string, data: Partial<UserProfile> & { email?: string; photoURL?: string }): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  // Per standardized Zup architecture, profile info is managed in centralized users table by Zup Profile app.
  // We do not save profile updates here.
  return true;
}

/**
 * Save user badges
 */
export async function unlockSupabaseBadge(userId: string, badgeId: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  // Per standardized Zup architecture, badges are not stored in this app.
  return true;
}

/**
 * Store progressive simulation results per stage
 */

(window as any).testSave = async () => {
  console.log("🔥 RUNNING testSave()...");
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user) {
    console.error("TEST SAVE FAILED: No authenticated user", authError);
    return;
  }
  
  console.log("Current Supabase User:", user);
  
  const payload = {
    user_id: user.id,
    activity_id: "S003",
    task_id: 999,
    task_name: "TEST",
    task_description: "Testing Supabase",
    value1: "hello",
    completed: true,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from("activity_designthinking")
    .insert([payload])
    .select();
    
  console.log("TEST SAVE SUCCESS", data);
  if (error) console.error("TEST ERROR:", error);
};

export async function saveStageProgress(payloadDetails: {
  activity_id: string;
  task_id: string;
  task_name: string;
  task_description: string;
  value1?: string;
  value2?: string;
  value3?: string;
  score?: number;
  completed: boolean;
}): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    console.log("🔥 DESIGN THINKING SAVE FUNCTION CALLED");
    console.log("Supabase Client:", supabase);
    console.log("Saving Design Thinking activity...");
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log("CURRENT USER:", user);
    
    if (!user) {
      console.warn("User not found for saving stage progress.", authError);
      return false;
    }

    const payload = {
      user_id: user.id,
      activity_id: "S003",
      task_id: parseFloat(payloadDetails.task_id), // Cast to float/int
      task_name: payloadDetails.task_name,
      task_description: payloadDetails.task_description,
      value1: payloadDetails.value1 || null,
      value2: payloadDetails.value2 || null,
      value3: payloadDetails.value3 || null,
      score: payloadDetails.score || 0,
      completed: payloadDetails.completed,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from("activity_designthinking")
      .insert([payload])
      .select();

    if (error) {
      console.error("SUPABASE INSERT FAILED:", error);
      throw error;
    }

    console.log("Design Thinking saved:", data);
    return true;
  } catch (err) {
    console.error("Error saving stage progress:", err);
    return false;
  }
}

