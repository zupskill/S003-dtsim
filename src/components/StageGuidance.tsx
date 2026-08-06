import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, HelpCircle, ChevronRight, Sparkles } from "lucide-react";

interface GuidanceData {
  title: string;
  message: string;
  why: string;
}

const STAGE_GUIDANCE_MAP: Record<string, GuidanceData> = {
  EMPATHIZE: {
    title: "👀 Understand the Problem",
    message: "Think from someone else's perspective. What struggles, frustrations, or challenges might they face? Pin observations or add your own.",
    why: "Great solutions begin by understanding real people."
  },
  DEFINE: {
    title: "🎯 Focus the Challenge",
    message: "Choose one problem and narrow it down. A well-defined problem leads to better ideas.",
    why: "Solving the right problem is more important than solving it quickly."
  },
  IDEATE: {
    title: "💡 Explore Possibilities",
    message: "Don't worry about perfect ideas. List as many solutions as you can. Wild ideas are welcome.",
    why: "The more ideas you generate, the higher the chance of finding a great one."
  },
  PROTOTYPE: {
    title: "🛠 Bring an Idea to Life",
    message: "Pick the solution you believe in most. Show how it would work using a storyboard or flow.",
    why: "Prototyping helps us experiment quickly and fail fast without high costs."
  },
  TEST: {
    title: "🔍 Challenge Your Solution",
    message: "Review your idea from different angles. Look for strengths, gaps, and opportunities to improve.",
    why: "Testing reveals blind spots before we build the final real-world solution."
  },
  RESULTS: {
    title: "🏆 Reflect on Your Journey",
    message: "See what you built, what worked well, and where your idea could grow next.",
    why: "Reflection solidifies learning and highlights the next path for iteration."
  }
};

const PREVIEW_TEXT_MAP: Record<string, string> = {
  EMPATHIZE: "👀 Understand the people affected by the problem.",
  DEFINE: "🎯 Narrow the problem into a clear challenge.",
  IDEATE: "💡 Think of as many solutions as possible.",
  PROTOTYPE: "🛠 Show how your idea would work.",
  TEST: "🔍 Explore strengths, risks, and improvements.",
  RESULTS: "🏆 Review your journey and key takeaways."
};

interface StageGuidanceProps {
  stageKey: "EMPATHIZE" | "DEFINE" | "IDEATE" | "PROTOTYPE" | "TEST" | "RESULTS" | null;
  theme: "dark" | "light";
}

