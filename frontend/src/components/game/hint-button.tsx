'use client';

import React, { useState } from 'react';
import { Lightbulb } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';

interface HintButtonProps {
  hintUsed: boolean;
  hint: string | null;
  loading: boolean;
  onRequestHint: () => void;
}

export function HintButton({ hintUsed, hint, loading, onRequestHint }: HintButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  // If hint has already been received and is displayed
  if (hint) {
    return (
      <div className="border border-accent/40 bg-accent/5 rounded p-3 space-y-1">
        <div className="flex items-center gap-1.5">
          <Lightbulb size={12} className="text-accent shrink-0" />
          <span className="text-accent text-xs font-mono tracking-widest uppercase">Hint</span>
        </div>
        <p className="text-foreground text-sm font-serif italic leading-relaxed">{hint}</p>
      </div>
    );
  }

  // Hint already used but no text in state (page reload edge case)
  if (hintUsed) {
    return (
      <div className="border border-border rounded p-3">
        <p className="text-muted text-xs font-mono italic">Hint already used this session.</p>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted text-xs font-mono p-2">
        <Spinner size="sm" />
        <span>Consulting case files...</span>
      </div>
    );
  }

  // Confirm prompt
  if (showConfirm) {
    return (
      <div className="border border-amber-800/50 bg-amber-950/20 rounded p-3 space-y-2">
        <p className="text-amber-400 text-xs font-mono leading-relaxed">
          You only get one hint. Use it wisely. Are you sure?
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setShowConfirm(false);
              onRequestHint();
            }}
            className="text-xs font-mono bg-accent text-background px-3 py-1.5 rounded uppercase tracking-widest hover:bg-accent-hover transition-colors"
          >
            Yes, reveal
          </button>
          <button
            onClick={() => setShowConfirm(false)}
            className="text-xs font-mono border border-border text-muted px-3 py-1.5 rounded uppercase tracking-widest hover:text-foreground hover:border-accent/50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Default state — show request button
  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="w-full flex items-center gap-2 text-muted hover:text-amber-400 border border-border hover:border-amber-800/60 rounded p-2.5 transition-all text-xs font-mono uppercase tracking-widest"
    >
      <Lightbulb size={13} />
      Request Hint (one-time only)
    </button>
  );
}
