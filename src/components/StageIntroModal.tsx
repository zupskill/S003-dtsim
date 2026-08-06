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
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center px-4 pt-[68px] pb-4 sm:p-4 bg-background/80 backdrop-blur-sm transition-opacity">
      <div className="bg-surface border border-border rounded-2xl w-[95%] sm:w-full max-w-[420px] sm:max-w-3xl max-h-[calc(100vh-84px)] sm:max-h-[90vh] shadow-2xl animate-in fade-in zoom-in-95 duration-300 flex flex-col relative overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-border flex flex-col items-center text-center relative shrink-0">
          <button 
            onClick={onClose}
            className="absolute top-2 sm:top-4 right-2 sm:right-4 p-2 text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-brand-secondary font-semibold uppercase tracking-wider text-xs sm:text-sm mb-1 sm:mb-2">
            <span>🎓</span> Design Thinking Briefing
          </div>
          <h2 className="text-xl sm:text-3xl font-bold text-text-primary mb-1 sm:mb-2">{stageConfig.title}</h2>
          <p className="text-xs sm:text-sm text-text-secondary hidden sm:block">{stageConfig.description}</p>
        </div>

        {/* Video Container */}
        <div className="w-full aspect-video bg-black relative shrink-0">
          <iframe
            src={stageConfig.youtubeUrl}
            title={`${stageConfig.title} Introduction`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="w-full h-full border-0"
          ></iframe>
        </div>

        {/* Learning Summary */}
        <div className="p-4 sm:p-6 bg-surface-hover/50 flex-1 overflow-y-auto">
          <h3 className="text-sm sm:text-lg font-medium text-text-primary mb-2 sm:mb-3">In this stage you'll learn to:</h3>
          <ul className="space-y-1.5 sm:space-y-2">
            {stageConfig.bulletPoints.map((point, index) => (
              <li key={index} className="flex items-start gap-2 text-xs sm:text-sm text-text-secondary">
                <span className="text-brand-secondary mt-0.5 sm:mt-1">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer actions */}
        <div className="p-4 sm:p-6 border-t border-border bg-surface flex flex-col gap-3 sm:gap-4 shrink-0">
          <div className="flex items-center justify-end">
            <button
              onClick={() => onContinue(dontShowAgain)}
              className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-medium text-text-primary bg-brand-secondary hover:bg-brand-secondary-hover transition-colors flex items-center justify-center gap-2"
            >
              Continue to {stageConfig.title}
              <Play className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex items-center gap-2 mt-1 sm:mt-2">
            <input
              type="checkbox"
              id="dontShowAgain"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 rounded border-border-subtle bg-surface-hover text-brand-secondary focus:ring-brand-secondary focus:ring-offset-slate-900 cursor-pointer shrink-0"
            />
            <label htmlFor="dontShowAgain" className="text-xs sm:text-sm text-text-secondary cursor-pointer select-none">
              Don't show this introduction again
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
