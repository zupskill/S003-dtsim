import React, { useState, useEffect } from "react";
import { Topic, PrototypeData } from "../types";
import { Award, ShieldAlert, Sparkles, AlertCircle, RefreshCw, Layers, CheckCircle, HelpCircle, Flame, ArrowRight } from "lucide-react";

interface TestingStageProps {
  topic: Topic;
  refinedProblem: string;
  prototype: PrototypeData | null;
  onAddXP: (amount: number) => void;
  onUnlockBadge: (badgeId: string) => void;
  onNext: () => void;
}

export default function TestingStage({
  topic,
  refinedProblem,
  prototype,
  onAddXP,
  onUnlockBadge,
  onNext
}: TestingStageProps) {
  
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

  const [selectedIdeaText] = useState<string>(() => {
    const key = `zupskill_prototype_${topic.id}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.selectedIdea && parsed.selectedIdea.text) {
          return parsed.selectedIdea.text;
        }
      } catch {}
    }
    return "";
  });

  // What-If States
  const [whatIfChallenges, setWhatIfChallenges] = useState<string[]>(() => {
    const key = `zupskill_testing_${topic.id}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.whatIfChallenges !== undefined) return parsed.whatIfChallenges;
      } catch {}
    }
    return [];
  });
  const [whatIfScore, setWhatIfScore] = useState<number | null>(() => {
    const key = `zupskill_testing_${topic.id}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.whatIfScore !== undefined) return parsed.whatIfScore;
      } catch {}
    }
    return null;
  });
  const [loadingWhatIf, setLoadingWhatIf] = useState(false);

  // I-Like States
  const [iLikeHighlights, setILikeHighlights] = useState<string[]>(() => {
    const key = `zupskill_testing_${topic.id}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.iLikeHighlights !== undefined) return parsed.iLikeHighlights;
      } catch {}
    }
    return [];
  });
  const [iLikeScore, setILikeScore] = useState<number | null>(() => {
    const key = `zupskill_testing_${topic.id}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.iLikeScore !== undefined) return parsed.iLikeScore;
      } catch {}
    }
    return null;
  });
  const [loadingILike, setLoadingILike] = useState(false);

  // I-Wish States
  const [iWishImprovements, setIWishImprovements] = useState<string[]>(() => {
    const key = `zupskill_testing_${topic.id}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.iWishImprovements !== undefined) return parsed.iWishImprovements;
      } catch {}
    }
    return [];
  });
  const [iWishScore, setIWishScore] = useState<number | null>(() => {
    const key = `zupskill_testing_${topic.id}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.iWishScore !== undefined) return parsed.iWishScore;
      } catch {}
    }
    return null;
  });
  const [loadingIWish, setLoadingIWish] = useState(false);

  // Classified Category State
  const [classifiedCategory, setClassifiedCategory] = useState<string | null>(() => {
    const key = `zupskill_testing_${topic.id}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.classifiedCategory !== undefined) return parsed.classifiedCategory;
      } catch {}
    }
    return null;
  });

  useEffect(() => {
    const stateToSave = {
      whatIfChallenges,
      whatIfScore,
      iLikeHighlights,
      iLikeScore,
      iWishImprovements,
      iWishScore,
      classifiedCategory
    };
    localStorage.setItem(`zupskill_testing_${topic.id}`, JSON.stringify(stateToSave));
  }, [whatIfChallenges, whatIfScore, iLikeHighlights, iLikeScore, iWishImprovements, iWishScore, classifiedCategory, topic.id]);

  useEffect(() => {
    if (prototype) {
      // Check if we already have saved results in localStorage first
      const savedKey = `zupskill_testing_${topic.id}`;
      const saved = localStorage.getItem(savedKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.whatIfScore !== null && parsed.whatIfScore !== undefined) {
            // Already simulated! Keep the saved results.
            return;
          }
        } catch {}
      }
      runTestingSimulation();
    }
  }, [prototype, topic.id]);

  const runTestingSimulation = async () => {
    if (!prototype) return;

    // Fire independent calls to resolve "high testing latency" constraints! (Async + independent skeleton loading)
    setLoadingWhatIf(true);
    setLoadingILike(true);
    setLoadingIWish(true);
    setClassifiedCategory(null);

    const solutionName = prototype.title ? prototype.title.replace(/\s+Micro-Model$/i, "") : "your solution";

    // Call WHAT-IF
    const whatIfPromise = fetch("/api/test/what-if", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        problemStatement: refinedProblem,
        prototypeTitle: prototype.title,
        prototypeDescription: prototype.description,
        selectedIdea: selectedIdeaText
      })
    })
      .then(res => res.json())
      .then(data => {
        setWhatIfChallenges(data.challenges || []);
        setWhatIfScore(data.score || 78);
        if (data.category) {
          setClassifiedCategory(data.category);
        }
        setLoadingWhatIf(false);
        onAddXP(20);
      })
      .catch(err => {
        console.error("Fail loading what-if:", err);
        setWhatIfChallenges([
          `What if users choose an alternate route or bypass ${solutionName} due to unexpected habits?`,
          `What if peak student traffic hours create overcrowding or bottlenecks around ${solutionName}?`
        ]);
        setWhatIfScore(70);
        setLoadingWhatIf(false);
      });

    // Call I-LIKE
    const iLikePromise = fetch("/api/test/i-like", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        problemStatement: refinedProblem,
        prototypeTitle: prototype.title,
        prototypeDescription: prototype.description,
        selectedIdea: selectedIdeaText
      })
    })
      .then(res => res.json())
      .then(data => {
        setILikeHighlights(data.highlights || []);
        setILikeScore(data.score || 85);
        if (data.category && !classifiedCategory) {
          setClassifiedCategory(data.category);
        }
        setLoadingILike(false);
        onAddXP(20);
      })
      .catch(err => {
        console.error("Fail loading i-like:", err);
        setILikeHighlights([
          `I like that ${solutionName} directly addresses the described user core pain points in a neat way.`,
          `I like that this design makes the key parts of ${solutionName} easily visible and understandable.`
        ]);
        setILikeScore(80);
        setLoadingILike(false);
      });

    // Call I-WISH
    const iWishPromise = fetch("/api/test/i-wish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        problemStatement: refinedProblem,
        prototypeTitle: prototype.title,
        prototypeDescription: prototype.description,
        selectedIdea: selectedIdeaText
      })
    })
      .then(res => res.json())
      .then(data => {
        setIWishImprovements(data.improvements || []);
        setIWishScore(data.score || 82);
        if (data.category && !classifiedCategory) {
          setClassifiedCategory(data.category);
        }
        setLoadingIWish(false);
        onAddXP(20);
        onUnlockBadge("evaluation-leader");
      })
      .catch(err => {
        console.error("Fail loading i-wish:", err);
        setIWishImprovements([
          `I wish we could explore adding clear visual signs or supportive markings to ${solutionName} for better guidance.`,
          `I wish there was a clear option or quick guide for first-time users to easily understand ${solutionName}.`
        ]);
        setIWishScore(75);
        setLoadingIWish(false);
      });

    // Wait for all to finish to evaluate top-tier levels
    await Promise.allSettled([whatIfPromise, iLikePromise, iWishPromise]);
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="text-center mb-8 max-w-2xl mx-auto">
        <span className="text-xs font-mono text-brand-secondary uppercase tracking-[0.2em] px-3 py-1 bg-brand-secondary/35 border border-brand-secondary/20 rounded-full">
          Step 5: Evaluate & Test your Prototype 🧪
        </span>
        <h2 className="text-3xl font-extrabold text-text-primary mt-4 mb-2 tracking-tight">
          Let's test your <span className="bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 text-transparent bg-clip-text">prototype! ✨</span>
        </h2>
        <p className="text-sm text-text-secondary">
          Time for a friendly review! Our supportive AI teammate will evaluate how resilient your prototype is (What If), celebrate what's awesome about it (I Like), and suggest some cool ways we could make it even better (I Wish).
        </p>
      </div>

      {/* 🎯 CONTEXT PAIRING: SELECTED CHALLENGE & EXPERIMENTAL SOLUTION */}
      <div className="bg-background/80 border border-slate-850 p-4 rounded-2xl mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 relative overflow-hidden backdrop-blur-md shadow-[0_4px_20px_rgba(245,158,11,0.04)]">
        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/50" />
        
        {/* Left aspect: Pinned Struggle & Design Challenge */}
        <div className="flex flex-col gap-3 pl-2">
          {/* Target Problem */}
          <div className="flex items-start gap-2.5">
            <div className="p-1.5 bg-brand-secondary/45 rounded-xl border border-brand-secondary/20 text-brand-secondary text-xs mt-0.5 shrink-0 select-none">
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
            <div className="p-1.5 bg-brand-secondary/45 rounded-xl border border-brand-secondary/20 text-brand-secondary mt-0.5 shrink-0 select-none">
              ✨
            </div>
            <div>
              <span className="text-[9px] font-mono font-black text-brand-secondary tracking-widest block uppercase font-bold text-brand-secondary">
                🎯 DESIGN CHALLENGE (HMW)
              </span>
              <p className="text-xs font-bold text-text-primary mt-0.5 leading-relaxed">
                "{refinedProblem || "..."}"
              </p>
            </div>
          </div>
        </div>

        {/* Aspect 2: Solution */}
        <div className="flex items-start gap-2.5 md:border-l md:border-slate-850/80 md:pl-4">
          <div className="p-1.5 bg-amber-950/45 rounded-xl border border-brand-primary/25 text-brand-primary text-xs mt-0.5 shrink-0 select-none">
            💡
          </div>
          <div>
            <span className="text-[9px] font-mono font-black text-amber-300 uppercase tracking-widest block">
              FINAL SOLUTION
            </span>
            <p className="text-xs font-bold text-text-primary mt-0.5 leading-relaxed">
              {prototype?.title || "Your Selected Idea"}
            </p>
            <p className="text-[10px] text-text-secondary leading-relaxed font-sans mt-0.5">
              {prototype?.description || "A custom formulated prototype blueprint undergoing evaluation."}
            </p>
          </div>
        </div>
      </div>

      {/* PROTOTYPE SPOTLIGHT INFO */}
      {prototype && (
        <div className="glass-panel p-5 rounded-xl border-border mb-8 flex flex-col md:flex-row items-start justify-between gap-6 bg-surface/10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-[10px] bg-purple-950 text-purple-400 px-2 py-0.5 rounded border border-purple-500/20 font-bold uppercase">
                {prototype.format.toUpperCase()} MODEL PROTOTYPE
              </span>
              {classifiedCategory ? (
                <span className="text-[10px] bg-brand-secondary text-brand-secondary px-2 py-0.5 rounded border border-brand-secondary/30 font-bold uppercase">
                  CLASSIFIED: {classifiedCategory}
                </span>
              ) : (
                <span className="text-[10px] text-text-tertiary font-mono">STATUS: CLASSIFYING & EVALUATING... ⚙️</span>
              )}
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-1">
              {prototype.title}
            </h3>
            <p className="text-xs text-slate-450 leading-relaxed font-mono">
              "{prototype.description}"
            </p>
          </div>
          
          <button
            onClick={runTestingSimulation}
            disabled={loadingWhatIf || loadingILike || loadingIWish}
            className="px-4 py-2 bg-surface-hover hover:bg-slate-750 text-text-primary hover:text-text-primary rounded-lg border border-border-subtle text-xs font-bold uppercase tracking-wider transition-all cursor-pointer inline-flex items-center gap-1.5 shrink-0 self-center disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${(loadingWhatIf || loadingILike || loadingIWish) ? "animate-spin" : ""}`} /> 
            Refresh Evaluation 🔄
          </button>
        </div>
      )}

      {/* THE 3 FEEDBACK SECTIONS - RENDERED INDEPENDENTLY WITH LOADING SKELETONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* WHAT-IF PANEL */}
        <div className="flex flex-col">
          <div className={`glass-panel p-5 rounded-2xl flex-1 flex flex-col justify-between border-l-4 border-red-500 h-full ${loadingWhatIf ? "animate-pulse" : "glow-orange"}`}>
            <div>
              <div className="flex items-center justify-between mb-4 border-b border-slate-850 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-red-400 font-mono flex items-center gap-1">
                  🧠 WHAT IF? (FUN SCENARIOS)
                </span>
                
                {!loadingWhatIf && whatIfScore !== null && (
                  <span className="text-[10px] font-mono bg-red-950/40 text-red-400 border border-red-500/30 px-2 py-0.5 rounded font-black">
                    RESILIENCE: {whatIfScore}/100
                  </span>
                )}
              </div>

              {loadingWhatIf ? (
                /* Skeleton Loader */
                <div className="space-y-4">
                  <div className="h-3 bg-red-500/10 rounded w-5/6" />
                  <div className="h-20 bg-surface border border-slate-850 rounded-lg animate-pulse" />
                  <div className="h-3 bg-red-500/10 rounded w-2/3" />
                  <div className="h-20 bg-surface border border-slate-850 rounded-lg animate-pulse" />
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-text-secondary leading-relaxed font-semibold">
                    How will your idea handle these unexpected situations?
                  </p>
                  
                  {whatIfChallenges.map((challenge, idx) => (
                    <div key={idx} className="p-3 bg-background border border-red-500/10 rounded-xl relative overflow-hidden">
                      <span className="absolute top-0 left-0 h-full w-1 bg-red-500/60" />
                      <p className="text-xs text-text-primary leading-relaxed font-medium">
                        "{challenge}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="text-[10px] text-text-tertiary font-mono mt-6 border-t border-slate-855 pt-2 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" /> Review loaded! ✨
            </div>
          </div>
        </div>

        {/* I-LIKE PANEL */}
        <div className="flex flex-col">
          <div className={`glass-panel p-5 rounded-2xl flex-1 flex flex-col justify-between border-l-4 border-brand-secondary h-full ${loadingILike ? "animate-pulse" : "glow-cyan"}`}>
            <div>
              <div className="flex items-center justify-between mb-4 border-b border-slate-850 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-secondary font-mono flex items-center gap-1">
                  💖 I LIKE (HIGHLIGHTS)
                </span>
                
                {!loadingILike && iLikeScore !== null && (
                  <span className="text-[10px] font-mono bg-brand-secondary/40 text-brand-secondary border border-brand-secondary/30 px-2 py-0.5 rounded font-black">
                    USER DELIGHT: {iLikeScore}/100
                  </span>
                )}
              </div>

              {loadingILike ? (
                /* Skeleton Loader */
                <div className="space-y-4">
                  <div className="h-3 bg-brand-secondary/10 rounded w-5/6" />
                  <div className="h-20 bg-surface border border-slate-850 rounded-lg animate-pulse" />
                  <div className="h-3 bg-brand-secondary/10 rounded w-2/3" />
                  <div className="h-20 bg-surface border border-slate-850 rounded-lg animate-pulse" />
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-text-secondary leading-relaxed font-semibold">
                    Here is what makes your idea super useful and awesome:
                  </p>
                  
                  {iLikeHighlights.map((highlight, idx) => (
                    <div key={idx} className="p-3 bg-background border border-brand-secondary/10 rounded-xl relative overflow-hidden">
                      <span className="absolute top-0 left-0 h-full w-1 bg-brand-primary/60" />
                      <p className="text-xs text-text-primary leading-relaxed font-medium">
                        "{highlight}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="text-[10px] text-text-tertiary font-mono mt-6 border-t border-slate-855 pt-2 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-pulse" /> Delight verified! ✨
            </div>
          </div>
        </div>

        {/* I-WISH PANEL */}
        <div className="flex flex-col">
          <div className={`glass-panel p-5 rounded-2xl flex-1 flex flex-col justify-between border-l-4 border-purple-500 h-full ${loadingIWish ? "animate-pulse" : "glow-purple"}`}>
            <div>
              <div className="flex items-center justify-between mb-4 border-b border-slate-850 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-400 font-mono flex items-center gap-1">
                  💡 I WISH (IDEAS FOR GROWTH)
                </span>
                
                {!loadingIWish && iWishScore !== null && (
                  <span className="text-[10px] font-mono bg-purple-950/40 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded font-black">
                    POTENTIAL: {iWishScore}/100
                  </span>
                )}
              </div>

              {loadingIWish ? (
                /* Skeleton Loader */
                <div className="space-y-4">
                  <div className="h-3 bg-purple-500/10 rounded w-5/6" />
                  <div className="h-20 bg-surface border border-slate-850 rounded-lg animate-pulse" />
                  <div className="h-3 bg-purple-500/10 rounded w-2/3" />
                  <div className="h-20 bg-surface border border-slate-850 rounded-lg animate-pulse" />
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-text-secondary leading-relaxed font-semibold">
                    Ooh, want to dream even bigger? Here are some fun ways we could expand your idea:
                  </p>
                  
                  {iWishImprovements.map((imp, idx) => (
                    <div key={idx} className="p-3 bg-background border border-purple-500/10 rounded-xl relative overflow-hidden">
                      <span className="absolute top-0 left-0 h-full w-1 bg-purple-550/60" />
                      <p className="text-xs text-text-primary leading-relaxed font-medium">
                        "{imp}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="text-[10px] text-text-tertiary font-mono mt-6 border-t border-slate-855 pt-2 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" /> Ready to grow! ✨
            </div>
          </div>
        </div>

      </div>

      {/* CONTINUOUS NAVIGATION */}
      <div className="flex justify-between items-center mt-6 pt-4 border-t border-border/80">
        <span className="text-text-tertiary text-xs">
          Stage 6: Testing Complete
        </span>

        <button
          disabled={loadingWhatIf || loadingILike || loadingIWish}
          onClick={onNext}
          className="px-10 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-text-primary font-extrabold uppercase tracking-widest text-xs rounded-full cursor-pointer transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] disabled:opacity-40 disabled:transform-none disabled:hover:shadow-none inline-flex items-center gap-2"
        >
          View My Results <Award className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}
