'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, BookOpen, X, Shield, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import type { PublicCase, Suspect, Witness } from '@/lib/types';
import { useTTS } from '@/hooks/use-tts';
import { NARRATOR_VOICE, STORY_VOICE, buildCaseNarrative } from '@/lib/tts';

function avatarUrl(name: string, role: 'suspect' | 'witness' = 'suspect'): string {
  const seed = encodeURIComponent(name);
  const style = role === 'witness' ? 'lorelei-neutral' : 'lorelei';
  const bg = role === 'witness' ? 'dccfb8' : 'f1ead4';
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&backgroundColor=${bg}`;
}

interface CaseFileBookProps {
  caseData: PublicCase;
  sessionId: string;
  difficulty: string;
  onBeginInvestigation: () => void;
  onClose?: () => void;
}

const PAGE_VARIANTS = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0, filter: 'blur(4px)' }),
  center: { x: 0, opacity: 1, filter: 'blur(0px)' },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0, filter: 'blur(4px)' }),
};

/* ────────────────────────────────────────────────────────────
   Page text extractors — pure text for TTS narration
──────────────────────────────────────────────────────────── */

function getCoverText(caseData: PublicCase, difficulty: string): string {
  return [
    `Murder case file.`,
    caseData.setting ? `Location: ${caseData.setting}.` : '',
    `Difficulty: ${difficulty}.`,
    `Victim: ${caseData.victim.name}.`,
    `This document is classified. Turn the page to begin your briefing.`,
  ].filter(Boolean).join(' ');
}

function getVictimText(victim: PublicCase['victim']): string {
  return [
    `Victim profile.`,
    `Name: ${victim.name}.`,
    victim.age ? `Age: ${victim.age}.` : '',
    `Occupation: ${victim.occupation}.`,
    `Cause of death: ${victim.cause}.`,
    `Time of death: ${victim.time_of_death}.`,
    `Body found at: ${victim.found_at}.`,
    victim.background ? `Background: ${victim.background}` : '',
    victim.last_known_movements ? `Last known movements: ${victim.last_known_movements}` : '',
  ].filter(Boolean).join(' ');
}

function getCrimeSceneText(caseData: PublicCase): string {
  return [
    `Crime scene report.`,
    `Scene description: ${caseData.crime_scene_description}`,
    caseData.initial_evidence && caseData.initial_evidence.length > 0
      ? `Physical evidence found: ${caseData.initial_evidence.join('. ')}.`
      : '',
  ].filter(Boolean).join(' ');
}

function getSuspectsText(suspects: Suspect[]): string {
  return [
    `Persons of interest. ${suspects.length} suspect${suspects.length !== 1 ? 's' : ''} identified.`,
    ...suspects.map(
      (s) => `${s.name}, aged ${s.age}, ${s.relationship_to_victim}. ${s.why_suspect ?? ''}`.trim(),
    ),
  ].join('  ');
}

function getWitnessesText(witnesses: Witness[]): string {
  if (witnesses.length === 0) return 'No alibi witnesses on record for this case.';
  return [
    `Alibi witnesses. ${witnesses.length} witness${witnesses.length !== 1 ? 'es' : ''} identified.`,
    ...witnesses.map(
      (w) => `${w.name}, aged ${w.age}. ${w.relationship_to_suspects}. ${w.why_relevant ?? ''}`.trim(),
    ),
  ].join('  ');
}

function getBeginText(): string {
  return `You have read the complete case file. When you are ready, click Start the Clock to begin your investigation. The timer will start. Good luck, Detective.`;
}

/* ────────────────────────────────────────────────────────────
   Page content components (visual)
──────────────────────────────────────────────────────────── */

function CoverPage({ caseData, sessionId, difficulty }: { caseData: PublicCase; sessionId: string; difficulty: string }) {
  const diffColors: Record<string, { color: string; ring: string }> = {
    easy:   { color: '#5fcf94', ring: 'rgba(95,207,148,0.45)'  },
    medium: { color: '#e8c84a', ring: 'rgba(232,200,74,0.45)'  },
    hard:   { color: '#e07f82', ring: 'rgba(224,127,130,0.55)' },
  };
  const dc = diffColors[difficulty] ?? diffColors.medium;
  const today = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase();

  return (
    <div className="h-full relative overflow-hidden px-7 pt-6 pb-12">
      {/* Top file tab */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-[8px] tracking-[0.5em] uppercase" style={{ color: 'rgba(232,200,74,0.55)' }}>
            Metropolitan Detective Agency
          </span>
          <span className="font-mono text-[9px] tracking-[0.35em] uppercase" style={{ color: 'rgba(255,243,210,0.45)' }}>
            Homicide Division &middot; Case File
          </span>
        </div>
        <div
          className="px-2 py-1 rounded text-[8px] font-mono tracking-[0.3em] uppercase"
          style={{
            background: 'rgba(155,34,38,0.12)',
            border: '1px solid rgba(155,34,38,0.55)',
            color: '#e07f82',
          }}
        >
          Sealed
        </div>
      </div>

      {/* Hairline */}
      <div className="h-px mb-5" style={{ background: 'linear-gradient(to right, transparent, rgba(232,200,74,0.4), transparent)' }} />

      {/* Polaroid victim photo + identity */}
      <div className="flex gap-5 items-start">
        <motion.div
          initial={{ rotate: -3, opacity: 0, y: 10 }}
          animate={{ rotate: -3, opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          className="shrink-0"
          style={{
            background: '#f5e6c8',
            padding: '6px 6px 22px 6px',
            boxShadow: '0 12px 24px rgba(0,0,0,0.7), 0 4px 8px rgba(0,0,0,0.5)',
          }}
        >
          <div
            className="w-[88px] h-[88px] overflow-hidden"
            style={{ background: '#1a1208', filter: 'grayscale(60%) contrast(1.1)' }}
          >
            <img
              src={`https://api.dicebear.com/7.x/lorelei/svg?seed=${encodeURIComponent(caseData.victim.name)}_victim&backgroundColor=transparent`}
              alt={caseData.victim.name}
              className="w-full h-full object-cover"
            />
          </div>
          <p className="text-[8px] font-mono uppercase tracking-[0.2em] text-center mt-1" style={{ color: '#5a4a2a' }}>
            VICTIM
          </p>
        </motion.div>

        <div className="flex-1 min-w-0 pt-1">
          <p className="font-mono text-[8px] tracking-[0.4em] uppercase mb-1.5" style={{ color: 'rgba(232,200,74,0.65)' }}>
            File #{sessionId.slice(0, 8).toUpperCase()}
          </p>
          <h1
            className="font-display font-black text-[34px] leading-[0.95] tracking-tight mb-2"
            style={{ color: '#f5e6c8', textShadow: '0 0 20px rgba(232,200,74,0.20)' }}
          >
            MURDER<br />FILE
          </h1>
          <p className="font-serif italic text-[15px] leading-tight" style={{ color: 'rgba(255,243,210,0.85)' }}>
            {caseData.victim.name}
          </p>
          <p className="font-mono text-[10px] tracking-[0.2em] mt-0.5" style={{ color: 'rgba(255,243,210,0.45)' }}>
            {caseData.victim.occupation}
          </p>
        </div>
      </div>

      {/* CONFIDENTIAL stamp */}
      <motion.div
        initial={{ opacity: 0, scale: 0.7, rotate: -18 }}
        animate={{ opacity: 1, scale: 1, rotate: -14 }}
        transition={{ duration: 0.6, delay: 0.3, ease: 'backOut' }}
        className="absolute pointer-events-none"
        style={{
          right: 22,
          top: 130,
          padding: '6px 14px',
          border: '2.5px solid rgba(155,34,38,0.65)',
          color: 'rgba(155,34,38,0.7)',
          fontFamily: 'ui-monospace, monospace',
          fontWeight: 900,
          letterSpacing: '0.18em',
          fontSize: 12,
          background: 'rgba(155,34,38,0.04)',
          boxShadow: 'inset 0 0 8px rgba(155,34,38,0.10)',
        }}
      >
        CONFIDENTIAL
      </motion.div>

      {/* Metadata card */}
      <div
        className="mt-7 rounded-md p-4 grid grid-cols-2 gap-x-6 gap-y-2.5"
        style={{
          background: 'rgba(0,0,0,0.35)',
          border: '1px solid rgba(232,200,74,0.18)',
          boxShadow: 'inset 0 1px 0 rgba(232,200,74,0.10)',
        }}
      >
        {[
          ['Filed',       today],
          ['Status',      'OPEN — UNSOLVED'],
          ['Classification', `LEVEL ${difficulty === 'hard' ? '5' : difficulty === 'medium' ? '3' : '2'}`],
          ['Detective',    'You'],
        ].map(([label, value]) => (
          <div key={label} className="flex flex-col gap-0.5">
            <span className="font-mono text-[8px] tracking-[0.35em] uppercase" style={{ color: 'rgba(255,243,210,0.4)' }}>
              {label}
            </span>
            <span className="font-mono text-[10px] tracking-[0.1em]" style={{ color: '#f5e6c8' }}>
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Setting strip */}
      {caseData.setting && (
        <div className="mt-3 flex items-center gap-2">
          <span className="font-mono text-[8px] tracking-[0.4em] uppercase" style={{ color: 'rgba(232,200,74,0.55)' }}>
            Location
          </span>
          <span className="font-serif italic text-[12px] truncate" style={{ color: 'rgba(255,243,210,0.78)' }}>
            {caseData.setting}
          </span>
        </div>
      )}

      {/* Difficulty stamp at bottom-left */}
      <div
        className="absolute bottom-7 left-7 px-3 py-1.5 rounded font-mono text-[10px] tracking-[0.3em] uppercase"
        style={{
          border: `1.5px solid ${dc.ring}`,
          color: dc.color,
          background: 'rgba(0,0,0,0.4)',
        }}
      >
        &diams; {difficulty} Case
      </div>

      {/* Bottom hint */}
      <div className="absolute bottom-3 inset-x-7">
        <p className="font-mono text-[8px] tracking-[0.5em] uppercase text-center" style={{ color: 'rgba(255,243,210,0.30)' }}>
          Turn page &rsaquo;
        </p>
      </div>
    </div>
  );
}

function VictimPage({ victim }: { victim: PublicCase['victim'] }) {
  return (
    <div className="h-full overflow-y-auto px-6 py-5 space-y-5">
      <div className="border-b border-accent/20 pb-3">
        <p className="font-mono text-[9px] tracking-[0.45em] text-muted/50 uppercase mb-1">— File Section I —</p>
        <h2 className="font-serif text-xl font-bold text-accent tracking-wide">Victim Profile</h2>
      </div>
      <div className="flex gap-4 items-start">
        <div className="w-16 h-16 rounded border border-border overflow-hidden shrink-0 bg-surface">
          <img src={`https://api.dicebear.com/7.x/lorelei/svg?seed=${encodeURIComponent(victim.name)}_victim&backgroundColor=f1ead4`} alt={victim.name} className="w-full h-full object-cover" />
        </div>
        <div className="space-y-1.5 text-sm flex-1">
          {[
            ['Name', victim.name, 'font-serif font-bold'],
            victim.age ? ['Age', String(victim.age), ''] : null,
            ['Occupation', victim.occupation, ''],
            ['Cause', victim.cause, 'text-danger font-semibold'],
            ['Time', victim.time_of_death, ''],
            ['Found at', victim.found_at, ''],
          ].filter((row): row is string[] => row !== null).map(([label, value, cls]) => (
            <div key={label as string} className="flex gap-2">
              <span className="text-muted font-mono text-xs w-20 shrink-0 pt-0.5">{label as string}</span>
              <span className={`text-foreground ${cls as string}`}>{value as string}</span>
            </div>
          ))}
        </div>
      </div>
      {victim.background && (
        <div className="space-y-1.5">
          <h3 className="font-mono text-[9px] tracking-[0.4em] text-accent/70 uppercase">Background</h3>
          <p className="font-serif text-foreground/85 text-sm leading-relaxed italic">{victim.background}</p>
        </div>
      )}
      {victim.last_known_movements && (
        <div className="space-y-1.5">
          <h3 className="font-mono text-[9px] tracking-[0.4em] text-accent/70 uppercase">Last Known Movements</h3>
          <p className="font-serif text-foreground/85 text-sm leading-relaxed">{victim.last_known_movements}</p>
        </div>
      )}
    </div>
  );
}

function CrimeScenePage({ caseData }: { caseData: PublicCase }) {
  return (
    <div className="h-full overflow-y-auto px-6 py-5 space-y-5">
      <div className="border-b border-accent/20 pb-3">
        <p className="font-mono text-[9px] tracking-[0.45em] text-muted/50 uppercase mb-1">— File Section II —</p>
        <h2 className="font-serif text-xl font-bold text-accent tracking-wide">Crime Scene</h2>
      </div>
      <div className="space-y-1.5">
        <h3 className="font-mono text-[9px] tracking-[0.4em] text-accent/70 uppercase">Scene Description</h3>
        <p className="font-serif text-foreground/85 text-sm leading-relaxed italic">{caseData.crime_scene_description}</p>
      </div>
      {caseData.initial_evidence && caseData.initial_evidence.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-mono text-[9px] tracking-[0.4em] text-accent/70 uppercase">Physical Evidence ({caseData.initial_evidence.length} items)</h3>
          <ul className="space-y-2">
            {caseData.initial_evidence.map((item, i) => (
              <li key={i} className="flex gap-3 items-start">
                <span className="font-mono text-[10px] text-accent/80 w-5 shrink-0 mt-0.5">{String(i + 1).padStart(2, '0')}</span>
                <span className="font-serif text-foreground/80 text-sm leading-snug">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function SuspectsPage({ suspects }: { suspects: Suspect[] }) {
  return (
    <div className="h-full overflow-y-auto px-6 py-5 space-y-4">
      <div className="border-b border-accent/20 pb-3">
        <p className="font-mono text-[9px] tracking-[0.45em] text-muted/50 uppercase mb-1">— File Section III —</p>
        <h2 className="font-serif text-xl font-bold text-accent tracking-wide">Persons of Interest</h2>
      </div>
      <div className="space-y-4">
        {suspects.map((s) => (
          <div key={s.id} className="flex gap-3 border-l-2 border-accent/20 pl-3">
            <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-border bg-surface">
              <img src={avatarUrl(s.name, 'suspect')} alt={s.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <p className="font-serif font-bold text-foreground text-sm">{s.name}<span className="font-mono text-[10px] text-muted ml-2">Age {s.age}</span></p>
              <p className="font-mono text-xs text-muted/80">{s.relationship_to_victim}</p>
              {s.why_suspect && <p className="font-serif italic text-accent/80 text-xs leading-snug">&ldquo;{s.why_suspect}&rdquo;</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WitnessesPage({ witnesses }: { witnesses: Witness[] }) {
  if (witnesses.length === 0) {
    return (
      <div className="h-full flex items-center justify-center px-6">
        <p className="font-serif italic text-muted/60 text-sm text-center">No alibi witnesses on record for this case.</p>
      </div>
    );
  }
  return (
    <div className="h-full overflow-y-auto px-6 py-5 space-y-4">
      <div className="border-b border-accent/20 pb-3">
        <p className="font-mono text-[9px] tracking-[0.45em] text-muted/50 uppercase mb-1">— File Section IV —</p>
        <h2 className="font-serif text-xl font-bold text-accent tracking-wide">Alibi Witnesses</h2>
        <p className="font-serif italic text-muted/60 text-xs mt-1">These individuals may corroborate or contradict suspect accounts.</p>
      </div>
      <div className="space-y-4">
        {witnesses.map((w) => (
          <div key={w.id} className="flex gap-3 border-l-2 border-muted/20 pl-3">
            <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-border bg-surface">
              <img src={avatarUrl(w.name, 'witness')} alt={w.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <p className="font-serif font-bold text-foreground text-sm">{w.name}<span className="font-mono text-[10px] text-muted ml-2">Age {w.age}</span></p>
              <p className="font-mono text-xs text-muted/80">{w.relationship_to_suspects}</p>
              {w.why_relevant && <p className="font-serif italic text-muted/70 text-xs leading-snug">{w.why_relevant}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BeginPage({ onBeginInvestigation }: { onBeginInvestigation: () => void }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center space-y-6 px-8">
      <div className="space-y-2">
        <p className="font-mono text-[9px] tracking-[0.5em] text-accent/60 uppercase">You have read the case file</p>
        <h2 className="font-display text-2xl font-black text-foreground">Begin Your Investigation</h2>
        <p className="font-serif italic text-muted/70 text-sm max-w-xs mx-auto leading-relaxed">
          Once you start, the clock begins ticking. Interrogate every suspect. Trust nothing. The truth is buried in contradiction.
        </p>
      </div>
      <button
        onClick={onBeginInvestigation}
        className={twMerge(
          'group relative px-8 py-3 rounded border border-accent bg-accent/10',
          'font-mono text-sm tracking-widest uppercase text-accent',
          'hover:bg-accent hover:text-background transition-all duration-300',
          'focus:outline-none focus:ring-2 focus:ring-accent',
        )}
      >
        Start the Clock &rarr;
      </button>
      <p className="font-mono text-[9px] tracking-widest text-muted/40 uppercase">
        You can reopen this case file at any time during your investigation
      </p>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Main CaseFileBook component
──────────────────────────────────────────────────────────── */

export function CaseFileBook({ caseData, sessionId, difficulty, onBeginInvestigation, onClose }: CaseFileBookProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [direction, setDirection] = useState(1);
  const [autoReading, setAutoReading] = useState(false); // true while in sequential auto-read mode
  const tts = useTTS();
  const autoReadRef = useRef(false); // ref for async closure

  const suspects = caseData.suspects || [];
  const witnesses = caseData.witnesses || [];

  // Each page: { label, visualComponent, getText }
  const pages = [
    { label: 'Cover',       visual: <CoverPage caseData={caseData} sessionId={sessionId} difficulty={difficulty} />, getText: () => getCoverText(caseData, difficulty) },
    { label: 'Victim',      visual: <VictimPage victim={caseData.victim} />,                                          getText: () => getVictimText(caseData.victim) },
    { label: 'Crime Scene', visual: <CrimeScenePage caseData={caseData} />,                                           getText: () => getCrimeSceneText(caseData) },
    { label: 'Suspects',    visual: <SuspectsPage suspects={suspects} />,                                             getText: () => getSuspectsText(suspects) },
    { label: 'Witnesses',   visual: <WitnessesPage witnesses={witnesses} />,                                          getText: () => getWitnessesText(witnesses) },
    { label: 'Begin',       visual: <BeginPage onBeginInvestigation={onBeginInvestigation} />,                        getText: getBeginText },
  ];

  const STORY_PAGE_INDEX = pages.length - 1; // "Begin" page is last

  const goTo = useCallback((idx: number) => {
    if (idx < 0 || idx >= pages.length) return;
    setDirection(idx > currentPage ? 1 : -1);
    setCurrentPage(idx);
  }, [currentPage, pages.length]);

  // ── Stop TTS when user manually changes page ──
  const manualGoTo = useCallback((idx: number) => {
    if (autoReading) {
      autoReadRef.current = false;
      setAutoReading(false);
      tts.stop();
    }
    goTo(idx);
  }, [autoReading, tts, goTo]);

  // ── Read current page aloud ──
  const readCurrentPage = useCallback(async () => {
    const text = pages[currentPage].getText();
    await tts.speak(text, NARRATOR_VOICE);
  }, [currentPage, pages, tts]);

  // ── Toggle reading current page ──
  const handleToggleRead = useCallback(() => {
    if (tts.speaking) {
      autoReadRef.current = false;
      setAutoReading(false);
      tts.stop();
    } else {
      readCurrentPage();
    }
  }, [tts, readCurrentPage]);

  // ── Read ALL pages sequentially then play the narrative ──
  const handleReadAll = useCallback(async () => {
    if (!tts.supported) return;
    autoReadRef.current = true;
    setAutoReading(true);

    for (let i = currentPage; i < pages.length; i++) {
      if (!autoReadRef.current) break;
      setDirection(1);
      setCurrentPage(i);

      // Wait a moment for page transition
      await new Promise<void>((res) => setTimeout(res, 400));

      if (!autoReadRef.current) break;
      const text = pages[i].getText();
      await tts.speak(text, NARRATOR_VOICE);

      if (!autoReadRef.current) break;
      // Pause between pages
      await new Promise<void>((res) => setTimeout(res, 600));
    }

    // All pages done — play the full narrative story
    if (autoReadRef.current) {
      const narrative = buildCaseNarrative(caseData);
      setCurrentPage(STORY_PAGE_INDEX);
      await new Promise<void>((res) => setTimeout(res, 500));
      if (autoReadRef.current) {
        await tts.speak(narrative, STORY_VOICE);
      }
    }

    autoReadRef.current = false;
    setAutoReading(false);
  }, [currentPage, pages, tts, caseData, STORY_PAGE_INDEX]);

  // ── Clean up TTS on unmount ──
  useEffect(() => {
    return () => {
      autoReadRef.current = false;
      tts.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Auto-start narration on first open (default ON; respects user pref) ──
  const autoplayFiredRef = useRef(false);
  useEffect(() => {
    if (autoplayFiredRef.current) return;
    if (!tts.supported) return;
    let pref: string | null = null;
    try { pref = localStorage.getItem('mm_case_file_autoplay'); } catch {}
    if (pref === '0') return; // user opted out previously
    autoplayFiredRef.current = true;
    // Brief delay so voice list is loaded (esp. Firefox) and the user sees the cover
    const t = setTimeout(() => {
      // handleReadAll uses a closure but its body just reads refs/pages — fine to call
      handleReadAll();
    }, 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tts.supported]);

  // ── Toggle the autoplay preference (persisted) ──
  const [autoplayPref, setAutoplayPref] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    try { return localStorage.getItem('mm_case_file_autoplay') !== '0'; }
    catch { return true; }
  });
  const toggleAutoplay = useCallback(() => {
    setAutoplayPref((prev) => {
      const next = !prev;
      try { localStorage.setItem('mm_case_file_autoplay', next ? '1' : '0'); } catch {}
      // If turning OFF mid-narration, stop immediately
      if (!next) {
        autoReadRef.current = false;
        setAutoReading(false);
        tts.stop();
      }
      return next;
    });
  }, [tts]);

  const isLastPage = currentPage === pages.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
      style={{ background: 'rgba(3,3,5,0.94)', backdropFilter: 'blur(14px)' }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        className="relative w-full flex"
        style={{ maxWidth: '820px', maxHeight: '92dvh' }}
      >
        {/* ── Book spine (left edge) ── */}
        <div
          className="hidden sm:flex w-6 shrink-0 rounded-l-md flex-col items-center justify-center gap-3 py-6"
          style={{
            background: 'linear-gradient(180deg, #2a1f06 0%, #1a1204 50%, #120e03 100%)',
            borderLeft: '1px solid rgba(201,162,39,0.25)',
            borderTop: '1px solid rgba(201,162,39,0.15)',
            borderBottom: '1px solid rgba(201,162,39,0.15)',
          }}
        >
          <span
            className="font-mono text-[8px] tracking-[0.5em] uppercase"
            style={{
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
              color: 'rgba(201,162,39,0.35)',
              transform: 'rotate(180deg)',
            }}
          >
            MURDER FILE
          </span>
        </div>

        {/* ── Book body ── */}
        <div
          className="relative flex flex-col flex-1 rounded-r-md sm:rounded-l-none rounded-l-md overflow-hidden"
          style={{
            background: 'linear-gradient(160deg, #1c1608 0%, #131008 40%, #0d0b06 100%)',
            border: '1px solid rgba(201,162,39,0.22)',
            borderLeft: 'none',
            boxShadow: '0 0 80px rgba(201,162,39,0.07), 0 40px 100px rgba(0,0,0,0.85), inset 0 1px 0 rgba(201,162,39,0.1)',
            height: 'min(680px, 88dvh)',
          }}
        >
          {/* Top paper texture strip */}
          <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(201,162,39,0.3), transparent)' }} />

          {/* ── Top bar ── */}
          <div className="flex items-center justify-between px-5 py-3 border-b shrink-0" style={{ borderColor: 'rgba(201,162,39,0.12)', background: 'rgba(0,0,0,0.3)' }}>
            <div className="flex items-center gap-2.5">
              <BookOpen size={14} className="text-accent/60" />
              <div>
                <span className="font-mono text-[8px] tracking-[0.5em] text-muted/40 uppercase block">
                  Metropolitan Detective Agency
                </span>
                <span className="font-mono text-[10px] tracking-[0.3em] text-accent/70 uppercase">
                  {pages[currentPage].label}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {/* TTS status indicator */}
              {tts.speaking && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1.5">
                  {[0,1,2].map((i) => (
                    <motion.span key={i} className="inline-block w-0.5 rounded-full bg-accent"
                      style={{ height: 10 }}
                      animate={{ scaleY: [0.3, 1, 0.3] }}
                      transition={{ duration: 0.7, delay: i * 0.15, repeat: Infinity }}
                    />
                  ))}
                  <span className="font-mono text-[9px] text-accent/80 tracking-wider ml-1">
                    {autoReading ? 'Auto-reading…' : 'Reading…'}
                  </span>
                </motion.div>
              )}

              {/* Page counter */}
              <span className="font-mono text-[10px] text-muted/35 tabular-nums">
                {currentPage + 1} / {pages.length}
              </span>

              {/* Autoplay preference toggle (persisted) */}
              {tts.supported && (
                <button
                  onClick={toggleAutoplay}
                  title={autoplayPref
                    ? 'Auto-narration is ON for new case files. Click to turn off.'
                    : 'Auto-narration is OFF for new case files. Click to turn on.'}
                  className="flex items-center gap-1.5 px-2 py-1 rounded font-mono text-[9px] tracking-widest uppercase transition-all"
                  style={
                    autoplayPref
                      ? { border: '1px solid rgba(232,200,74,0.35)', color: '#e8c84a', background: 'rgba(232,200,74,0.08)' }
                      : { border: '1px solid rgba(241,234,212,0.18)', color: 'rgba(241,234,212,0.45)', background: 'transparent' }
                  }
                >
                  {autoplayPref ? <Volume2 size={11} /> : <VolumeX size={11} />}
                  Auto
                </button>
              )}

              {/* Read All — manual trigger */}
              {tts.supported && !autoReading && !tts.speaking && (
                <button onClick={handleReadAll}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-accent/35 text-accent/75 hover:border-accent hover:text-accent hover:bg-accent/8 transition-all font-mono text-[9px] tracking-widest uppercase">
                  <Volume2 size={11} /> Read All
                </button>
              )}

              {autoReading && (
                <button onClick={() => { autoReadRef.current = false; setAutoReading(false); tts.stop(); }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-danger/40 text-danger/75 hover:border-danger hover:text-danger hover:bg-danger/8 transition-all font-mono text-[9px] tracking-widest uppercase">
                  <VolumeX size={11} /> Stop
                </button>
              )}

              {onClose && (
                <button onClick={() => { autoReadRef.current = false; tts.stop(); onClose(); }}
                  className="w-7 h-7 rounded flex items-center justify-center border border-border/40 text-muted/50 hover:border-foreground/40 hover:text-foreground transition-colors"
                  aria-label="Close case file">
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* ── Page area ── */}
          <div className="relative flex-1 overflow-hidden min-h-0">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentPage}
                custom={direction}
                variants={PAGE_VARIANTS}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                className="absolute inset-0"
              >
                {pages[currentPage].visual}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ── Bottom navigation ── */}
          <div className="flex items-center justify-between px-5 py-3.5 border-t shrink-0"
            style={{ borderColor: 'rgba(201,162,39,0.12)', background: 'rgba(0,0,0,0.25)' }}>
            {/* Page dots + individual speaker */}
            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                {pages.map((p, i) => (
                  <button key={i} onClick={() => manualGoTo(i)}
                    title={p.label}
                    className="relative transition-all duration-200 flex flex-col items-center gap-0.5 group"
                    aria-label={`Go to page ${i + 1}: ${p.label}`}
                  >
                    <span className={twMerge(
                      'h-1.5 rounded-full transition-all duration-200',
                      i === currentPage ? 'bg-accent w-5' : 'bg-muted/25 hover:bg-muted/55 w-2',
                    )} />
                  </button>
                ))}
              </div>

              {tts.supported && !autoReading && (
                <button onClick={handleToggleRead}
                  title={tts.speaking ? 'Stop reading' : 'Read this page aloud'}
                  className={twMerge(
                    'w-7 h-7 rounded flex items-center justify-center border transition-all duration-200',
                    tts.speaking
                      ? 'border-accent/70 text-accent bg-accent/12'
                      : 'border-border/45 text-muted/45 hover:border-accent/55 hover:text-accent/80',
                  )}>
                  {tts.speaking && !autoReading ? <VolumeX size={12} /> : <Volume2 size={12} />}
                </button>
              )}
            </div>

            {/* Prev / Next — bigger, more prominent */}
            <div className="flex gap-2.5">
              <button
                onClick={() => manualGoTo(currentPage - 1)}
                disabled={currentPage === 0}
                className={twMerge(
                  'flex items-center gap-1.5 px-4 py-2 rounded border font-mono text-[10px] tracking-widest uppercase transition-all duration-200',
                  currentPage === 0
                    ? 'border-border/20 text-muted/20 cursor-not-allowed'
                    : 'border-border/60 text-muted/70 hover:border-accent/60 hover:text-accent',
                )}
              >
                <ChevronLeft size={13} /> Prev
              </button>
              <button
                onClick={() => manualGoTo(currentPage + 1)}
                disabled={isLastPage}
                className={twMerge(
                  'flex items-center gap-1.5 px-4 py-2 rounded border font-mono text-[10px] tracking-widest uppercase transition-all duration-200',
                  isLastPage
                    ? 'border-border/20 text-muted/20 cursor-not-allowed'
                    : 'border-accent/70 text-accent bg-accent/10 hover:bg-accent/18 hover:border-accent',
                )}
              >
                Next <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
