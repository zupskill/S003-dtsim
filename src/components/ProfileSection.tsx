import React, { useState, useEffect } from "react";
import { UserProfile, Badge } from "../types";
import { BADGES } from "../data";
import { Award, Compass, Heart, Activity, Briefcase, ShieldCheck, Star } from "lucide-react";
import { X, User, Trophy, Flame } from "lucide-react";
import { saveSupabaseProfile } from "../supabase";

interface ProfileSectionProps {
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
  onClose: () => void;
  onAddXP: (amount: number) => void;
}

const badgeIcons: Record<string, React.ComponentType<any>> = {
  Compass: Compass,
  Heart: Heart,
  Briefcase: Briefcase,
  Activity: Activity,
  ShieldCheck: ShieldCheck,
  Award: Award
};

export default function ProfileSection({
  profile,
  setProfile,
  onClose,
  onAddXP
}: ProfileSectionProps) {
  const [activeTab, setActiveTab] = useState<"details" | "achievements">("details");

  const XP_LEVEL_TARGETS: Record<string, number> = {
    "Explorer": 150,
    "Observer": 350,
    "Problem Finder": 600,
    "Innovator": 950,
    "Visionary": 1400,
    "System Thinker": 2500,
  };

  const currentLevelTarget = XP_LEVEL_TARGETS[profile.level] || 1000;
  const progressRatio = Math.min((profile.xp / currentLevelTarget) * 100, 100);

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="glass-panel max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-2xl relative p-8 border-border text-left bg-background/95 shadow-2xl">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-450 hover:text-text-primary cursor-pointer transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tab Header Selector */}
        <div className="flex border-b border-border mb-6 gap-6">
          <button
            onClick={() => setActiveTab("details")}
            className={`pb-3 text-sm font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all ${
              activeTab === "details"
                ? "border-brand-secondary text-text-primary"
                : "border-transparent text-text-tertiary hover:text-slate-350"
            }`}
          >
            <User className="w-4 h-4" />
            Your Profile
          </button>
          
          <button
            onClick={() => setActiveTab("achievements")}
            className={`pb-3 text-sm font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all ${
              activeTab === "achievements"
                ? "border-brand-secondary text-text-primary"
                : "border-transparent text-text-tertiary hover:text-slate-350"
            }`}
          >
            <Trophy className="w-4 h-4" />
            Achievements & XP
          </button>
        </div>

        {/* TAB 1: DETAILS EDIT FORM */}
        {activeTab === "details" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl bg-surface/50 border border-border">
              <div className="relative">
                {profile.photoURL ? (
                  <img src={profile.photoURL} alt={profile.username} className="w-24 h-24 rounded-full border-2 border-brand-secondary/30 object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-brand-primary/10 text-brand-secondary flex items-center justify-center border-2 border-brand-secondary/30">
                    <User className="w-10 h-10" />
                  </div>
                )}
                <div className="absolute -bottom-2 -right-2 bg-surface border border-border-subtle p-1.5 rounded-full shadow-lg">
                  <Flame className="w-4 h-4 text-orange-500" />
                </div>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-2xl font-bold text-text-primary mb-1">{profile.username}</h3>
                <p className="text-text-secondary mb-4">{profile.email}</p>
                <div className="inline-block bg-brand-secondary/10 text-brand-secondary px-3 py-1 rounded-full text-xs font-mono font-bold tracking-widest uppercase border border-brand-secondary/20">
                  {profile.level}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-surface/50 border border-border text-center">
                <div className="text-3xl font-bold text-brand-secondary mb-1">{profile.xp}</div>
                <div className="text-[10px] text-text-secondary font-bold tracking-widest uppercase">Total XP</div>
              </div>
              <div className="p-4 rounded-2xl bg-surface/50 border border-border text-center">
                <div className="text-3xl font-bold text-text-primary mb-1">{profile.completedSimulations || 0}</div>
                <div className="text-[10px] text-text-secondary font-bold tracking-widest uppercase">Simulations</div>
              </div>
              <div className="p-4 rounded-2xl bg-surface/50 border border-border text-center">
                <div className="text-3xl font-bold text-text-primary mb-1">{profile.problemsSolved}</div>
                <div className="text-[10px] text-text-secondary font-bold tracking-widest uppercase">Problems</div>
              </div>
              <div className="p-4 rounded-2xl bg-surface/50 border border-border text-center">
                <div className="text-3xl font-bold text-text-primary mb-1">{profile.unlockedBadgeIds.length}</div>
                <div className="text-[10px] text-text-secondary font-bold tracking-widest uppercase">Badges</div>
              </div>
            </div>

            <p className="text-xs text-center text-text-tertiary font-medium">
              Your account information is securely provided by your Google account.
            </p>
          </div>
        )}

        {/* TAB 2: ACHIEVEMENTS & ROAD */}
        {activeTab === "achievements" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="min-w-0">
                <span className="text-[10px] inline-block uppercase font-mono tracking-wider text-text-tertiary font-semibold mb-0.5">CURRENT LEVEL TITLE</span>
                <span className="text-xl font-black uppercase text-brand-secondary block tracking-tight">{profile.level}</span>
              </div>
              <div className="flex gap-1 items-center bg-brand-secondary/20 px-3.5 py-1.5 rounded-full border border-brand-secondary/20 text-brand-secondary text-xs font-bold font-mono">
                <Flame className="w-4 h-4" /> {profile.xp} XP acumulados
              </div>
            </div>

            {/* XP PROGRESS BAR */}
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] uppercase font-bold text-text-secondary font-mono">
                <span>XP PROGRESSION RATIO</span>
                <span className="text-brand-secondary">{profile.xp} / {currentLevelTarget} XP</span>
              </div>
              <div className="w-full h-2.5 bg-background rounded-full overflow-hidden border border-border p-0.5">
                <div className="h-full bg-gradient-to-r from-brand-secondary to-brand-secondary/80 rounded-full transition-all duration-350" style={{ width: `${progressRatio}%` }} />
              </div>
            </div>

            {/* ACHIEVEMENTS GRID */}
            <div className="space-y-3">
              <span className="text-[10px] font-mono font-bold tracking-wider text-text-tertiary uppercase block">
                ZUPSKILL ACHIEVEMENTS ({BADGES.filter(b => b.unlocked || profile.unlockedBadgeIds.includes(b.id)).length} UNLOCKED)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {BADGES.map((b) => {
                  const isUnlocked = profile.unlockedBadgeIds.includes(b.id) || b.id === "problem-hunter";
                  const Icon = badgeIcons[b.icon] || Star;
                  
                  return (
                    <div
                      key={b.id}
                      className={`p-3 rounded-xl border transition-all text-left flex items-center gap-3 ${
                        isUnlocked
                          ? "bg-brand-secondary/20 border-brand-secondary/25 text-brand-secondary"
                          : "bg-background/40 border-border text-slate-650 opacity-40 select-none"
                      }`}
                    >
                      <div className={`p-2 rounded-lg border shrink-0 ${isUnlocked ? "bg-brand-secondary/30 border-brand-secondary/30 text-brand-secondary" : "bg-surface border-slate-850"}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      
                      <div className="min-w-0">
                        <span className="text-xs font-bold block leading-snug truncate" title={b.name}>{b.name}</span>
                        <span className="text-[10px] text-text-tertiary block leading-tight line-clamp-1" title={b.description}>{b.description}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SIMULATION STATS */}
            <div className="p-4 bg-background border border-border rounded-xl flex items-center justify-between text-center gap-4">
              <div>
                <span className="text-base font-black text-text-primary">{profile.problemsSolved}</span>
                <span className="text-[9px] font-mono text-slate-505 block uppercase mt-0.5">PROBLEMS SOLVED</span>
              </div>
              <div className="h-5 w-px bg-surface-hover" />
              <div>
                <span className="text-base font-black text-text-primary">{profile.ideasGenerated}</span>
                <span className="text-[9px] font-mono text-slate-505 block uppercase mt-0.5">IDEAS GENERATED</span>
              </div>
              <div className="h-5 w-px bg-surface-hover" />
              <div>
                <span className="text-base font-black text-text-primary">{profile.prototypesBuilt}</span>
                <span className="text-[9px] font-mono text-slate-505 block uppercase mt-0.5">PROTOTYPES BUILT</span>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 pt-4 border-t border-border flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-surface hover:bg-surface-hover text-slate-405 hover:text-text-primary rounded-xl text-xs font-bold uppercase cursor-pointer transition-colors border border-slate-805"
          >
            Close Window
          </button>
        </div>

      </div>
    </div>
  );
}
