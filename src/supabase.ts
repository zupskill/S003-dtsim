import { createClient } from "@supabase/supabase-js";
import { UserProfile } from "./types";
import { reconstructRecapFromActivities } from "./utils/lpfb";

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

    const { recap, completedCount } = reconstructRecapFromActivities(activities);

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
      lastCompletedSimulation: recap || undefined
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

