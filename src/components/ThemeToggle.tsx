import React from "react";
import { Moon, Sun } from "lucide-react";
import { motion } from "motion/react";

interface ThemeToggleProps {
  theme: "dark" | "light";
  onToggle: () => void;
}

export default function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const isDark = theme === "dark";

  return (
    <div 
      className="flex items-center gap-2 select-none md:gap-3 transition-transform duration-200 hover:scale-[1.02] cursor-pointer"
      onClick={onToggle}
    >
      {/* Dark Indicator */}
      <span 
        className={`text-[10px] sm:text-xs font-mono font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-1 ${
          isDark ? "text-brand-primary scale-100" : "text-text-tertiary opacity-60 scale-95"
        }`}
      >
        🌙 <span className="hidden xs:inline">Dark</span>
      </span>

      {/* Switch Background Container */}
      <div
        className={`relative w-14 h-7 rounded-full border p-1 transition-all duration-300 flex items-center justify-between ${
          isDark 
            ? "bg-background border-brand-primary/20 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]" 
            : "bg-background border-brand-primary/20 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]"
        }`}
      >
        {/* Background icons inside the slider track */}
        <div className="absolute inset-0 flex items-center justify-between px-1.5 pointer-events-none opacity-30">
          <Moon className={`w-2.5 h-2.5 ${isDark ? "text-brand-primary" : "text-text-secondary"}`} />
          <Sun className={`w-2.5 h-2.5 ${isDark ? "text-text-secondary" : "text-brand-secondary"}`} />
        </div>

        {/* Animated Sliding Knob */}
        <motion.div
          className={`w-5 h-5 rounded-full z-10 flex items-center justify-center transition-shadow duration-300 ${
            isDark 
              ? "bg-brand-secondary shadow-[0_0_12px_rgba(0,181,230,0.7)] text-slate-955" 
              : "bg-brand-primary shadow-[0_0_12px_rgba(79,70,229,0.5)] text-text-primary"
          }`}
          animate={{
            x: isDark ? 0 : 26, 
          }}
          transition={{
            type: "spring",
            stiffness: 350,
            damping: 25,
          }}
        >
          {isDark ? (
            <Moon className="w-2.5 h-2.5 text-slate-955 stroke-[2.5]" />
          ) : (
            <Sun className="w-2.5 h-2.5 text-text-primary stroke-[2.5]" />
          )}
        </motion.div>
      </div>

      {/* Light Indicator */}
      <span 
        className={`text-[10px] sm:text-xs font-mono font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-1 ${
          !isDark ? "text-brand-primary scale-100 font-extrabold" : "text-slate-650 opacity-60 scale-95"
        }`}
      >
        <span className="hidden xs:inline">Light</span> ☀️
      </span>
    </div>
  );
}
