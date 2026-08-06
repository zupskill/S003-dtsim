import React, { useState } from "react";
import { MoveRight, Zap, Target, Award, Compass } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SimulationIntroProps {
  onComplete: () => void;
}

export default function SimulationIntro({ onComplete }: SimulationIntroProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);

  const steps = [
    {
      title: "Welcome to ZupSkill's Creator Lab",
      highlight: "Let's turn your ideas into action! ✨",
      description: "No boring textbooks here! You're about to solve a real-world problem using design thinking. Learn what real people struggle with, sketch a cool solution, and see how our friendly AI reviews it.",
      icon: Compass,
      color: "text-brand-primary",
      accent: "from-brand-primary/20 to-brand-primary/80/10",
    },
    {
      title: "The 5 Simple Steps of Design Thinking",
      highlight: "Empathize → Define → Ideate → Prototype → Test",
      description: "Understand the problem. Explore ideas. Build a solution. Improve it.",
      icon: Target,
      color: "text-purple-400",
      accent: "from-purple-500/20 to-pink-500/10",
    },
    {
      title: "Level up & Get badged!",
      highlight: "Earn XP and unlock achievements",
      description: "At the end, our AI helper will review your design, and you can share it with friends on our campus social board. Gain XP, climb the rankings, and show off your unlocked badges!",
      icon: Award,
      color: "text-orange-400",
      accent: "from-orange-500/20 to-yellow-500/10",
    }
  ];

  const cardVariants = {
    initial: {
      opacity: 0,
      scale: 1.04,
      filter: "blur(2px)",
    },
    animate: {
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
      transition: {
        duration: 0.4,
        ease: "easeInOut",
      }
    },
    exit: {
      opacity: 0,
      scale: 0.96,
      filter: "blur(2px)",
      transition: {
        duration: 0.3,
        ease: "easeInOut",
      }
    }
  };

  const handleStart = () => {
    setIsCompleting(true);
    setTimeout(() => {
      onComplete();
    }, 1000);
  };

  const currentStep = steps[activeStep] || steps[0];

  return (
    <div className="min-h-screen cyber-grid flex items-center justify-center py-12 px-4 relative">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(0,181,230,0.07),transparent_70%)]" />

      {/* Stable outer wrapper layout slot of exact dimensions that stays perfectly still */}
      <div className="max-w-xl w-full h-[500px] relative z-10">
        <AnimatePresence mode="wait" initial={false}>
          {!isCompleting ? (
            <motion.div
              key={`onboarding-card-${activeStep}`}
              variants={cardVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="absolute inset-0 w-full h-full glass-panel rounded-2xl glow-cyan p-8 text-center flex flex-col justify-between overflow-hidden select-none border border-border-subtle bg-background/85 shadow-[0_0_20px_rgba(0,181,230,0.15)]"
            >
              <div className="flex flex-col flex-1 justify-start">
                {/* Progress Dots inside the stable card layout */}
                <div className="flex justify-center gap-2 mb-6 shrink-0">
                  {steps.map((_, i) => (
                    <div
                      key={i}
                      className="h-1.5 rounded-full transition-all duration-300 ease-in-out"
                      style={{
                        width: i === activeStep ? "32px" : "8px",
                        backgroundColor: i === activeStep ? "#00b5e6" : "#1e293b",
                      }}
                    />
                  ))}
                </div>

                {/* Animated Step Core Info with fixed height centered slot */}
                <div className="h-[270px] w-full flex items-center justify-center relative select-none">
                  <div className="w-full flex flex-col items-center justify-center">
                    {/* Step Icon */}
                    <div className="mx-auto w-16 h-16 rounded-full bg-surface border border-border-subtle/60 flex items-center justify-center mb-5 shrink-0 shadow-[0_0_15px_rgba(0,181,230,0.15)]">
                      {React.createElement(currentStep.icon, {
                        className: `w-8 h-8 ${currentStep.color} animate-pulse`,
                      })}
                    </div>

                    {/* Step Content */}
                    <span className="text-xs font-bold tracking-[0.2em] uppercase text-brand-primary mb-1 block shrink-0">
                      {currentStep.title}
                    </span>
                    <h3 className="text-xl md:text-2xl font-black text-text-primary mb-3 leading-tight shrink-0">
                      {currentStep.highlight}
                    </h3>
                    <p className="text-text-secondary text-sm md:text-base leading-relaxed max-w-sm shrink-0">
                      {currentStep.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Navigation Action Area - Locked securely in same position */}
              <div className="shrink-0 mt-auto">
                <div className="flex justify-center mb-5 h-[48px] items-center">
                  {activeStep < steps.length - 1 ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.12, ease: "easeInOut" }}
                      onClick={() => setActiveStep(activeStep + 1)}
                      className="px-6 py-2.5 bg-surface hover:text-text-primary text-text-secondary font-bold uppercase tracking-widest text-xs rounded-full border border-border-subtle flex items-center gap-2 shadow-sm select-none cursor-pointer"
                    >
                      Next Step 👀 <MoveRight className="w-4 h-4" />
                    </motion.button>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.12, ease: "easeInOut" }}
                      onClick={handleStart}
                      className="px-8 py-3.5 bg-gradient-to-r from-brand-primary to-brand-primary/80 hover:from-brand-primary hover:to-brand-primary/80 text-black font-extrabold uppercase tracking-widest text-xs rounded-full shadow-[0_0_20px_rgba(0,181,230,0.3)] flex items-center gap-2 select-none cursor-pointer"
                    >
                      Let's Start! 🚀 <Zap className="w-4 h-4" />
                    </motion.button>
                  )}
                </div>

                <div className="text-[11px] text-text-tertiary font-mono tracking-wider font-semibold">
                  Brought to you by ZupSkill ❤️
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="completing-transition-card"
              initial={{ opacity: 0, scale: 0.97, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.45, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full glass-panel rounded-2xl glow-cyan p-8 text-center flex flex-col items-center justify-center overflow-hidden select-none"
            >
              <motion.div
                animate={{
                  filter: [
                    "drop-shadow(0 0 2px rgba(0, 181, 230, 0))",
                    "drop-shadow(0 0 25px rgba(0, 181, 230, 0.95))",
                    "drop-shadow(0 0 8px rgba(0, 181, 230, 0.3))"
                  ],
                  scale: [0.98, 1.04, 1],
                }}
                transition={{
                  duration: 0.75,
                  ease: "easeInOut",
                  times: [0, 0.5, 1],
                }}
                className="flex flex-col items-center"
              >
                <div className="w-16 h-16 rounded-full bg-surface border-2 border-brand-primary flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(0,181,230,0.3)]">
                  <Zap className="w-9 h-9 text-brand-primary fill-brand-primary/20" />
                </div>
                <h2 className="text-2xl font-black tracking-[0.25em] text-text-primary uppercase bg-clip-text bg-gradient-to-r from-brand-primary to-brand-primary/80">
                  ZupSkill
                </h2>
                <p className="text-[10px] text-brand-primary/80 font-mono tracking-[0.4em] uppercase mt-2">
                  Creator Lab
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
