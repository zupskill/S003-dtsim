import React, { useState } from "react";
import { Play, Users, Rocket, Sparkles, Brain, CheckCircle, X, LogIn, LogOut, GraduationCap, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ThemeToggle from "./ThemeToggle";
import SignOutButton from "./SignOutButton";
import { UserProfile } from "../types";

interface LandingScreenProps {
  onStart: () => void;
  onResume?: () => void;
  onNewStart?: () => void;
  hasActiveSession?: boolean;
  onExploreCommunity: () => void;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  user: any;
  profile: UserProfile | null;
  onSignInWithGoogle: () => void;
  onSignOut: () => void;
}

export default function LandingScreen({ 
  onStart, 
  onResume,
  onNewStart,
  hasActiveSession = false,
  onExploreCommunity, 
  theme, 
  onToggleTheme,
  user,
  profile,
  onSignInWithGoogle,
  onSignOut
}: LandingScreenProps) {
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const handleStart = () => {
    setIsStarting(true);
    setTimeout(() => {
      onStart();
    }, 500); // 500ms transition delay
  };

  const handleResume = () => {
    if (!onResume) return;
    setIsStarting(true);
    setTimeout(() => {
      onResume();
    }, 500);
  };

  const handleNewStart = () => {
    if (!onNewStart) return;
    setIsStarting(true);
    setTimeout(() => {
      onNewStart();
    }, 500);
  };

  return (
    <div className="min-h-screen cyber-grid flex flex-col justify-between py-12 px-6 relative overflow-hidden">
      
      {/* Decorative Glow Elements */}
      <motion.div 
        animate={isStarting ? { scale: 1.4, opacity: 0.1, filter: "blur(150px)" } : { scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-brand-primary/10 blur-[120px] pointer-events-none animate-pulse" 
      />
      <motion.div 
        animate={isStarting ? { scale: 1.5, opacity: 0.05, filter: "blur(150px)" } : { scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-purple-500/10 blur-[130px] pointer-events-none" 
      />

      {/* Central creative studio/lab glow bloom/atmosphere behind hero section */}
      <motion.div 
        animate={isStarting ? { scale: 1.3, opacity: 0 } : { scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-indigo-150/20 dark:bg-brand-primary/10 blur-[130px] pointer-events-none -z-10" 
      />

      {/* Subtle Studio Accents */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
        <motion.div 
          animate={isStarting ? { scale: 1.2, opacity: 0 } : { scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="absolute top-10 left-[8%] w-[500px] h-[500px] rounded-full bg-brand-primary/15 dark:bg-brand-primary/5 blur-[130px] pointer-events-none" 
        />
        <motion.div 
          animate={isStarting ? { scale: 1.2, opacity: 0 } : { scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="absolute bottom-20 right-[8%] w-[600px] h-[600px] rounded-full bg-purple-200/15 dark:bg-purple-500/5 blur-[150px] pointer-events-none" 
        />
      </div>

      {/* Header Logotype */}
      <motion.div 
        animate={isStarting ? { opacity: 0, y: -20 } : { opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-5xl mx-auto flex items-center justify-between z-10"
      >
        <div className="flex items-center shrink-0">
          <img 
            src="/zupskill-logo.png" 
            alt="ZupSkill" 
            className="h-8 sm:h-10 w-auto object-contain" 
          />
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          
          {user && profile ? (
            <>
              <div className="flex items-center gap-2.5 bg-surface border border-border rounded-xl px-3.5 py-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.3)] animate-in fade-in duration-200">
                {profile.photoURL ? (
                  <img referrerPolicy="no-referrer" src={profile.photoURL} alt={profile.username} className="w-6.5 h-6.5 rounded-full border border-brand-primary/40 shrink-0" />
                ) : (
                  <div className="w-6.5 h-6.5 rounded-full bg-gradient-to-tr from-brand-primary to-brand-primary/80 flex items-center justify-center text-[10px] text-black font-black font-mono shrink-0">
                    {profile.username?.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="text-left leading-tight">
                  <span className="text-xs font-bold text-text-primary block line-clamp-1">{profile.username}</span>
                  <span className="text-[9px] font-mono font-semibold text-brand-primary uppercase tracking-widest">{profile.level}</span>
                </div>
              </div>
              <SignOutButton onSignOut={onSignOut} />
            </>
          ) : (
            <span className="hidden sm:flex text-xs bg-surface-hover text-text-secondary border border-border-subtle px-3 py-1 rounded-full items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span> SYSTEM: ONLINE
            </span>
          )}
        </div>
      </motion.div>

      {/* Main Container Switch */}
      <AnimatePresence mode="wait">
          {/* STANDARD ADVANCED HERO AND SIGN IN SWITCH */}
          <motion.div 
            key="hero"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-4xl mx-auto text-center my-auto z-10 px-4"
          >
            <motion.div
              animate={{
                y: [0, -4, 0],
                rotate: [-0.3, 0.3, -0.3],
                borderColor: [
                  "rgba(0,181,230,0.25)",
                  "rgba(0,181,230,0.6)",
                  "rgba(0,181,230,0.25)"
                ],
                boxShadow: [
                  "0 0 10px rgba(0,181,230,0.04)",
                  "0 0 20px rgba(0,181,230,0.2)",
                  "0 0 10px rgba(0,181,230,0.04)"
                ],
                backgroundColor: [
                  "rgba(0,181,230,0.08)",
                  "rgba(0,181,230,0.16)",
                  "rgba(0,181,230,0.08)"
                ]
              }}
              transition={{
                duration: 5.4,
                ease: "easeInOut",
                repeat: Infinity
              }}
              className="inline-flex items-center gap-2 px-3 py-1 border rounded-full text-brand-primary text-xs font-semibold mb-6 uppercase tracking-wider select-none cursor-default backdrop-blur-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-primary" /> DT INNOVATION LAB
            </motion.div>

            <h2 className="font-extrabold tracking-tight text-text-primary leading-none mb-6" style={{ fontSize: "clamp(2.25rem, 5vw, 3.75rem)" }}>
              Most people notice problems.<br />
              <span className="bg-gradient-to-r from-brand-primary via-sky-500 to-brand-primary/80 dark:from-brand-primary dark:via-sky-400 dark:to-brand-primary/80 text-transparent bg-clip-text">
                Let's learn how to solve them.
              </span>
            </h2>

            <p className="text-text-secondary text-lg md:text-xl max-w-2xl mx-auto mb-10 font-normal leading-relaxed">
              Welcome to the <span className="text-text-primary font-medium">DT Innovation Lab 👀</span>. 
              Unleash your creativity, solve real-world struggles with friendly AI assistance, and level up your problem-solving game today!
            </p>

            {/* Dynamic Launch Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-lg mx-auto">
              {!user ? (
                /* GUEST LOGIN GATEWAY */
                <button
                  id="google-signin-btn"
                  onClick={onSignInWithGoogle}
                  className="w-full sm:w-auto px-8 py-4 bg-brand-primary hover:bg-brand-primary-hover text-text-primary text-sm md:text-base font-extrabold uppercase tracking-widest rounded-full transition-all duration-300 transform hover:scale-105 shadow-[0_10px_30px_rgba(0,181,230,0.25)] flex items-center justify-center gap-3 cursor-pointer"
                >
                  <span className="w-6 h-6 rounded-full bg-background flex items-center justify-center text-blue-600 font-black text-xs font-mono select-none">G</span>
                  Continue with Google
                </button>
              ) : (
                /* AUTHENTICATED PILOT DRIVERS */
                <>
                  {hasActiveSession ? (
                    <>
                      <button
                        id="resume-simulation-btn"
                        onClick={handleResume}
                        className="w-full sm:w-auto px-8 py-4 bg-brand-primary hover:bg-brand-primary-hover text-black text-sm md:text-base font-extrabold uppercase tracking-widest rounded-full transition-all duration-300 transform hover:scale-105 shadow-[0_10px_30px_rgba(0,181,230,0.3)] hover:shadow-[0_15px_35px_rgba(0,181,230,0.5)] flex items-center justify-center gap-2 cursor-pointer"
                      >
                        Resume Simulation <Rocket className="w-5 h-5" />
                      </button>
                      <button
                        id="start-new-simulation-btn"
                        onClick={handleNewStart}
                        className="w-full sm:w-auto px-6 py-4 bg-surface-hover hover:bg-slate-150 active:bg-slate-200 dark:bg-surface-hover/80 dark:hover:bg-slate-700 text-slate-800 hover:text-slate-950 dark:text-text-primary dark:hover:text-text-primary border border-rose-500/30 hover:border-rose-500/60 text-xs font-bold uppercase tracking-widest rounded-full transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        Restart New
                      </button>
                    </>
                  ) : (
                    <button
                      id="start-simulation-btn"
                      onClick={handleStart}
                      className="w-full sm:w-auto px-8 py-4 bg-brand-primary hover:bg-brand-primary-hover text-black text-base font-bold uppercase tracking-widest rounded-full transition-all duration-300 transform hover:scale-105 shadow-[0_10px_30px_rgba(0,181,230,0.3)] hover:shadow-[0_15px_35px_rgba(0,181,230,0.5)] flex items-center justify-center gap-2 cursor-pointer"
                    >
                      Start Simulation <Rocket className="w-5 h-5" />
                    </button>
                  )}
                </>
              )}
              
              <button
                onClick={onExploreCommunity}
                className="w-full sm:w-auto px-6 py-4 bg-surface-hover hover:bg-slate-150 active:bg-slate-200 dark:bg-surface-hover/80 dark:hover:bg-slate-700 text-slate-850 hover:text-slate-950 dark:text-text-primary dark:hover:text-text-primary border border-slate-300 dark:border-border-subtle hover:border-slate-400 dark:hover:border-slate-650 text-sm font-bold uppercase tracking-widest rounded-full shadow-[0_4px_12px_rgba(15,23,42,0.04)] dark:shadow-none transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Users className="w-4.5 h-4.5" /> Explore Community
              </button>

              <button
                onClick={() => setShowDemoModal(true)}
                className="w-full sm:w-auto px-6 py-3 text-text-tertiary dark:text-text-secondary hover:text-slate-900 dark:hover:text-text-primary text-xs font-bold uppercase tracking-widest transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" /> Watch Demo
              </button>
            </div>
          </motion.div>
      </AnimatePresence>

      {/* DEMO MODAL */}
      {showDemoModal && (
        <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center px-4 pt-[68px] pb-4 sm:p-4 bg-background/80 backdrop-blur-sm transition-opacity">
          <div className="bg-surface border border-border rounded-2xl w-[95%] sm:w-full max-w-[420px] sm:max-w-3xl max-h-[calc(100vh-84px)] sm:max-h-[90vh] shadow-2xl animate-in fade-in zoom-in-95 duration-300 flex flex-col relative overflow-hidden">
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-border flex flex-col items-center text-center relative shrink-0">
              <button 
                onClick={() => setShowDemoModal(false)}
                className="absolute top-2 sm:top-4 right-2 sm:right-4 p-2 text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-full transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 text-brand-primary font-semibold uppercase tracking-wider text-xs sm:text-sm mb-1 sm:mb-2">
                <span>🎬</span> Demo
              </div>
              <h2 className="text-xl sm:text-3xl font-bold text-text-primary mb-1 sm:mb-2">DT Innovation Lab Demo</h2>
              <p className="text-xs sm:text-sm text-text-secondary hidden sm:block">Watch this short demo to understand how the DT Innovation Lab works before starting your Design Thinking journey.</p>
            </div>

            {/* Video Container */}
            <div className="w-full aspect-video bg-black relative shrink-0">
              <iframe
                src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                title="DT Innovation Lab Demo"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full border-0"
              ></iframe>
            </div>

            {/* Learning Summary */}
            <div className="p-4 sm:p-6 bg-surface-hover/50 flex-1 overflow-y-auto">
              <h3 className="text-sm sm:text-lg font-medium text-text-primary mb-2 sm:mb-3">In this demo you'll discover:</h3>
              <ul className="space-y-1.5 sm:space-y-2">
                <li className="flex items-start gap-2 text-xs sm:text-sm text-text-secondary">
                  <span className="text-brand-primary mt-0.5 sm:mt-1">•</span>
                  <span>How the Design Thinking simulation works</span>
                </li>
                <li className="flex items-start gap-2 text-xs sm:text-sm text-text-secondary">
                  <span className="text-brand-primary mt-0.5 sm:mt-1">•</span>
                  <span>What each stage teaches</span>
                </li>
                <li className="flex items-start gap-2 text-xs sm:text-sm text-text-secondary">
                  <span className="text-brand-primary mt-0.5 sm:mt-1">•</span>
                  <span>How your ideas evolve into solutions</span>
                </li>
                <li className="flex items-start gap-2 text-xs sm:text-sm text-text-secondary">
                  <span className="text-brand-primary mt-0.5 sm:mt-1">•</span>
                  <span>How achievements and XP are earned</span>
                </li>
              </ul>
            </div>

            {/* Footer actions */}
            <div className="p-4 sm:p-6 border-t border-border bg-surface flex flex-col gap-3 sm:gap-4 shrink-0">
              <div className="flex items-center justify-end gap-3 flex-col sm:flex-row">
                <button
                  onClick={() => setShowDemoModal(false)}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-medium text-text-secondary hover:bg-surface-hover transition-colors order-2 sm:order-1"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowDemoModal(false);
                    if (user) {
                      handleStart();
                    } else {
                      onSignInWithGoogle();
                    }
                  }}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-medium text-text-primary bg-brand-primary hover:bg-brand-primary-hover transition-colors flex items-center justify-center gap-2 order-1 sm:order-2"
                >
                  Start Simulation
                  <Play className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
