import React, { useState, useEffect } from "react";
import { Topic, PrototypeData, Badge, UserProfile } from "../types";
import { PREDEFINED_TOPICS, BADGES } from "../data";
import { Award, Sparkles, Share2, Users, RefreshCw, Heart, CheckCircle, Smartphone, Rocket, Calendar, Landmark, MapPin, Target, Lightbulb, Compass, ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import { isSupabaseConfigured } from "../supabase";

interface FinalReportProps {
  topic: Topic;
  refinedProblem: string;
  prototype: PrototypeData | null;
  userProfile: UserProfile;
  onRestart: () => void;
  theme: "dark" | "light";
}

export default function FinalReport({
  topic,
  refinedProblem,
  prototype,
  userProfile,
  onRestart,
  theme
}: FinalReportProps) {
  
  const isDark = theme === "dark";
  const [isGenerating, setIsGenerating] = useState(false);

  // 1. Retrieve the actual simulated scores from localStorage or default comfortably
  const getSimulatedScores = () => {
    const savedKey = `zupskill_testing_${topic.id}`;
    const saved = localStorage.getItem(savedKey);
    let creativity = 75;
    let understanding = 80;
    let innovation = 70;
    let parsedObj: any = {};
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        parsedObj = parsed;
        if (parsed.iWishScore !== undefined && parsed.iWishScore !== null) creativity = parsed.iWishScore;
        if (parsed.iLikeScore !== undefined && parsed.iLikeScore !== null) understanding = parsed.iLikeScore;
        if (parsed.whatIfScore !== undefined && parsed.whatIfScore !== null) innovation = parsed.whatIfScore;
      } catch (err) {}
    }
    const overallScore = Math.round((creativity + understanding + innovation) / 3);

    // Write back overallScore if not already persisted or if it changed
    if (saved && parsedObj.overallScore !== overallScore) {
      try {
        parsedObj.overallScore = overallScore;
        localStorage.setItem(savedKey, JSON.stringify(parsedObj));
      } catch (err) {}
    }

    return { creativity, understanding, innovation, overallScore };
  };

  const scores = getSimulatedScores();

  // Determine achievement details based on dynamic, earned testing scores & tiers
  const getAchievementDetails = (scores: { creativity: number; understanding: number; innovation: number; overallScore: number }) => {
    const avgScore = scores.overallScore;
    
    if (avgScore >= 91) {
      return {
        title: "DT Innovation Master",
        symbol: "👑",
        desc: "Exceptional! You demonstrated master-level systemic design thinking. Your prototype showcases phenomenal user empathy, unique and highly creative novelty, and real-world scalability.",
        strengthScores: scores,
        tierName: "DT Innovation Master",
        colorClass: "bg-brand-primary/40 border border-brand-primary/20 text-brand-primary"
      };
    }
    if (avgScore >= 76) {
      return {
        title: "Innovation Builder",
        symbol: "🚀",
        desc: "Fantastic! You generated highly original ideas, built a very sound prototype, and proved useful real-world potential with clear stakeholder empathy.",
        strengthScores: scores,
        tierName: "Innovation Builder",
        colorClass: "bg-amber-950/40 border border-brand-secondary/20 text-amber-300"
      };
    }
    if (avgScore >= 61) {
      return {
        title: "Creative Thinker",
        symbol: "💡",
        desc: "Great job! You explored alternative futures, formulated elegant ideas, and shaped a solid, interactive design thinking flow.",
        strengthScores: scores,
        tierName: "Creative Thinker",
        colorClass: "bg-brand-primary/40 border border-brand-primary/20 text-brand-primary"
      };
    }
    if (avgScore >= 41) {
      return {
        title: "Problem Solver",
        symbol: "🔍",
        desc: "Good effort! You successfully mapped the core problems, gathered campus insights, and created a practical and clear roadmap solution.",
        strengthScores: scores,
        tierName: "Problem Solver",
        colorClass: "bg-purple-950/40 border border-purple-500/20 text-purple-300"
      };
    }
    return {
      title: "Explorer",
      symbol: "🌱",
      desc: "You successfully completed all stages of the design challenge, learning the fundamentals of spatial, policy, or software prototyping.",
      strengthScores: scores,
      tierName: "Explorer",
      colorClass: "bg-surface border border-border-subtle text-text-secondary"
    };
  };

  const ach = getAchievementDetails(scores);

  const cardBgClass = isDark 
    ? "bg-background/80 border border-slate-850/85 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between" 
    : "bg-background border border-slate-200/90 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between shadow-sm shadow-slate-100/40";

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4">
      {/* SUCCESS CONFETTI ATMOSPHERE */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-brand-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="glass-panel p-8 rounded-3xl glow-cyan text-center relative overflow-hidden border-brand-primary/25 mb-8">
        
        {/* CELEBRATION MOMENT */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-brand-primary/20 to-brand-primary/80/20 border border-brand-primary/40 rounded-full text-brand-primary text-xs font-bold mb-6 uppercase tracking-widest font-mono"
        >
          <Sparkles className="w-4 h-4 animate-pulse text-brand-primary" /> ✨ LAB COMPLETE 🎉 CHALLENGE RESOLVED
        </motion.div>

        <h1 className="text-3xl md:text-5xl font-black text-text-primary tracking-tight mb-4 leading-tight">
          You didn’t just solve a problem 👀 <br/>
          <span className="bg-gradient-to-r from-brand-primary via-sky-400 to-brand-primary/80 text-transparent bg-clip-text">
            You learned how to redesign the world.
          </span>
        </h1>

        <p className="text-text-secondary text-sm md:text-base max-w-2xl mx-auto mb-10">
          You are officially certified in human-centered innovation. Your parameters have been stress-tested, optimized, and compiled. Here is your design scorecard!
        </p>

        {/* REWARDS AREA - HIGHLY IMPACTFUL XP & ACQUIRED TITLE */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8 text-left">
          
          {/* ACH LEVEL OUTCOME CARD */}
          <div className={`md:col-span-7 ${cardBgClass}`}>
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl pointer-events-none ${isDark ? "bg-brand-primary/5" : "bg-brand-primary/3"}`} />
            
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <span className="text-3xl">{ach.symbol}</span>
                <div>
                  <span className={`text-[9.5px] font-mono uppercase tracking-widest block font-extrabold leading-none mb-1 ${isDark ? "text-brand-primary" : "text-brand-primary"}`}>UNLOCKED ACHIEVEMENT</span>
                  <h3 className={`text-xl font-black ${isDark ? "text-text-primary" : "text-slate-900"}`}>{ach.title}</h3>
                </div>
              </div>
              <p className={`text-xs leading-relaxed font-sans ${isDark ? "text-text-secondary" : "text-slate-650"}`}>
                {ach.desc}
              </p>
            </div>

            <div className={`mt-6 pt-4 border-t flex items-center justify-between ${isDark ? "border-border" : "border-slate-150"}`}>
              <span className={`text-[10px] font-mono uppercase tracking-wider ${isDark ? "text-text-tertiary" : "text-text-secondary"}`}>Verified Identity Status</span>
              <span className={`text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-lg ${
                isDark ? ach.colorClass : "bg-brand-primary/10 border border-brand-primary text-brand-primary"
              }`}>
                {ach.tierName}
              </span>
            </div>
          </div>

          {/* REDESIGNED RESULTS XP CARD */}
          <div className={`md:col-span-5 ${cardBgClass}`}>
            <div className={`absolute -top-12 -right-12 w-24 h-24 rounded-full blur-2xl pointer-events-none ${isDark ? "bg-brand-primary/10" : "bg-brand-primary/3"}`} />
            
            <div className="space-y-4">
              {/* SECTION 1: XP EARNED */}
              <div>
                <span className={`text-[10px] font-mono block tracking-widest uppercase font-black leading-none mb-1.5 ${isDark ? "text-brand-primary" : "text-brand-primary"}`}>
                  XP EARNED
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-3xl md:text-4xl font-extrabold tracking-tight leading-none font-mono ${isDark ? "text-text-primary" : "text-slate-900"}`}>
                    +910
                  </span>
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${isDark ? "text-emerald-400 bg-emerald-500/10" : "text-emerald-800 bg-emerald-50 border border-emerald-200"}`}>
                    XP
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div className={`border-t ${isDark ? "border-border" : "border-slate-150"}`} />

              {/* SECTION 2: CURRENT LEVEL */}
              <div className="flex items-center justify-between">
                <div>
                  <span className={`text-[10px] font-mono block tracking-widest uppercase font-black leading-none mb-1 ${isDark ? "text-text-secondary" : "text-text-tertiary"}`}>
                    CURRENT LEVEL
                  </span>
                  <span className={`text-base font-extrabold leading-none ${isDark ? "text-text-primary" : "text-slate-900"}`}>
                    {userProfile.level || "Innovator"}
                  </span>
                </div>
                <div className={`text-xl w-9 h-9 flex items-center justify-center rounded-xl border ${
                  isDark ? "bg-surface border-border text-text-primary" : "bg-surface border-slate-200 text-slate-850"
                }`}>
                  ⚡
                </div>
              </div>

              {/* Divider */}
              <div className={`border-t ${isDark ? "border-border" : "border-slate-150"}`} />

              {/* SECTION 3: PROGRESS TO NEXT LEVEL */}
              <div>
                <div className={`flex items-center justify-between text-[10px] font-mono tracking-widest uppercase font-black mb-1.5 ${isDark ? "text-text-secondary" : "text-text-tertiary"}`}>
                  <span>PROGRESS TO NEXT LEVEL</span>
                  <span className={isDark ? "text-text-secondary normal-case" : "text-slate-650 normal-case"}>
                    {userProfile.xp % 300} / 300 XP
                  </span>
                </div>
                {/* Custom highly polished animated progress bar */}
                <div className={`h-3 rounded-full overflow-hidden p-[2px] border ${
                  isDark ? "bg-surface border-border" : "bg-surface-hover border-slate-200"
                }`}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round(((userProfile.xp % 300) / 300) * 100)}%` }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-brand-primary via-brand-primary/90 to-brand-primary/60 rounded-full"
                  />
                </div>
              </div>
            </div>

            {/* CARD FOOTER: Total Status */}
            <div className={`mt-5 pt-4 border-t flex items-center justify-between text-xs font-semibold ${isDark ? "border-border" : "border-slate-150"}`}>
              <span className={`font-mono tracking-wider uppercase text-[10px] ${isDark ? "text-text-secondary" : "text-text-tertiary"}`}>Total Status</span>
              <span className={`font-mono font-black flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] ${
                isDark ? "bg-surface border-border text-text-primary" : "bg-surface border-slate-200 text-slate-700"
              }`}>
                🏆 {userProfile.xp} Total XP
              </span>
            </div>
          </div>

        </div>

        {/* OVERALL DESIGN SCORE CARD */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className={`mb-8 ${isDark ? "bg-background/90 border border-slate-850" : "bg-background border border-slate-200"} rounded-2xl p-6 shadow-sm shadow-slate-100/40 relative overflow-hidden`}
        >
          {/* Ambient decorative glow */}
          <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none -mr-8 -mt-8 ${isDark ? "bg-brand-primary/10" : "bg-brand-primary/5"}`} />
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-left relative z-10">
            <div className="text-center sm:text-left space-y-1">
              <span className={`text-[10px] font-mono block uppercase tracking-[0.2em] font-black ${isDark ? "text-brand-primary" : "text-brand-primary"}`}>
                OVERALL DESIGN SCORE
              </span>
              <div className="flex items-baseline justify-center sm:justify-start gap-1">
                <span className={`text-5xl font-black font-mono tracking-tight leading-none ${isDark ? "text-text-primary" : "text-slate-900"}`}>
                  {ach.strengthScores.overallScore}
                </span>
                <span className={`text-lg font-bold font-mono ${isDark ? "text-text-tertiary" : "text-text-secondary"}`}>/ 100</span>
              </div>
            </div>
            
            <div className={`px-6 py-3.5 rounded-full flex items-center justify-center gap-3.5 border shadow-sm ${
              isDark 
                ? "bg-surface/90 border-border text-text-primary" 
                : "bg-surface/90 border-slate-150 text-slate-800"
            }`}>
              <span className="text-3xl select-none leading-none">{ach.symbol}</span>
              <span className="text-base font-black tracking-tight leading-none">
                {ach.tierName}
              </span>
            </div>
          </div>
        </motion.div>

        {/* STRENGTHS AND GROWTH FIELDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left mb-8">
          
          {/* YOUR STRONGEST AREAS */}
          <div className={isDark ? "bg-background border border-slate-850 rounded-2xl p-6" : "bg-background border border-slate-200 rounded-2xl p-6 shadow-sm shadow-slate-100/40"}>
            <h3 className={`text-sm font-extrabold uppercase tracking-widest mb-4 flex items-center gap-2 ${isDark ? "text-text-secondary" : "text-slate-550"}`}>
              <Target className={`w-4 h-4 ${isDark ? "text-brand-primary" : "text-brand-primary"}`} /> Your Strongest Areas
            </h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className={isDark ? "text-text-secondary flex items-center gap-1" : "text-slate-700 flex items-center gap-1"}>💡 Creativity</span>
                  <span className={`font-mono ${isDark ? "text-brand-primary" : "text-brand-primary"}`}>{ach.strengthScores.creativity}%</span>
                </div>
                <div className={`h-2 rounded-full overflow-hidden ${isDark ? "bg-surface" : "bg-surface-hover"}`}>
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${ach.strengthScores.creativity}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-brand-primary to-brand-primary/80 rounded-full"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className={isDark ? "text-text-secondary flex items-center gap-1" : "text-slate-700 flex items-center gap-1"}>❤️ User Understanding</span>
                  <span className={`font-mono ${isDark ? "text-brand-primary" : "text-brand-primary"}`}>{ach.strengthScores.understanding}%</span>
                </div>
                <div className={`h-2 rounded-full overflow-hidden ${isDark ? "bg-surface" : "bg-surface-hover"}`}>
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${ach.strengthScores.understanding}%` }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.1 }}
                    className="h-full bg-gradient-to-r from-pink-500 to-sky-500 rounded-full"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className={isDark ? "text-text-secondary flex items-center gap-1" : "text-slate-700 flex items-center gap-1"}>🚀 Innovation</span>
                  <span className={`font-mono ${isDark ? "text-brand-primary" : "text-brand-primary"}`}>{ach.strengthScores.innovation}%</span>
                </div>
                <div className={`h-2 rounded-full overflow-hidden ${isDark ? "bg-surface" : "bg-surface-hover"}`}>
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${ach.strengthScores.innovation}%` }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                    className="h-full bg-gradient-to-r from-purple-500 to-brand-primary/80 rounded-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* THINGS TO EXPLORE NEXT */}
          <div className={isDark ? "bg-background border border-slate-850 rounded-2xl p-6 flex flex-col justify-between" : "bg-background border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm shadow-slate-100/40"}>
            <div>
              <h3 className={`text-sm font-extrabold uppercase tracking-widest mb-4 flex items-center gap-2 ${isDark ? "text-text-secondary" : "text-slate-550"}`}>
                <Compass className={`w-4 h-4 ${isDark ? "text-purple-400" : "text-purple-700"}`} /> Things to Explore Next
              </h3>

              <ul className="space-y-3">
                <li className="flex gap-2 text-xs leading-relaxed">
                  <span className={`shrink-0 font-extrabold ${isDark ? "text-brand-primary" : "text-brand-primary"}`}>•</span>
                  <span className={isDark ? "text-text-secondary" : "text-slate-700"}>Consider more edge cases during testing to preempt user behavioral workarounds before physical launch.</span>
                </li>
                <li className="flex gap-2 text-xs leading-relaxed">
                  <span className={`shrink-0 font-extrabold ${isDark ? "text-purple-400" : "text-purple-700"}`}>•</span>
                  <span className={isDark ? "text-text-secondary" : "text-slate-700"}>Explore more futuristic HOW ideas within the Ideate stage map to discover highly disruptive alternatives.</span>
                </li>
                <li className="flex gap-2 text-xs leading-relaxed">
                  <span className={`shrink-0 font-extrabold ${isDark ? "text-brand-primary" : "text-brand-primary"}`}>•</span>
                  <span className={isDark ? "text-text-secondary" : "text-slate-700"}>Add deeper descriptive layers or visual flow parameters to your blueprint flow elements to guide engineers.</span>
                </li>
              </ul>
            </div>

            <div className={`mt-4 pt-3 border-t text-[10px] italic ${isDark ? "border-border text-text-tertiary" : "border-slate-150 text-text-secondary"}`}>
              ✨ Every challenge refined builds real-world spatial, software, and policy expertise.
            </div>
          </div>

        </div>

        {/* 🎯 PROBLEM SOLVED & 💡 FINAL SOLUTION DETAILS */}
        <div className={`border rounded-2xl p-5 mb-8 text-left relative overflow-hidden backdrop-blur-md ${
          isDark 
            ? "bg-background border-slate-850 shadow-[0_4px_22px_rgba(255,200,61,0.05)]" 
            : "bg-background border-slate-205 shadow-sm shadow-slate-100/40"
        }`}>
          <span className={`text-[10px] font-mono block uppercase mb-4 font-bold tracking-widest border-b pb-2 ${
            isDark ? "text-text-tertiary border-border" : "text-text-tertiary border-slate-150"
          }`}>
            🏁 SUMMARY OF YOUR DESIGN JOURNEY
          </span>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* PROBLEM SOLVED CARD */}
            <div className="flex items-start gap-3">
              <div className={`p-1.5 rounded-xl border shrink-0 select-none text-xs ${
                isDark ? "bg-brand-primary/45 border-brand-primary/20 text-brand-primary" : "bg-brand-primary/10 border-brand-primary text-brand-primary"
              }`}>
                🎯
              </div>
              <div className="space-y-1">
                <span className={`text-[9px] font-mono font-black uppercase tracking-widest block ${isDark ? "text-brand-primary" : "text-brand-primary"}`}>
                  PROBLEM SOLVED
                </span>
                <p className={`text-xs font-semibold leading-relaxed italic ${isDark ? "text-text-primary" : "text-slate-800"}`}>
                  "{refinedProblem || "How might we explore creative community designs?"}"
                </p>
              </div>
            </div>

            {/* FINAL SOLUTION CARD */}
            <div className={`flex items-start gap-3 border-t pt-4 md:border-t-0 md:pt-0 md:border-l md:pl-5 ${
              isDark ? "border-border" : "border-slate-150"
            }`}>
              <div className={`p-1.5 rounded-xl border shrink-0 select-none text-xs ${
                isDark ? "bg-amber-950/45 border-brand-secondary/25 text-brand-secondary" : "bg-amber-50 border-amber-250 text-amber-800"
              }`}>
                💡
              </div>
              <div className="space-y-1">
                <span className={`text-[9px] font-mono font-black uppercase tracking-widest block ${isDark ? "text-brand-secondary" : "text-amber-700"}`}>
                  FINAL SOLUTION
                </span>
                <h5 className={`text-xs font-bold leading-normal ${isDark ? "text-text-primary" : "text-slate-900"}`}>
                  {prototype?.title || "Your Selected Idea"}
                </h5>
                <p className={`text-[11px] leading-relaxed ${isDark ? "text-text-secondary" : "text-text-tertiary"}`}>
                  {prototype?.description || "A custom formulated prototype blueprint."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* REBALANCED CTA FIELD BUTTONS */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
          <button
            onClick={async () => {
              setIsGenerating(true);
              try {
                const { generateDesignThinkingReport } = await import("../utils/pdfGenerator");
                await generateDesignThinkingReport(topic, refinedProblem, prototype, scores, userProfile);
              } catch (err) {
                console.error("Error generating report:", err);
              } finally {
                setIsGenerating(false);
              }
            }}
            disabled={isGenerating}
            className={`w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-brand-primary to-brand-primary/80 hover:from-brand-primary hover:to-brand-primary/80 text-text-primary text-[11px] font-extrabold uppercase tracking-widest rounded-full transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_14px_rgba(0,181,230,0.3)] hover:shadow-[0_6px_20px_rgba(0,181,230,0.45)] ${isGenerating ? 'opacity-70 cursor-not-allowed transform-none' : 'transform hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.98]'}`}
          >
            📄 {isGenerating ? "Generating..." : "Download Design Thinking Report"}
          </button>

          <button
            onClick={onRestart}
            className={`w-full sm:w-auto px-6 py-3.5 text-[11px] font-extrabold uppercase tracking-widest rounded-full transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer ${
              isDark 
                ? "bg-amber-500/10 hover:bg-amber-500/20 border border-brand-secondary/30 hover:border-brand-secondary text-amber-300" 
                : "bg-amber-100 hover:bg-amber-200 border border-amber-350 hover:border-amber-450 text-amber-800"
            }`}
          >
            🔄 View Journey Recap
          </button>
        </div>

      </div>
    </div>
  );
}
