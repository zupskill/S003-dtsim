import React, { useState, useEffect } from "react";
import { Topic, ProblemObservation, IdeaItem, PrototypeData, UserProfile, CommunitySubmission } from "./types";
import { MOCK_COMMUNITY_SUBMISSIONS } from "./data";
import { motion, AnimatePresence } from "motion/react";
import { STAGE_INTROS, StageIntroModal } from "./components/StageIntroModal";

// Helper component to reset scroll on route/stage change
const ScrollToTop = () => {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 50);
    return () => clearTimeout(timer);
  }, []);
  return null;
};

// Component imports
import LandingScreen from "./components/LandingScreen";
import NewSimConfirmModal from "./components/NewSimConfirmModal";
import { generateRecapReport } from "./utils/pdfGenerator";
import AuthScreen from "./components/AuthScreen";
import ProfileSetupScreen from "./components/ProfileSetupScreen";
import SimulationIntro from "./components/SimulationIntro";
import ProgressTracker from "./components/ProgressTracker";
import TopicSelection from "./components/TopicSelection";
import EmpathizeStage from "./components/EmpathizeStage";
import DefineStage from "./components/DefineStage";
import IdeateStage from "./components/IdeateStage";
import PrototypeStage from "./components/PrototypeStage";
import TestingStage from "./components/TestingStage";
import FinalReport from "./components/FinalReport";
import RecapScreen from "./components/RecapScreen";
import ProfileSection from "./components/ProfileSection";
import ThemeToggle from "./components/ThemeToggle";
import SignOutButton from "./components/SignOutButton";
import StageGuidance from "./components/StageGuidance";
// Supabase integration
import { 
  supabase,
  isSupabaseConfigured,

  saveSupabaseProfile,
  unlockSupabaseBadge,
} from "./supabase";

// Lucide icon imports for general App use
import { Award, Compass, Eye, ShieldAlert, Zap, PenTool, Flame, User, MessageSquare, Users, RotateCcw, RefreshCw, Sparkles, Play, MoreVertical } from "lucide-react";

import { useRuntime } from "./contexts/RuntimeContext";

