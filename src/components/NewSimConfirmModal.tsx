import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, Download, Play, X, FileText, CheckCircle2 } from 'lucide-react';
import { UserProfile, Topic } from '../types';

interface NewSimConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onDownload: () => void;
  isDownloading: boolean;
  theme: "dark" | "light";
  profile: UserProfile | null;
  topic: Topic | null;
  currentStage: number;
}

export default function NewSimConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  onDownload,
  isDownloading,
  theme,
  profile,
  topic,
  currentStage
}: NewSimConfirmModalProps) {
  const isDark = theme === "dark";
  const recap = profile?.lastCompletedSimulation;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 select-none">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className={`absolute inset-0 backdrop-blur-sm ${
              isDark ? 'bg-slate-950/80' : 'bg-slate-900/60'
            }`}
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`relative w-full max-w-lg rounded-3xl overflow-hidden border shadow-2xl flex flex-col ${
              isDark 
                ? 'bg-slate-900 border-slate-700/50 shadow-black/50' 
                : 'bg-white border-slate-200 shadow-slate-900/20'
            }`}
          >
            {/* Header */}
            <div className={`p-6 sm:p-8 flex items-start gap-4 border-b ${
              isDark ? 'border-slate-800' : 'border-slate-100'
            }`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-100 text-amber-600'
              }`}>
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="flex-1 pt-1">
                <h3 className={`text-xl font-black tracking-tight mb-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  Start a New Design Journey?
                </h3>
                <p className={`text-sm font-medium leading-relaxed ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  You are about to begin a new Design Thinking journey. 
                  Your previous challenge, ideas, and solutions will be replaced.
                </p>
              </div>
              <button
                onClick={onClose}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shrink-0 ${
                  isDark ? 'hover:bg-slate-800 text-slate-500' : 'hover:bg-slate-100 text-slate-400'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Journey Details */}
            {(recap || topic) && (
              <div className={`p-6 sm:px-8 border-b ${isDark ? 'border-slate-800/50 bg-slate-900/50' : 'border-slate-100/50 bg-slate-50'}`}>
                <div className="flex items-center gap-2 mb-3">
                  <FileText className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                  <span className={`text-xs font-bold uppercase tracking-wider ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}>Current Journey</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex flex-col mb-1">
                    <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Status</span>
                    <span className={`text-sm font-semibold truncate ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                      {recap ? 'Completed' : `In Progress (Stage ${currentStage})`}
                    </span>
                  </div>
                  {(recap?.challenge || topic?.title) && (
                    <div className="flex flex-col">
                      <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Challenge</span>
                      <span className={`text-sm font-semibold truncate ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{recap?.challenge || topic?.title}</span>
                    </div>
                  )}
                  {recap?.prototypeSummary && (
                    <div className="flex flex-col">
                      <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Prototype</span>
                      <span className={`text-sm font-semibold truncate ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{recap.prototypeSummary}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className={`p-6 sm:p-8 flex flex-col gap-3 ${
              isDark ? 'bg-slate-900' : 'bg-white'
            }`}>
              <p className={`text-xs font-medium text-center mb-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                If you want to keep your work, download your journey report before continuing.
              </p>
              
              <button
                onClick={onDownload}
                disabled={isDownloading || !recap}
                className={`w-full py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border ${
                  !recap
                    ? (isDark ? 'bg-slate-800 border-slate-700 text-slate-500 opacity-50 cursor-not-allowed' : 'bg-slate-100 border-slate-200 text-slate-400 opacity-50 cursor-not-allowed')
                    : isDark
                      ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-white hover:border-slate-600'
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-900 hover:border-slate-300'
                } ${isDownloading ? 'opacity-50 cursor-wait' : ''}`}
              >
                {isDownloading ? (
                  <>
                    <div className="w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                    <span>Generating PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    <span>Download Journey PDF</span>
                  </>
                )}
              </button>

              <button
                onClick={onConfirm}
                className={`w-full py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${
                  isDark
                    ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-900/20'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
                }`}
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Start New Journey</span>
              </button>
              
              <button
                onClick={onClose}
                className={`w-full py-3 px-4 rounded-xl font-bold flex items-center justify-center transition-all mt-1 ${
                  isDark
                    ? 'hover:bg-slate-800 text-slate-400 hover:text-white'
                    : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
                }`}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
