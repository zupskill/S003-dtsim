import React from "react";
import { Check, Compass, Eye, ShieldAlert, Zap, PenTool, Award, Play } from "lucide-react";

interface ProgressTrackerProps {
  currentStage: number; // 1 to 6
  setStage: (stage: number) => void;
  maxReachedStage: number;
}

export default function ProgressTracker({ currentStage, setStage, maxReachedStage }: ProgressTrackerProps) {
  const stages = [
    { num: 1, name: "Topic", icon: Compass },
    { num: 2, name: "Empathize", icon: Eye },
    { num: 3, name: "Define", icon: ShieldAlert },
    { num: 4, name: "Ideate", icon: Zap },
    { num: 5, name: "Prototype", icon: PenTool },
    { num: 6, name: "Test", icon: Award },
  ];

  return (
    <div className="w-full bg-surface/80 backdrop-blur-md border-b border-border py-3 px-4 sticky top-0 z-40 shadow-lg shadow-brand-secondary/10">
      <div className="max-w-5xl mx-auto flex items-center justify-between overflow-x-auto scrollbar-none py-1">
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          const isCurrent = currentStage === stage.num;
          const isCompleted = stage.num < currentStage;
          const isPlayable = stage.num <= maxReachedStage;

          return (
            <React.Fragment key={stage.num}>
              {/* Stage Element */}
              <button
                disabled={!isPlayable}
                onClick={() => setStage(stage.num)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 relative shrink-0 ${
                  isCurrent
                    ? "bg-gradient-to-r from-brand-secondary to-brand-secondary/80 text-text-primary shadow-[0_0_15px_rgba(6,182,212,0.5)] font-medium scale-105"
                    : isCompleted
                    ? "bg-surface-hover/80 text-brand-secondary font-medium cursor-pointer hover:bg-surface-hover border border-brand-secondary/20 shadow-[0_0_8px_rgba(6,182,212,0.1)]"
                    : isPlayable
                    ? "bg-surface-hover text-text-secondary cursor-pointer hover:bg-surface-hover border border-border-subtle"
                    : "text-text-tertiary cursor-not-allowed opacity-40 bg-transparent"
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 ${
                    isCurrent
                      ? "bg-background text-brand-secondary font-bold"
                      : isCompleted
                      ? "bg-brand-secondary/20 text-brand-secondary"
                      : "bg-surface-hover text-text-tertiary"
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : stage.num}
                </span>

                <Icon className={`w-4 h-4 shrink-0 ${isCurrent ? "animate-pulse" : ""}`} />
                <span className="text-xs tracking-wider uppercase font-semibold hidden md:inline">
                  {stage.name}
                </span>
              </button>

              {/* Connector */}
              {idx < stages.length - 1 && (
                <div
                  className={`h-0.5 min-w-[12px] flex-1 mx-2 transition-all duration-500 rounded-full ${
                    stage.num < currentStage
                      ? "bg-gradient-to-r from-brand-secondary to-brand-secondary/80 shadow-[0_0_6px_rgba(59,130,246,0.3)]"
                      : "bg-surface-hover"
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
