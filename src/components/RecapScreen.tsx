import React, { useState } from 'react';
import { CompletedSimulationRecap, UserProfile } from '../types';
import { motion } from 'motion/react';
import { RotateCcw, Trophy, Target, Lightbulb, PenTool, Download, Calendar, Star } from 'lucide-react';
import { generateRecapReport } from '../utils/pdfGenerator';

interface RecapScreenProps {
  recap: CompletedSimulationRecap;
  profile: UserProfile;
  onNewStart: () => void;
  onReviewRecap: () => void;
  theme: "light" | "dark";
}

export default function RecapScreen({ recap, profile, onNewStart, onReviewRecap, theme }: RecapScreenProps) {
  const isDark = theme === "dark";
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      await generateRecapReport(recap, profile);
    } catch (e) {
      console.error(e);
    }
    setIsGenerating(false);
  };

  return (
    <div className={`min-h-screen w-full flex flex-col items-center pt-24 pb-12 px-4 ${isDark ? 'bg-background text-text-primary' : 'bg-surface text-slate-900'}`}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl flex flex-col items-center gap-8"
      >
        <div className="text-center space-y-3">
          <h1 className="font-black tracking-tight" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
            👋 Welcome Back!
          </h1>
          <p className={`text-lg md:text-xl font-medium ${isDark ? 'text-text-secondary' : 'text-text-tertiary'}`}>
            Here's a quick recap of your most recent Design Thinking journey.
          </p>
        </div>

        {/* SUMMARY CARD */}
        <div className={`w-full p-6 md:p-8 rounded-3xl border ${isDark ? 'bg-surface border-border' : 'bg-background border-slate-200'} shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden`}>
          {/* Subtle glow background */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
          
          <div className="flex flex-col gap-2 relative z-10">
            <span className={`text-xs font-bold tracking-widest uppercase ${isDark ? 'text-brand-secondary' : 'text-brand-secondary'}`}>
              {recap.simulationName}
            </span>
            <h2 className="text-2xl font-bold leading-tight">
              {recap.challenge}
            </h2>
            <div className={`flex items-center gap-2 text-sm font-medium ${isDark ? 'text-text-secondary' : 'text-text-tertiary'}`}>
              <Calendar className="w-4 h-4" />
              <span>Completed on {recap.completionDate}</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 relative z-10 shrink-0">
            <div className={`text-5xl font-black tracking-tighter ${isDark ? 'text-text-primary' : 'text-slate-900'}`}>
              {recap.overallScore}%
            </div>
            <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-text-tertiary' : 'text-text-secondary'}`}>
              Overall Score
            </span>
          </div>
        </div>

        {/* DESIGN THINKING SUMMARY STAGES */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Stage 1: Challenge */}
          <div className={`p-5 rounded-2xl border ${isDark ? 'bg-surface/50 border-border' : 'bg-background border-slate-200'}`}>
            <div className="flex items-center gap-2 mb-3">
              <Target className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              <h3 className="font-bold">Stage 1: Challenge</h3>
            </div>
            <p className={`text-sm ${isDark ? 'text-text-secondary' : 'text-slate-700'}`}>
              {recap.challenge}
            </p>
          </div>

          {/* Stage 2: Empathize */}
          <div className={`p-5 rounded-2xl border ${isDark ? 'bg-surface/50 border-border' : 'bg-background border-slate-200'}`}>
            <div className="flex items-center gap-2 mb-3">
              <Star className={`w-5 h-5 ${isDark ? 'text-brand-primary' : 'text-amber-600'}`} />
              <h3 className="font-bold">Stage 2: Empathize</h3>
            </div>
            <p className={`text-sm ${isDark ? 'text-text-secondary' : 'text-slate-700'}`}>
              {recap.empathizeSummary || "Explored user feelings and pain points."}
            </p>
          </div>

          {/* Stage 3: Define */}
          <div className={`p-5 rounded-2xl border ${isDark ? 'bg-surface/50 border-border' : 'bg-background border-slate-200'}`}>
            <div className="flex items-center gap-2 mb-3">
              <Target className={`w-5 h-5 ${isDark ? 'text-rose-400' : 'text-rose-600'}`} />
              <h3 className="font-bold">Stage 3: Define</h3>
            </div>
            <p className={`text-sm ${isDark ? 'text-text-secondary' : 'text-slate-700'}`}>
              {recap.problemStatement || "Defined the core problem."}
            </p>
          </div>

          {/* Stage 4: Ideate */}
          <div className={`p-5 rounded-2xl border ${isDark ? 'bg-surface/50 border-border' : 'bg-background border-slate-200'} md:col-span-2 lg:col-span-1`}>
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className={`w-5 h-5 ${isDark ? 'text-brand-primary' : 'text-brand-primary'}`} />
              <h3 className="font-bold">Stage 4: Ideate</h3>
            </div>
            <ul className={`text-sm space-y-1 ${isDark ? 'text-text-secondary' : 'text-slate-700'}`}>
              {recap.topIdeas && recap.topIdeas.length > 0 ? recap.topIdeas.map((idea, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className={isDark ? "text-text-tertiary" : "text-text-secondary"}>•</span>
                  <span>{idea}</span>
                </li>
              )) : (
                <li>Generated creative solutions.</li>
              )}
            </ul>
          </div>

          {/* Stage 5: Prototype */}
          <div className={`p-5 rounded-2xl border ${isDark ? 'bg-surface/50 border-border' : 'bg-background border-slate-200'} md:col-span-2`}>
            <div className="flex items-center gap-2 mb-3">
              <PenTool className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
              <h3 className="font-bold">Stage 5: Prototype</h3>
            </div>
            <p className={`text-sm line-clamp-3 ${isDark ? 'text-text-secondary' : 'text-slate-700'}`}>
              {recap.prototypeSummary || "Built and summarized the final prototype."}
            </p>
          </div>

        </div>

        {/* ACHIEVEMENTS */}
        {recap.achievements && recap.achievements.length > 0 && (
          <div className="w-full flex flex-wrap justify-center gap-3 mt-4">
            {recap.achievements.map((ach, idx) => (
              <div key={idx} className={`px-4 py-2 rounded-full border text-sm font-bold flex items-center gap-2 ${isDark ? 'bg-brand-secondary/40 border-brand-secondary/30 text-brand-secondary' : 'bg-brand-secondary/10 border-brand-secondary text-brand-secondary'}`}>
                <Trophy className="w-4 h-4" />
                {ach}
              </div>
            ))}
          </div>
        )}

        {/* ACTIONS */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-8 w-full md:w-auto">
          <button
            onClick={onNewStart}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-text-primary bg-brand-secondary hover:bg-brand-secondary-hover transition-all flex items-center justify-center gap-3 shadow-lg shadow-brand-secondary/25"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Start New Simulation</span>
          </button>
          
          <button
            onClick={handleDownload}
            disabled={isGenerating}
            className={`w-full sm:w-auto px-8 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 border ${
              isDark 
                ? 'bg-surface border-border-subtle hover:bg-surface-hover text-text-primary' 
                : 'bg-background border-slate-300 hover:bg-surface text-slate-900'
            } ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Download className="w-5 h-5" />
            <span>{isGenerating ? "Generating..." : "Download Design Thinking Report"}</span>
          </button>
        </div>

      </motion.div>
    </div>
  );
}
