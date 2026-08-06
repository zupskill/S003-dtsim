import React, { useState, useEffect } from "react";
import { Topic, IdeaItem, PrototypeData } from "../types";
import { 
  Sparkles, 
  Layers, 
  FileText, 
  CloudUpload, 
  CheckCircle, 
  Lightbulb, 
  Flame,
  ArrowRight,
  Check,
  RotateCcw
} from "lucide-react";
import SafeTextInput from "./SafeTextInput";

interface PrototypeStageProps {
  topic: Topic;
  ideas: IdeaItem[];
  refinedProblem: string;
  onAddXP: (amount: number) => void;
  onUnlockBadge: (badgeId: string) => void;
  prototype: PrototypeData | null;
  setPrototype: (p: PrototypeData) => void;
  onNext: () => void;
  onShowToast?: (text: string, type?: "success" | "idea" | "info" | "badge") => void;
}

interface SceneItem {
  id: string;
  title: string;
  text: string;
  placeholder: string;
}

export default function PrototypeStage({
  topic,
  ideas,
  refinedProblem,
  onAddXP,
  onUnlockBadge,
  prototype,
  setPrototype,
  onNext,
  onShowToast
}: PrototypeStageProps) {
  
  const [originalProblemText] = useState<string>(() => {
    const key = `zupskill_define_${topic.id}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.selectedObs && parsed.selectedObs.text) {
          return parsed.selectedObs.text;
        }
      } catch {}
    }
    return "";
  });

  const [isCommitted, setIsCommitted] = useState<boolean>(() => {
    const key = `zupskill_prototype_committed_${topic.id}`;
    const saved = localStorage.getItem(key);
    return saved === "true";
  });

  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [pendingSelectedIdea, setPendingSelectedIdea] = useState<IdeaItem | null>(null);
  const [localToast, setLocalToast] = useState<string | null>(null);

  useEffect(() => {
    if (localToast) {
      const timer = setTimeout(() => {
        setLocalToast(null);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [localToast]);

  const [selectedIdea, setSelectedIdea] = useState<IdeaItem | null>(() => {
    const key = `zupskill_prototype_${topic.id}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.selectedIdea !== undefined && parsed.selectedIdea !== null) {
          return parsed.selectedIdea;
        }
      } catch {}
    }
    const bestIdea = ideas.find(i => i.category === "WOW") || ideas[0];
    return bestIdea || null;
  });

  const [format, setFormat] = useState<"storyboard" | "pitch">(() => {
    const key = `zupskill_prototype_${topic.id}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.format !== undefined && (parsed.format === "storyboard" || parsed.format === "pitch")) {
          return parsed.format;
        }
      } catch {}
    }
    return "storyboard";
  });

  // 1. Storyboard Modeler state (Predefined 5 key stages of storyboard)
  const [storyboardScenes, setStoryboardScenes] = useState<SceneItem[]>(() => {
    const key = `zupskill_prototype_${topic.id}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.storyboardScenes !== undefined && Array.isArray(parsed.storyboardScenes) && parsed.storyboardScenes.length === 5) {
          return parsed.storyboardScenes.map((s: any, idx: number) => {
            const defaultTitles = ["Problem", "Solution Introduction", "Solution in Action", "User Benefit", "Outcome"];
            return {
              id: s.id || `scene_${idx + 1}`,
              title: s.title || defaultTitles[idx],
              text: s.text || "",
              placeholder: s.placeholder || ""
            };
          });
        }
      } catch {}
    }
    return [
      { id: "scene_1", title: "Problem", text: "", placeholder: "Describe the core problem or pain point your user is facing..." },
      { id: "scene_2", title: "Solution Introduction", text: "", placeholder: "How is the solution introduced or discovered by the user?" },
      { id: "scene_3", title: "Solution in Action", text: "", placeholder: "How does the user interact with the solution? Describe it in action!" },
      { id: "scene_4", title: "User Benefit", text: "", placeholder: "What immediate relief, benefit, or value does the user get?" },
      { id: "scene_5", title: "Outcome", text: "", placeholder: "What is the ultimate positive outcome for the user and community?" }
    ];
  });

  // 2. Solution Pitch state (What problem they solved, what solution they built, why it works, what impact it creates)
  const [pitch, setPitch] = useState(() => {
    const key = `zupskill_prototype_${topic.id}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.pitch !== undefined) {
          return {
            problemSolved: parsed.pitch.problemSolved || parsed.pitch.myIdea || "",
            solutionBuilt: parsed.pitch.solutionBuilt || "",
            whyItWorks: parsed.pitch.whyItWorks || parsed.pitch.howItWorks || "",
            impactCreated: parsed.pitch.impactCreated || parsed.pitch.whyItHelpers || ""
          };
        }
      } catch {}
    }
    return {
      problemSolved: "",
      solutionBuilt: "",
      whyItWorks: "",
      impactCreated: ""
    };
  });

  // Content moderation safety tracking states
  const [isStoryboardSafe, setIsStoryboardSafe] = useState<Record<string, boolean>>({});
  const [isPitchProblemSafe, setIsPitchProblemSafe] = useState(true);
  const [isPitchSolutionSafe, setIsPitchSolutionSafe] = useState(true);
  const [isPitchWhySafe, setIsPitchWhySafe] = useState(true);
  const [isPitchImpactSafe, setIsPitchImpactSafe] = useState(true);

  const storyboardActiveUnsafe = Object.values(isStoryboardSafe).some(val => val === false);
  const pitchActiveUnsafe = !isPitchProblemSafe || !isPitchSolutionSafe || !isPitchWhySafe || !isPitchImpactSafe;
  const formatUnsafe = format === "storyboard" ? storyboardActiveUnsafe : pitchActiveUnsafe;

  // Optional File Upload state
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string } | null>(() => {
    const key = `zupskill_prototype_${topic.id}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.uploadedFile !== undefined) return parsed.uploadedFile;
      } catch {}
    }
    return null;
  });
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    const stateToSave = {
      format,
      storyboardScenes,
      pitch,
      uploadedFile,
      selectedIdea,
      isCommitted
    };
    localStorage.setItem(`zupskill_prototype_${topic.id}`, JSON.stringify(stateToSave));
    localStorage.setItem(`zupskill_prototype_committed_${topic.id}`, String(isCommitted));
  }, [format, storyboardScenes, pitch, uploadedFile, selectedIdea, isCommitted, topic.id]);

  // Set initial selected idea from Stage 4
  useEffect(() => {
    if (ideas.length > 0 && !selectedIdea) {
      const bestIdea = ideas.find(i => i.category === "WOW") || ideas[0];
      setSelectedIdea(bestIdea);
    }
  }, [ideas, selectedIdea]);

  // Optional File attachment handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setUploadedFile({
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`
      });
      onAddXP(20);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile({
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`
      });
      onAddXP(20);
    }
  };

  // Blueprint preset templates to help fast-track storyboard/pitch fields with edit control
  const handleAutoFillSuggestion = () => {
    if (!selectedIdea) return;

    if (format === "storyboard") {
      setStoryboardScenes([
        { id: "scene_1", title: "Problem", text: `Users are experiencing constant anxiety or frustration due to the targeted problem of "${originalProblemText || "this target issue"}".`, placeholder: "Describe the core problem or pain point your user is facing..." },
        { id: "scene_2", title: "Solution Introduction", text: `To address this, our solution "${selectedIdea.enhancedTitle || selectedIdea.text}" is introduced to give the user immediate power and agency.`, placeholder: "How is the solution introduced or discovered by the user?" },
        { id: "scene_3", title: "Solution in Action", text: "The user easily opens or interacts with our solution to navigate around the danger or coordinate with system alerts.", placeholder: "How does the user interact with the solution? Describe it in action!" },
        { id: "scene_4", title: "User Benefit", text: "Instead of facing danger, hassle, or friction alone, they receive clear guidance, instant coordination, and ease.", placeholder: "What immediate relief, benefit, or value does the user get?" },
        { id: "scene_5", title: "Outcome", text: "The user arrives safely at their destination or achieves their task with robust peace of mind, strengthening their community connection.", placeholder: "What is the ultimate positive outcome for the user and community?" }
      ]);
    } else if (format === "pitch") {
      setPitch({
        problemSolved: `We solved the core problem where users struggled with: "${originalProblemText || "this target challenge"}" as highlighted by student feedback.`,
        solutionBuilt: `Our solution "${selectedIdea.enhancedTitle || selectedIdea.text}" provides an elegant, interactive system to coordinate assistance.`,
        whyItWorks: "It works because it brings immediate safety overlays, automated warnings, and coordinates community peers in real time.",
        impactCreated: "This transforms isolation and anxiety into confidence, ensuring higher safety, trust, and less friction on campus."
      });
    }
    onAddXP(15);
  };

  // Evaluate progress & micro celebrations
  const getProgressStats = () => {
    if (!selectedIdea) return { percentage: 0, text: "Select an idea on the left to start!" };

    let itemsFilled = 0;
    let totalTargets = 4;

    if (format === "storyboard") {
      itemsFilled = storyboardScenes.filter((s) => s.text.trim().length > 3).length;
      totalTargets = 5;
    } else if (format === "pitch") {
      if (pitch.problemSolved.trim().length > 3) itemsFilled++;
      if (pitch.solutionBuilt.trim().length > 3) itemsFilled++;
      if (pitch.whyItWorks.trim().length > 3) itemsFilled++;
      if (pitch.impactCreated.trim().length > 3) itemsFilled++;
      totalTargets = 4;
    }

    // 25% is given simply for selecting the idea
    const activeProgressPct = Math.min(25 + Math.round((itemsFilled / totalTargets) * 75), 100);

    // Micro feedback labels
    let microCelebrationLabel = "Drafting base coordinates...";
    if (itemsFilled === 1) {
      microCelebrationLabel = "✨ Nice start!";
    } else if (itemsFilled >= 3 || (format === "pitch" && itemsFilled === 4)) {
      microCelebrationLabel = "🚀 Your idea is taking shape.";
    }
    if (activeProgressPct === 100) {
      microCelebrationLabel = "🎉 Prototype ready for testing!";
    }

    return {
      percentage: activeProgressPct,
      text: microCelebrationLabel,
      itemsCount: itemsFilled
    };
  };

  const progress = getProgressStats();

  const handleSavePrototype = () => {
    if (!selectedIdea || formatUnsafe) return;

    let composedDesc = "";
    if (format === "storyboard") {
      composedDesc = `Storyboard flow describing user interaction with "${selectedIdea.text}": ` + 
        storyboardScenes.map((s) => `[${s.title}] ${s.text || s.placeholder}`).join(" → ");
    } else if (format === "pitch") {
      composedDesc = `Solution Pitch: [Problem Solved] ${pitch.problemSolved} [Solution Built] ${pitch.solutionBuilt} [Why It Works] ${pitch.whyItWorks} [Impact] ${pitch.impactCreated}`;
    }

    const titlePrefix = selectedIdea.enhancedTitle || selectedIdea.text.split(" ").slice(0, 3).join(" ");

    const pData: PrototypeData = {
      title: titlePrefix,
      description: composedDesc,
      format: format,
      storyboardSteps: storyboardScenes.map((s) => `${s.title}: ${s.text}`).filter(Boolean),
      uploadedName: uploadedFile?.name
    };

    setPrototype(pData);
    onAddXP(40);
    onUnlockBadge("prototype-builder");
    onShowToast?.("🚀 Prototype ready", "success");
    onNext();
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-6 px-4 animate-in fade-in duration-350">
      
      {/* HEADER SECTION - exciting human phrasing */}
      <div className="text-center mb-8 max-w-2xl mx-auto">
        <span className="text-xs font-mono text-brand-primary bg-brand-primary/45 px-3 py-1 rounded-full border border-brand-primary/20 uppercase tracking-[0.2em]">
          Step 4: BRING YOUR IDEA TO LIFE 🎬
        </span>
        <h2 className="text-3xl font-extrabold text-text-primary mt-4 mb-2 tracking-tight">
          Bring Your Idea to Life
        </h2>
        <p className="text-sm text-text-secondary">
          Pick one idea and show how it would work in the real world.
        </p>
      </div>

      {/* 🎯 CONTEXT DASHBOARD: TARGET PROBLEM & ACTIVE SOLUTION BLUEPRINT */}
      <div className="bg-background/80 border border-slate-850 p-4 rounded-2xl mb-6 grid grid-cols-1 md:grid-cols-2 gap-4.5 relative overflow-hidden backdrop-blur-md shadow-[0_4px_20px_rgba(0,181,230,0.04)] animate-in slide-in-from-top duration-300">
        <div className="absolute top-0 left-0 w-1 h-full bg-brand-primary/50" />
        
        {/* Left Aspect: Pinned Struggle & Design Challenge */}
        <div className="flex flex-col gap-3 pl-2">
          {/* Target Problem */}
          <div className="flex items-start gap-2.5">
            <div className="p-1.5 bg-brand-primary/45 rounded-xl border border-brand-primary/20 text-brand-primary mt-0.5 shrink-0 select-none text-xs">
              🎯
            </div>
            <div>
              <span className="text-[9px] font-mono font-black text-text-secondary tracking-widest block uppercase">
                TARGET PROBLEM
              </span>
              <p className="text-xs font-semibold text-text-primary mt-0.5 leading-relaxed italic">
                "{originalProblemText || "..."}"
              </p>
            </div>
          </div>
          
          {/* Design Challenge (HMW) */}
          <div className="flex items-start gap-2.5 pt-2 border-t border-border/60">
            <div className="p-1.5 bg-brand-primary/45 rounded-xl border border-brand-primary/20 text-brand-primary mt-0.5 shrink-0 select-none text-xs">
              ✨
            </div>
            <div>
              <span className="text-[9px] font-mono font-black text-brand-primary tracking-widest block uppercase font-bold text-brand-primary">
                🎯 DESIGN CHALLENGE (HMW)
              </span>
              <p className="text-xs font-bold text-text-primary mt-0.5 leading-relaxed">
                "{refinedProblem || "..."}"
              </p>
            </div>
          </div>
        </div>

        {/* Right Aspect: Selected Solution Blueprint */}
        <div className="flex items-start gap-2.5 md:border-l md:border-slate-850/85 md:pl-4">
          <div className="p-1.5 bg-amber-950/45 rounded-xl border border-brand-secondary/25 text-brand-secondary mt-0.5 shrink-0 select-none">
            💡
          </div>
          <div>
            <span className="text-[9px] font-mono font-black text-amber-300 tracking-widest block uppercase font-bold">
              SELECTED SOLUTION
            </span>
            {selectedIdea && isCommitted ? (
              <div className="space-y-0.5 mt-0.5 animate-in fade-in duration-200">
                <p className="text-xs font-bold text-text-primary leading-relaxed">
                  {selectedIdea.enhanced ? selectedIdea.enhancedTitle : selectedIdea.text}
                </p>
                <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                  ✓ Confirmed for Prototyping
                </p>
              </div>
            ) : (
              <p className="text-xs text-text-tertiary mt-0.5 italic">
                {selectedIdea ? "Pending solution commitment lock..." : "Please choose and lock a solution to begin!"}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch mb-6 animate-in fade-in duration-300">
        
        {/* LEFT COLUMN: SELECTED IDEA SPOTLIGHT KEYCARD (Col 4) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          
          <div className="bg-background/20 border border-border/60 p-5 rounded-3xl flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <span className="text-[10px] font-mono font-bold tracking-wider text-text-tertiary block uppercase">
                💡 {isCommitted ? "CHOSEN BLUEPRINT ACTIVE" : "SELECT YOUR SOLUTION"}
              </span>

              <div className="space-y-2.5 max-h-[290px] overflow-y-auto scrollbar-none pr-1">
                {ideas.map((item) => {
                  const isSelected = selectedIdea?.id === item.id;
                  const isDimmed = isCommitted && !isSelected;
                  const isLoverActive = isCommitted && isSelected;
                  
                  const catBadges: Record<string, string> = {
                    HOW: "bg-purple-950/40 text-purple-400 border-purple-500/15",
                    WOW: "bg-brand-primary/40 text-brand-primary border-brand-primary/15",
                    NOW: "bg-yellow-950/40 text-brand-secondary border-yellow-500/15",
                  };

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (isCommitted) {
                          onShowToast?.("To choose another solution, please click '🔄 Choose Different Solution' below first.", "info");
                          return;
                        }
                        setPendingSelectedIdea(item);
                        setShowConfirmModal(true);
                      }}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all duration-300 text-xs flex flex-col gap-1.5 cursor-pointer ${
                        isDimmed 
                          ? "border-border/40 bg-background/5 text-text-tertiary opacity-45 cursor-not-allowed hover:opacity-60 saturate-50 blur-[0.2px] hover:blur-none"
                          : isLoverActive 
                          ? "border-brand-primary bg-brand-primary/20 text-text-primary shadow-[0_0_18px_rgba(0,181,230,0.15)] scale-[1.02] ring-1 ring-brand-primary/30"
                          : isSelected
                          ? "border-brand-secondary/40 bg-amber-950/5 text-text-primary scale-[1.01]"
                          : "border-border/60 bg-transparent text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className={`text-[8px] font-mono font-bold uppercase border px-2 py-0.5 rounded ${catBadges[item.category] || "bg-surface text-text-secondary border-border"}`}>
                          {item.category}
                        </span>
                        {isLoverActive ? (
                          <span className="text-[8px] font-mono text-brand-primary flex items-center gap-1 font-bold">
                            <CheckCircle className="w-3 h-3 text-brand-primary animate-pulse" /> LOCKED
                          </span>
                        ) : item.enhanced ? (
                          <span className="text-[8px] font-mono font-bold uppercase text-purple-400">⚡ ENHANCED</span>
                        ) : null}
                      </div>

                      <p className="font-semibold leading-relaxed">
                        {item.enhanced ? item.enhancedTitle : item.text}
                      </p>
                    </button>
                  );
                })}

                {ideas.length === 0 && (
                  <div className="p-8 border-2 border-dashed border-border text-center rounded-2xl">
                    <p className="text-xs text-text-tertiary">Your Brainstorm list is empty.</p>
                    <p className="text-[10px] text-text-tertiary mt-1">Please go back to Ideate!</p>
                  </div>
                )}
              </div>
            </div>

            {/* SELECTED SOLUTION CARD - VISUAL MOMENT OF COMMITMENT */}
            {selectedIdea && (
              <div className="mt-5">
                {isCommitted ? (
                  <div className="p-4.5 bg-gradient-to-r from-brand-primary/40 via-brand-primary/90/20 to-amber-950/30 rounded-2xl border border-brand-primary shadow-[0_0_20px_rgba(0,181,230,0.12)] relative overflow-hidden transition-all duration-300">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/10 rounded-full blur-xl pointer-events-none" />
                    <span className="text-[10px] font-mono font-bold text-brand-primary uppercase tracking-widest block mb-1.5 flex items-center gap-1">
                      💡 SELECTED SOLUTION
                    </span>
                    <p className="text-xs text-text-primary font-black leading-relaxed italic">
                      "{selectedIdea.enhanced ? selectedIdea.enhancedTitle : selectedIdea.text}"
                    </p>
                    {selectedIdea.reasoning && (
                      <p className="text-[10px] text-slate-450 font-medium leading-relaxed mt-2 italic">
                        "{selectedIdea.reasoning}"
                      </p>
                    )}
                    
                    <div className="mt-3.5 pt-3 border-t border-slate-950/40 flex items-center justify-between gap-2.5">
                      <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 font-bold">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> ✓ Confirmed for Prototyping
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCommitted(false);
                          onShowToast?.("🔓 Choice unlocked. Select another idea card!", "info");
                        }}
                        className="text-[9px] font-mono bg-background hover:bg-surface text-brand-secondary hover:text-amber-300 px-2.5 py-1.5 rounded-lg border border-slate-850 hover:border-border-subtle transition-colors uppercase font-bold flex items-center gap-1 cursor-pointer"
                      >
                        🔄 Choose Different Solution
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4.5 bg-background/50 border border-dashed border-slate-805 text-text-tertiary rounded-2xl flex flex-col items-center justify-center text-center gap-2">
                    <span className="text-xl animate-bounce">🔒</span>
                    <p className="text-[11px] font-semibold text-text-secondary animate-pulse">Commitment Required</p>
                    <p className="text-[10px] text-text-tertiary max-w-[210px] leading-relaxed">
                      Please select an idea card above to lock in your target solution.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: PROTOTYPE SUITE (Story, Flow, Suggest Pitch) (Col 8) */}
        <div className="lg:col-span-8 flex flex-col">
          {!isCommitted ? (
            <div className="bg-background/25 border border-border/60 p-8 rounded-3xl flex flex-col items-center justify-center text-center min-h-[460px] h-full relative overflow-hidden">
              {/* Visual grid blueprint background */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,181,230,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,181,230,0.03)_1px,transparent_1px)] bg-[size:14px_24px]" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-brand-primary/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative z-10 max-w-sm flex flex-col items-center gap-4">
                <div className="w-14 h-14 bg-surface border border-border rounded-2xl flex items-center justify-center text-brand-primary shadow-[0_0_20px_rgba(0,181,230,0.1)] select-none">
                  <span className="text-2xl animate-pulse">🔒</span>
                </div>
                <div>
                  <h3 className="text-base font-black text-text-primary tracking-tight uppercase">
                    Prototyping Workspace Closed
                  </h3>
                  <p className="text-[11px] text-text-secondary mt-2 leading-relaxed">
                    Please select an idea card on the left and finalize your Solution Commitment to unlock this interactive modeling deck!
                  </p>
                </div>
                <div className="p-3 bg-brand-primary/20 rounded-xl border border-brand-primary/10 text-[10px] font-mono text-brand-primary">
                  We'll build out your chosen design journey together once committed.
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-background/15 border border-border/80 p-5 rounded-3xl flex flex-col justify-between flex-1 relative animate-in fade-in duration-300">
              
              {/* Format Pickers Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 mb-4 border-b border-border/60 gap-4">
                <div>
                  <span className="text-[10px] font-mono font-bold tracking-wider text-text-tertiary block uppercase">
                    ⚙️ MODELING MEDIUM
                  </span>
                  <p className="text-xs text-text-secondary">Choose the format you prefer to map down details!</p>
                </div>

                <div className="flex bg-background/80 p-1.5 rounded-2xl border border-slate-850 gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setFormat("storyboard")}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all uppercase cursor-pointer flex items-center gap-1.5 ${
                      format === "storyboard" ? "bg-brand-primary text-black shadow-md" : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" /> Storyboard 🎬
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormat("pitch")}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all uppercase cursor-pointer flex items-center gap-1.5 ${
                      format === "pitch" ? "bg-brand-primary text-black shadow-md" : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" /> Solution Pitch ✨
                  </button>
                </div>
              </div>

              {/* FOCUS BLUEPRINT REMINDER CARD */}
              {selectedIdea && (
                <div className="bg-brand-primary/5 border border-brand-primary/20 p-3 rounded-2xl mb-4 text-[11px] flex items-center justify-between gap-3 text-text-secondary">
                  <div className="flex items-center gap-2 truncate">
                    <span className="p-1.5 bg-brand-primary/50 rounded-lg text-brand-primary font-bold font-mono text-[9px] shrink-0 select-none">
                      ACTIVE SOLUTION
                    </span>
                    <p className="truncate font-medium italic">
                      You are currently prototyping: <span className="text-text-primary font-extrabold">"{selectedIdea.enhanced ? selectedIdea.enhancedTitle : selectedIdea.text}"</span>
                    </p>
                  </div>
                </div>
              )}

              {/* REAL-TIME DYNAMIC WORKSPACE */}
              <div className="flex-1 min-h-[290px]">
                
                {/* Form fills suggest blueprint buttons */}
                {selectedIdea && (
                  <div className="flex justify-end mb-3">
                    <button
                      onClick={handleAutoFillSuggestion}
                      className="text-[10px] bg-surface/80 hover:bg-surface-hover text-brand-primary hover:text-brand-primary rounded-lg px-2.5 py-1 border border-border hover:border-border-subtle transition-colors uppercase font-mono tracking-widest flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-brand-primary" /> Suggest Starter Draft
                    </button>
                  </div>
                )}

                {/* 1. STORYBOARD EXPERIENCE */}
                {format === "storyboard" && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-brand-primary font-mono font-bold uppercase tracking-wider block">
                        Scene sequence (Build your journey storyboard)
                      </span>
                    </div>

                    <div className="flex flex-col gap-2 max-h-[440px] overflow-y-auto pr-3 pb-4">
                      {storyboardScenes.map((scene, idx) => (
                        <div key={scene.id} className="flex flex-col items-center w-full">
                          <div className="w-full p-4 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-850 rounded-2xl flex flex-col gap-3">
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-mono font-black text-brand-primary bg-brand-primary/45 px-2.5 py-1 rounded border border-brand-primary/15 uppercase w-fit shrink-0">
                                Scene {idx + 1}
                              </span>
                              <div className="text-text-primary text-sm font-bold font-sans">
                                {scene.title}
                              </div>
                            </div>

                            <SafeTextInput
                              type="textarea"
                              placeholder={scene.placeholder}
                              value={scene.text}
                              onChange={(val) => {
                                const updated = [...storyboardScenes];
                                updated[idx].text = val;
                                setStoryboardScenes(updated);
                              }}
                              onSafetyChange={(safe) => setIsStoryboardSafe(prev => ({ ...prev, [scene.id]: safe }))}
                              context={selectedIdea ? `Prototype Storyboard Scene ${idx + 1} (${scene.title}): ${selectedIdea.text}` : "Prototype Storyboard Scene"}
                              className="w-full bg-background/80 border border-slate-850 p-3 text-sm text-slate-255 rounded-xl focus:outline-none focus:border-brand-primary/50 placeholder:text-text-tertiary resize-y min-h-[90px] font-medium leading-relaxed"
                            />
                          </div>
                          
                          {idx < storyboardScenes.length - 1 && (
                            <div className="h-6 w-0.5 bg-gradient-to-b from-brand-primary/30 to-transparent my-1 rounded-full relative">
                              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-brand-primary/50 text-[10px]">
                                ↓
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. SOLUTION PITCH EXPERIENCE */}
                {format === "pitch" && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <span className="text-[10px] text-brand-primary font-mono font-bold uppercase tracking-wider block">
                      SOLUTION PITCH (Pitch your concept in humbles, elegant prose)
                    </span>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[340px] overflow-y-auto pr-1">
                      {/* Field 1 */}
                      <div className="p-3.5 bg-background/80 border border-slate-850 rounded-2xl flex flex-col gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">🎯</span>
                          <span className="text-[9px] font-mono tracking-widest text-text-secondary uppercase font-black">
                            1. WHAT PROBLEM YOU SOLVED
                          </span>
                        </div>
                        <p className="text-[10px] text-text-tertiary leading-tight">
                          Describe the precise student pain point or struggle solved.
                        </p>
                        <SafeTextInput
                          type="textarea"
                          value={pitch.problemSolved}
                          onChange={(val) => setPitch({ ...pitch, problemSolved: val })}
                          onSafetyChange={(safe) => setIsPitchProblemSafe(safe)}
                          context={selectedIdea ? `Prototype Pitch Problem Solved: ${selectedIdea.text}` : "Prototype Pitch Problem Solved"}
                          placeholder="State the core student issue your design directly addresses..."
                          rows={3}
                          className="w-full bg-background border border-slate-850 p-2 text-xs text-text-primary rounded-xl focus:outline-none focus:border-brand-primary/30 resize-none font-medium leading-relaxed"
                        />
                      </div>

                      {/* Field 2 */}
                      <div className="p-3.5 bg-background/80 border border-slate-850 rounded-2xl flex flex-col gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">🛠️</span>
                          <span className="text-[9px] font-mono tracking-widest text-text-secondary uppercase font-black">
                            2. WHAT SOLUTION YOU BUILT
                          </span>
                        </div>
                        <p className="text-[10px] text-text-tertiary leading-tight">
                          Outline your design concept and what you've created.
                        </p>
                        <SafeTextInput
                          type="textarea"
                          value={pitch.solutionBuilt}
                          onChange={(val) => setPitch({ ...pitch, solutionBuilt: val })}
                          onSafetyChange={(safe) => setIsPitchSolutionSafe(safe)}
                          context={selectedIdea ? `Prototype Pitch Solution Built: ${selectedIdea.text}` : "Prototype Pitch Solution Built"}
                          placeholder="Summarize the core mechanism of your solution..."
                          rows={3}
                          className="w-full bg-background border border-slate-850 p-2 text-xs text-text-secondary rounded-xl focus:outline-none focus:border-brand-primary/30 resize-none font-medium leading-relaxed"
                        />
                      </div>

                      {/* Field 3 */}
                      <div className="p-3.5 bg-background/80 border border-slate-850 rounded-2xl flex flex-col gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">⚡</span>
                          <span className="text-[9px] font-mono tracking-widest text-text-secondary uppercase font-black">
                            3. WHY IT WORKS
                          </span>
                        </div>
                        <p className="text-[10px] text-text-tertiary leading-tight">
                          Explain what makes this idea effective and clever.
                        </p>
                        <SafeTextInput
                          type="textarea"
                          value={pitch.whyItWorks}
                          onChange={(val) => setPitch({ ...pitch, whyItWorks: val })}
                          onSafetyChange={(safe) => setIsPitchWhySafe(safe)}
                          context={selectedIdea ? `Prototype Pitch Why It Works: ${selectedIdea.text}` : "Prototype Pitch Why It Works"}
                          placeholder="Details the smart mechanism or logic behind its utility..."
                          rows={3}
                          className="w-full bg-background border border-slate-850 p-2 text-xs text-text-secondary rounded-xl focus:outline-none focus:border-brand-primary/30 resize-none font-medium leading-relaxed"
                        />
                      </div>

                      {/* Field 4 */}
                      <div className="p-3.5 bg-background/80 border border-slate-850 rounded-2xl flex flex-col gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">💖</span>
                          <span className="text-[9px] font-mono tracking-widest text-text-secondary uppercase font-black">
                            4. WHAT IMPACT IT CREATES
                          </span>
                        </div>
                        <p className="text-[10px] text-text-tertiary leading-tight">
                          Describe the final benefit or peace of mind delivered.
                        </p>
                        <SafeTextInput
                          type="textarea"
                          value={pitch.impactCreated}
                          onChange={(val) => setPitch({ ...pitch, impactCreated: val })}
                          onSafetyChange={(safe) => setIsPitchImpactSafe(safe)}
                          context={selectedIdea ? `Prototype Pitch Impact Created: ${selectedIdea.text}` : "Prototype Pitch Impact Created"}
                          placeholder="How does this resolve anxieties and delight students..."
                          rows={3}
                          className="w-full bg-background border border-slate-850 p-2 text-xs text-text-secondary rounded-xl focus:outline-none focus:border-brand-primary/30 resize-none font-medium leading-relaxed"
                        />
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* LOWER PORTION: FILE UPLOAD ZONE & PROGRESS TRACKER */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border/60 pt-4 mt-4">
                
                {/* TARGET/PROGRESS TRACKER WITH MOTIVATION STATUS */}
                <div className="bg-background/30 p-3.5 rounded-2xl border border-border flex flex-col justify-center gap-2">
                  <div className="flex items-center justify-between text-[11px] font-mono uppercase text-text-secondary font-bold">
                    <span>PROTOTYPE PROGRESS</span>
                    <span className={`font-black ${progress.percentage === 100 ? "text-emerald-400" : "text-brand-primary"}`}>
                      {progress.percentage}%
                    </span>
                  </div>
                  
                  <div className="w-full h-1.5 bg-background rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${progress.percentage === 100 ? "bg-emerald-500" : "bg-brand-primary"}`}
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>

                  <p className="text-[11px] text-text-secondary font-bold mt-0.5 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
                    <span>{progress.text}</span>
                  </p>
                </div>

                {/* INTERACTIVE OPTIONAL DOCK UPLOAD ZONE */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-3 text-center transition-all flex flex-col justify-center cursor-pointer ${
                    dragOver
                      ? "border-brand-primary bg-brand-primary/5"
                      : uploadedFile
                      ? "border-emerald-500/40 bg-emerald-950/15"
                      : "border-slate-850 bg-background/10 hover:border-border hover:bg-background/30"
                  }`}
                >
                  <input
                    type="file"
                    id="pro-file-upload"
                    accept="image/*,.pdf,.sketch"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  <label htmlFor="pro-file-upload" className="cursor-pointer">
                    {uploadedFile ? (
                      <div className="flex items-center justify-center gap-2 text-emerald-400">
                        <CheckCircle className="w-4 h-4 shrink-0 animate-bounce" />
                        <div className="text-left">
                          <span className="font-bold text-xs text-text-primary block truncate max-w-[190px]">{uploadedFile.name} ({uploadedFile.size})</span>
                          <span className="text-[9px] block text-text-secondary">Mockup attached successfully.</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        <CloudUpload className="w-5 h-5 text-text-tertiary mx-auto" />
                        <p className="text-[10px] text-text-secondary font-bold block">
                          Upload custom wireframe or sketch (Optional)
                        </p>
                        <p className="text-[9px] text-text-tertiary block">
                          Drag & Drop here or Browse files
                        </p>
                      </div>
                    )}
                  </label>
                </div>

              </div>

            </div>
          )}
        </div>

      </div>

      {/* STAGE MAIN NAVIGATION CONTROL BAR */}
      <div className="flex justify-between items-center mt-4 pt-4 border-t border-border/80">
        <span className="text-text-tertiary text-xs">
          Stage 5: Coherent Blueprint Active ({selectedIdea ? "Idea locked" : "No idea active"})
        </span>
        
        <button
          disabled={!selectedIdea || progress.percentage < 50 || formatUnsafe}
          onClick={handleSavePrototype}
          className="px-10 py-3.5 bg-orange-600 hover:bg-orange-500 text-text-primary font-extrabold text-xs uppercase tracking-widest rounded-full cursor-pointer transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_15px_rgba(234,88,12,0.3)] hover:shadow-[0_0_25px_rgba(234,88,12,0.5)] disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-none"
        >
          Test the Solution →
        </button>
      </div>

      {/* SOLUTION COMMITMENT LIGHTWEIGHT CONFIRMATION MODAL */}
      {showConfirmModal && pendingSelectedIdea && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface border border-border rounded-3xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-primary to-brand-primary/80" />
            
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2.5 bg-brand-primary/40 rounded-2xl border border-brand-primary/20 text-brand-primary shrink-0">
                <Lightbulb className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-black text-text-primary tracking-tight uppercase">
                  💡 Prototype This Idea?
                </h3>
                <p className="text-[10px] text-text-secondary font-medium">
                  Confirm your solution commitment
                </p>
              </div>
            </div>

            <div className="p-4 bg-background/60 rounded-2xl border border-slate-850 my-4 text-xs font-semibold text-text-primary leading-relaxed italic">
              "{pendingSelectedIdea.enhanced ? pendingSelectedIdea.enhancedTitle : pendingSelectedIdea.text}"
            </div>

            <p className="text-[11px] text-text-secondary leading-relaxed mb-6">
              You are about to build your prototype around this solution. Locking down this choice updates your Storyboard and Solution Pitch instantly.
            </p>

            <div className="flex items-center gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  setPendingSelectedIdea(null);
                }}
                className="px-4 py-2 bg-transparent hover:bg-surface-hover text-text-secondary hover:text-text-primary rounded-xl text-xs font-bold transition-all uppercase cursor-pointer"
              >
                Choose Another
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedIdea(pendingSelectedIdea);
                  setIsCommitted(true);
                  setShowConfirmModal(false);
                  setPendingSelectedIdea(null);
                  onShowToast?.("✓ Solution Locked In", "success");
                  onAddXP?.(15);
                }}
                className="px-5 py-2.5 bg-brand-primary hover:bg-brand-primary text-slate-950 rounded-xl text-xs font-black transition-all uppercase font-mono tracking-wider flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(0,181,230,0.25)] hover:shadow-[0_0_25px_rgba(0,181,230,0.4)]"
              >
                <Check className="w-4 h-4 text-slate-950 stroke-[3]" /> Prototype This Idea
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