export default function App() {
  // Theme state: default is 'dark'
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const saved = localStorage.getItem("zupskill_theme");
    return saved === "light" ? "light" : "dark";
  });

  useEffect(() => {
    localStorage.setItem("zupskill_theme", theme);
    const root = document.documentElement;
    if (theme === "light") {
      root.classList.add("light");
      root.classList.remove("dark");
    } else {
      root.classList.add("dark");
      root.classList.remove("light");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Navigation State: 'auth' | 'landing' | 'intro' | 'simulation' | 'community' | 'report' | 'recap'
  const [activeScreen, setActiveScreen] = useState<"auth" | "landing" | "intro" | "simulation" | "community" | "report" | "recap">(() => {
    const saved = localStorage.getItem("zupskill_sim_active_screen");
    // Default fallback to 'auth' if onboarding was saved
    if (saved === "onboarding") return "auth";
    return (saved as any) || "auth";
  });
  
  // Simulation Stage State: 1 to 6
  const [currentStage, setCurrentStage] = useState<number>(() => {
    const saved = localStorage.getItem("zupskill_sim_current_stage");
    return saved ? parseInt(saved, 10) : 1;
  });
  const [maxReachedStage, setMaxReachedStage] = useState<number>(() => {
    const saved = localStorage.getItem("zupskill_sim_max_reached_stage");
    return saved ? parseInt(saved, 10) : 1;
  });

  useEffect(() => {
    let title = "DT Innovation Lab | Zupskill";
    if (activeScreen === "simulation") {
      switch (currentStage) {
        case 1: title = "DT Innovation Lab | Choose a Topic"; break;
        case 2: title = "DT Innovation Lab | Empathize"; break;
        case 3: title = "DT Innovation Lab | Define"; break;
        case 4: title = "DT Innovation Lab | Ideate"; break;
        case 5: title = "DT Innovation Lab | Prototype"; break;
        case 6: title = "DT Innovation Lab | Test"; break;
      }
    } else if (activeScreen === "report") {
      title = "DT Innovation Lab | Journey Complete";
    }
    document.title = title;
  }, [activeScreen, currentStage]);

  // Stage Introduction Modal State
  const [showStageIntro, setShowStageIntro] = useState<boolean>(false);
  const [sessionSeenIntros, setSessionSeenIntros] = useState<Record<number, boolean>>({});
  const [persistedSeenIntros, setPersistedSeenIntros] = useState<Record<number, boolean>>(() => {
    const saved = localStorage.getItem("zupskill_sim_seen_intros");
    return saved ? JSON.parse(saved) : {};
  });

  // Watch for current stage changes and trigger intro if not seen
  useEffect(() => {
    if (activeScreen === "simulation") {
      if (!sessionSeenIntros[currentStage] && !persistedSeenIntros[currentStage]) {
        setShowStageIntro(true);
      } else {
        setShowStageIntro(false);
      }
    }
  }, [currentStage, activeScreen, sessionSeenIntros, persistedSeenIntros]);

  const handleCloseStageIntro = (dontShowAgain: boolean) => {
    setShowStageIntro(false);
    setSessionSeenIntros(prev => ({ ...prev, [currentStage]: true }));
    if (dontShowAgain) {
      const updated = { ...persistedSeenIntros, [currentStage]: true };
      setPersistedSeenIntros(updated);
      localStorage.setItem("zupskill_sim_seen_intros", JSON.stringify(updated));
    }
  };

  const handleSkipStageIntro = () => {
    setShowStageIntro(false);
    setSessionSeenIntros(prev => ({ ...prev, [currentStage]: true }));
  };

  const openIntroAgain = () => {
    setShowStageIntro(true);
  };

  // Simulation Core Data
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(() => {
    const saved = localStorage.getItem("zupskill_sim_selected_topic");
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [problemObservations, setProblemObservations] = useState<ProblemObservation[]>(() => {
    const saved = localStorage.getItem("zupskill_sim_problem_observations");
    try {
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [refinedHowMightWe, setRefinedHowMightWe] = useState<string>(() => {
    return localStorage.getItem("zupskill_sim_refined_hmw") || "";
  });
  const [ideas, setIdeas] = useState<IdeaItem[]>(() => {
    const saved = localStorage.getItem("zupskill_sim_ideas");
    try {
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [selectedPrototype, setSelectedPrototype] = useState<PrototypeData | null>(() => {
    const saved = localStorage.getItem("zupskill_sim_selected_prototype");
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Community Submissions Database
  const [submissions, setSubmissions] = useState<CommunitySubmission[]>(() => {
    const saved = localStorage.getItem("zupskill_sim_submissions");
    try {
      return saved ? JSON.parse(saved) : MOCK_COMMUNITY_SUBMISSIONS;
    } catch {
      return MOCK_COMMUNITY_SUBMISSIONS;
    }
  });
  const [savedSubmissions, setSavedSubmissions] = useState<string[]>(() => {
    const saved = localStorage.getItem("zupskill_sim_saved_submissions");
    try {
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Toast notifications database
  const [toasts, setToasts] = useState<{ id: string; text: string; type: "success" | "idea" | "info" | "badge" }[]>([]);

  // Stage progress state for messages overlay
  const [stageTransition, setStageTransition] = useState<{ message: string; subtext: string } | null>(null);

  const showToast = (text: string, type: "success" | "idea" | "info" | "badge" = "success") => {
    const id = `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2500);
  };

  // Google Auth User states
  const { 
    user, profile, setProfile, isLoading: loadingAuth, 
    saveStageLocally, syncCompletion, signOut, signInWithGoogle 
  } = useRuntime();

  const [showAccountChooser, setShowAccountChooser] = useState<boolean>(false);
  const [showNewSimConfirm, setShowNewSimConfirm] = useState<boolean>(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);
  // Redirect to Auth or Onboarding based on session status
  useEffect(() => {
    if (loadingAuth) return;

    if (!user) {
      if (activeScreen !== "auth") {
        setActiveScreen("auth");
      }
    } else {
      if (activeScreen === "auth" && profile.uid === user.id) {
        console.log("=== AUTHENTICATION AUDIT LOGS ===");
        console.log("✓ Authentication success:", user.id);
        console.log("✓ Profile loaded:", profile);
        console.log("✓ Profile source:", profile.xp > 60 || profile.isOnboarded ? "Supabase (or fallback merge)" : "New Initialization");
        console.log("✓ Recap loaded:", !!profile.lastCompletedSimulation);
        console.log("✓ Recap source:", profile.lastCompletedSimulation ? "localStorage (zupskill_sim_recap)" : "None");
        console.log("✓ activeScreen before routing:", activeScreen);
        
        if (profile.lastCompletedSimulation) {
          setActiveScreen("recap");
          console.log("✓ activeScreen after routing: recap");
        } else {
          setActiveScreen("landing");
          console.log("✓ activeScreen after routing: landing");
        }
      }
    }
  }, [user, loadingAuth, activeScreen, profile]);

  // Save profile updates automatically to Supabase (Debounced)
  useEffect(() => {
    if (!user || !profile || !profile.uid || !profile.isOnboarded) return;
    const saveToSupabase = async () => {
      try {
        await saveSupabaseProfile(user.id, profile);
      } catch (err) {
        console.error("Error saving updated profile to Supabase:", err);
      }
    };
    const tid = setTimeout(saveToSupabase, 600);
    return () => clearTimeout(tid);
  }, [profile, user]);





  const handleSaveOnboarding = async (data: {
    username: string;
    email: string;
    phone: string;
    gender: string;
    city: string;
    yearOfBirth: string;
    college: string;
    degree: string;
    yearOfStudy: string;
    primaryInterest?: string;
    careerGoal?: string;
  }) => {
    if (!user) return;
    const syncedProfile: UserProfile = {
      uid: user.id,
      username: data.username,
      email: data.email,
      photoURL: user.user_metadata?.avatar_url || user.user_metadata?.picture || "",
      college: data.college,
      degree: data.degree,
      yearOfStudy: data.yearOfStudy,
      primaryInterest: data.primaryInterest || "UX/UI Design",
      careerGoal: data.careerGoal || "",
      phone: data.phone,
      gender: data.gender,
      city: data.city,
      yearOfBirth: data.yearOfBirth,
      level: "Explorer",
      xp: 100, // setup complete reward
      unlockedBadgeIds: ["problem-hunter"],
      problemsSolved: 0,
      ideasGenerated: 0,
      prototypesBuilt: 0,
      isOnboarded: true
    };

    try {
      await saveSupabaseProfile(user.id, syncedProfile);
      setProfile(syncedProfile);
      showToast("🚀 Neural coordinates synced!", "success");
    } catch (err) {
      console.error("Supabase onboarding write failure:", err);
      setProfile(syncedProfile);
      showToast("🔐 Saved local simulation credentials", "info");
    }
  };

  // Synchronize state changes to localStorage
  useEffect(() => {
    localStorage.setItem("zupskill_sim_active_screen", activeScreen);
  }, [activeScreen]);

  useEffect(() => {
    localStorage.setItem("zupskill_sim_current_stage", String(currentStage));
  }, [currentStage]);

  useEffect(() => {
    localStorage.setItem("zupskill_sim_max_reached_stage", String(maxReachedStage));
  }, [maxReachedStage]);

  useEffect(() => {
    if (selectedTopic) {
      localStorage.setItem("zupskill_sim_selected_topic", JSON.stringify(selectedTopic));
    } else {
      localStorage.removeItem("zupskill_sim_selected_topic");
    }
  }, [selectedTopic]);

  useEffect(() => {
    localStorage.setItem("zupskill_sim_problem_observations", JSON.stringify(problemObservations));
  }, [problemObservations]);

  useEffect(() => {
    localStorage.setItem("zupskill_sim_refined_hmw", refinedHowMightWe);
  }, [refinedHowMightWe]);

  useEffect(() => {
    localStorage.setItem("zupskill_sim_ideas", JSON.stringify(ideas));
  }, [ideas]);

  useEffect(() => {
    if (selectedPrototype) {
      localStorage.setItem("zupskill_sim_selected_prototype", JSON.stringify(selectedPrototype));
    } else {
      localStorage.removeItem("zupskill_sim_selected_prototype");
    }
  }, [selectedPrototype]);

  useEffect(() => {
    localStorage.setItem("zupskill_sim_submissions", JSON.stringify(submissions));
  }, [submissions]);

  useEffect(() => {
    localStorage.setItem("zupskill_sim_saved_submissions", JSON.stringify(savedSubmissions));
  }, [savedSubmissions]);

  useEffect(() => {
    localStorage.setItem("zupskill_sim_profile", JSON.stringify(profile));
  }, [profile]);

  // Show profile overlay drawer
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);

  // Temporary developer reset confirm dialog state
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [showMobileMenu, setShowMobileMenu] = useState<boolean>(false);

  // XP Level mapping evaluator
  const calculateLevel = (xp: number): UserProfile["level"] => {
    if (xp >= 1400) return "System Thinker";
    if (xp >= 950) return "Visionary";
    if (xp >= 600) return "Innovator";
    if (xp >= 350) return "Problem Finder";
    if (xp >= 150) return "Observer";
    return "Explorer";
  };

  // Helper routine to dynamically add XP points and handle level-up toasts!
  const handleAddXP = (amount: number) => {
    setProfile((prev) => {
      const updatedXp = prev.xp + amount;
      const newLvl = calculateLevel(updatedXp);
      const isLevelUp = newLvl !== prev.level;

      if (isLevelUp) {
        showToast(`🌟 Promoted to "${newLvl.toUpperCase()}"! +150 XP bonus applied!`, "badge");
      }

      return {
        ...prev,
        xp: updatedXp + (isLevelUp ? 150 : 0),
        level: newLvl
      };
    });
  };

  // Routine to unlock badge criteria
  const handleUnlockBadge = (badgeId: string) => {
    setProfile((prev) => {
      if (prev.unlockedBadgeIds.includes(badgeId)) return prev;

      showToast(`🏆 Badge Unlocked: ${badgeId.replace("-", " ").toUpperCase()}! (+50 XP)`, "badge");

      return {
        ...prev,
        unlockedBadgeIds: [...prev.unlockedBadgeIds, badgeId],
        xp: prev.xp + 50
      };
    });
  };

  // Callback to insert custom simulation prototype directly on community board
  const handlePublishToCommunity = (
    topicTitle: string,
    problem: string,
    title: string,
    description: string
  ) => {
    const newSub: CommunitySubmission = {
      id: `sub_${Date.now()}`,
      username: profile.username,
      college: profile.college,
      topicTitle: topicTitle,
      refinedProblem: problem,
      prototypeTitle: title,
      prototypeDescription: description,
      likes: 1,
      comments: [
        { username: "ZupSkill_Bot", text: "Welcome to active innovation! Your simulated parameters are now visible in the metro network.", date: "Just now" }
      ],
      category: "WOW" // Defaults to realistic innovation, user can tag details
    };

    setSubmissions([newSub, ...submissions]);
    handleAddXP(100); // Massive boost for publishing!

    setProfile((prev) => ({
      ...prev,
      problemsSolved: prev.problemsSolved + 1,
      prototypesBuilt: prev.prototypesBuilt + 1
    }));
    
    showToast("🚀 Solution published to community feed!", "success");
  };

  // Transitions with high-fidelity 1-second overlay message
  const triggerTransition = (
    nextScreen: "auth" | "onboarding" | "landing" | "intro" | "simulation" | "community" | "report",
    nextStage?: number,
    customMessage?: string
  ) => {
    let msg = customMessage || "";
    let sub = "";

    if (!msg) {
      if (activeScreen === "landing" && nextScreen === "intro") {
        msg = "Entering Simulation... 🚀";
        sub = "Let's gear up for design thinking!";
      } else if (activeScreen === "intro" && nextScreen === "simulation" && nextStage === 1) {
        msg = "Step 1: Choose a Topic 🎯";
        sub = "Pick a struggle that moves you most!";
      } else if (currentStage === 1 && nextStage === 2) {
        msg = "Excellent Choice! let's empathize!";
        sub = "Explore perspective models and gather core frustrations.";
      } else if (currentStage === 2 && nextStage === 3) {
        msg = "Empathize → Define";
        sub = "Observations collected. Let's focus on one problem.";
      } else if (currentStage === 3 && nextStage === 4) {
        msg = "Define → Ideate";
        sub = "Now let's explore possible solutions.";
      } else if (currentStage === 4 && nextStage === 5) {
        msg = "Ideate → Prototype";
        sub = "Pick the idea you believe in most.";
      } else if (currentStage === 5 && nextStage === 6) {
        msg = "Prototype → Test";
        sub = "Let's see how your solution holds up.";
      } else if (nextScreen === "report") {
        msg = "Refinements Complete! 🏆";
        sub = "Analyzing your innovations scorecard...";
      } else {
        msg = `Navigating to ${nextScreen}...`;
      }
    } else {
      // Parse custom title vs subtext if they exist
      if (msg.includes("observations") || msg.includes("Observations")) {
        sub = "Nice research! Ready to craft a robust problem statement.";
      } else if (msg.includes("defined") || msg.includes("Defined")) {
        sub = "Ready for brainstorm action vectors.";
      } else if (msg.includes("categorized") || msg.includes("Categorized")) {
        sub = "Prepare storyboard models or pitch decks.";
      } else if (msg.includes("ready") || msg.includes("Ready")) {
        sub = "Initiating Stress-Tests and User Sentiment logs.";
      } else if (msg.includes("Simulation Scorecard")) {
        sub = "Calculating final performance attributes.";
      } else {
        sub = "A creative step in your innovation journey!";
      }
    }

    // Spawn stage transition modal first
    setStageTransition({ message: msg, subtext: sub });

    setTimeout(() => {
      setActiveScreen(nextScreen);
      if (nextStage !== undefined) {
        setCurrentStage(nextStage);
        if (nextStage > maxReachedStage) {
          setMaxReachedStage(nextStage);
        }
      }
      setStageTransition(null);
      
      // Fire small successful micro-sound or success indicator
      if (nextStage !== undefined) {
        showToast("✓ Stage Complete", "success");
      }
    }, 1000); // 1.0 second exact presentation duration
  };

  // Safe manual tab stage switching
    const handleSafeNewStart = () => {
    setShowNewSimConfirm(true);
  };

  const handleConfirmNewStart = () => {
    setShowNewSimConfirm(false);
    handleResetSim();
    triggerTransition("intro");
  };

  const handleDownloadReport = async () => {
    if (!profile.lastCompletedSimulation) return;
    setIsGeneratingPDF(true);
    try {
      await generateRecapReport(profile.lastCompletedSimulation, profile);
    } catch (e) {
      console.error(e);
    }
    setIsGeneratingPDF(false);
  };

  const advanceStage = (stageNum: number) => {
    triggerTransition("simulation", stageNum);
  };

  // Standard reset simulation
  const handleResetSim = async () => {
    // Clear simulation-level keys
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("zupskill_sim_") && key !== "zupskill_sim_profile" && key !== "zupskill_sim_submissions" && key !== "zupskill_sim_saved_submissions" && !key.startsWith("zupskill_sim_recap_")) {
        keysToRemove.push(key);
      }
      if (key && (key.startsWith("zupskill_perspectives_") || key.startsWith("zupskill_selected_perspective_") || key.startsWith("zupskill_define_") || key.startsWith("zupskill_prototype_") || key.startsWith("zupskill_testing_"))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));

    if (user) {
      try {
        console.log("Clearing previous journey from Supabase...");
        const { supabase } = await import("./supabase");
        const { error } = await supabase
          .from("activity_designthinking")
          .delete()
          .eq("user_id", user.id)
          .eq("activity_id", "S003");
        
        if (error) {
          console.error("Error clearing Supabase journey:", error);
        } else {
          console.log("Previous journey cleared");
        }
      } catch (err) {
        console.error("Failed to clear Supabase data:", err);
      }
    }

    setSelectedTopic(null);
    setProblemObservations([]);
    setRefinedHowMightWe("");
    setIdeas([]);
    setSelectedPrototype(null);
    setCurrentStage(1);
    setMaxReachedStage(1);
    setActiveScreen("landing");
    setSessionSeenIntros({});
    setPersistedSeenIntros({});
    handleAddXP(10);
  };

  // FULL DEVELOPER/TESTING RESET
  const handleConfirmFullReset = () => {
    // 1. Clear all local storage keys starting with zupskill_
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("zupskill_")) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));

    // 2. Reset React state variables to fresh initialization
    setSelectedTopic(null);
    setProblemObservations([]);
    setRefinedHowMightWe("");
    setIdeas([]);
    setSelectedPrototype(null);
    setSavedSubmissions([]);
    setSubmissions(MOCK_COMMUNITY_SUBMISSIONS);
    setSessionSeenIntros({});
    setPersistedSeenIntros({});
    setProfile({
      username: "Beta_Innovator_9",
      college: "Stanford Design Lab",
      level: "Explorer",
      xp: 60,
      unlockedBadgeIds: ["problem-hunter"],
      problemsSolved: 0,
      ideasGenerated: 0,
      prototypesBuilt: 0
    });
    setCurrentStage(1);
    setMaxReachedStage(1);
    
    // 3. Clear transient visual toggles & direct user directly to Landing Page per user request
    setActiveScreen("landing");
    setShowResetConfirm(false);

    showToast("Session cleared & Reset complete! 🔄", "info");
  };

  let stageKey: "EMPATHIZE" | "DEFINE" | "IDEATE" | "PROTOTYPE" | "TEST" | "RESULTS" | null = null;
  if (activeScreen === "simulation") {
    if (currentStage === 2) stageKey = "EMPATHIZE";
    else if (currentStage === 3) stageKey = "DEFINE";
    else if (currentStage === 4) stageKey = "IDEATE";
    else if (currentStage === 5) stageKey = "PROTOTYPE";
    else if (currentStage === 6) stageKey = "TEST";
  } else if (activeScreen === "report") {
    stageKey = "RESULTS";
  }

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-center p-6 select-none relative overflow-hidden cyber-grid">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-cyan-500/10 blur-[100px] pointer-events-none animate-pulse" />
        <div className="space-y-4 animate-pulse">
          <div className="w-16 h-16 bg-gradient-to-tr from-cyan-400 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto text-xl font-mono text-black font-black shadow-[0_0_20px_rgba(6,182,212,0.3)]">
            ZS
          </div>
          <h2 className="text-sm font-black text-white font-mono uppercase tracking-[0.25em]">Syncing Neural Coordinates</h2>
          <span className="text-[10px] uppercase font-bold text-slate-500">Connecting to DT Innovation Network...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-100 font-sans flex flex-col justify-between selection:bg-cyan-500 selection:text-black">
      {/* New Simulation Confirmation Modal */}
      <NewSimConfirmModal
        isOpen={showNewSimConfirm}
        onClose={() => setShowNewSimConfirm(false)}
        onConfirm={handleConfirmNewStart}
        onDownload={handleDownloadReport}
        isDownloading={isGeneratingPDF}
        theme={theme}
        profile={profile}
        topic={selectedTopic}
        currentStage={currentStage}
      />

      
      {/* PERSISTENT HEADER BAR (Rendered for in-sim / feed views) */}
      {(activeScreen === "simulation" || activeScreen === "report" || activeScreen === "recap") && (
        <header className="bg-slate-950 border-b border-slate-850 px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between z-40 sticky top-0 overflow-hidden">
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-tr from-cyan-400 via-indigo-500 to-purple-600 rounded-xl flex items-center justify-center border border-cyan-400/20 shadow-[0_0_15px_rgba(6,182,212,0.15)] shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] sm:text-xs font-black tracking-[0.12em] text-white uppercase font-sans leading-none truncate max-w-[80px] sm:max-w-none">
                DT LAB
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
            {/* Desktop Actions */}
            <div className="hidden sm:flex items-center gap-4">
              <button
                onClick={() => setShowResetConfirm(true)}
                title="Developer Tool: Reset entire simulation progress and return to Topic Selection"
                className="px-2.5 py-1.5 rounded-lg border border-red-900/35 bg-red-950/20 hover:bg-red-950/45 text-red-400 hover:text-red-300 hover:border-red-500/50 text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-all duration-200"
              >
                <RotateCcw className="w-3.5 h-3.5 text-red-500 animate-pulse shrink-0" />
                <span>🔄 Reset</span>
              </button>

              <button
                onClick={() => window.open("https://app.zupskill.com/", "_blank", "noopener,noreferrer")}
                className="text-xs uppercase font-bold tracking-wider px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-slate-400 hover:text-white"
                title="Community"
              >
                <Users className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Community</span>
              </button>
            </div>

            {/* Smooth Theme Switching Toggler */}
            <ThemeToggle theme={theme} onToggle={toggleTheme} />

            {/* Profile controller pill button */}
            <button
              onClick={() => setShowProfileModal(true)}
              className="bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl px-2 sm:px-4 py-1.5 flex items-center gap-2 sm:gap-3 text-left transition-all hover:border-cyan-500/20 cursor-pointer shrink-0"
            >
              {profile.photoURL ? (
                <img src={profile.photoURL} alt={profile.username} className="w-6 h-6 rounded-full border border-cyan-400/30 object-cover shrink-0" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-cyan-400/10 text-cyan-400 flex items-center justify-center border border-cyan-400/30 shrink-0">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}

              <div className="hidden sm:block">
                <span className="text-[10px] font-mono font-bold block text-slate-400 leading-none truncate max-w-[80px]">{profile.username}</span>
                <span className="text-[10px] text-cyan-400 leading-none">{profile.xp} XP • {profile.level}</span>
              </div>
            </button>

            <SignOutButton onSignOut={signOut} />

            {/* Mobile More Menu Toggle */}
            <div className="relative sm:hidden ml-0.5">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center justify-center shrink-0"
                aria-label="More Options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              
              {showMobileMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMobileMenu(false)}></div>
                  <div className="absolute top-full right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col py-1">
                    <button
                      onClick={() => {
                        setShowMobileMenu(false);
                        window.open("https://app.zupskill.com/", "_blank", "noopener,noreferrer");
                      }}
                      className="px-4 py-3 flex items-center gap-3 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-left"
                    >
                      <Users className="w-4 h-4 text-cyan-400" />
                      Community
                    </button>
                    <button
                      onClick={() => {
                        setShowMobileMenu(false);
                        setShowResetConfirm(true);
                      }}
                      className="px-4 py-3 flex items-center gap-3 text-sm text-red-400 hover:bg-slate-800 hover:text-red-300 transition-colors text-left border-t border-slate-800/50"
                    >
                      <RotateCcw className="w-4 h-4 text-red-500" />
                      Reset Progress
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>
      )}

      {/* RENDER ACTIVE GRAPH SCREEN WITH ANIMATEPRESENCE */}
      <main className="flex-1 w-full bg-slate-950 relative overflow-hidden">
        
        <AnimatePresence mode="wait">
          <motion.div
            key={activeScreen === "simulation" ? `sim-${currentStage}` : activeScreen}
            initial={{ opacity: 0, y: 20, scale: 0.99, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -20, scale: 0.99, filter: "blur(4px)" }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="w-full h-full"
          >
            <ScrollToTop />
            
            {activeScreen === "auth" && (
              <AuthScreen
                theme={theme}
                onToggleTheme={toggleTheme}
                onSignInWithGoogle={signInWithGoogle}
              />
            )}

            {activeScreen === "recap" && profile.lastCompletedSimulation && (
              <RecapScreen
                recap={profile.lastCompletedSimulation}
                profile={profile}
                theme={theme}
                onNewStart={handleSafeNewStart}
                onReviewRecap={() => {
                  setActiveScreen("landing");
                }}
              />
            )}

            {activeScreen === "landing" && (
              <LandingScreen
                onStart={() => triggerTransition("intro")}
                onResume={() => {
                  triggerTransition("simulation", currentStage);
                }}
                onNewStart={handleSafeNewStart}
                hasActiveSession={!!selectedTopic}
                onExploreCommunity={() => window.open("https://app.zupskill.com/", "_blank", "noopener,noreferrer")}
                theme={theme}
                onToggleTheme={toggleTheme}
                user={user}
                profile={profile}
                onSignInWithGoogle={signInWithGoogle}
                onSignOut={signOut}
              />
            )}

            {activeScreen === "intro" && (
              <SimulationIntro
                onComplete={() => {
                  triggerTransition("simulation", 1);
                }}
              />
            )}

            {activeScreen === "report" && (
              <FinalReport
                topic={selectedTopic!}
                refinedProblem={refinedHowMightWe}
                prototype={selectedPrototype!}
                userProfile={profile}
                onRestart={() => {
                  setActiveScreen("recap");
                }}
                theme={theme}
              />
            )}

            {activeScreen === "simulation" && (
              <div className="flex flex-col h-full bg-slate-950">
                {/* STAGE TAB INDICATOR ROUTER */}
                <ProgressTracker
                  currentStage={currentStage}
                  setStage={advanceStage}
                  maxReachedStage={maxReachedStage}
                />

                {currentStage <= 5 && (
                  <StageIntroModal
                    isOpen={showStageIntro}
                    stageConfig={STAGE_INTROS[currentStage]}
                    onContinue={handleCloseStageIntro}
                    onClose={handleSkipStageIntro}
                  />
                )}

                <div className="flex-1 w-full max-w-6xl mx-auto relative flex flex-col">
                  {currentStage <= 5 && (
                    <div className="w-full flex justify-end px-6 pt-4 pb-0 z-10 shrink-0">
                      <button
                        onClick={openIntroAgain}
                        className="flex items-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-full border border-indigo-500/20"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Watch Introduction Again
                      </button>
                    </div>
                  )}

                  {/* STAGE 1: TOPIC SELECTION */}
                  {currentStage === 1 && (
                    <TopicSelection
                      selectedTopic={selectedTopic}
                      onSelect={(topic) => {
                        setSelectedTopic(topic);
                        
                        saveStageLocally({
                          activity_id: "S003",
                          task_id: "1.0",
                          task_name: "Topic Selection",
                          task_description: "Selected design challenge",
                          value1: topic.id,
                          value2: topic.title,
                          completed: true
                        });

                        handleAddXP(30);
                        triggerTransition("simulation", 2, `Topic Locked: ${topic.title} ✨`);
                      }}
                    />
                  )}

                  {/* STAGE 2: EMPATHIZE */}
                  {currentStage === 2 && selectedTopic && (
                    <EmpathizeStage
                      topic={selectedTopic}
                      onAddXP={handleAddXP}
                      onUnlockBadge={handleUnlockBadge}
                      problemObservations={problemObservations}
                      setProblemObservations={setProblemObservations}
                      onShowToast={showToast}
                      theme={theme}
                      onNext={() => {
                        setProfile((prev) => ({ ...prev, problemsSolved: prev.problemsSolved + 1 }));
                        
                        saveStageLocally({
                            activity_id: "S003",
                            task_id: "2.0",
                            task_name: "Empathize",
                            task_description: "Gathered problem observations",
                            value1: JSON.stringify(problemObservations),
                            completed: true
                          });

                        triggerTransition("simulation", 3, "Observations collected! Let's focus. 📌");
                      }}
                    />
                  )}

                  {/* STAGE 3: DEFINE */}
                  {currentStage === 3 && selectedTopic && (
                    <DefineStage
                      topic={selectedTopic}
                      problemObservations={problemObservations}
                      onAddXP={handleAddXP}
                      refinedHowMightWe={refinedHowMightWe}
                      setRefinedHowMightWe={setRefinedHowMightWe}
                      onShowToast={showToast}
                      onNext={() => {
                        saveStageLocally({
                            activity_id: "S003",
                            task_id: "3.0",
                            task_name: "Define",
                            task_description: "Refined problem into How Might We question",
                            value1: refinedHowMightWe,
                            completed: true
                          });

                        triggerTransition("simulation", 4, "Problem defined. Challenge statement saved! 🎯");
                      }}
                    />
                  )}

                  {/* STAGE 4: IDEATE */}
                  {currentStage === 4 && selectedTopic && (
                    <IdeateStage
                      topic={selectedTopic}
                      problemStatement={refinedHowMightWe}
                      ideas={ideas}
                      setIdeas={setIdeas}
                      onAddXP={handleAddXP}
                      onUnlockBadge={handleUnlockBadge}
                      onShowToast={showToast}
                      onNext={() => {
                        setProfile((prev) => ({ ...prev, ideasGenerated: prev.ideasGenerated + ideas.length }));
                        
                        saveStageLocally({
                            activity_id: "S003",
                            task_id: "4.0",
                            task_name: "Ideate",
                            task_description: "Generated solution ideas",
                            value1: JSON.stringify(ideas),
                            completed: true
                          });

                        triggerTransition("simulation", 5, "Ideas captured! Pick your favorite. 💡");
                      }}
                    />
                  )}

                  {/* STAGE 5: PROTOTYPE */}
                  {currentStage === 5 && selectedTopic && (
                    <PrototypeStage
                      topic={selectedTopic}
                      ideas={ideas}
                      refinedProblem={refinedHowMightWe}
                      onAddXP={handleAddXP}
                      onUnlockBadge={handleUnlockBadge}
                      prototype={selectedPrototype}
                      setPrototype={setSelectedPrototype}
                      onShowToast={showToast}
                      onNext={() => {
                        saveStageLocally({
                            activity_id: "S003",
                            task_id: "5.0",
                            task_name: "Prototype",
                            task_description: "Built and selected prototype solution",
                            value1: selectedPrototype?.title || "",
                            value2: selectedPrototype?.description || "",
                            completed: true
                          });

                        triggerTransition("simulation", 6, "Prototype ready. Initiating stress tests! 🚀");
                      }}
                    />
                  )}

                  {/* STAGE 6: TESTING */}
                  {currentStage === 6 && selectedTopic && (
                    <TestingStage
                      topic={selectedTopic}
                      refinedProblem={refinedHowMightWe}
                      prototype={selectedPrototype}
                      onAddXP={handleAddXP}
                      onUnlockBadge={handleUnlockBadge}
                      onNext={async () => {
                        // Compute Recap
                        const savedTesting = localStorage.getItem(`zupskill_testing_${selectedTopic.id}`);
                        let creativity = 75, understanding = 80, innovation = 70;
                        if (savedTesting) {
                          try {
                            const parsed = JSON.parse(savedTesting);
                            if (parsed.iWishScore != null) creativity = parsed.iWishScore;
                            if (parsed.iLikeScore != null) understanding = parsed.iLikeScore;
                            if (parsed.whatIfScore != null) innovation = parsed.whatIfScore;
                          } catch(e) {}
                        }
                        const overallScore = Math.round((creativity + understanding + innovation) / 3);

                        let title = "Explorer";
                        if (overallScore >= 91) title = "DT Innovation Master";
                        else if (overallScore >= 76) title = "Innovation Builder";
                        else if (overallScore >= 61) title = "Creative Thinker";
                        else if (overallScore >= 41) title = "Problem Solver";

                        const topIdeas = ideas.slice(0, 3).map(i => i.text);
                        const recap = {
                          simulationName: "DT Innovation Lab",
                          completionDate: new Date().toLocaleDateString(),
                          challenge: selectedTopic.title,
                          empathizeSummary: problemObservations.length > 0 ? problemObservations[0].text : "",
                          problemStatement: refinedHowMightWe,
                          topIdeas: topIdeas,
                          prototypeSummary: selectedPrototype.description,
                          achievements: [title],
                          overallScore: overallScore,
                          completionTime: Date.now()
                        };

                        setProfile(prev => ({ ...prev, lastCompletedSimulation: recap }));

                        saveStageLocally({
                            activity_id: "S003",
                            task_id: "5.0",
                            task_name: "Test",
                            task_description: "Evaluated prototype",
                            value1: selectedPrototype?.title || "",
                            value2: selectedPrototype?.description || "",
                            value3: JSON.stringify({ creativity, understanding, innovation, overallScore }),
                            score: overallScore,
                            completed: true
                          });
                        await syncCompletion(overallScore);

                        triggerTransition("report", undefined, "Testing complete. Let's inspect final scores! 🧪");
                      }}
                    />
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

      </main>

      {/* OVERLAY PROFILE MODAL DIALOG */}
      {showProfileModal && (
        <ProfileSection
          profile={profile}
          setProfile={setProfile}
          onAddXP={handleAddXP}
          onClose={() => setShowProfileModal(false)}
        />
      )}

      {/* CONFIRMATION DIALOG FOR FULL DEVELOPER RESET */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 z-55 pointer-events-auto animate-in fade-in duration-200">
          <div className="max-w-sm w-full max-h-[90vh] overflow-y-auto rounded-2xl relative p-6 bg-slate-900 border border-red-500/30 text-left shadow-[0_0_50px_rgba(239,68,68,0.2)]">
            <div className="flex items-center gap-3 mb-4 text-red-400">
              <ShieldAlert className="w-6 h-6 animate-pulse text-red-500 shrink-0" />
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-mono">
                Reset Simulation?
              </h3>
            </div>
            
            <p className="text-xs text-slate-400 mb-6 leading-relaxed font-sans">
              This will permanently clear your current progress, remove custom perspectives, erase drafted stage components, delete uploaded files, reset XP/badges, and start a fresh simulation.
            </p>

            <span className="text-[9px] font-mono font-semibold tracking-wide text-red-400/85 block bg-red-950/20 border border-red-900/35 rounded-lg px-2.5 py-1.5 mb-5 leading-tight">
              ⚠️ Developer Tool / Testing Only
            </span>
            
            <div className="flex justify-end gap-2.5 font-mono">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 border border-slate-800 text-slate-400 rounded-xl hover:text-white hover:bg-slate-950 transition-colors text-[10px] uppercase font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmFullReset}
                className="px-4 py-2 bg-red-950/80 hover:bg-red-900 text-red-200 hover:text-white border border-red-800 rounded-xl transition-colors text-[10px] uppercase font-bold cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STAGE GUIDANCE POPUP SYSTEM */}
      <StageGuidance stageKey={stageKey} theme={theme} />

      {/* ELEGANT TOAST SYSTEM */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-2.5 z-55 pointer-events-none max-w-sm w-full font-sans">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 25, scale: 0.9, filter: "blur(2px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.9, y: -10, filter: "blur(2px)", transition: { duration: 0.15 } }}
              className={`p-4 rounded-xl border shadow-xl flex items-center gap-3 pointer-events-auto backdrop-blur-md transition-all duration-300 ${
                theme === "dark"
                  ? `bg-slate-900/95 ${
                      toast.type === "success"
                        ? "border-emerald-500/35 text-emerald-250 shadow-emerald-950/15"
                        : toast.type === "idea"
                        ? "border-amber-500/35 text-amber-250 shadow-amber-950/15"
                        : toast.type === "badge"
                        ? "border-purple-500/50 text-purple-250 shadow-purple-950/20"
                        : "border-slate-700 text-slate-105"
                    }`
                  : `bg-white/98 z-50 shadow-lg border-2 ${
                      toast.type === "success"
                        ? "border-emerald-500/50 text-emerald-950 shadow-emerald-100/40"
                        : toast.type === "idea"
                        ? "border-amber-500/50 text-amber-950 shadow-amber-100/40"
                        : toast.type === "badge"
                        ? "border-purple-500/60 text-purple-950 shadow-purple-100/40"
                        : "border-slate-350 text-slate-900 shadow-slate-200/40"
                    }`
              }`}
            >
              <div className="shrink-0 font-bold">
                {toast.type === "success" && (
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                    theme === "dark" 
                      ? "bg-emerald-500/10 text-emerald-400" 
                      : "bg-emerald-100 text-emerald-800 border border-emerald-500/30"
                  }`}>
                    ✓
                  </div>
                )}
                {toast.type === "idea" && (
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs ${
                    theme === "dark" 
                      ? "bg-amber-500/10 text-amber-400" 
                      : "bg-amber-100 text-amber-805 border border-amber-500/30"
                  }`}>
                    💡
                  </div>
                )}
                {toast.type === "badge" && (
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs ${
                    theme === "dark" 
                      ? "bg-purple-500/10 text-purple-400" 
                      : "bg-purple-100 text-purple-800 border border-purple-500/30"
                  }`}>
                    🏆
                  </div>
                )}
                {toast.type === "info" && (
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs ${
                    theme === "dark" 
                      ? "bg-slate-800 text-slate-400" 
                      : "bg-slate-100 text-slate-700 border border-slate-350"
                  }`}>
                    ⓘ
                  </div>
                )}
              </div>
              <span className={`text-xs font-sans tracking-wide leading-tight ${
                theme === "light" ? "font-black text-slate-950" : "font-semibold text-slate-100"
              }`}>
                {toast.text}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ENCOURAGING INTERMEDIATE STAGE TRANSITION MESSAGES OVERLAY */}
      <AnimatePresence>
        {stageTransition && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-6 pointer-events-auto transition-colors duration-350 ${
              theme === "dark"
                ? "bg-slate-950/90"
                : "bg-slate-950/40"
            }`}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: -15 }}
              transition={{ delay: 0.05, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className={`text-center space-y-4 max-w-md p-8 rounded-3xl relative max-h-[90vh] overflow-y-auto overflow-x-hidden transition-all duration-300 ${
                theme === "dark"
                  ? "bg-slate-900 border border-slate-800/80 shadow-2xl shadow-cyan-950/20 text-white"
                  : "bg-white border-2 border-slate-300 shadow-2xl shadow-slate-400/40 text-slate-900"
              }`}
            >
              {/* Pulsing futuristic core orb decor */}
              <div className={`absolute top-[10%] left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-2xl pointer-events-none ${
                theme === "dark" ? "bg-cyan-500/5" : "bg-indigo-500/5"
              }`} />

              <div className="flex justify-center mb-2">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center animate-spin duration-3000 ${
                  theme === "dark"
                    ? "bg-gradient-to-br from-cyan-500/15 to-indigo-500/15 text-cyan-400 border border-cyan-500/30"
                    : "bg-indigo-100 text-indigo-700 border border-indigo-400/30"
                }`}>
                  <Zap className="w-5 h-5 animate-pulse" />
                </div>
              </div>

              <h3 className={`text-lg md:text-xl tracking-tight leading-snug uppercase ${
                theme === "dark" ? "font-extrabold text-white" : "font-black text-slate-950"
              }`}>
                {stageTransition.message}
              </h3>
              <p className={`text-xs leading-relaxed max-w-sm mx-auto ${
                theme === "dark" ? "text-slate-400 font-medium" : "text-slate-700 font-bold"
              }`}>
                {stageTransition.subtext}
              </p>

              <div className="pt-4 flex justify-center">
                <span className={`text-[9px] font-mono uppercase tracking-widest flex items-center gap-1.5 px-3 py-1 rounded-full border ${
                  theme === "dark"
                    ? "font-bold text-cyan-400/60 bg-cyan-950/25 border-cyan-500/10"
                    : "font-black text-indigo-700 bg-indigo-50 border-indigo-300"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full animate-ping ${
                    theme === "dark" ? "bg-cyan-400" : "bg-indigo-600"
                  }`} /> Loading Journey Frame
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* SMALL FOOTER */}
      <footer className="bg-slate-950/60 border-t border-slate-900 py-3 text-center text-[10px] text-slate-500 font-mono tracking-widest uppercase">
        © 2026 ZUPSKILL FUTURE REDESIGN PORTAL
      </footer>

    </div>
  );
}
