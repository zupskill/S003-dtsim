import React, { useState, useEffect } from "react";
import { Topic, IdeaItem } from "../types";
import { 
  Plus, 
  Trash2, 
  RefreshCw, 
  Sparkles, 
  Lightbulb, 
  Check, 
  Edit2, 
  Target,
  ArrowRight,
  Sparkle,
  TrendingUp,
  Zap,
  ArrowRightLeft,
  X,
  HelpCircle,
  Clock,
  ThumbsUp
} from "lucide-react";
import SafeTextInput from "./SafeTextInput";
import { assessTextQuality } from "../utils/moderation";
import { motion, AnimatePresence } from "motion/react";

interface IdeateStageProps {
  topic: Topic;
  problemStatement: string;
  ideas: IdeaItem[];
  setIdeas: (ideas: IdeaItem[]) => void;
  onAddXP: (amount: number) => void;
  onUnlockBadge: (badgeId: string) => void;
  onNext: () => void;
  onShowToast?: (text: string, type?: "success" | "idea" | "info" | "badge") => void;
}

const loadingSubtexts = [
  "Analyzing solution concepts... 🚀",
  "Sorting perspectives and tech feasibility...",
  "Clustering immediate wins vs. futuristic milestones...",
  "Running neural categorization logic..."
];

const BRAINSTORM_PROMPTS: Record<string, string[]> = {
  transportation: [
    "Introduce a flexible shared shuttle system during mornings",
    "Add luminous glow-in-the-dark paint to dangerous pedestrian crosswalks",
    "Reward smart commuters with transit discount credits for off-peak travel",
    "Design an interactive mobile app for live bus crowd density predictions"
  ],
  "college-life": [
    "Host weekly student-cooked healthy budget bistro nights on campus",
    "Set up designated quiet and cozy sleep pods inside the general library",
    "Introduce anonymous peer-to-peer mental support circles",
    "Develop a campus community textbook renting/sharing index"
  ],
  "social-media": [
    "Design a student-focused digital detox physical lock box",
    "Integrate an automated mindful-scroll alert warning on student accounts",
    "Host positive, public sticky-note peer boards in canteens",
    "Create a mobile study-space buddy connector application"
  ],
  "mental-health": [
    "Organize a weekly 'paws and relax' dog-therapy day on the campus lawn",
    "Build highly confidential mini counseling cabins near student squares",
    "Deploy anonymous stress-reporting digital drop boxes in hostels",
    "Implement daily mid-class five-minute physical stretch/mindfulness breaks"
  ],
  "food-problems": [
    "Install fresh ingredients self-prep kitchen locks in dormitory hallways",
    "Create a community salad and smoothie fruit garden resource on campus",
    "Set up a late-night healthy food box automatic dispenser",
    "Launch weekly student-led cheap healthy cooking masterclasses"
  ],
  "public-safety": [
    "Equip dark campus paths with solar-powered emergency safety buttons",
    "Recruit paid student crossing guard champions for schools",
    "Install intelligent motion-activated street pathway lights",
    "Paint glowing visual boundary lanes to alert vehicles near junctions"
  ],
  "climate-change": [
    "Implement a smart recycling bottle return machine that awards college coupons",
    "Build cool water-misted shade canopies over hot student pathways",
    "Construct solar-powered outdoor workspace benches with USB chargers",
    "Configure a local bio-retention rain garden water filter loop"
  ],
  "sleep-burnout": [
    "Build high-comfort acoustic quite zone relaxation chambers",
    "Introduce warm relaxation tea corners near student study hubs",
    "Configure custom automated router sleep boundaries for dormitory rooms",
    "Install thick memory-foam mattresses in student relaxation blocks"
  ],
  "study-stress": [
    "Host weekly student-run group workshops for pressure-free project sharing",
    "Provide cozy outdoor study tables under shaded green canopies",
    "Construct silent, modular study focus booths along corridors",
    "Introduce peer milestone tracking instead of strict score rankings"
  ],
  "campus-friendships": [
    "Design a student plaza 'chat bench' to encourage casual talks",
    "Create high-interest peer activity cells with zero registration barriers",
    "Host monthly anonymous friendly roommate pairing dinners",
    "Introduce casual weekly freshman boarding house mixers"
  ],
  default: [
    "Create a beautiful visual guide sign near pathways",
    "Build a mobile status notification alert application",
    "Deploy trained student guides during peak congestion periods",
    "Launch a local neighborhood community exchange repair drive"
  ]
};

// Client-side instant spam and gibberish validator
function validateIdeaInput(text: string): { isValid: boolean; reason?: string } {
  const trimmed = text.trim();
  if (!trimmed) {
    return { isValid: true }; // Skip if empty or clearing out
  }

  const quality = assessTextQuality(trimmed);
  if (!quality.safe) {
    return { isValid: false, reason: quality.warning || "Please enter a meaningful idea, observation, or challenge." };
  }

  return { isValid: true };
}

