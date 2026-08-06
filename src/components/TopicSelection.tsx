import React, { useState, useRef, useEffect } from "react";
import { Topic } from "../types";
import { PREDEFINED_TOPICS } from "../data";
import { Sparkles, Car, GraduationCap, Heart, Compass, BookOpen, Globe, Lightbulb, Activity, ShieldCheck, Apple, LayoutGrid, AlertCircle, PlusCircle, X, ChevronRight, MessageSquareCode, Moon, Users } from "lucide-react";
import { motion } from "motion/react";
import SafeTextInput from "./SafeTextInput";

interface TopicSelectionProps {
  onSelect: (topic: Topic) => void;
  selectedTopic: Topic | null;
}

// Map of icon names to Lucide icons
const iconMap: Record<string, React.ComponentType<any>> = {
  Car: Car,
  GraduationCap: GraduationCap,
  Heart: Heart,
  Compass: Compass,
  BookOpen: BookOpen,
  Globe: Globe,
  Activity: Activity,
  ShieldCheck: ShieldCheck,
  Apple: Apple,
  LayoutGrid: LayoutGrid,
  Sparkles: Sparkles,
  Moon: Moon,
  Users: Users
};

export default function TopicSelection({ onSelect, selectedTopic }: TopicSelectionProps) {
  const [localSelectedTopic, setLocalSelectedTopic] = useState<Topic | null>(selectedTopic);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isTitleSafe, setIsTitleSafe] = useState(true);
  const [isDescSafe, setIsDescSafe] = useState(true);

  // States & Refs for Guided Navigation Transition
  const continueBtnRef = useRef<HTMLDivElement>(null);
  const [highlightActive, setHighlightActive] = useState(false);
  const [showSuccessFeedback, setShowSuccessFeedback] = useState(false);

  // Unified trigger function for selecting a topic & guiding focus
  const selectTopicAndTriggerScroll = (topic: Topic) => {
    setLocalSelectedTopic(topic);
    setShowSuccessFeedback(true);
    setHighlightActive(true);

    // Smooth scroll page to bottom action within requested 500ms–800ms natural feeling
    setTimeout(() => {
      continueBtnRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 200);

    // Keep highlight/subtle pulse active for exactly 1.8s (1-2 glow & pulse cycles)
    setTimeout(() => {
      setHighlightActive(false);
    }, 1800);
  };

  useEffect(() => {
    if (showSuccessFeedback) {
      const timer = setTimeout(() => {
        setShowSuccessFeedback(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessFeedback]);

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) {
      setErrorMsg("Please specify a topic title.");
      return;
    }
    if (!isTitleSafe || !isDescSafe) {
      setErrorMsg("Please rephrase flagged content to keep things respectful and constructive.");
      return;
    }
    setErrorMsg("");
    setIsGenerating(true);

    // Simulate short analysis of custom topic via "DT Innovation Lab Engine"
    setTimeout(() => {
      const customTopic: Topic = {
        id: `custom_${Date.now()}`,
        title: customTitle,
        description: customDescription || "Dynamically configured innovation challenge statement.",
        trendingTag: "CUSTOM CHALLENGE",
        activityCount: 1,
        iconName: "Sparkles",
        color: "from-purple-600 via-brand-primary/90 to-blue-500",
        isCustom: true,
      };
      setIsGenerating(false);
      setShowCustomModal(false);
      selectTopicAndTriggerScroll(customTopic);
    }, 1200);
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-6 px-4 animate-in fade-in duration-300">
      {/* Visual Header */}
      <div className="text-center mb-10 max-w-2xl mx-auto">
        <span className="text-xs font-mono text-brand-primary uppercase tracking-[0.2em] px-3 py-1 bg-brand-primary/35 border border-brand-primary/20 rounded-full">
          Step 1: Choose a Topic 🎯
        </span>
        <h2 className="text-3xl font-extrabold text-text-primary mt-4 mb-2 tracking-tight">
          What would you like to <span className="bg-gradient-to-r from-brand-primary to-brand-primary/80 text-transparent bg-clip-text">redesign?</span>
        </h2>
        <p className="text-sm text-text-secondary">
          Pick an interesting problem you actually want to explore. Choose a card below to start your creative journey!
        </p>
      </div>

      {/* Grid of Topics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Topic Card Loops */}
        {PREDEFINED_TOPICS.map((topic) => {
          const IconComp = iconMap[topic.iconName] || Lightbulb;
          const isSelected = localSelectedTopic?.id === topic.id;

          return (
            <button
              key={topic.id}
              onClick={() => selectTopicAndTriggerScroll(topic)}
              className={`text-left rounded-2xl bg-background/40 border transition-all duration-300 relative overflow-hidden group cursor-pointer ${
                isSelected 
                  ? "border-blue-500 bg-blue-950/20 shadow-[0_0_20px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/30 scale-[1.02]" 
                  : "border-border/80 hover:border-border-subtle/80 hover:bg-surface/30 hover:scale-[1.01]"
              }`}
            >
              {/* Soft visual indicator line on select */}
              <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${topic.color} ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-60 transition-opacity duration-300"}`} />

              <div className="p-6 flex flex-col justify-between h-full min-h-[160px]">
                <div className="space-y-3.5">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${isSelected ? "bg-blue-500/10 text-blue-400" : "bg-surface text-text-secondary group-hover:text-blue-300"} transition-colors`}>
                      <IconComp className="w-5 h-5" />
                    </div>
                    <h3 className="text-[17px] font-bold text-text-primary transition-colors group-hover:text-blue-200">
                      {topic.title}
                    </h3>
                  </div>
                  
                  <p className="text-sm text-slate-350 leading-relaxed font-sans italic opacity-90">
                    "{topic.description}"
                  </p>
                </div>

                {isSelected && (
                  <div className="mt-4 flex items-center justify-end">
                    <span className="text-[9px] bg-blue-950 text-blue-400 px-2.5 py-0.5 rounded-full font-mono font-bold tracking-wider uppercase border border-blue-500/20">
                      SELECTED 🔵
                    </span>
                  </div>
                )}
              </div>
            </button>
          );
        })}

        {/* CUSTOM TOPIC CARD */}
        <button
          onClick={() => setShowCustomModal(true)}
          className={`text-left rounded-2xl border-2 border-dashed transition-all duration-300 relative overflow-hidden group cursor-pointer hover:scale-[1.01] ${
            localSelectedTopic?.isCustom
              ? "border-blue-500 bg-blue-950/10"
              : "border-border hover:border-purple-500/40 bg-background/10 hover:bg-background/20"
          }`}
        >
          <div className="p-6 flex flex-col justify-between h-full min-h-[160px]">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl transition-colors ${
                  localSelectedTopic?.isCustom
                    ? "bg-blue-950/30 border border-blue-800/20 text-blue-400"
                    : "bg-purple-950/30 border border-purple-800/20 text-purple-400 group-hover:text-purple-300"
                }`}>
                  <PlusCircle className="w-5 h-5" />
                </div>
                
                <h3 className="text-[17px] font-bold text-text-primary group-hover:text-purple-300 transition-colors">
                  {localSelectedTopic?.isCustom ? localSelectedTopic.title : "Create Your Own Topic ✏️"}
                </h3>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                {localSelectedTopic?.isCustom ? `"${localSelectedTopic.description}"` : "Have a custom struggle you'd love to redesign? Type it in and map it!"}
              </p>
            </div>
            {localSelectedTopic?.isCustom && (
              <div className="mt-4 flex items-center justify-end">
                <span className="text-[9px] bg-blue-950 text-blue-400 px-2.5 py-0.5 rounded-full font-mono font-bold tracking-wider uppercase border border-blue-500/20">
                  SELECTED CUSTOM 🔵
                </span>
              </div>
            )}
          </div>
        </button>
      </div>

      {/* STAGE PROCESSION BOTTOM ACTION BUTTON (BLUE) */}
      <div 
        ref={continueBtnRef} 
        className="mt-12 pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4"
      >
        <div className="flex flex-col items-start gap-1">
          <span className="text-text-tertiary text-xs font-sans">
            {localSelectedTopic ? `Ready to start Empathize stage with: ${localSelectedTopic.title}` : "Select a topic card above to continue"}
          </span>
          {localSelectedTopic && (
            <span className="text-emerald-400 text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
              ✓ Topic Selected
            </span>
          )}
        </div>

        <motion.button
          disabled={!localSelectedTopic}
          variants={{
            idle: {
              boxShadow: "0 0 15px rgba(0,181,230,0.3)",
              borderColor: "rgba(59,130,246,0.3)",
              scale: 1,
            },
            highlight: {
              boxShadow: [
                "0 0 15px rgba(37, 99, 235, 0.3)",
                "0 0 35px rgba(0, 181, 230, 0.8)",
                "0 0 15px rgba(37, 99, 235, 0.3)",
              ],
              borderColor: [
                "rgba(59,130,246,0.3)",
                "rgba(0,181,230,0.85)",
                "rgba(59,130,246,0.3)",
              ],
              scale: [1, 1.015, 1],
              transition: {
                duration: 0.9,
                repeat: 1,
                ease: "easeInOut",
              },
            }
          }}
          animate={highlightActive ? "highlight" : "idle"}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => localSelectedTopic && onSelect(localSelectedTopic)}
          className="px-10 py-3.5 bg-brand-primary hover:bg-blue-500 text-text-primary font-extrabold text-xs uppercase tracking-widest rounded-full cursor-pointer border border-blue-500/30 transition-all duration-300 disabled:opacity-45 disabled:cursor-not-allowed"
        >
          Continue to Empathize →
        </motion.button>
      </div>

      {/* Floating Guided visual success feedback toast */}
      {showSuccessFeedback && localSelectedTopic && (
        <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="px-5 py-3 bg-surface border border-emerald-500/30 text-emerald-400 text-xs font-bold font-mono tracking-wider uppercase rounded-full shadow-[0_0_20px_rgba(16,185,129,0.35)] flex items-center gap-2.5 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            ✓ Topic Selected
          </div>
        </div>
      )}

      {/* CUSTOM TOPIC MODAL */}
      {showCustomModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-panel max-w-lg w-full max-h-[90vh] overflow-y-auto rounded-2xl glow-purple relative p-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Close button */}
            <button 
              onClick={() => setShowCustomModal(false)}
              className="absolute top-4 right-4 text-text-secondary hover:text-text-primary cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-6 h-6 text-purple-400 animate-pulse" />
              <h3 className="text-lg font-bold text-text-primary uppercase tracking-wider font-mono">Your Custom Topic ✏️</h3>
            </div>

            <form onSubmit={handleCreateCustom} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-text-secondary mb-1.5">
                  What is the problem/idea name? *
                </label>
                <SafeTextInput
                  type="input"
                  required
                  placeholder="e.g., Late Night Studies & Sleep Quality"
                  value={customTitle}
                  onChange={setCustomTitle}
                  onSafetyChange={(safe) => setIsTitleSafe(safe)}
                  context="Custom topic creation name"
                  className="w-full bg-background border border-border text-text-primary text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase text-text-secondary mb-1.5">
                  What is this about? (Brief Description) 📝
                </label>
                <SafeTextInput
                  type="textarea"
                  placeholder="e.g., How high-frequency endless feeds and late-night notification loops disrupt student focus, sleep, and well-being."
                  value={customDescription}
                  onChange={setCustomDescription}
                  onSafetyChange={(safe) => setIsDescSafe(safe)}
                  context="Custom topic description"
                  rows={3}
                  className="w-full bg-background border border-border text-text-primary text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-950/20 border border-red-500/20 text-red-200 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-4 py-2 bg-surface border border-border hover:border-border-subtle text-text-secondary hover:text-text-primary text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating || !customTitle.trim() || !isTitleSafe || !isDescSafe}
                  className="px-6 py-2 bg-gradient-to-r from-purple-500 to-brand-primary/80 hover:from-purple-400 hover:to-brand-primary/80 text-text-primary text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(147,51,234,0.3)] disabled:opacity-55 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-t-transparent border-white rounded-full animate-spin" />
                      Building Challenge... 🚀
                    </>
                  ) : (
                    <>
                      Create Challenge ✨ <MessageSquareCode className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
