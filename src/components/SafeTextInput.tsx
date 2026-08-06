import React, { useState, useEffect, useRef } from "react";
import { scanTextLocally, scanTextOnServer } from "../utils/moderation";
import { AlertCircle, HelpCircle, Sparkles } from "lucide-react";

interface SafeTextInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  type?: "input" | "textarea";
  className?: string;
  rows?: number;
  maxLength?: number;
  id?: string;
  required?: boolean;
  context?: string;
  onSafetyChange?: (safe: boolean, level: number) => void;
  disabled?: boolean;
}

export default function SafeTextInput({
  value,
  onChange,
  placeholder = "",
  type = "input",
  className = "",
  rows = 3,
  maxLength,
  id,
  required = false,
  context = "",
  onSafetyChange,
  disabled = false
}: SafeTextInputProps) {
  const [warning, setWarning] = useState<string | null>(null);
  const [safetyLevel, setSafetyLevel] = useState<number>(0);
  const serverCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Run validation effect
  useEffect(() => {
    const trimmed = value.trim();
    if (!trimmed) {
      setWarning(null);
      setSafetyLevel(0);
      if (onSafetyChange) onSafetyChange(true, 0);
      return;
    }

    // 1. Run instant local scan first (spam/excessive chars/exact dictionary hits)
    const localCheck = scanTextLocally(trimmed, context);
    if (!localCheck.safe || localCheck.level > 0) {
      setWarning(localCheck.warning || "Let's keep things respectful and constructive 👀");
      setSafetyLevel(localCheck.level);
      if (onSafetyChange) {
        onSafetyChange(localCheck.safe, localCheck.level);
      }
      // Cancel any pending server check as local check is already warning
      if (serverCheckTimeoutRef.current) {
        clearTimeout(serverCheckTimeoutRef.current);
      }
      return;
    }

    // If local check is completely green, clear warnings
    setWarning(null);
    setSafetyLevel(0);
    if (onSafetyChange) onSafetyChange(true, 0);

    // 2. Debounce deeper context-aware server verification (only if text is substantial - > 5 chars)
    if (trimmed.length > 5) {
      if (serverCheckTimeoutRef.current) {
        clearTimeout(serverCheckTimeoutRef.current);
      }

      serverCheckTimeoutRef.current = setTimeout(async () => {
        const serverCheck = await scanTextOnServer(trimmed, context);
        if (!serverCheck.safe || serverCheck.level > 0) {
          setWarning(serverCheck.warning || "Try rephrasing that so everyone can participate comfortably.");
          setSafetyLevel(serverCheck.level);
          if (onSafetyChange) {
            onSafetyChange(serverCheck.safe, serverCheck.level);
          }
        } else {
          setWarning(null);
          setSafetyLevel(0);
          if (onSafetyChange) onSafetyChange(true, 0);
        }
      }, 1200); // 1.2s typing pause debounce
    }

    return () => {
      if (serverCheckTimeoutRef.current) {
        clearTimeout(serverCheckTimeoutRef.current);
      }
    };
  }, [value, context]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Run auto-expanding height for textarea type
  useEffect(() => {
    if (type === "textarea" && textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value, type]);

  // Determine warning outline colour properties
  let outlineColorClass = "";
  if (safetyLevel === 1) {
    outlineColorClass = "border-yellow-600/40 focus:border-yellow-500/80 focus:ring-1 focus:ring-yellow-500/20";
  } else if (safetyLevel >= 2) {
    outlineColorClass = "border-red-500/50 focus:border-red-500/80 focus:ring-1 focus:ring-red-500/20 bg-red-950/5";
  }

  const effectiveMaxLength = type === "textarea" ? (maxLength && maxLength < 512 ? maxLength : 512) : (maxLength && maxLength < 126 ? maxLength : 126);
  if (type === "textarea") {
    console.log("[INPUT] Textarea limit: 512");
  } else {
    console.log("[INPUT] Text input limit: 126");
  }

  return (
    <div className="w-full space-y-1 text-left relative">
      {type === "textarea" ? (
        <textarea
          ref={textareaRef}
          id={id}
          required={required}
          maxLength={effectiveMaxLength}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          disabled={disabled}
          className={`${className} ${outlineColorClass} transition-colors duration-200 resize-none overflow-hidden`}
        />
      ) : (
        <input
          id={id}
          type="text"
          required={required}
          maxLength={effectiveMaxLength}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`${className} ${outlineColorClass} transition-colors duration-200`}
        />
      )}

      {/* Real-time gentle inline suggestions without blocking standard focus */}
      {warning && (
        <div className="flex items-start gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border text-[10px] sm:text-xs text-text-secondary font-sans leading-normal animate-in fade-in slide-in-from-top-1">
          <HelpCircle className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${safetyLevel >= 2 ? "text-brand-primary" : "text-brand-secondary"}`} />
          <div className="flex-1">
            <span className="font-semibold block text-text-primary">
              {safetyLevel >= 2 ? "💡 Friendly Suggestion:" : "✨ Let's optimize:"}
            </span>
            <p className="text-text-secondary font-medium">{warning}</p>
          </div>
        </div>
      )}
    </div>
  );
}
