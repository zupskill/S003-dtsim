import React, { useState, useEffect } from "react";
import { Topic, ProblemObservation } from "../types";
import { Eye, Compass, HelpCircle, Info, Sparkles, AlertTriangle, Loader2, CheckCircle, Check, RotateCcw } from "lucide-react";
import SafeTextInput from "./SafeTextInput";

interface DefineStageProps {
  topic: Topic;
  problemObservations: ProblemObservation[];
  onAddXP: (amount: number) => void;
  refinedHowMightWe: string;
  setRefinedHowMightWe: (statement: string) => void;
  onNext: () => void;
  onShowToast?: (text: string, type?: "success" | "idea" | "info" | "badge") => void;
}

// Map pre-defined struggle phrases to smart target action verbs/goals to drive real-time live preview
function smartReframeHMW(problemText: string, perspectiveName: string = ""): string {
  if (!problemText) {
    return "How might we design a more welcoming and seamless experience for our community?";
  }

  const text = problemText.trim();
  const lowerText = text.toLowerCase();
  const actor = perspectiveName ? perspectiveName.trim() : "people";
  const actorPlural = actor.endsWith("s") || actor.toLowerCase() === "people" || actor.toLowerCase() === "elderly" ? actor : `${actor}s`;

  // 1. High-fidelity default maps matching predefined struggles
  if (lowerText.includes("lunch alone") || lowerText.includes("alone in canteen")) {
    return "How might we help students feel more comfortable and connected during meal times on campus?";
  }
  if (lowerText.includes("street light") || lowerText.includes("lighting") || lowerText.includes("unlit")) {
    return "How might we improve street lighting maintenance to make walking at night feel safer?";
  }
  if (lowerText.includes("pedestrian signal") || lowerText.includes("cross") || lowerText.includes("seconds")) {
    if (lowerText.includes("elderly") || lowerText.includes("slow")) {
      return "How might we make pedestrian crossings safer and more accessible for elderly passengers?";
    }
    return "How might we design pedestrian crossings to keep slow-walking citizens safe and unhurried?";
  }
  if (lowerText.includes("bus starts") || lowerText.includes("walk slow") || (lowerText.includes("bus") && lowerText.includes("elderly"))) {
    return "How might we make public transit boarding more accessible and patient for elderly citizens?";
  }
  if (lowerText.includes("double-park") || lowerText.includes("blocking") || lowerText.includes("parking")) {
    return "How might we prevent double-parking and make local narrow roads easily navigable?";
  }
  if (lowerText.includes("pothole") || lowerText.includes("wet road") || lowerText.includes("scooter rider")) {
    return "How might we protect riders from road hazards and make commuting routes safer?";
  }
  if (lowerText.includes("scroll") || lowerText.includes("scroller") || lowerText.includes("mindless")) {
    return "How might we help students cultivate digital mindfulness and better sleep habits away from endless scrolling?";
  }
  if (lowerText.includes("stigma") || lowerText.includes("counselor")) {
    return "How might we make mental health resources more approachable and stigma-free for students?";
  }
  if (lowerText.includes("lonely") || lowerText.includes("clique") || lowerText.includes("friend")) {
    return "How might we make classroom and campus gatherings more welcoming to help peers build real friendships?";
  }
  if (lowerText.includes("expensive") || lowerText.includes("canteen") || lowerText.includes("affordable")) {
    return "How might we make healthy, high-quality nourishment affordable for all campus students?";
  }
  if (lowerText.includes("noisy") || lowerText.includes("study space") || lowerText.includes("distract")) {
    return "How might we create quiet, distraction-free study spaces that promote deep student focus?";
  }

  // 2. Regex-based pattern-matching for smart verb-based transformations
  // Pattern A: "becomes very hard for X to Y" -> "How might we make Y easier and more seamless for X?"
  const hardForRegex = /(?:becomes\s+)?(?:very\s+)?(?:hard|difficult|challenging)\s+for\s+(.+?)\s+to\s+(.+)/i;
  let match = text.match(hardForRegex);
  if (match) {
    const matchedActor = match[1].trim();
    const action = match[2].trim().replace(/[.!?]+$/, "");
    return `How might we make it simpler and safer for ${matchedActor} to ${action}?`;
  }

  // Pattern B: "struggle(s) to X" -> "How might we help X in a smoother way?"
  const struggleToRegex = /struggle[s]?\s+to\s+(.+)/i;
  match = text.match(struggleToRegex);
  if (match) {
    const action = match[1].trim().replace(/[.!?]+$/, "");
    return `How might we help ${actorPlural} ${action} without feeling overwhelmed?`;
  }

  // Pattern C: "lack of X makes Y" or "no X turns into Y" -> "How might we improve X to enhance Y?"
  if (lowerText.startsWith("lack of ") || lowerText.startsWith("missing ")) {
    const subject = text.replace(/^(lack of|missing)\s+/i, "").replace(/[.!?]+$/, "");
    return `How might we optimize the design of ${subject} to support ${actorPlural}?`;
  }

  // Clean trailing punctuation
  const cleanStr = text.replace(/[.!?]+$/, "").trim();

  // Pattern D: "How might we..." already present
  if (lowerText.startsWith("how might we")) {
    return text;
  }

  // Final fallback that is descriptive, clean, and DOES NOT wrap inside a generic lazy sentence template.
  // Transform raw text by changing passive/negative sentences into active, positive, goal-oriented statements
  let actionPhrased = cleanStr;
  
  // Strip common leading fluff
  actionPhrased = actionPhrased.replace(/^(is\s+)?(always\s+)?(very\s+)?(hard|difficult)\s+because\s+/i, "");
  actionPhrased = actionPhrased.replace(/^struggles?\s+with\s+/i, "manage ");
  actionPhrased = actionPhrased.replace(/^feelings?\s+of\s+/i, "address ");
  
  // Make a beautiful HMW sentence out of the key goals
  return `How might we support ${actorPlural} in addressing issues around ${actionPhrased.toLowerCase()}?`;
}

