import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { LogOut } from "lucide-react";

interface SignOutButtonProps {
  onSignOut: () => void;
  className?: string;
}

export default function SignOutButton({ onSignOut, className = "" }: SignOutButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (showConfirm) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [showConfirm]);

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        title="Sign Out"
        className={`bg-surface/60 backdrop-blur hover:bg-surface-hover border border-border rounded-xl px-2 sm:px-3 py-1.5 flex items-center justify-center gap-2 transition-all hover:border-brand-primary/20 hover:shadow-[0_0_10px_rgba(0,181,230,0.1)] group shrink-0 ${className}`}
      >
        <LogOut className="w-4 h-4 text-text-secondary group-hover:text-brand-primary transition-colors" />
        <span className="hidden sm:inline text-[10px] sm:text-xs font-bold text-text-secondary group-hover:text-brand-primary transition-colors">Sign Out</span>
      </button>

      {showConfirm && createPortal(
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden relative z-[9999]">
            <div className="p-6">
              <h3 className="text-xl font-bold text-text-primary mb-2">Sign Out?</h3>
              <p className="text-sm text-text-secondary mb-6">
                Are you sure you want to sign out?
                <br /><br />
                Your progress and completed simulations have already been saved.
              </p>
              
              <div className="flex items-center gap-3 w-full">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-surface-hover/50 hover:bg-surface-hover text-sm font-bold text-text-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowConfirm(false);
                    onSignOut();
                  }}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-brand-primary hover:bg-brand-primary text-sm font-bold text-text-primary transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
