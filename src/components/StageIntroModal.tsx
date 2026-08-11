import React, { useState } from "react";
import { X, Play } from "lucide-react";

export interface StageIntroConfig {
  id: number;
  title: string;
  description: string;
  bulletPoints: string[];
  youtubeUrl: string;
}

export const STAGE_INTROS: Record<number, StageIntroConfig> = {
  1: {
    id: 1,
    title: "Choose a Topic",
    description: "This short lesson introduces the purpose of this stage and prepares you before you begin.",
    bulletPoints: [
      "Identify a problem you care about",
      "Understand why it matters",
      "Select a topic to focus your design thinking efforts"
    ],
    youtubeUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },
  2: {
    id: 2,
    title: "Empathize",
    description: "This short lesson introduces the purpose of this stage and prepares you before you begin.",
    bulletPoints: [
      "Observe real user behavior",
      "Understand frustrations",
      "Identify hidden needs",
      "Build empathy before solving problems"
    ],
    youtubeUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },
  3: {
    id: 3,
    title: "Define",
    description: "This short lesson introduces the purpose of this stage and prepares you before you begin.",
    bulletPoints: [
      "Synthesize your empathy findings",
      "Draft a clear problem statement",
      "Create a How Might We (HMW) question",
      "Set a clear direction for ideation"
    ],
    youtubeUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },
  4: {
    id: 4,
    title: "Ideate",
    description: "This short lesson introduces the purpose of this stage and prepares you before you begin.",
    bulletPoints: [
      "Brainstorm without judgment",
      "Generate a wide variety of ideas",
      "Think outside the box",
      "Select the most promising solutions"
    ],
    youtubeUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },
  5: {
    id: 5,
    title: "Prototype",
    description: "This short lesson introduces the purpose of this stage and prepares you before you begin.",
    bulletPoints: [
      "Build a tangible representation of your idea",
      "Focus on the core functionality",
      "Learn by making",
      "Prepare for user testing"
    ],
    youtubeUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },
  6: {
    id: 6,
    title: "Test",
    description: "This short lesson introduces the purpose of this stage and prepares you before you begin.",
    bulletPoints: [
      "Put your prototype in front of users",
      "Gather authentic feedback",
      "Identify areas for improvement",
      "Iterate based on test results"
    ],
    youtubeUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  }
};

interface StageIntroModalProps {
  isOpen: boolean;
  stageConfig: StageIntroConfig;
  onContinue: (dontShowAgain: boolean) => void;
  onClose: () => void;
}

export function StageIntroModal({ isOpen, stageConfig, onContinue, onClose }: StageIntroModalProps) {
  const [hasWatched, setHasWatched] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setHasWatched(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-background/80 backdrop-blur-sm transition-opacity">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-3xl max-h-[96dvh] shadow-2xl animate-in fade-in zoom-in-95 duration-300 flex flex-col relative overflow-hidden">
        {/* Header */}
        <div className="p-3 sm:p-5 border-b border-border flex flex-col items-center text-center relative shrink-0">
          <button 
            onClick={onClose}
            className="absolute top-2 right-2 sm:top-4 sm:right-4 p-2 text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-brand-primary font-semibold uppercase tracking-wider text-[10px] sm:text-xs mb-1">
            <span>🎓</span> Design Thinking Briefing
          </div>
          <h2 className="text-lg sm:text-2xl font-bold text-text-primary mb-1">{stageConfig.title}</h2>
          <p className="text-xs text-text-secondary hidden sm:block max-w-[90%]">{stageConfig.description}</p>
        </div>

        {/* Video Container */}
        <div className="w-full bg-black shrink-0 flex items-center justify-center">
          <iframe
            src={stageConfig.youtubeUrl}
            title={`${stageConfig.title} Introduction`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="w-full border-0"
            style={{ 
              height: "auto",
              maxHeight: "min(35dvh, 320px)",
              maxWidth: "calc(min(35dvh, 320px) * 16 / 9)",
              aspectRatio: "16 / 9"
            }}
          ></iframe>
        </div>

        {/* Learning Summary */}
        <div className="p-3 sm:p-5 bg-surface-hover/50 flex-1 overflow-y-auto min-h-[80px]">
          <h3 className="text-sm sm:text-base font-medium text-text-primary mb-2">In this stage you'll learn to:</h3>
          <ul className="space-y-1.5">
            {stageConfig.bulletPoints.map((point, index) => (
              <li key={index} className="flex items-start gap-2 text-xs sm:text-sm text-text-secondary">
                <span className="text-brand-primary mt-0.5">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer actions */}
        <div className="p-3 sm:p-5 border-t border-border bg-surface flex flex-row flex-wrap items-center justify-center gap-3 shrink-0">
          <button
            onClick={() => setHasWatched(true)}
            disabled={hasWatched}
            className={`flex-1 min-w-[200px] whitespace-nowrap px-4 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-medium border transition-colors flex items-center justify-center ${
              hasWatched 
                ? 'bg-brand-primary/10 text-brand-primary border-brand-primary/30 cursor-default' 
                : 'text-text-primary border-border hover:bg-surface-hover'
            }`}
          >
            I watched the video
          </button>
          <button
            onClick={() => onContinue(true)}
            disabled={!hasWatched}
            className={`flex-1 min-w-[200px] whitespace-nowrap px-4 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-medium transition-colors flex items-center justify-center gap-2 ${
              hasWatched
                ? "text-text-primary bg-brand-primary hover:bg-brand-primary-hover"
                : "text-text-tertiary bg-surface-hover border border-border opacity-50 cursor-not-allowed"
            }`}
          >
            Continue to {stageConfig.title}
            <Play className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
