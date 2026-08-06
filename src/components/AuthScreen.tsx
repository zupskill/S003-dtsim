import React from "react";
import { Sparkles, CheckCircle } from "lucide-react";
import { motion } from "motion/react";
import ThemeToggle from "./ThemeToggle";

interface AuthScreenProps {
  theme: "dark" | "light";
  onToggleTheme: () => void;
  onSignInWithGoogle: () => void;
}

export default function AuthScreen({
  theme,
  onToggleTheme,
  onSignInWithGoogle,
}: AuthScreenProps) {
  return (
    <div className="min-h-screen cyber-grid flex flex-col justify-between py-12 px-6 relative overflow-hidden select-none">
      
      {/* Decorative Glow Elements */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-brand-secondary/10 blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-purple-500/10 blur-[130px] pointer-events-none" />
      
      {/* Header Logotype */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-brand-secondary to-brand-secondary/80 rounded-lg flex items-center justify-center font-black text-black text-lg shadow-[0_0_15px_rgba(6,182,212,0.4)]">
            ZS
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-text-primary uppercase italic">DT INNOVATION LAB</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
      </div>

      {/* Main card */}
      <div className="w-full max-w-md mx-auto z-10 px-4 my-auto">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="glass-panel rounded-2xl glow-cyan overflow-hidden p-8 border-brand-secondary/25 text-left bg-background/85 backdrop-blur-lg relative"
        >
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none -mr-8 -mt-8 bg-brand-secondary/10" />

          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-2 px-3 py-1 border border-brand-secondary/30 rounded-full text-brand-secondary text-xs font-semibold mb-4 uppercase tracking-wider bg-brand-secondary/20">
              <Sparkles className="w-3.5 h-3.5 text-brand-secondary animate-pulse" /> GATEWAY PORTAL
            </span>
            <h2 id="auth-title" className="text-3xl font-black text-text-primary leading-tight mb-3">
              DT Innovation Lab 🚀
            </h2>
            <p className="text-slate-405 text-sm font-medium leading-relaxed max-w-sm mx-auto">
              Learn how to solve real-world problems, earn achievements, and build your innovation portfolio.
            </p>
          </div>

          {/* Benefits Bullet Points */}
          <div className="space-y-3.5 bg-surface/60 border border-border/80 rounded-2xl p-5 mb-8">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-4.5 h-4.5 text-brand-secondary shrink-0 mt-0.5" />
              <span className="text-xs font-bold text-text-secondary">Save your progress</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-4.5 h-4.5 text-brand-secondary shrink-0 mt-0.5" />
              <span className="text-xs font-bold text-text-secondary">Earn XP and achievements</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-4.5 h-4.5 text-brand-secondary shrink-0 mt-0.5" />
              <span className="text-xs font-bold text-text-secondary">Access your design history</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-4.5 h-4.5 text-brand-secondary shrink-0 mt-0.5" />
              <span className="text-xs font-bold text-text-secondary">Continue from any device</span>
            </div>
          </div>

          <motion.button
            id="google-signin-btn"
            onClick={onSignInWithGoogle}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="w-full relative group overflow-hidden rounded-full py-4 px-6 bg-brand-primary text-text-primary font-black uppercase tracking-widest text-xs cursor-pointer shadow-[0_0_20px_rgba(37,99,235,0.25)] transition-all duration-300 hover:shadow-[0_0_35px_rgba(37,99,235,0.5)] flex items-center justify-center gap-3"
          >
            {/* Shimmer effect */}
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />
            
            <div className="flex items-center justify-center gap-2.5 z-10">
              <span className="w-5 h-5 rounded-full bg-background flex items-center justify-center text-blue-600 font-black text-[11px] font-mono select-none transition-colors duration-300 shadow-inner">
                G
              </span>
              <span className="tracking-[0.15em] text-text-primary">
                Continue with Google
              </span>
            </div>
          </motion.button>

        </motion.div>
      </div>

      {/* Small Footer */}
      <div className="w-full text-center z-10 font-mono text-[9px] text-text-tertiary tracking-widest uppercase">
        SECURE CLOUD CREDENTIALS SYNCED VIA SUPABASE
      </div>
    </div>
  );
}
