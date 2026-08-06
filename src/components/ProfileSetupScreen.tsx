import React, { useState } from "react";
import { User, ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import ThemeToggle from "./ThemeToggle";
import SignOutButton from "./SignOutButton";

interface ProfileSetupScreenProps {
  theme: "dark" | "light";
  onToggleTheme: () => void;
  onSaveOnboarding: (data: {
    username: string;
    email: string;
    phone: string;
    gender: string;
    city: string;
    yearOfBirth: string;
    college: string;
    degree: string;
    yearOfStudy: string;
    primaryInterest?: string;
    careerGoal?: string;
  }) => void;
  username: string;
  email?: string;
  onSignOut?: () => void;
}

export default function ProfileSetupScreen({
  theme,
  onToggleTheme,
  onSaveOnboarding,
  username,
  email = "",
  onSignOut,
}: ProfileSetupScreenProps) {
  const [fullName, setFullName] = useState(username || "");
  const [emailInput, setEmailInput] = useState(email || "");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [city, setCity] = useState("");
  const [yearOfBirth, setYearOfBirth] = useState("");
  const [college, setCollege] = useState("");
  const [branch, setBranch] = useState("");
  const [yearOfGraduation, setYearOfGraduation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !fullName.trim() ||
      !emailInput.trim() ||
      !phone.trim() ||
      !gender.trim() ||
      !city.trim() ||
      !yearOfBirth.trim() ||
      !college.trim() ||
      !branch.trim() ||
      !yearOfGraduation.trim()
    ) {
      return;
    }
    setIsSubmitting(true);
    onSaveOnboarding({
      username: fullName.trim(),
      email: emailInput.trim(),
      phone: phone.trim(),
      gender: gender.trim(),
      city: city.trim(),
      yearOfBirth: yearOfBirth.trim(),
      college: college.trim(),
      degree: branch.trim(),
      yearOfStudy: yearOfGraduation.trim(),
    });
  };

  const isFormValid =
    fullName.trim() !== "" &&
    emailInput.trim() !== "" &&
    phone.trim() !== "" &&
    gender.trim() !== "" &&
    city.trim() !== "" &&
    yearOfBirth.trim() !== "" &&
    college.trim() !== "" &&
    branch.trim() !== "" &&
    yearOfGraduation.trim() !== "";

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
            <span className="text-sm font-bold tracking-tight text-text-primary uppercase italic">DT INNOVATION PORTAL</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          {onSignOut && (
            <SignOutButton onSignOut={onSignOut} />
          )}
        </div>
      </div>

      {/* Profile Setup Onboarding Form */}
      <div className="w-full max-w-3xl mx-auto z-10 px-4 my-auto">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="glass-panel rounded-2xl overflow-hidden p-8 border-border text-left bg-background/95 backdrop-blur-xl shadow-2xl relative"
        >
          {/* Header Area */}
          <div className="flex items-center gap-4 mb-8 border-b border-border/80 pb-5">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-brand-primary/25 flex items-center justify-center text-amber-505 shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary tracking-tight">
                Your Profile
              </h1>
              <p className="text-xs text-text-secondary mt-0.5">
                Auto-saves to your account in real time.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Row 1: Full Name & Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-305 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  maxLength={126}
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-[#0b0f19] border border-border hover:border-border-subtle/80 focus:border-brand-secondary/50 text-text-primary text-sm px-4 py-3 rounded-xl focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-305 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  maxLength={126}
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full bg-[#0b0f19] border border-border hover:border-border-subtle/80 focus:border-brand-secondary/50 text-text-primary text-sm px-4 py-3 rounded-xl focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Row 2: Phone & Gender */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-305 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  maxLength={126}
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#0b0f19] border border-border hover:border-border-subtle/80 focus:border-brand-secondary/50 text-text-primary text-sm px-4 py-3 rounded-xl focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-305 mb-2">
                  Gender
                </label>
                <input
                  type="text"
                  maxLength={126}
                  required
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full bg-[#0b0f19] border border-border hover:border-border-subtle/80 focus:border-brand-secondary/50 text-text-primary text-sm px-4 py-3 rounded-xl focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Row 3: City & Year of Birth */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-305 mb-2">
                  City
                </label>
                <input
                  type="text"
                  maxLength={126}
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-[#0b0f19] border border-border hover:border-border-subtle/80 focus:border-brand-secondary/50 text-text-primary text-sm px-4 py-3 rounded-xl focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-305 mb-2">
                  Year of Birth
                </label>
                <input
                  type="text"
                  maxLength={126}
                  required
                  value={yearOfBirth}
                  onChange={(e) => setYearOfBirth(e.target.value)}
                  className="w-full bg-[#0b0f19] border border-border hover:border-border-subtle/80 focus:border-brand-secondary/50 text-text-primary text-sm px-4 py-3 rounded-xl focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Row 4: College & Branch */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-305 mb-2">
                  College
                </label>
                <input
                  type="text"
                  maxLength={126}
                  required
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  className="w-full bg-[#0b0f19] border border-border hover:border-border-subtle/80 focus:border-brand-secondary/50 text-text-primary text-sm px-4 py-3 rounded-xl focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-305 mb-2">
                  Branch
                </label>
                <input
                  type="text"
                  maxLength={126}
                  required
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full bg-[#0b0f19] border border-border hover:border-border-subtle/80 focus:border-brand-secondary/50 text-text-primary text-sm px-4 py-3 rounded-xl focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Row 5: Year of Graduation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-305 mb-2">
                  Year of Graduation
                </label>
                <input
                  type="text"
                  maxLength={126}
                  required
                  value={yearOfGraduation}
                  onChange={(e) => setYearOfGraduation(e.target.value)}
                  className="w-full bg-[#0b0f19] border border-border hover:border-border-subtle/80 focus:border-brand-secondary/50 text-text-primary text-sm px-4 py-3 rounded-xl focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-border flex justify-end">
              <button
                id="submit-onboarding-btn"
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className="px-8 py-3.5 bg-brand-primary hover:bg-brand-primary-hover disabled:bg-surface-hover text-text-primary font-extrabold uppercase tracking-widest rounded-full text-xs shadow-[0_8px_24px_rgba(37,99,235,0.25)] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>Saving Profile...</>
                ) : (
                  <>
                    Confirm & Complete <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>

      {/* Small Footer */}
      <div className="w-full text-center z-10 font-mono text-[9px] text-slate-650 tracking-widest uppercase">
        © 2026 ZUPSKILL FUTURE REDESIGN PORTAL
      </div>
    </div>
  );
}
