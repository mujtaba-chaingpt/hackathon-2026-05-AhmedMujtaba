'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import { useAudio } from '@/lib/audio-context';
import { api } from '@/lib/api';
import type { GameSession, Suspect, Witness, Character, InterrogationMessage } from '@/lib/types';
import { FullPageSpinner } from '@/components/ui/spinner';
import { CountdownTimer } from '@/components/game/countdown-timer';
import { SuspectList } from '@/components/game/suspect-list';
import { InterrogationChat } from '@/components/game/interrogation-chat';
import { HintButton } from '@/components/game/hint-button';
import { AccusationPanel } from '@/components/game/accusation-panel';
import { CaseFileBook } from '@/components/game/case-file-book';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { AlertTriangle, FileText, ChevronLeft } from 'lucide-react';

export default function GamePage() {
  const { user, loading: authLoading } = useAuth();
  const { playClick, playSend, playReceive, stopAmbient, startAmbient, stopMusic, startMusic } = useAudio();

  // Silence ambient + background music so TTS voices are clearly audible.
  // Restore both when leaving (result page, dashboard, etc.).
  useEffect(() => {
    stopAmbient();
    stopMusic();
    return () => { startAmbient(); startMusic(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;

  // Session state
  const [session, setSession] = useState<GameSession | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);

  // Case file book
  const [showCaseBook, setShowCaseBook] = useState(false); // starts closed (shown after load)
  const [bookInitiallyShown, setBookInitiallyShown] = useState(false);

  // Timer gating — timer only starts after user reads the case file
  const [timerStarted, setTimerStarted] = useState(false);
  const [timerExpiresAt, setTimerExpiresAt] = useState<string | null>(null);

  // Game state
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [conversations, setConversations] = useState<Map<string, InterrogationMessage[]>>(new Map());
  const [interrogating, setInterrogating] = useState(false);

  // Hint state
  const [hintText, setHintText] = useState<string | null>(null);
  const [hintLoading, setHintLoading] = useState(false);
  const [hintError, setHintError] = useState<string | null>(null);

  // Accusation state
  const [showAccusation, setShowAccusation] = useState(false);
  const [accusationLoading, setAccusationLoading] = useState(false);
  const [accusationError, setAccusationError] = useState<string | null>(null);

  // Timer expiry
  const [timeExpired, setTimeExpired] = useState(false);
  const expireHandledRef = useRef(false);

  // Mobile panel toggle
  const [mobileView, setMobileView] = useState<'case' | 'interrogation'>('case');

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) router.replace('/');
  }, [user, authLoading, router]);

  // Load session on mount
  useEffect(() => {
    if (!sessionId) return;
    setSessionLoading(true);
    api
      .getSession(sessionId)
      .then((s) => {
        setSession(s);
        if (s.status !== 'active') {
          router.replace('/dashboard');
          return;
        }
        // Persist difficulty so the result page can record stats
        try { localStorage.setItem(`mm_session_${sessionId}`, s.difficulty); } catch {}
        // Show the case book on first load
        setShowCaseBook(true);
        setBookInitiallyShown(true);
      })
      .catch((err: Error) => {
        setSessionError(err.message || 'Failed to load case.');
      })
      .finally(() => setSessionLoading(false));
  }, [sessionId, router]);

  // Handle "Begin Investigation" from the book — starts the timer
  const handleBeginInvestigation = useCallback(() => {
    if (!session) return;
    setShowCaseBook(false);
    if (!timerStarted) {
      setTimerStarted(true);
      setTimerExpiresAt(session.expiresAt);
    }
    playClick();
  }, [session, timerStarted, playClick]);

  // Handle closing the book mid-game (doesn't restart timer)
  const handleCloseCaseBook = useCallback(() => {
    setShowCaseBook(false);
    playClick();
  }, [playClick]);

  // Handle timer expiry
  const handleTimerExpire = useCallback(async () => {
    if (expireHandledRef.current) return;
    expireHandledRef.current = true;
    setTimeExpired(true);
    try {
      const result = await api.submitVerdict(sessionId, '');
      sessionStorage.setItem(`result_${sessionId}`, JSON.stringify(result));
    } catch {}
    setTimeout(() => router.push(`/result/${sessionId}`), 2500);
  }, [sessionId, router]);

  // Get messages for selected character
  const currentMessages: InterrogationMessage[] = selectedCharacter
    ? (conversations.get(selectedCharacter.id) ?? [])
    : [];

  // Send question
  const handleSendQuestion = useCallback(
    async (question: string) => {
      if (!selectedCharacter || !session) return;

      const detectiveMsg: InterrogationMessage = {
        role: 'detective',
        content: question,
        timestamp: Date.now(),
      };
      playSend();
      setConversations((prev) => {
        const next = new Map(prev);
        const existing = next.get(selectedCharacter.id) ?? [];
        next.set(selectedCharacter.id, [...existing, detectiveMsg]);
        return next;
      });

      setInterrogating(true);
      try {
        const res = await api.interrogate(sessionId, selectedCharacter.id, question);
        const suspectMsg: InterrogationMessage = {
          role: 'suspect',
          content: res.answer,
          suspectName: res.suspectName,
          timestamp: Date.now(),
        };
        playReceive();
        setConversations((prev) => {
          const next = new Map(prev);
          const existing = next.get(selectedCharacter.id) ?? [];
          next.set(selectedCharacter.id, [...existing, suspectMsg]);
          return next;
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to send question.';
        setConversations((prev) => {
          const next = new Map(prev);
          const existing = next.get(selectedCharacter.id) ?? [];
          next.set(selectedCharacter.id, [...existing, {
            role: 'suspect', content: `[Error: ${msg}]`, timestamp: Date.now(),
          }]);
          return next;
        });
      } finally {
        setInterrogating(false);
      }
    },
    [selectedCharacter, session, sessionId, playSend, playReceive],
  );

  // Request hint
  const handleRequestHint = useCallback(async () => {
    setHintLoading(true);
    setHintError(null);
    try {
      const res = await api.requestHint(sessionId);
      setHintText(res.hint);
      setSession((prev) => prev ? { ...prev, hintUsed: true } : prev);
    } catch (err: unknown) {
      setHintError(err instanceof Error ? err.message : 'Failed to get hint.');
    } finally {
      setHintLoading(false);
    }
  }, [sessionId]);

  // Submit accusation
  const handleAccuse = useCallback(
    async (suspectId: string) => {
      setAccusationLoading(true);
      setAccusationError(null);
      try {
        const result = await api.submitVerdict(sessionId, suspectId);
        sessionStorage.setItem(`result_${sessionId}`, JSON.stringify(result));
        router.push(`/result/${sessionId}`);
      } catch (err: unknown) {
        setAccusationError(err instanceof Error ? err.message : 'Failed to submit verdict.');
        setAccusationLoading(false);
      }
    },
    [sessionId, router],
  );

  if (authLoading || sessionLoading) return <FullPageSpinner />;

  if (sessionError) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-sm text-center space-y-4">
          <AlertTriangle size={40} className="text-danger mx-auto" />
          <h2 className="font-serif text-xl font-bold text-danger">Case File Missing</h2>
          <p className="font-mono text-muted text-sm">{sessionError}</p>
          <Button onClick={() => router.push('/dashboard')} variant="outline">
            Return to Headquarters
          </Button>
        </div>
      </div>
    );
  }

  if (!session) return <FullPageSpinner />;

  const suspects = session.case.suspects || [];
  const witnesses = session.case.witnesses || [];

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Case file book overlay */}
      {showCaseBook && (
        <CaseFileBook
          caseData={session.case}
          sessionId={sessionId}
          difficulty={session.difficulty}
          onBeginInvestigation={handleBeginInvestigation}
          onClose={bookInitiallyShown && timerStarted ? handleCloseCaseBook : undefined}
        />
      )}

      {/* Time expired overlay */}
      <AnimatePresence>
        {timeExpired && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
            style={{ backdropFilter: 'blur(8px)' }}
          >
            <div className="text-center space-y-5">
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="font-mono text-danger/70 text-xs tracking-[0.6em] uppercase"
              >
                Case Closed
              </motion.p>
              <motion.h2
                initial={{ opacity: 0, scale: 1.3, filter: 'blur(12px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                className="font-display text-6xl font-black text-danger glow-crimson"
              >
                TIME&apos;S UP
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="font-serif text-foreground/60 italic text-lg"
              >
                The killer walks free tonight.
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ delay: 1.2, duration: 1.5, repeat: Infinity }}
                className="font-mono text-muted/60 text-xs tracking-widest"
              >
                Calculating results...
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top bar */}
      <div
        className="shrink-0 px-4 py-2 flex items-center justify-between gap-4"
        style={{
          background: 'linear-gradient(to bottom, rgba(8,8,14,0.98), rgba(6,6,10,0.96))',
          borderBottom: '1px solid rgba(30,30,42,0.9)',
          boxShadow: '0 2px 20px rgba(0,0,0,0.5)',
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-muted/60 hover:text-foreground transition-colors"
            title="Return to Headquarters"
          >
            <ChevronLeft size={18} />
          </button>
          {/* Case ID + victim name */}
          <div className="border-l border-border/60 pl-3">
            <p className="font-mono text-[9px] text-danger/60 uppercase tracking-[0.35em] leading-none mb-0.5">
              ◆ Case #{sessionId.slice(0, 8).toUpperCase()} &bull; {session.difficulty.toUpperCase()}
            </p>
            <p className="font-serif text-foreground text-sm font-bold">
              {session.case.victim.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Re-open case file button */}
          <button
            onClick={() => { setShowCaseBook(true); playClick(); }}
            title="Open Case File"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm border border-border/70 text-muted/70 hover:border-accent/60 hover:text-accent hover:bg-accent/5 transition-all duration-200 font-mono text-[11px] tracking-widest uppercase"
          >
            <FileText size={11} />
            <span className="hidden sm:inline">Case File</span>
          </button>

          {/* Timer — only renders once started */}
          {timerStarted && timerExpiresAt ? (
            <CountdownTimer expiresAt={timerExpiresAt} onExpire={handleTimerExpire} />
          ) : (
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-muted/40 border border-dashed border-muted/20 rounded-sm px-2.5 py-1.5 tracking-widest uppercase">
              <FileText size={10} className="text-muted/30" />
              <span className="hidden sm:inline">Read file to start timer</span>
            </div>
          )}
        </div>
      </div>

      {/* Mobile view toggle */}
      <div className="lg:hidden flex border-b border-border bg-surface shrink-0">
        <button
          onClick={() => setMobileView('case')}
          className={[
            'flex-1 py-2.5 font-mono text-xs uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors',
            mobileView === 'case' ? 'text-accent border-b-2 border-accent' : 'text-muted',
          ].join(' ')}
        >
          <FileText size={13} />
          Suspects
        </button>
        <button
          onClick={() => setMobileView('interrogation')}
          className={[
            'flex-1 py-2.5 font-mono text-xs uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors',
            mobileView === 'interrogation' ? 'text-accent border-b-2 border-accent' : 'text-muted',
          ].join(' ')}
        >
          Interrogation
          {selectedCharacter && <span className="w-1.5 h-1.5 rounded-full bg-accent" />}
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* LEFT PANEL — Suspects & Witnesses */}
        <div
          className={[
            'w-full lg:w-1/3 lg:flex flex-col overflow-hidden game-panel-left',
            mobileView === 'case' ? 'flex' : 'hidden',
          ].join(' ')}
        >
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <SuspectList
              suspects={suspects}
              witnesses={witnesses}
              selectedId={selectedCharacter?.id ?? null}
              onSelect={(char) => {
                setSelectedCharacter(char);
                setMobileView('interrogation');
              }}
            />

            {/* Hint section */}
            <div className="pt-1">
              {hintError && <p className="text-danger text-xs font-mono mb-2">{hintError}</p>}
              <HintButton
                hintUsed={session.hintUsed}
                hint={hintText}
                loading={hintLoading}
                onRequestHint={handleRequestHint}
              />
            </div>
          </div>

          {/* Accusation button */}
          <div className="shrink-0 p-4 border-t border-border bg-surface">
            <Button
              variant="destructive"
              size="md"
              onClick={() => { setShowAccusation(true); playClick(); }}
              className="w-full"
              disabled={!timerStarted}
            >
              {timerStarted ? 'Make Accusation' : 'Read Case File First'}
            </Button>
          </div>
        </div>

        {/* RIGHT PANEL — Interrogation */}
        <div
          className={[
            'flex-1 w-full lg:flex flex-col overflow-hidden game-panel-right',
            mobileView === 'interrogation' ? 'flex' : 'hidden lg:flex',
          ].join(' ')}
        >
          {selectedCharacter ? (
            <div className="flex-1 p-4 overflow-hidden min-h-0 interrogation-room-bg">
              <InterrogationChat
                character={selectedCharacter}
                messages={currentMessages}
                onSendQuestion={handleSendQuestion}
                loading={interrogating}
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6 interrogation-room-bg">
              <div className="text-center space-y-5 max-w-xs">
                {/* Interrogation lamp icon */}
                <div className="relative mx-auto w-20 h-20">
                  <div className="absolute inset-0 rounded-full bg-danger/8 border border-danger/20 animate-pulse" />
                  <div className="absolute inset-2 rounded-full bg-danger/5 border border-danger/15 flex items-center justify-center">
                    <span className="font-mono text-2xl text-danger/40 font-black">?</span>
                  </div>
                </div>
                <div>
                  <p className="font-mono text-[9px] text-muted/40 uppercase tracking-[0.4em] mb-2">
                    Interrogation Room
                  </p>
                  <h3 className="font-serif text-base text-foreground/80 font-semibold mb-2">
                    Select a Suspect
                  </h3>
                  <p className="font-serif text-muted/60 italic text-xs leading-relaxed">
                    Choose a person from the left panel.<br />
                    Every word reveals — or conceals — the truth.
                  </p>
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border/40" />
                  <span className="font-mono text-[8px] text-muted/25 tracking-widest uppercase">Evidence Room</span>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border/40" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Accusation modal */}
      <Modal
        isOpen={showAccusation}
        onClose={() => { if (!accusationLoading) setShowAccusation(false); }}
        title="Name Your Suspect"
      >
        {accusationError && (
          <div className="mb-4 flex items-start gap-2 bg-danger/10 border border-danger/30 rounded p-3">
            <AlertTriangle size={14} className="text-danger shrink-0 mt-0.5" />
            <p className="text-foreground text-sm font-mono">{accusationError}</p>
          </div>
        )}
        <AccusationPanel
          suspects={suspects}
          onAccuse={handleAccuse}
          loading={accusationLoading}
          onCancel={() => setShowAccusation(false)}
        />
      </Modal>
    </div>
  );
}