export default function StageGuidance({ stageKey, theme }: StageGuidanceProps) {
  const isDark = theme === "dark";
  const [isOpen, setIsOpen] = useState(false);             // Full guide card state
  const [showSubtleHint, setShowSubtleHint] = useState(false); // Mini preview notification
  const [showWhy, setShowWhy] = useState(false);

  // Auto-trigger mini guidance notice on every stage entry
  useEffect(() => {
    if (!stageKey) {
      setIsOpen(false);
      setShowSubtleHint(false);
      return;
    }

    // Reset view states for new stage
    setIsOpen(false);
    setShowWhy(false);

    // Auto-show the premium mini guidance hint after a short, sleek delay (450ms)
    const hintTimer = setTimeout(() => {
      setShowSubtleHint(true);
    }, 450);

    return () => clearTimeout(hintTimer);
  }, [stageKey]);

  if (!stageKey || !STAGE_GUIDANCE_MAP[stageKey]) return null;

  const data = STAGE_GUIDANCE_MAP[stageKey];
  const previewText = PREVIEW_TEXT_MAP[stageKey];

  const handleOpenFullGuide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowSubtleHint(false);
    setIsOpen(true);
    setShowWhy(false);
  };

  const handleDismissHint = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowSubtleHint(false);
  };

  const handleDismissFull = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
  };

  const handleToggleFullManual = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Toggle full guide card on static help icon click
    setShowSubtleHint(false);
    setIsOpen((prev) => !prev);
  };

  return (
    <>
      {/* 1. Subtle Mini-Hint Bubble - Rendered with absolute self-contained pointer-events */}
      <AnimatePresence>
        {showSubtleHint && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 15 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0 
            }}
            exit={{ 
              opacity: 0, 
              scale: 0.9, 
              y: 10,
              transition: { duration: 0.2 } // Direct 200ms dismiss animation 
            }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className={`fixed bottom-[196px] right-6 md:right-8 z-50 p-4.5 rounded-2xl shadow-2xl w-72 sm:w-80 border-2 flex flex-col gap-3 transition-colors pointer-events-auto select-none ${
              isDark 
                ? "bg-surface/98 border-border text-text-primary shadow-slate-950/60" 
                : "bg-background/98 border-slate-350 text-slate-950 shadow-slate-400/40"
            }`}
          >
            {/* Header section with icon & close action icon */}
            <div className="flex items-center justify-between pointer-events-auto">
              <div className="flex items-center gap-1.5 pointer-events-none">
                <Sparkles className={`w-4 h-4 shrink-0 ${
                  isDark ? "text-brand-secondary" : "text-brand-secondary"
                }`} />
                <span className={`text-[11px] font-mono font-black tracking-widest uppercase ${
                  isDark ? "text-brand-secondary" : "text-brand-secondary"
                }`}>
                  👋 Need help?
                </span>
              </div>
              <button
                onClick={handleDismissHint}
                className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer border hover:scale-105 active:scale-95 pointer-events-auto ${
                  isDark 
                    ? "text-text-secondary hover:text-text-primary hover:bg-surface-hover border-border/80" 
                    : "text-slate-700 hover:text-slate-950 hover:bg-surface-hover border-slate-200 shadow-sm"
                }`}
                title="Dismiss hint"
              >
                <X className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>

            {/* Message text with high contrast weights */}
            <p className={`text-xs leading-relaxed font-bold font-sans pointer-events-none ${
              isDark ? "text-slate-250" : "text-slate-850"
            }`}>
              {previewText}
            </p>

            {/* Interaction Action Button */}
            <button
              onClick={handleOpenFullGuide}
              className={`w-full text-center py-2 px-3 text-xs leading-none font-sans font-black uppercase tracking-wider rounded-xl transition-all hover:scale-[1.01] active:scale-95 cursor-pointer pointer-events-auto ${
                isDark
                  ? "bg-brand-secondary/10 border border-brand-secondary/30 text-brand-secondary hover:bg-brand-secondary/20"
                  : "bg-brand-secondary/10 border border-brand-secondary text-brand-secondary hover:bg-brand-secondary/20 hover:border-brand-secondary shadow-sm"
              }`}
            >
              Learn More
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Floating helper triggers button - Standalone fixed trigger */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={handleToggleFullManual}
            className={`fixed bottom-36 right-6 md:right-8 z-50 w-12 h-12 rounded-full flex items-center justify-center shadow-xl backdrop-blur transition-all hover:scale-105 active:scale-95 cursor-pointer group pointer-events-auto ${
              isDark
                ? "bg-surface border border-border text-brand-secondary hover:text-brand-secondary hover:border-brand-secondary/35"
                : "bg-background border-2 border-slate-350 text-brand-secondary hover:text-brand-secondary hover:border-brand-secondary shadow-slate-350/40"
            }`}
            title="Toggle Stage Mentor System"
          >
            {/* Ambient animation indicators */}
            {showSubtleHint && (
              <span className={`absolute inset-0 rounded-full animate-ping opacity-20 scale-105 pointer-events-none ${
                isDark ? "bg-brand-primary" : "bg-indigo-650"
              }`} />
            )}
            <HelpCircle className="w-5.5 h-5.5 group-hover:scale-110 transition-transform stroke-[2.2]" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* 3. Full Guidance Informer Card overlay popup - Rendered independently */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.92, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.95, y: 20, filter: "blur(3px)" }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className={`fixed bottom-36 right-6 md:right-8 z-50 w-full max-w-[340px] p-5 rounded-2xl shadow-2xl backdrop-blur-md selection:bg-brand-secondary selection:text-black transition-all border-2 pointer-events-auto ${
              isDark
                ? "bg-surface/98 border-slate-850 text-text-primary shadow-slate-950/60"
                : "bg-background border-slate-350 text-slate-950 shadow-slate-400/35"
            }`}
          >
            {/* Header Area */}
            <div className={`flex items-center justify-between pb-2.5 mb-2.5 border-b pointer-events-auto ${
              isDark ? "border-border/60" : "border-slate-250"
            }`}>
              <div className="flex items-center gap-2 pointer-events-none">
                <span className={`w-2 h-2 rounded-full animate-pulse shrink-0 ${
                  isDark ? "bg-brand-primary" : "bg-indigo-650"
                }`} />
                <span className={`text-[10px] font-black font-sans tracking-widest uppercase ${
                  isDark ? "text-brand-secondary/90" : "text-brand-secondary"
                }`}>
                  STAGE MENTOR
                </span>
                <span className={`text-[9px] font-mono font-black px-1.5 py-0.5 rounded uppercase border ${
                  isDark 
                    ? "bg-background border-slate-850 text-brand-secondary" 
                    : "bg-brand-secondary/10 border-brand-secondary text-brand-secondary"
                }`}>
                  ACTIVE
                </span>
              </div>
              <button
                onClick={handleDismissFull}
                className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 border pointer-events-auto ${
                  isDark 
                    ? "text-slate-450 hover:text-text-primary hover:bg-surface-hover border-border/80" 
                    : "text-slate-705 hover:text-slate-950 hover:bg-surface-hover border-slate-205 shadow-sm"
                }`}
                aria-label="Dismiss stage guidance"
              >
                <X className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>

            {/* Title & Body Challenge */}
            <h4 className={`text-sm tracking-tight flex items-center gap-1.5 mb-2.5 font-sans font-black pointer-events-none ${
              isDark ? "text-text-primary" : "text-slate-950"
            }`}>
              {data.title}
            </h4>
            <p className={`text-xs leading-relaxed font-sans mb-4 font-semibold pointer-events-none ${
              isDark ? "text-slate-305" : "text-slate-800"
            }`}>
              {data.message}
            </p>

            {/* Expandable Why Links (Theme Specific & high contrast) */}
            <div className={`pt-3 border-t pointer-events-auto ${
              isDark ? "border-slate-850" : "border-slate-250"
            }`}>
              <button
                onClick={() => setShowWhy(!showWhy)}
                className={`text-[10px] uppercase font-mono font-black tracking-wider flex items-center gap-1 cursor-pointer transition-colors hover:scale-[1.01] active:scale-98 ${
                  isDark ? "text-brand-secondary hover:text-brand-secondary" : "text-brand-secondary hover:text-brand-secondary"
                }`}
              >
                <ChevronRight className={`w-3.5 h-3.5 transform transition-transform duration-250 ${
                  showWhy 
                    ? (isDark ? 'rotate-90 text-brand-secondary' : 'rotate-90 text-brand-secondary') 
                    : ''
                }`} />
                Why am I doing this?
              </button>

              <AnimatePresence initial={false}>
                {showWhy && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1, marginTop: 10 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden pointer-events-none"
                  >
                    <p className={`text-[11px] leading-relaxed pl-3.5 border-l-2 py-2 pr-2 rounded-r-lg font-sans font-black ${
                      isDark 
                        ? "text-emerald-400/95 border-emerald-500/40 bg-emerald-950/20" 
                        : "text-emerald-950 border-emerald-600 bg-emerald-50"
                    }`}>
                      {data.why}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