export default function DefineStage({
  topic,
  problemObservations,
  onAddXP,
  refinedHowMightWe,
  setRefinedHowMightWe,
  onNext,
  onShowToast
}: DefineStageProps) {
  
  const [isCommitted, setIsCommitted] = useState<boolean>(() => {
    const key = `zupskill_define_committed_${topic.id}`;
    const saved = localStorage.getItem(key);
    return saved === "true";
  });

  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [pendingSelectedObs, setPendingSelectedObs] = useState<ProblemObservation | null>(null);

  const [selectedObs, setSelectedObs] = useState<ProblemObservation | null>(() => {
    const key = `zupskill_define_${topic.id}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.selectedObs !== undefined && parsed.selectedObs !== null) {
          return parsed.selectedObs;
        }
      } catch {}
    }
    return problemObservations[0] || null;
  });

  const [anythingElse, setAnythingElse] = useState(() => {
    const key = `zupskill_define_${topic.id}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.anythingElse !== undefined) return parsed.anythingElse;
      } catch {}
    }
    return "";
  });
  
  const [isAnythingElseSafe, setIsAnythingElseSafe] = useState(true);

  const [hasAddedXPValue, setHasAddedXPValue] = useState(() => {
    const key = `zupskill_define_${topic.id}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.hasAddedXPValue !== undefined) return parsed.hasAddedXPValue;
      } catch {}
    }
    return false;
  });

  useEffect(() => {
    const stateToSave = {
      anythingElse,
      hasAddedXPValue,
      selectedObs,
      isCommitted
    };
    localStorage.setItem(`zupskill_define_${topic.id}`, JSON.stringify(stateToSave));
    localStorage.setItem(`zupskill_define_committed_${topic.id}`, String(isCommitted));
  }, [anythingElse, hasAddedXPValue, selectedObs, isCommitted, topic.id]);

  // Select first available observation by default if not set
  useEffect(() => {
    if (problemObservations.length > 0 && !selectedObs) {
      setSelectedObs(problemObservations[0]);
    }
  }, [problemObservations, selectedObs]);

  // AI-powered Challenge Statement Generator states
  const [aiStatement, setAiStatement] = useState<string>("");
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<boolean>(false);
  const [precisionScore, setPrecisionScore] = useState<number | null>(null);
  const [precisionFeedback, setPrecisionFeedback] = useState<string>("");

  // Purely natural fallback HMW challenge statement translation creator
  const liveStatement = smartReframeHMW(selectedObs?.text || "", selectedObs?.perspectiveName || "");

  // Debounced API call to automatically generate defined statement
  useEffect(() => {
    if (!selectedObs || selectedObs.text.trim().length < 3) {
      setAiStatement("");
      setIsAiLoading(false);
      setAiError(false);
      setPrecisionScore(null);
      setPrecisionFeedback("");
      return;
    }

    setIsAiLoading(true);
    setAiError(false);

    const delayDebounceFn = setTimeout(async () => {
      try {
        const response = await fetch("/api/define", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            topicTitle: topic.title,
            problemSelection: selectedObs.text,
            answers: {
              anythingElse: anythingElse.trim(),
            },
          }),
        });

        if (!response.ok) {
          throw new Error("Failed server HMW generation");
        }

        const data = await response.json();
        if (data && data.finishedStatement) {
          setAiStatement(data.finishedStatement);
          setPrecisionScore(data.precisionScore || null);
          setPrecisionFeedback(data.precisionFeedback || "");
          setAiError(false);
        } else {
          throw new Error("Invalid response keys");
        }
      } catch (err) {
        console.error("AI Challenge statement generation failed:", err);
        setAiError(true);
      } finally {
        setIsAiLoading(false);
      }
    }, 850); // 850ms debouncing is optimal for typing flow

    return () => clearTimeout(delayDebounceFn);
  }, [anythingElse, selectedObs, topic.title]);

  // Sync state to parent on any input changes (using AI statement if available, otherwise local fallback)
  useEffect(() => {
    if (aiStatement) {
      setRefinedHowMightWe(aiStatement);
    } else {
      setRefinedHowMightWe(liveStatement);
    }
  }, [aiStatement, liveStatement, setRefinedHowMightWe]);

  // Load previously granted XP state
  useEffect(() => {
    const key = `zupskill_define_${topic.id}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.hasAddedXPValue) {
          setHasAddedXPValue(true);
        }
      } catch {}
    }
  }, [topic.id]);

  const canProgress = isCommitted && isAnythingElseSafe;

  return (
    <div className="w-full max-w-6xl mx-auto py-6 px-4 animate-in fade-in duration-300">
      
      {/* Header section - Minimal and focus-oriented */}
      <div className="text-center mb-6 max-w-2xl mx-auto">
        <span className="text-xs font-mono text-brand-primary uppercase tracking-[0.2em] px-3 py-1 bg-brand-primary/35 border border-brand-primary/20 rounded-full">
          Step 2: Define 🧭
        </span>
        <h2 className="text-3xl font-extrabold text-text-primary mt-4 mb-2 tracking-tight">
          Refine Your <span className="bg-gradient-to-r from-brand-primary to-brand-primary/80 text-transparent bg-clip-text font-black">Design Challenge 🎯</span>
        </h2>
        <p className="text-sm text-text-secondary">
          Transform a broad user struggle into a polished, actionable "How Might We" springboard for brainstorming.
        </p>
      </div>

      {/* 🎯 TOP CONTEXT PANEL (continuity dashboard) */}
      {isCommitted && selectedObs && (
        <div className="bg-background/80 border border-slate-850 p-4 rounded-2xl mb-6 grid grid-cols-1 md:grid-cols-2 gap-4.5 relative overflow-hidden backdrop-blur-md shadow-[0_4px_20px_rgba(0,181,230,0.04)] animate-in slide-in-from-top duration-300">
          <div className="absolute top-0 left-0 w-1 h-full bg-brand-primary/50" />
          
          {/* Left Aspect: Selected Problem */}
          <div className="flex items-start gap-2.5 pl-2">
            <div className="p-1.5 bg-brand-primary/45 rounded-xl border border-brand-primary/20 text-brand-primary mt-0.5 shrink-0 select-none">
              🎯
            </div>
            <div>
              <span className="text-[9px] font-mono font-black text-text-secondary tracking-widest block uppercase">
                TARGET PROBLEM
              </span>
              <p className="text-xs font-semibold text-text-primary mt-0.5 leading-relaxed italic">
                "{selectedObs?.text || "..."}"
              </p>
            </div>
          </div>

          {/* Right Aspect: Design Challenge (HMW) */}
          <div className="flex items-start gap-2.5 md:border-l md:border-slate-850/85 md:pl-4">
            <div className="p-1.5 bg-brand-primary/45 rounded-xl border border-brand-primary/25 text-brand-primary mt-0.5 shrink-0 select-none">
              ✨
            </div>
            <div>
              <span className="text-[9px] font-mono font-black text-brand-primary tracking-widest block uppercase font-bold">
                🎯 DESIGN CHALLENGE
              </span>
              <p className="text-xs font-bold text-text-primary mt-0.5 leading-relaxed">
                "{aiStatement || liveStatement || "..."}"
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Grid container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch mb-8">
        
        {/* LEFT COLUMN: Problem list from Board (Col 5) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-background/20 border border-border/60 p-5 rounded-3xl flex flex-col justify-between h-full min-h-[360px]">
            
            <div className="space-y-4">
              <span className="text-[10px] font-mono font-bold tracking-wider text-text-tertiary block uppercase px-1">
                📌 {isCommitted ? "CHOSEN PROBLEM ACTIVE" : "CHOOSE YOUR TARGET PROBLEM"}
              </span>

              <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-none pr-1">
                {problemObservations.map((obs) => {
                  const isSelected = selectedObs?.id === obs.id;
                  const isDimmed = isCommitted && !isSelected;
                  const isLoverActive = isCommitted && isSelected;
                  return (
                    <button
                      key={obs.id}
                      onClick={() => {
                        if (isCommitted) {
                          onShowToast?.("To choose another struggle, please click '🔄 Choose Different Problem' below.", "info");
                          return;
                        }
                        setPendingSelectedObs(obs);
                        setShowConfirmModal(true);
                      }}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all duration-300 text-xs flex items-start gap-3 cursor-pointer ${
                        isDimmed 
                          ? "border-border/40 bg-background/5 text-text-tertiary opacity-45 cursor-not-allowed hover:opacity-60 saturate-50 blur-[0.2px] hover:blur-none"
                          : isLoverActive 
                          ? "border-brand-primary bg-brand-primary/20 text-text-primary shadow-[0_0_18px_rgba(0,181,230,0.15)] scale-[1.02] ring-1 ring-brand-primary/30 font-semibold"
                          : isSelected
                          ? "border-brand-secondary/40 bg-amber-950/5 text-text-primary scale-[1.01]"
                          : "border-border/80 bg-background/40 text-text-secondary hover:text-text-primary hover:border-border-subtle/65"
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 transition-colors ${isLoverActive ? "bg-brand-primary animate-pulse" : isSelected ? "bg-amber-400 animate-pulse" : "bg-slate-700"}`} />
                      <div className="space-y-0.5 flex-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="text-[9px] font-mono font-bold block opacity-60 tracking-wider uppercase">
                            {obs.perspectiveName}
                          </span>
                          {isLoverActive && (
                            <span className="text-[8px] font-mono font-extrabold text-brand-primary flex items-center gap-1 uppercase tracking-wider bg-brand-primary/60 px-1.5 py-0.5 rounded border border-brand-primary/30">
                              <CheckCircle className="w-2.5 h-2.5 text-brand-primary stroke-[3]" /> LOCKED
                            </span>
                          )}
                        </div>
                        <span className={isDimmed ? "line-through decoration-slate-850" : ""}>"{obs.text}"</span>
                      </div>
                    </button>
                  );
                })}

                {problemObservations.length === 0 && (
                  <div className="p-8 border-2 border-dashed border-border text-center rounded-2xl">
                    <p className="text-xs text-text-tertiary">Your Problem Board is currently empty.</p>
                    <p className="text-[10px] text-text-tertiary mt-1">Please back up to Empathize and pin some struggles!</p>
                  </div>
                )}
              </div>
            </div>

            {/* SELECTED TARGET CARD - DYNAMIC HIGHLIGHT WITH UNLOCK OPTION */}
            {selectedObs && (
              <div className="mt-5">
                {isCommitted ? (
                  <div className="p-4.5 bg-gradient-to-r from-brand-primary/40 via-brand-primary/90/20 to-amber-950/30 rounded-2xl border border-brand-primary shadow-[0_0_20px_rgba(0,181,230,0.12)] relative overflow-hidden transition-all duration-300">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/10 rounded-full blur-xl pointer-events-none" />
                    <span className="text-[10px] font-mono font-bold text-brand-primary uppercase tracking-widest block mb-1.5 flex items-center gap-1">
                      🎯 SELECTED PROBLEM
                    </span>
                    <p className="text-xs text-text-primary font-black leading-relaxed italic">
                      "{selectedObs.text}"
                    </p>
                    
                    <div className="mt-3.5 pt-3 border-t border-slate-950/40 flex items-center justify-between gap-2.5">
                      <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 font-bold">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> ✓ Confirmed Challenge
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCommitted(false);
                          onShowToast?.("🔓 Choice unlocked. Select another struggle card!", "info");
                        }}
                        className="text-[9px] font-mono bg-background hover:bg-surface text-brand-secondary hover:text-amber-300 px-2.5 py-1.5 rounded-lg border border-slate-850 hover:border-border-subtle transition-colors uppercase font-bold flex items-center gap-1 cursor-pointer"
                      >
                        🔄 Choose Different Problem
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4.5 bg-background/50 border border-dashed border-slate-805 text-text-tertiary rounded-2xl flex flex-col items-center justify-center text-center gap-2">
                    <span className="text-xl animate-bounce">🔒</span>
                    <p className="text-[11px] font-semibold text-text-secondary animate-pulse" id="commitment-required-lbl">Commitment Required</p>
                    <p className="text-[10px] text-text-tertiary max-w-[210px] leading-relaxed">
                      Please select a struggle card above and click to lock in your challenge constraint.
                    </p>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* RIGHT COLUMN: Auto-challenge & Optional Context || Locked Workspace Cover (Col 7) */}
        <div className="lg:col-span-7 flex flex-col">
          {!isCommitted ? (
            <div className="bg-background/25 border border-border/60 p-8 rounded-3xl flex flex-col items-center justify-center text-center min-h-[460px] h-full relative overflow-hidden">
              {/* Visual grid blueprint background */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,181,230,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,181,230,0.03)_1px,transparent_1px)] bg-[size:14px_24px]" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-brand-primary/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative z-10 max-w-sm flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-300">
                <div className="w-14 h-14 bg-surface border border-border rounded-2xl flex items-center justify-center text-brand-primary shadow-[0_0_20px_rgba(0,181,230,0.1)] select-none">
                  <span className="text-2xl animate-pulse">🔒</span>
                </div>
                <div>
                  <h3 className="text-base font-black text-text-primary tracking-tight uppercase" id="define-stage-locked-heading">
                    Problem Commitment Required
                  </h3>
                  <p className="text-[11px] text-text-secondary mt-2 leading-relaxed">
                    Please select a target struggle on the left and finalize your Problem Commitment to unlock your dynamic thinking challenge workspace!
                  </p>
                </div>
                <div className="p-3 bg-brand-primary/20 rounded-xl border border-brand-primary/10 text-[10px] font-mono text-brand-primary">
                  We'll automatically formulate your custom "How Might We" storm once confirmed.
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-background/15 border border-border/80 p-6 rounded-3xl flex flex-col h-full justify-between gap-6 relative animate-in fade-in duration-300">
              
              <div className="space-y-5">
                <div className="flex items-center justify-between pb-1.5 border-b border-border/60">
                  <span className="text-[10px] font-mono font-bold tracking-wider text-text-tertiary block uppercase">
                    ⚡ DESIGN THINKING REFINEMENT
                  </span>
                  <span className="text-[10px] font-mono text-brand-primary flex items-center gap-1">
                    💡 Zero form-filling, pure context refinement.
                  </span>
                </div>

                {/* Display Chosen Problem clearly */}
                {selectedObs && (
                  <div className="bg-brand-primary/10 border border-brand-primary/10 rounded-2xl p-4.5 relative overflow-hidden backdrop-blur-sm animate-in fade-in duration-300">
                    <span className="text-[10px] font-mono font-bold text-brand-primary uppercase tracking-widest block mb-1">
                      🎯 Selected Problem
                    </span>
                    <p className="text-sm text-text-primary font-extrabold leading-relaxed italic">
                      "{selectedObs.text}"
                    </p>
                    <div className="mt-2 text-[10px] font-mono text-text-secondary flex items-center gap-2">
                      <span>Stakeholder Group:</span>
                      <span className="bg-brand-primary/10 border border-brand-primary/20 text-brand-primary px-2 py-0.5 rounded-md font-bold uppercase text-[9px]">
                        {selectedObs.perspectiveName}
                      </span>
                    </div>
                  </div>
                )}

                {/* Anything Else Worth Mentioning Field (Optional Context) */}
                <div>
                  <div className="flex items-center justify-between pb-1.5">
                    <label className="block text-[11px] font-bold text-text-secondary font-sans uppercase tracking-wider">
                      🧩 Additional Context (Optional)
                    </label>
                    <span className="text-[10px] text-text-tertiary font-mono italic">Does not block progress</span>
                  </div>
                  <SafeTextInput
                    id="define-stage-optional-input"
                    type="input"
                    maxLength={150}
                    placeholder="e.g., Cultural barriers, timing issues, environmental factors..."
                    value={anythingElse}
                    onChange={setAnythingElse}
                    onSafetyChange={(safe) => setIsAnythingElseSafe(safe)}
                    context="Define Stage - OPTIONAL"
                    className="w-full bg-background/85 border border-slate-850 text-slate-150 text-xs px-3.5 py-3 rounded-xl focus:outline-none focus:border-brand-primary/85 focus:ring-1 focus:ring-brand-primary/20 placeholder:text-text-tertiary font-medium transition-all"
                  />
                  <p className="text-[10px] text-text-tertiary mt-1.5 leading-snug">
                    Provide extra details, timing observations, or local constraints to sharpen the auto-generated brainstorm.
                  </p>
                </div>

                {/* ✨ AUTO-GENERATED DESIGN CHALLENGE */}
                {selectedObs && (
                  <div className="bg-background/95 border border-brand-primary/25 p-5 rounded-3xl space-y-4 mt-2 transition-all duration-300 relative overflow-hidden shadow-[0_0_20px_rgba(0,181,230,0.06)]">
                    {/* Visual Accent Glow */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-2xl pointer-events-none" />
                    
                    <div className="flex items-center justify-between relative z-10">
                      <span className="text-[10px] font-mono font-bold text-brand-primary uppercase tracking-wider flex items-center gap-1.5 bg-brand-primary/40 border border-brand-primary/10 px-2.5 py-1 rounded-full">
                        <Sparkles className={`w-3.5 h-3.5 text-brand-primary ${isAiLoading ? "animate-spin" : ""}`} />
                        🎯 Your Design Challenge
                      </span>
                      
                      {isAiLoading ? (
                        <span className="text-[9px] bg-brand-primary/10 text-brand-primary px-2.5 py-1 rounded-full border border-brand-primary/20 font-mono font-bold flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" /> AI is crafting...
                        </span>
                      ) : aiError ? (
                        <span className="text-[9px] bg-amber-500/15 text-brand-secondary px-2.5 py-1 rounded-full border border-brand-secondary/30 font-mono font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Fallback Active
                        </span>
                      ) : aiStatement ? (
                        <span className="text-[9px] bg-emerald-500/15 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/30 font-mono font-bold flex items-center gap-1">
                          🤖 AI Generated
                        </span>
                      ) : (
                        <span className="text-[9px] bg-surface border border-slate-805 text-text-secondary px-2.5 py-1 rounded-full font-mono font-bold">
                          📝 Local Preview
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-3 relative z-10">
                      {isAiLoading && !aiStatement ? (
                        <div className="space-y-2 py-2">
                          <div className="h-4 bg-surface-hover/55 rounded-md animate-pulse w-11/12" />
                          <div className="h-4 bg-surface-hover/55 rounded-md animate-pulse w-3/4" />
                        </div>
                      ) : (
                        <h3 className="text-sm md:text-base font-extrabold text-text-primary leading-relaxed font-sans pr-2" id="defined-challenge-stmt">
                          "{aiStatement || liveStatement}"
                        </h3>
                      )}

                      {/* Encouraging score & precision note */}
                      {aiStatement && !isAiLoading && (
                        <div className="pt-3 border-t border-border/60 flex flex-col sm:flex-row sm:items-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                          {precisionScore !== null && (
                            <div className="flex items-center gap-2 bg-brand-primary/20 border border-brand-primary/10 px-3 py-1 rounded-xl shrink-0">
                              <div className="text-[10px] font-mono font-bold text-text-secondary uppercase tracking-widest">
                                Empathy Score:
                              </div>
                              <div className="text-sm font-black text-brand-primary">
                                {precisionScore}%
                              </div>
                            </div>
                          )}
                          {precisionFeedback && (
                            <p className="text-[11px] text-text-secondary italic leading-snug">
                              {precisionFeedback}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>

            </div>
          )}
        </div>

      </div>

      {/* STAGE FOOTER NAVIGATION */}
      <div className="flex justify-between items-center mt-6 pt-4 border-t border-border/80">
        <div className="flex flex-col">
          <span className="text-text-secondary font-bold text-xs">
            Proceeding to Step 3
          </span>
          <span className="text-text-tertiary text-[10px] mt-0.5" id="footer-status-label">
            {!isCommitted ? "⚠️ Please select and commit to a target struggle to continue!" : "✨ Locked challenge is primed for brainstorming!"}
          </span>
        </div>
        <button
          disabled={!canProgress}
          onClick={onNext}
          className="px-10 py-3.5 bg-brand-primary hover:bg-brand-primary-hover text-text-primary font-extrabold text-xs uppercase tracking-widest rounded-full cursor-pointer transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] disabled:opacity-35 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-none"
        >
          Let's Brainstorm →
        </button>
      </div>

      {/* PROBLEM SELECTION LIGHTWEIGHT CONFIRMATION MODAL */}
      {showConfirmModal && pendingSelectedObs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface border border-border rounded-3xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-primary to-brand-primary/80" />
            
            <div className="flex items-start gap-4 mb-4">
              <div className="p-2.5 bg-brand-primary/45 rounded-2xl border border-brand-primary/20 text-brand-primary shrink-0">
                🎯
              </div>
              <div>
                <h3 className="text-sm font-black text-text-primary tracking-tight uppercase" id="focus-on-this-title">
                  🎯 Focus on This Problem?
                </h3>
                <p className="text-[10px] text-text-secondary font-medium uppercase tracking-wider font-mono">
                  Challenge Confirmation
                </p>
              </div>
            </div>

            <div className="p-4.5 bg-background/60 rounded-2xl border border-slate-850 my-4 text-xs font-semibold text-text-primary leading-relaxed italic">
              "{pendingSelectedObs.text}"
            </div>

            <p className="text-[11px] text-text-secondary leading-relaxed mb-6">
              This will become your design challenge for the next stages. All future ideation, prototyping, and testing will focus on this challenge.
            </p>

            <div className="flex items-center gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  setPendingSelectedObs(null);
                }}
                className="px-4 py-2 bg-transparent hover:bg-surface-hover text-text-secondary hover:text-text-primary rounded-xl text-xs font-bold transition-all uppercase cursor-pointer"
              >
                Choose Another
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedObs(pendingSelectedObs);
                  setIsCommitted(true);
                  setShowConfirmModal(false);
                  setPendingSelectedObs(null);
                  onShowToast?.("✓ Problem Selected! This challenge will guide your ideation journey.", "success");
                  onAddXP(30);
                  setHasAddedXPValue(true);
                }}
                className="px-5 py-2.5 bg-brand-primary hover:bg-brand-primary text-slate-950 rounded-xl text-xs font-black transition-all uppercase font-mono tracking-wider flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(0,181,230,0.25)] hover:shadow-[0_0_25px_rgba(0,181,230,0.4)]"
              >
                <Check className="w-4 h-4 text-slate-950 stroke-[3]" /> Focus On This Problem
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
