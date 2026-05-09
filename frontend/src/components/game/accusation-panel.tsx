'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import type { Suspect } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

interface AccusationPanelProps {
  suspects: Suspect[];
  onAccuse: (suspectId: string) => void;
  loading: boolean;
  onCancel: () => void;
}

// ── Analysis steps shown while waiting for verdict ───────────────────────────
const ANALYSIS_STEPS = [
  'Comparing alibis against physical evidence',
  'Evaluating interrogation contradictions',
  'Matching motive to suspect profile',
  'Rendering final verdict...',
];

function AnalysisScreen() {
  return (
    <div
      className="relative flex flex-col gap-6 p-2 overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse at center, rgba(155,34,38,0.08) 0%, transparent 60%)',
      }}
    >
      {/* Pulsing crimson dot — top-right */}
      <motion.span
        className="absolute top-1 right-1 w-2 h-2 rounded-full"
        style={{ background: '#9b2226' }}
        animate={{ opacity: [1, 0.2, 1], scale: [1, 1.3, 1] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Title block */}
      <div className="flex flex-col gap-1 pr-6">
        <motion.p
          className="font-mono text-sm tracking-[0.3em] uppercase text-danger"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          CROSS-REFERENCING EVIDENCE
        </motion.p>
        <motion.p
          className="font-serif italic text-foreground/60 text-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.4 }}
        >
          Analyzing interrogation transcripts...
        </motion.p>
      </div>

      {/* Scanning line */}
      <motion.div
        className="relative w-full overflow-hidden"
        style={{ height: 1 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <motion.div
          className="absolute inset-y-0 w-full"
          style={{
            background:
              'linear-gradient(to right, transparent 0%, rgba(155,34,38,0.6) 40%, rgba(220,38,38,0.9) 50%, rgba(155,34,38,0.6) 60%, transparent 100%)',
          }}
          animate={{ x: ['-110%', '110%'] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'linear', delay: 0.5 }}
        />
      </motion.div>

      {/* Analysis steps */}
      <div className="flex flex-col gap-3.5">
        {ANALYSIS_STEPS.map((step, i) => (
          <motion.div
            key={step}
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + i * 0.5, duration: 0.35, ease: 'easeOut' }}
          >
            {/* Checkmark circle — fills in 0.8s after the step text appears */}
            <motion.div
              className="relative w-4 h-4 shrink-0 flex items-center justify-center"
              initial={false}
            >
              {/* Background circle */}
              <motion.div
                className="absolute inset-0 rounded-full border border-foreground/20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 + i * 0.5, duration: 0.2 }}
              />
              {/* Filled green circle that clips in */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ background: 'rgba(34,197,94,0.85)' }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  delay: 0.4 + i * 0.5 + 0.8,
                  duration: 0.25,
                  ease: [0.34, 1.56, 0.64, 1],
                }}
              />
              {/* Check mark */}
              <motion.svg
                viewBox="0 0 10 8"
                className="relative z-10 w-2.5 h-2"
                fill="none"
                stroke="white"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{
                  delay: 0.4 + i * 0.5 + 0.9,
                  duration: 0.3,
                  ease: 'easeOut',
                }}
              >
                <motion.path d="M1 4 L3.5 6.5 L9 1" />
              </motion.svg>
            </motion.div>

            <span className="font-mono text-xs tracking-wide text-foreground/70">{step}</span>
          </motion.div>
        ))}
      </div>

      {/* Second scanning sweep line — wider, slower */}
      <motion.div
        className="relative w-full overflow-hidden rounded"
        style={{ height: 2 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.8 }}
      >
        <motion.div
          className="absolute inset-y-0 w-full"
          style={{
            background:
              'linear-gradient(to right, transparent 0%, rgba(155,34,38,0.4) 40%, rgba(220,38,38,0.7) 50%, rgba(155,34,38,0.4) 60%, transparent 100%)',
          }}
          animate={{ x: ['-110%', '110%'] }}
          transition={{ delay: 3.0, duration: 2.5, repeat: Infinity, ease: 'linear' }}
        />
      </motion.div>
    </div>
  );
}

// ── Panel ─────────────────────────────────────────────────────────────────────
export function AccusationPanel({
  suspects,
  onAccuse,
  loading,
  onCancel,
}: AccusationPanelProps) {
  const [selectedId, setSelectedId] = useState<string>('');

  const handleSubmit = () => {
    if (!selectedId) return;
    onAccuse(selectedId);
  };

  return (
    <div className="space-y-5">
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="analysis"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            <AnalysisScreen />
          </motion.div>
        ) : (
          <motion.div
            key="panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-5"
          >
            {/* Warning */}
            <div className="flex items-start gap-3 bg-danger/10 border border-danger/40 rounded p-3">
              <AlertTriangle size={16} className="text-danger shrink-0 mt-0.5" />
              <div>
                <p className="text-danger text-xs font-mono uppercase tracking-widest font-bold mb-0.5">
                  Irreversible Action
                </p>
                <p className="text-foreground text-sm font-serif">
                  Once you name your suspect, the case is closed. Choose carefully — the truth cannot
                  be changed.
                </p>
              </div>
            </div>

            {/* Suspect selector */}
            <div className="space-y-2">
              <label className="text-muted text-xs font-mono uppercase tracking-widest block">
                Name your suspect
              </label>
              <div className="space-y-2">
                {suspects.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedId(s.id)}
                    disabled={loading}
                    className={[
                      'w-full text-left rounded border px-4 py-3 transition-all duration-150',
                      selectedId === s.id
                        ? 'border-danger bg-danger/10 text-foreground'
                        : 'border-border hover:border-danger/50 text-muted hover:text-foreground',
                      'font-serif text-sm',
                      loading ? 'opacity-50 cursor-not-allowed' : '',
                    ].join(' ')}
                  >
                    <span className="font-semibold">{s.name}</span>
                    <span className="text-xs font-mono ml-2 opacity-70">
                      {s.relationship_to_victim}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <Button
                variant="destructive"
                size="md"
                onClick={handleSubmit}
                disabled={!selectedId || loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Spinner size="sm" className="border-foreground" />
                    Submitting...
                  </>
                ) : (
                  'Submit Accusation'
                )}
              </Button>
              <Button variant="outline" size="md" onClick={onCancel} disabled={loading}>
                Cancel
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