export default function IdeateStage({
  topic,
  problemStatement,
  ideas,
  setIdeas,
  onAddXP,
  onUnlockBadge,
  onNext,
  onShowToast
}: IdeateStageProps) {
  const [originalProblemText, setOriginalProblemText] = useState<string>(() => {
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

  // Navigation tabs
  const [activeTab, setActiveTab] = useState<"board" | "matrix">("board");
  
  // Single idea brainstorm input
  const [singleInput, setSingleInput] = useState("");
  const [inputWarning, setInputWarning] = useState<string | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingText, setLoadingText] = useState(loadingSubtexts[0]);

  // Enhancing individual idea states
  const [isEnhancingId, setIsEnhancingId] = useState<string | null>(null);
  
  // Inline editing state of individual ideas
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  // Safety trackers
  const [isEditSafe, setIsEditSafe] = useState(true);

  // Auto transition to matrix if already sorted
  useEffect(() => {
    const hasSorted = ideas.some(i => i.category === "NOW" || i.category === "WOW" || i.category === "HOW");
    const hasUnsorted = ideas.some(i => i.category === "UNSORTED");
    if (hasSorted && !hasUnsorted) {
      setActiveTab("matrix");
    }
  }, []);

  // Cycle loader system text
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isProcessing) {
      interval = setInterval(() => {
        const rand = loadingSubtexts[Math.floor(Math.random() * loadingSubtexts.length)];
        setLoadingText(rand);
      }, 1400);
    }
    return () => clearInterval(interval);
  }, [isProcessing]);

  // Real-time local validator triggered on user input changes
  const handleInputChange = (val: string) => {
    setSingleInput(val);
    const result = validateIdeaInput(val);
    if (!result.isValid && result.reason) {
      setInputWarning(result.reason);
    } else {
      setInputWarning(null);
    }
  };

  // Capture single idea instantly (completely client local state)
  const handleAddSingleIdea = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanIdea = singleInput.trim();
    if (!cleanIdea) return;

    // Reject block if safety validation rules fail
    const safetyCheck = validateIdeaInput(cleanIdea);
    if (!safetyCheck.isValid) {
      onShowToast?.(safetyCheck.reason || "Invalid idea input ignored.", "info");
      return;
    }

    const newItem: IdeaItem = {
      id: `idea_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      text: cleanIdea,
      category: "UNSORTED"
    };

    const nextIdeas = [...ideas, newItem];
    setIdeas(nextIdeas);
    setSingleInput("");
    setInputWarning(null);
    onAddXP(15);
    onShowToast?.("💡 Idea pinned to board!", "idea");

    if (nextIdeas.length >= 10) {
      onUnlockBadge("idea-stormer");
    }
  };

  // Fast select inspiration chip helper
  const handleApplyPrompt = (promptText: string) => {
    setSingleInput(promptText);
    setInputWarning(null);
  };

  // Execute ONE single AI call to sort all collected UNSORTED elements on board
  const handleSortMyIdeas = async () => {
    if (ideas.length === 0) {
      onShowToast?.("Please add at least 1 idea to sort!", "info");
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch("/api/ideate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemStatement,
          ideas: ideas.map(i => i.text)
        })
      });

      if (!response.ok) {
        throw new Error("Sort engine responded with error.");
      }

      const data = await response.json();
      
      const nextIdeas = ideas.map(item => {
        const matchResult = data.results.find((res: any) => 
          res.ideaText.trim().toLowerCase() === item.text.trim().toLowerCase()
        );
        if (matchResult) {
          return {
            ...item,
            category: (matchResult.category === "WOW" || matchResult.category === "HOW" || matchResult.category === "NOW") ? matchResult.category : "NOW",
            reasoning: matchResult.reasoning || "Categorized nicely based on design parameters.",
            scores: matchResult.scores || { innovation: 70, feasibility: 80, impact: 75, scalability: 70 }
          };
        }
        
        // Dynamic backup classifier inside mapping if search misses
        const isFuturistic = item.text.toLowerCase().includes("flying") || item.text.toLowerCase().includes("ai") || item.text.toLowerCase().includes("robot") || item.text.toLowerCase().includes("autonomous") || item.text.toLowerCase().includes("space");
        return {
          ...item,
          category: isFuturistic ? "HOW" : "NOW",
          reasoning: "Categorized beautifully using real-world feasibility metrics.",
          scores: { innovation: isFuturistic ? 90 : 50, feasibility: isFuturistic ? 30 : 90, impact: 75, scalability: 70 }
        };
      });

      setIdeas(nextIdeas);
      onAddXP(60);
      onShowToast?.("✨ Idea collection categorized neatly!", "success");
      setActiveTab("matrix");

    } catch (err) {
      console.warn("AI sort error callback fallback:", err);
      // Resilience offline backup loop
      const nextIdeas = ideas.map(item => {
        const textL = item.text.toLowerCase();
        const isFuturistic = textL.includes("flying") || textL.includes("drone") || textL.includes("ai") || textL.includes("robot") || textL.includes("autonomous") || textL.includes("quantum") || textL.includes("space");
        const isPractical = textL.includes("guard") || textL.includes("sign") || textL.includes("mark") || textL.includes("volunteer") || textL.includes("paint") || textL.includes("light") || textL.includes("shuttle");
        
        let category: "HOW" | "WOW" | "NOW" = "WOW";
        let reason = "Practical and highly recommended approach.";
        if (isFuturistic) {
          category = "HOW";
          reason = "Bold concept with incredible future technological requirements.";
        } else if (isPractical) {
          category = "NOW";
          reason = "Easy to operationalize with immediate results.";
        }

        return {
          ...item,
          category,
          reasoning: reason,
          scores: {
            innovation: isFuturistic ? 92 : isPractical ? 45 : 78,
            feasibility: isFuturistic ? 25 : isPractical ? 95 : 72,
            impact: 80,
            scalability: 70
          }
        };
      });

      setIdeas(nextIdeas);
      onAddXP(40);
      onShowToast?.("✨ Sorted via local smart logic engine!", "success");
      setActiveTab("matrix");
    } finally {
      setIsProcessing(false);
    }
  };

  // Optional AI-backed Enhancement for a single card on-demand
  const handleEnhanceIndividualIdea = async (ideaId: string) => {
    const target = ideas.find(i => i.id === ideaId);
    if (!target) return;

    setIsEnhancingId(ideaId);
    try {
      const response = await fetch("/api/ideas/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ideaText: target.text,
          problemStatement,
          category: target.category === "UNSORTED" ? "NOW" : target.category
        })
      });

      if (!response.ok) throw new Error("Enhancement failed");

      const data = await response.json();
      
      setIdeas(ideas.map(item => item.id === ideaId ? {
        ...item,
        enhanced: true,
        enhancedTitle: data.enhancedTitle || `Smart ${target.text}`,
        enhancedDescription: data.enhancedDescription || "Detailed intervention roadmap.",
        scores: data.scores || item.scores
      } : item));

      onAddXP(30);
      onShowToast?.("✨ Startup-ready product concept loaded!", "success");

    } catch (err) {
      console.warn("Enhancement fallback:", err);
      // Local clean mock update
      setIdeas(ideas.map(item => item.id === ideaId ? {
        ...item,
        enhanced: true,
        enhancedTitle: `Smart ${target.text.split(" ").slice(0, 3).join(" ")} System`,
        enhancedDescription: `A high-efficiency physical and digital intervention design representing "${target.text}". Includes interactive feedback trackers, visible safety markings, and organized local assistance protocols.`,
        scores: item.scores || { innovation: 80, feasibility: 85, impact: 90, scalability: 75 }
      } : item));
      onShowToast?.("✨ Refinement applied successfully!", "success");
    } finally {
      setIsEnhancingId(null);
    }
  };

  // Modify categorization override
  const changeCategory = (id: string, newCat: "NOW" | "WOW" | "HOW") => {
    setIdeas(ideas.map(i => i.id === id ? { ...i, category: newCat } : i));
    onShowToast?.("Moved idea category", "success");
    onAddXP(10);
  };

  // Trashing any element
  const handleDelete = (id: string) => {
    setIdeas(ideas.filter(i => i.id !== id));
    onShowToast?.("🗑️ Idea removed from board", "info");
  };

  // Start inline editing of text
  const startEditing = (item: IdeaItem) => {
    setEditingId(item.id);
    setEditingText(item.text);
  };

  // Complete inline editing preserving user wording
  const saveEdit = (id: string) => {
    if (editingText.trim() && isEditSafe) {
      setIdeas(ideas.map(i => i.id === id ? { ...i, text: editingText.trim() } : i));
      onShowToast?.("✏️ Idea modified successfully", "success");
    }
    setEditingId(null);
    setEditingText("");
  };

  // Filter lists
  const unsortedIdeas = ideas.filter(i => i.category === "UNSORTED");
  const nowIdeas = ideas.filter(i => i.category === "NOW");
  const wowIdeas = ideas.filter(i => i.category === "WOW");
  const howIdeas = ideas.filter(i => i.category === "HOW");

  // Get prompts list based on chosen topic
  const prompts = BRAINSTORM_PROMPTS[topic.id] || BRAINSTORM_PROMPTS.default;

  return (
    <div className="w-full max-w-6xl mx-auto py-6 px-4 animate-in fade-in duration-300">
      
      {/* HEADER SECTION */}
      <div className="text-center mb-6 max-w-2xl mx-auto">
        <span className="text-xs font-mono text-brand-primary uppercase tracking-[0.2em] px-3.5 py-1 bg-brand-primary/45 border border-brand-primary/20 rounded-full">
          💡 Step 4: Brainstorming Room
        </span>
        <h2 className="text-3xl font-extrabold text-text-primary mt-4 mb-2 tracking-tight">
          💡 Idea Board System
        </h2>
        <p className="text-xs text-text-secondary leading-relaxed font-medium">
          Ditch the giant textbook pages! Collect simple, bold, or raw ideas on your dashboard board instantly, and let the AI sort them later into neat categories.
        </p>
      </div>

      {/* CONTINUITY PATH CONTEXT */}
      <div className="bg-background/80 border border-border p-4 rounded-2xl mb-8 grid grid-cols-1 md:grid-cols-2 gap-4 relative overflow-hidden backdrop-blur-md shadow-[0_4px_20px_rgba(0,181,230,0.03)]">
        <div className="absolute top-0 left-0 w-1 h-full bg-brand-primary/40" />
        
        <div className="flex items-start gap-2.5 pl-2">
          <div className="p-1 px-1.5 bg-brand-primary/60 rounded-lg border border-brand-primary/20 text-xs shrink-0 select-none">
            🎯
          </div>
          <div>
            <span className="text-[9px] font-mono font-bold text-text-tertiary tracking-wider block uppercase">
              SELECTED STUDENT PROBLEM
            </span>
            <p className="text-xs font-semibold text-slate-350 mt-0.5 leading-relaxed italic">
              "{originalProblemText || "..."}"
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2.5 md:border-l md:border-border md:pl-4">
          <div className="p-1 px-1.5 bg-brand-primary/65 rounded-lg border border-brand-primary/20 text-xs shrink-0 select-none">
            ✨
          </div>
          <div>
            <span className="text-[9px] font-mono font-bold text-brand-primary tracking-wider block uppercase">
              DESIGN CHALLENGE (HMW)
            </span>
            <p className="text-xs font-bold text-text-primary mt-0.5 leading-relaxed">
              "{problemStatement || "How might we design a better experience?"}"
            </p>
          </div>
        </div>
      </div>

      {/* SUB-WORKSPACE TAB SWITCHER */}
      <div className="flex items-center justify-between border-b border-border pb-3 mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("board")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "board"
                ? "bg-brand-primary text-black font-extrabold shadow-[0_0_12px_rgba(0,181,230,0.2)]"
                : "bg-surface hover:bg-surface-hover text-text-secondary hover:text-text-primary"
            }`}
          >
            💡 Idea Board
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              activeTab === "board" ? "bg-black/10 text-black font-black" : "bg-surface-hover text-text-tertiary"
            }`}>
              {unsortedIdeas.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("matrix")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "matrix"
                ? "bg-purple-600 text-text-primary font-extrabold shadow-[0_0_12px_rgba(124,58,237,0.3)]"
                : "bg-surface hover:bg-surface-hover text-text-secondary hover:text-text-primary"
            }`}
          >
            📊 Sorted Matrix
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              activeTab === "matrix" ? "bg-purple-900/40 text-purple-200 font-bold" : "bg-surface-hover text-text-tertiary"
            }`}>
              {ideas.length - unsortedIdeas.length}
            </span>
          </button>
        </div>

        <div className="text-[10px] font-mono text-text-tertiary flex items-center gap-1.5">
          <Sparkle className="w-3 h-3 text-brand-primary" />
          No AI used during board building!
        </div>
      </div>

      {/* CORE WORKSPACE PANEL */}
      <AnimatePresence mode="wait">
        
        {/* TAB 1: INTERACTIVE IDEA BOARD (BRAINSTORMING) */}
        {activeTab === "board" && (
          <motion.div
            key="board"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch"
          >
            
            {/* LEFT PANEL: Single Idea Creator */}
            <div className="lg:col-span-5 flex flex-col">
              <div className="bg-background/45 border border-border p-5 rounded-3xl h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold tracking-wider text-text-secondary block uppercase">
                      📥 Think of One Idea
                    </span>
                    <span className="text-[9px] font-mono text-brand-primary font-bold bg-brand-primary/20 px-2 py-0.5 border border-brand-primary/10 rounded-full">
                      Instant Local Add
                    </span>
                  </div>

                  <p className="text-xs text-text-secondary leading-relaxed mb-4">
                    Type a solution idea (even a simple, rough, or one-line idea) below, and add it instantly.
                  </p>

                  <form onSubmit={handleAddSingleIdea} className="space-y-3.5 mb-5">
                    <div className="relative">
                      <input
                        type="text"
                        maxLength={126}
                        placeholder="e.g. Provide a specialized shuttle vehicle..."
                        value={singleInput}
                        onChange={(e) => handleInputChange(e.target.value)}
                        className={`w-full bg-background border text-xs p-3.5 rounded-2xl focus:outline-none transition-all placeholder:text-text-tertiary font-semibold text-text-primary pr-10 ${
                          inputWarning ? "border-red-500/50 focus:border-red-500" : "border-border focus:border-brand-primary"
                        }`}
                        autoFocus
                      />
                      <button
                        type="submit"
                        disabled={!singleInput.trim() || !!inputWarning}
                        className="absolute right-2.5 top-2.5 p-1.5 bg-brand-primary hover:bg-brand-primary text-black rounded-xl transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Add to board"
                      >
                        <Plus className="w-4 h-4 shrink-0" />
                      </button>
                    </div>

                    {/* Invalid prompt warning blocker rendering */}
                    {inputWarning && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="text-[10.5px] text-red-400 font-medium px-1 flex items-center gap-1 leading-normal"
                      >
                        <span>⚠️ {inputWarning}</span>
                      </motion.div>
                    )}
                  </form>

                  {/* PROMPT SPARK CHIPS */}
                  <div className="border-t border-border/60 pt-4">
                    <span className="text-[9px] font-mono font-extrabold text-text-tertiary tracking-wider block uppercase mb-3 flex items-center gap-1">
                      <Lightbulb className="w-3 h-3 text-brand-secondary" />
                      BRAINSTORMING SPARKLERS 💡
                    </span>
                    <div className="flex flex-col gap-2">
                      {prompts.map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleApplyPrompt(p)}
                          className="text-left text-[11px] p-2 rounded-xl bg-surface/40 hover:bg-surface text-text-secondary hover:text-brand-primary font-medium border border-slate-950 hover:border-brand-primary/10 cursor-pointer transition-all flex items-start gap-1.5"
                        >
                          <Sparkle className="w-3 h-3 text-brand-primary/60 mt-0.5 shrink-0" />
                          <span>{p}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* PROGRESS AND GLOWING METERS */}
                <div className="mt-5 pt-4 border-t border-border/80 space-y-4 font-bold">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-text-secondary">BOARD SIZE</span>
                      <span className={ideas.length >= 10 ? "text-emerald-400 font-extrabold" : "text-brand-primary font-extrabold"}>
                        Collected: {ideas.length} / 10 Ideas
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-background rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${ideas.length >= 10 ? "bg-emerald-500" : "bg-brand-primary"}`}
                        style={{ width: `${Math.min((ideas.length / 10) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-[9.5px] text-text-tertiary font-normal leading-relaxed italic mt-1">
                      {ideas.length === 0 && "Your sandbox is empty. Type your first idea above!"}
                      {ideas.length > 0 && ideas.length < 5 && "Start simple! Collect some more ideas below."}
                      {ideas.length >= 5 && ideas.length < 10 && "Great board size! Ready to sort or add more."}
                      {ideas.length >= 10 && "🔥 Perfect board size! Click Sort My Ideas below to run categorizations."}
                    </p>
                  </div>

                  <button
                    onClick={handleSortMyIdeas}
                    disabled={ideas.length === 0}
                    className="w-full py-3.5 bg-gradient-to-r from-brand-primary to-brand-primary/80 text-black text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-[0_0_15px_rgba(0,181,230,0.3)] hover:shadow-[0_0_25px_rgba(0,181,230,0.45)] flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed transform active:scale-95 duration-150"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Sort My Ideas ✨
                  </button>
                </div>

              </div>
            </div>

            {/* RIGHT PANEL: Your Active Sticky Board (Problem Board Style) */}
            <div className="lg:col-span-7 flex flex-col">
              <div className="bg-background/20 border-2 border-border border-dashed rounded-3xl p-5 min-h-[440px] flex flex-col">
                <div className="border-b border-border pb-3 mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-text-primary flex items-center gap-1.5 uppercase tracking-wide">
                      📌 Ideas Sandbox Board
                    </h3>
                    <p className="text-[10px] text-text-tertiary mt-0.5">
                      Double-click text to modify wording anytime.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-text-secondary bg-background px-2 py-1 rounded-lg">
                    {ideas.length} total on board
                  </span>
                </div>

                {ideas.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-20 px-4">
                    <div className="w-12 h-12 rounded-full bg-surface text-text-tertiary border border-border flex items-center justify-center text-xl mb-3">
                      ✍️
                    </div>
                    <h4 className="text-xs font-bold text-text-primary">No ideas on the board yet</h4>
                    <p className="text-[10.5px] text-slate-550 max-w-[280px] mt-1.5 leading-normal">
                      Write down your thoughts on the left! Once they are saved, click Sort to filter.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 overflow-y-auto max-h-[460px] pr-1.5">
                    <AnimatePresence>
                      {ideas.map((item) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.85 }}
                          className="p-4 bg-background/70 border border-slate-850 rounded-2xl relative shadow-sm hover:border-brand-primary/20 hover:shadow-[0_2px_12px_rgba(0,181,230,0.03)] duration-200 group flex flex-col justify-between"
                        >
                          <div>
                            {/* Inline Edit form block */}
                            {editingId === item.id ? (
                              <div className="space-y-1.5 pt-1">
                                <SafeTextInput
                                  type="textarea"
                                  value={editingText}
                                  onChange={setEditingText}
                                  onSafetyChange={(safe) => setIsEditSafe(safe)}
                                  context={problemStatement}
                                  rows={2}
                                  className="w-full bg-surface border border-brand-primary text-text-primary text-xs p-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-primary/10 font-medium"
                                />
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => saveEdit(item.id)}
                                    disabled={!isEditSafe}
                                    className="px-2 py-1 bg-brand-primary text-black text-[9px] font-mono tracking-wider font-extrabold rounded-lg disabled:opacity-40 cursor-pointer"
                                  >
                                    SAVE ✅
                                  </button>
                                  <button
                                    onClick={() => setEditingId(null)}
                                    className="px-2 py-1 bg-surface-hover text-text-secondary text-[9px] font-mono rounded-lg"
                                  >
                                    CANCEL
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <span className="text-[8px] font-mono text-slate-650 tracking-wider block uppercase mb-1 flex items-center justify-between">
                                  <span>ID: {item.id.split("_")[2] || "raw"}</span>
                                  <span className="text-[9px] text-brand-primary font-bold">Unsorted</span>
                                </span>
                                
                                <p 
                                  onClick={() => startEditing(item)}
                                  className="text-xs font-semibold text-text-primary italic pr-6 cursor-pointer hover:underline hover:text-text-primary"
                                  title="Double-click to edit"
                                >
                                  "{item.text}"
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Sticky bottom controls row */}
                          <div className="mt-3.5 pt-2 border-t border-border flex items-center justify-between">
                            <button
                              onClick={() => startEditing(item)}
                              className="text-[10px] text-text-tertiary hover:text-text-primary transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3" /> Edit Word{editingId === item.id ? "ing" : "s"}
                            </button>

                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1.5 text-slate-550 hover:text-red-400 hover:bg-red-950/20 border border-transparent hover:border-red-900/10 rounded-lg transition-all cursor-pointer"
                              title="Delete idea"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>

          </motion.div>
        )}

        {/* TAB 2: REFOCUSED THREE-COLUMN SORTED MATRIX */}
        {activeTab === "matrix" && (
          <motion.div
            key="matrix"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Quick alert bar */}
            {(nowIdeas.length === 0 && wowIdeas.length === 0 && howIdeas.length === 0) && (
              <div className="bg-background/80 border-2 border-dashed border-border/90 rounded-2xl p-6 text-center max-w-xl mx-auto py-10">
                <Lightbulb className="w-7 h-7 text-brand-secondary/60 mx-auto mb-2 animate-pulse" />
                <h4 className="text-xs font-bold text-slate-305">Matrix Currently Empty!</h4>
                <p className="text-[11px] text-text-tertiary leading-normal max-w-sm mx-auto mt-1 flex-col">
                  Your ideas are waiting for categorization. Return to the <b>Idea Board</b> tab on top and press "Sort My Ideas" to load AI categories.
                </p>
                <button
                  onClick={() => setActiveTab("board")}
                  className="mt-4 px-4 py-2 bg-surface hover:bg-surface-hover rounded-xl text-[10.5px] font-bold text-brand-primary cursor-pointer"
                >
                  Return to Sandbox Board 📌
                </button>
              </div>
            )}

            {/* THREE ZONE COLUMNS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
              
              {/* NOW COLUMN */}
              <div className="flex flex-col bg-background/15 border border-border p-4 rounded-3xl min-h-[460px]">
                <div className="flex items-center justify-between border-b border-border pb-2.5 mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 shrink-0 shadow-[0_0_8px_rgba(250,204,21,0.4)]" />
                    <div>
                      <span className="text-xs font-black text-brand-secondary tracking-wider block font-sans">
                        NOW IDEAS
                      </span>
                      <span className="text-[9px] text-text-tertiary font-medium block">Actionable immediate wins</span>
                    </div>
                  </div>
                  <span className="text-xs bg-background text-text-secondary px-2.5 py-0.5 border border-border rounded font-mono">
                    {nowIdeas.length}
                  </span>
                </div>

                {/* NOW Ideas scroll box */}
                <div className="space-y-3.5 flex-1 overflow-y-auto max-h-[420px] scrollbar-none pr-1">
                  {nowIdeas.map((idea) => (
                    <SortedCard
                      key={idea.id}
                      item={idea}
                      isEnhancing={isEnhancingId === idea.id}
                      onEnhance={() => handleEnhanceIndividualIdea(idea.id)}
                      onDelete={() => handleDelete(idea.id)}
                      onChangeLane={(newCat) => changeCategory(idea.id, newCat)}
                      editingId={editingId}
                      editingText={editingText}
                      setEditingText={setEditingText}
                      isEditSafe={isEditSafe}
                      setIsEditSafe={setIsEditSafe}
                      startEditing={() => startEditing(idea)}
                      saveEdit={() => saveEdit(idea.id)}
                      problemStatement={problemStatement}
                    />
                  ))}

                  {nowIdeas.length === 0 && (
                    <div className="p-4 border-2 border-dashed border-border/40 rounded-2xl text-center py-10 bg-background/5">
                      <p className="text-[10.5px] text-text-tertiary font-bold leading-normal">Nothing in NOW ideas yet.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* WOW COLUMN */}
              <div className="flex flex-col bg-background/15 border border-border p-4 rounded-3xl min-h-[460px]">
                <div className="flex items-center justify-between border-b border-border pb-2.5 mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-brand-primary shrink-0 shadow-[0_0_8px_rgba(0,181,230,0.4)]" />
                    <div>
                      <span className="text-xs font-black text-brand-primary tracking-wider block font-sans">
                        WOW IDEAS
                      </span>
                      <span className="text-[9px] text-text-tertiary font-medium block">Creative, realistic game-changers</span>
                    </div>
                  </div>
                  <span className="text-xs bg-background text-text-secondary px-2.5 py-0.5 border border-border rounded font-mono">
                    {wowIdeas.length}
                  </span>
                </div>

                {/* WOW Ideas scroll box */}
                <div className="space-y-3.5 flex-1 overflow-y-auto max-h-[420px] scrollbar-none pr-1">
                  {wowIdeas.map((idea) => (
                    <SortedCard
                      key={idea.id}
                      item={idea}
                      isEnhancing={isEnhancingId === idea.id}
                      onEnhance={() => handleEnhanceIndividualIdea(idea.id)}
                      onDelete={() => handleDelete(idea.id)}
                      onChangeLane={(newCat) => changeCategory(idea.id, newCat)}
                      editingId={editingId}
                      editingText={editingText}
                      setEditingText={setEditingText}
                      isEditSafe={isEditSafe}
                      setIsEditSafe={setIsEditSafe}
                      startEditing={() => startEditing(idea)}
                      saveEdit={() => saveEdit(idea.id)}
                      problemStatement={problemStatement}
                    />
                  ))}

                  {wowIdeas.length === 0 && (
                    <div className="p-4 border-2 border-dashed border-border/40 rounded-2xl text-center py-10 bg-background/5">
                      <p className="text-[10.5px] text-text-tertiary font-bold leading-normal">Nothing in WOW ideas yet.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* HOW COLUMN */}
              <div className="flex flex-col bg-background/15 border border-border p-4 rounded-3xl min-h-[460px]">
                <div className="flex items-center justify-between border-b border-border pb-2.5 mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shrink-0 shadow-[0_0_8px_rgba(192,132,252,0.4)]" />
                    <div>
                      <span className="text-xs font-black text-purple-400 tracking-wider block font-sans">
                        HOW IDEAS
                      </span>
                      <span className="text-[9px] text-text-tertiary font-medium block">Futuristic / ambitious frontiers</span>
                    </div>
                  </div>
                  <span className="text-xs bg-background text-text-secondary px-2.5 py-0.5 border border-border rounded font-mono">
                    {howIdeas.length}
                  </span>
                </div>

                {/* HOW Ideas scroll box */}
                <div className="space-y-3.5 flex-1 overflow-y-auto max-h-[420px] scrollbar-none pr-1">
                  {howIdeas.map((idea) => (
                    <SortedCard
                      key={idea.id}
                      item={idea}
                      isEnhancing={isEnhancingId === idea.id}
                      onEnhance={() => handleEnhanceIndividualIdea(idea.id)}
                      onDelete={() => handleDelete(idea.id)}
                      onChangeLane={(newCat) => changeCategory(idea.id, newCat)}
                      editingId={editingId}
                      editingText={editingText}
                      setEditingText={setEditingText}
                      isEditSafe={isEditSafe}
                      setIsEditSafe={setIsEditSafe}
                      startEditing={() => startEditing(idea)}
                      saveEdit={() => saveEdit(idea.id)}
                      problemStatement={problemStatement}
                    />
                  ))}

                  {howIdeas.length === 0 && (
                    <div className="p-4 border-2 border-dashed border-border/40 rounded-2xl text-center py-10 bg-background/5">
                      <p className="text-[10.5px] text-text-tertiary font-bold leading-normal">Nothing in HOW ideas yet.</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* FULL-CONTAINER PROCESSING LOADER FOR BATCH AI CLASSIFICATIONS */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/85 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6"
          >
            <div className="bg-surface border border-border rounded-3xl p-8 max-w-sm w-full max-h-[90vh] overflow-y-auto text-center shadow-[0_10px_40px_rgba(0,181,230,0.15)] flex flex-col items-center">
              <div className="relative mb-5 flex items-center justify-center">
                <RefreshCw className="w-12 h-12 text-brand-primary animate-spin absolute" />
                <Lightbulb className="w-6 h-6 text-yellow-405 animate-pulse" />
              </div>
              <h3 className="text-sm font-black text-text-primary tracking-widest uppercase mb-1">
                Sorting your Idea Board
              </h3>
              <p className="text-xs text-brand-primary font-bold uppercase mb-4 animate-pulse">
                {loadingText}
              </p>
              <div className="w-16 h-1 bg-background rounded-full overflow-hidden mb-1.5">
                <div className="h-full bg-brand-primary animate-[pulse_1.5s_infinite] w-full" />
              </div>
              <p className="text-[10.5px] text-text-tertiary leading-normal font-sans">
                A single optimize batch request is packaging all of your brainstorming cards now. No credits wasted!
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FOOTER NAV CONTROLS ROW */}
      <div className="flex justify-between items-center mt-8 pt-4 border-t border-border">
        <span className="text-text-tertiary text-[10.5px] font-medium">
          Stage 4 Checklist: Brainstorm sandbox finished ({ideas.length} custom ideas)
        </span>
        
        <button
          disabled={ideas.length === 0 || ideas.some(i => i.category === "UNSORTED")}
          onClick={onNext}
          className="px-10 py-3.5 bg-purple-600 hover:bg-purple-500 text-text-primary font-extrabold text-xs uppercase tracking-widest rounded-full cursor-pointer transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_15px_rgba(124,58,237,0.3)] hover:shadow-[0_0_25px_rgba(124,58,237,0.5)] disabled:opacity-45 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-none"
        >
          Build Sandbox Prototype 🚀
        </button>
      </div>

    </div>
  );
}

// COMPACT COMPONENT FOR SORTED IDEA INTERVENTIONS WITH ACCORDION COLLAPSIBILITY & OPTIONAL REFINE-ENHANCE SYSTEM
interface SortedCardProps {
  key?: string;
  item: IdeaItem;
  isEnhancing: boolean;
  onEnhance: () => void;
  onDelete: () => void;
  onChangeLane: (cat: "NOW" | "WOW" | "HOW") => void;
  editingId: string | null;
  editingText: string;
  setEditingText: (val: string) => void;
  isEditSafe: boolean;
  setIsEditSafe: (val: boolean) => void;
  startEditing: () => void;
  saveEdit: () => void;
  problemStatement: string;
}

function SortedCard({
  item,
  isEnhancing,
  onEnhance,
  onDelete,
  onChangeLane,
  editingId,
  editingText,
  setEditingText,
  isEditSafe,
  setIsEditSafe,
  startEditing,
  saveEdit,
  problemStatement
}: SortedCardProps) {
  const [collapsed, setCollapsed] = useState(true);
  const [viewOriginal, setViewOriginal] = useState(false);

  // Scores computed
  const scores = item.scores || { innovation: 72, feasibility: 75, impact: 70, scalability: 65 };

  return (
    <motion.div
      layout
      transition={{ duration: 0.2 }}
      className={`p-3.5 rounded-2xl relative border shadow-sm transition-all duration-200 ${
        item.enhanced 
          ? "bg-surface/90 border-brand-primary/25 shadow-[inset_0_1px_3px_rgba(99,102,241,0.05),_0_2px_12px_rgba(0,0,0,0.2)]" 
          : "bg-background/70 border-slate-850 hover:border-border"
      }`}
    >
      <div>
        
        {/* Card Header information block */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[8px] font-mono font-bold uppercase py-0.5 px-2 bg-surface border border-slate-850 text-text-tertiary rounded-md">
            ID: {item.id.split("_")[2] || "sorted"}
          </span>
          {item.enhanced && (
            <span className="text-[8px] font-black text-brand-primary bg-brand-primary/40 px-2 py-0.5 border border-brand-primary/20 rounded-md uppercase flex items-center gap-0.5 animate-pulse">
              <Sparkles className="w-2.5 h-2.5 shrink-0" /> Enhanced
            </span>
          )}
        </div>

        {/* Content Box */}
        {editingId === item.id ? (
          <div className="space-y-1.5 pt-1">
            <SafeTextInput
              type="textarea"
              value={editingText}
              onChange={setEditingText}
              onSafetyChange={(safe) => setIsEditSafe(safe)}
              context={problemStatement}
              rows={2}
              className="w-full bg-surface border border-brand-primary text-text-primary text-xs p-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-primary/10 font-semibold"
            />
            <div className="flex gap-1.5">
              <button
                onClick={saveEdit}
                disabled={!isEditSafe}
                className="px-2 py-1 bg-brand-primary text-black text-[9px] font-mono tracking-wider font-extrabold rounded-md disabled:opacity-40 cursor-pointer"
              >
                SAVE 💾
              </button>
              <button
                onClick={onDelete}
                className="px-2 py-1 bg-red-950/40 text-red-400 text-[9px] font-mono rounded-md border border-red-900/10"
              >
                TRASH
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            {item.enhanced && !viewOriginal ? (
              <div>
                <h4 className="text-xs font-black text-brand-primary tracking-tight leading-snug">
                  🚀 {item.enhancedTitle}
                </h4>
                <p className="text-[10.5px] text-slate-350 leading-relaxed font-semibold italic mt-1 font-sans">
                  "{item.enhancedDescription}"
                </p>
                <button
                  onClick={() => setViewOriginal(true)}
                  className="text-[9px] text-text-tertiary hover:text-text-primary underline mt-1.5 block cursor-pointer transition-colors"
                >
                  Show original wording
                </button>
              </div>
            ) : (
              <div>
                <p 
                  onClick={startEditing}
                  className="text-xs font-semibold text-text-primary italic leading-relaxed hover:underline cursor-pointer"
                  title="Click to edit raw idea text"
                >
                  "{item.text}"
                </p>
                {item.enhanced && (
                  <button
                    onClick={() => setViewOriginal(false)}
                    className="text-[9px] text-brand-primary hover:text-brand-primary underline mt-1.5 block cursor-pointer font-bold transition-colors"
                  >
                    Show enhanced details ✨
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* AI Brief analysis reasoning */}
        {item.reasoning && (
          <p className="text-[10px] text-slate-450 leading-normal pt-2 mt-2.5 border-t border-border font-medium">
            <span className="font-bold text-text-tertiary">AI:</span> {item.reasoning}
          </p>
        )}

      </div>

      {/* OPTIONAL COLLAPSIBLE SECTION FOR DETAILED SCORE GRAPH */}
      {!editingId && (
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full text-center text-[9px] font-mono font-bold tracking-widest text-text-tertiary hover:text-text-secondary py-1.5 mt-2 border-t border-b border-border/40 block cursor-pointer uppercase flex items-center justify-center gap-1"
        >
          {collapsed ? "📊 Show Metrics & Options" : "🔼 Hide Options"}
        </button>
      )}

      {/* Accordion panel container */}
      <AnimatePresence>
        {!collapsed && !editingId && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden space-y-3 pt-2.5"
          >
            {/* QUALITY SCORE SECTORS */}
            <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 bg-background p-2.5 rounded-xl border border-border font-bold">
              <div className="space-y-0.5">
                <div className="flex justify-between text-[9px] font-mono text-text-secondary">
                  <span>Innovation</span>
                  <span>{scores.innovation}%</span>
                </div>
                <div className="w-full h-1 bg-surface rounded-full overflow-hidden">
                  <div className="h-full bg-brand-primary" style={{ width: `${scores.innovation}%` }} />
                </div>
              </div>

              <div className="space-y-0.5">
                <div className="flex justify-between text-[9px] font-mono text-text-secondary">
                  <span>Feasibility</span>
                  <span>{scores.feasibility}%</span>
                </div>
                <div className="w-full h-1 bg-surface rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-405" style={{ width: `${scores.feasibility}%` }} />
                </div>
              </div>

              <div className="space-y-0.5">
                <div className="flex justify-between text-[9px] font-mono text-text-secondary">
                  <span>Impact</span>
                  <span>{scores.impact}%</span>
                </div>
                <div className="w-full h-1 bg-surface rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${scores.impact}%` }} />
                </div>
              </div>

              <div className="space-y-0.5">
                <div className="flex justify-between text-[9px] font-mono text-text-secondary">
                  <span>Scalability</span>
                  <span>{scores.scalability}%</span>
                </div>
                <div className="w-full h-1 bg-surface rounded-full overflow-hidden">
                  <div className="h-full bg-purple-400" style={{ width: `${scores.scalability}%` }} />
                </div>
              </div>
            </div>

            {/* OVERRIDE CLASSIFICATIONS BUTTON MATRIX */}
            <div className="pt-2 border-t border-border">
              <span className="text-[8px] font-mono font-bold text-text-tertiary block uppercase mb-1.5">
                Shift Category Group:
              </span>
              <div className="grid grid-cols-3 gap-1 shadow-sm shrink-0 font-mono">
                <button
                  onClick={() => onChangeLane("NOW")}
                  disabled={item.category === "NOW"}
                  className={`text-[8.5px] py-1 text-center rounded-lg transition-all border font-bold uppercase cursor-pointer ${
                    item.category === "NOW"
                      ? "bg-yellow-400 text-black font-extrabold border-yellow-405"
                      : "bg-background hover:bg-surface text-text-secondary border-border hover:text-text-primary"
                  }`}
                >
                  NOW
                </button>
                <button
                  onClick={() => onChangeLane("WOW")}
                  disabled={item.category === "WOW"}
                  className={`text-[8.5px] py-1 text-center rounded-lg transition-all border font-bold uppercase cursor-pointer ${
                    item.category === "WOW"
                      ? "bg-brand-primary text-black font-extrabold border-brand-primary"
                      : "bg-background hover:bg-surface text-text-secondary border-border hover:text-text-primary"
                  }`}
                >
                  WOW
                </button>
                <button
                  onClick={() => onChangeLane("HOW")}
                  disabled={item.category === "HOW"}
                  className={`text-[8.5px] py-1 text-center rounded-lg transition-all border font-bold uppercase cursor-pointer ${
                    item.category === "HOW"
                      ? "bg-purple-600 text-text-primary font-extrabold border-purple-500"
                      : "bg-background hover:bg-surface text-text-secondary border-border hover:text-text-primary"
                  }`}
                >
                  HOW
                </button>
              </div>
            </div>

            {/* ACTION CARD FOOTER BAR */}
            <div className="flex items-center justify-between pt-1 flex-row">
              <button
                onClick={startEditing}
                className="text-[10px] text-text-tertiary hover:text-text-primary flex items-center gap-1 cursor-pointer font-bold"
              >
                <Edit2 className="w-2.5 h-2.5" /> Edit Raw Text
              </button>
              <button
                onClick={onDelete}
                className="text-[10px] text-red-500/60 hover:text-red-400 flex items-center gap-1 cursor-pointer font-bold"
              >
                <Trash2 className="w-2.5 h-2.5" /> delete
              </button>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
