'use client';

import React, { useEffect, useRef, useState, useCallback, FormEvent } from 'react';
import { Send, Volume2, VolumeX, Fingerprint, MessageCircle, Mic, MicOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { twMerge } from 'tailwind-merge';
import type { Suspect, Witness, InterrogationMessage } from '@/lib/types';
import { Spinner } from '@/components/ui/spinner';
import { useTTS } from '@/hooks/use-tts';
import { getCharacterVoice } from '@/lib/tts';

function avatarUrl(name: string, role: 'suspect' | 'witness' = 'suspect'): string {
  const seed = encodeURIComponent(name);
  const style = role === 'witness' ? 'lorelei-neutral' : 'lorelei';
  const bg = role === 'witness' ? 'dccfb8' : 'f1ead4';
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&backgroundColor=${bg}`;
}

interface InterrogationChatProps {
  character: Suspect | Witness;
  messages: InterrogationMessage[];
  onSendQuestion: (question: string) => Promise<void>;
  loading: boolean;
}

// ── Web Speech Recognition (free, browser-built-in) ──────────────────────────
// Lazily-instantiated. Returns null where unsupported (e.g. Firefox).
type RecognitionLike = {
  start: () => void;
  stop: () => void;
  abort: () => void;
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> & { length: number } }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
};

function getRecognitionCtor(): (new () => RecognitionLike) | null {
  if (typeof window === 'undefined') return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return (w.SpeechRecognition || w.webkitSpeechRecognition) ?? null;
}

export function InterrogationChat({
  character,
  messages,
  onSendQuestion,
  loading,
}: InterrogationChatProps) {
  const [input, setInput] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [speakingMsgIdx, setSpeakingMsgIdx] = useState<number | null>(null);
  const [listening, setListening] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const recognitionRef = useRef<RecognitionLike | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevMsgCount = useRef(messages.length);
  const tts = useTTS();
  const recognitionSupported = typeof window !== 'undefined' && getRecognitionCtor() !== null;

  // ── Voice INPUT (speech-to-text) ──
  const startListening = useCallback(() => {
    setMicError(null);
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setMicError('Voice input not supported in this browser.');
      return;
    }
    try {
      // Stop any TTS playback so the mic doesn't pick it up
      tts.stop();
      const rec = new Ctor();
      rec.lang = 'en-US';
      rec.continuous = false;
      rec.interimResults = true;
      rec.onresult = (e) => {
        let transcript = '';
        for (let i = 0; i < e.results.length; i++) {
          transcript += e.results[i][0].transcript;
        }
        setInput(transcript);
      };
      rec.onend = () => {
        setListening(false);
        recognitionRef.current = null;
      };
      rec.onerror = (e) => {
        setListening(false);
        recognitionRef.current = null;
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          setMicError('Microphone access denied. Allow it in your browser settings.');
        } else if (e.error === 'no-speech') {
          setMicError('No speech detected. Try again.');
        } else if (e.error && e.error !== 'aborted') {
          setMicError(`Voice input error: ${e.error}`);
        }
      };
      recognitionRef.current = rec;
      rec.start();
      setListening(true);
    } catch {
      setMicError('Could not start voice input.');
    }
  }, [tts]);

  const stopListening = useCallback(() => {
    try { recognitionRef.current?.stop(); } catch {}
    setListening(false);
  }, []);

  const handleMicToggle = useCallback(() => {
    if (listening) stopListening();
    else startListening();
  }, [listening, startListening, stopListening]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-play new character responses when voiceEnabled
  useEffect(() => {
    const newCount = messages.length;
    if (!voiceEnabled || newCount === prevMsgCount.current) {
      prevMsgCount.current = newCount;
      return;
    }
    prevMsgCount.current = newCount;

    // Find the last character message
    const lastMsg = messages[newCount - 1];
    if (!lastMsg || lastMsg.role === 'detective') return;

    const idx = newCount - 1;
    const gender = (character as Suspect | Witness & { gender?: string }).gender as 'male' | 'female' | undefined;
    const voiceOpts = getCharacterVoice(character.name, character.role, gender);
    setSpeakingMsgIdx(idx);
    tts.speak(lastMsg.content, voiceOpts).finally(() => {
      setSpeakingMsgIdx(null);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, voiceEnabled]);

  // Stop voice on unmount
  useEffect(() => {
    return () => { tts.stop(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const q = input.trim();
    if (!q || loading) return;
    // Stop any ongoing speech / mic when detective sends a question
    tts.stop();
    if (listening) stopListening();
    setSpeakingMsgIdx(null);
    setInput('');
    await onSendQuestion(q);
  };

  // Cleanup mic on unmount
  useEffect(() => {
    return () => {
      try { recognitionRef.current?.abort(); } catch {}
      recognitionRef.current = null;
    };
  }, []);

  const isWitness = character.role === 'witness';

  // Sample opening questions for the empty state
  const sampleQuestions = isWitness
    ? [
        'What did you see that evening?',
        'Where were you when it happened?',
        'Did anyone act strangely?',
        'Whose alibi can you confirm?',
      ]
    : [
        'Where were you the night of the murder?',
        'What was your relationship with the victim?',
        'Why should I believe your alibi?',
        'Did you stand to gain from their death?',
      ];

  const accentColor = isWitness ? '#e8c84a' : '#e07f82';
  const accentRing  = isWitness ? 'rgba(232,200,74,0.40)' : 'rgba(224,127,130,0.50)';

  return (
    <div
      className="flex flex-col h-full overflow-hidden rounded-xl"
      style={{
        background: 'linear-gradient(160deg, rgba(18,15,10,0.97) 0%, rgba(10,8,6,0.97) 100%)',
        border: `1px solid ${isWitness ? 'rgba(232,200,74,0.22)' : 'rgba(224,127,130,0.28)'}`,
        boxShadow: `0 12px 32px rgba(0,0,0,0.6), inset 0 1px 0 ${isWitness ? 'rgba(232,200,74,0.08)' : 'rgba(224,127,130,0.10)'}`,
      }}
    >
      {/* Character header */}
      <div
        className="px-4 py-3 shrink-0 border-b"
        style={{
          background: 'rgba(0,0,0,0.4)',
          borderColor: isWitness ? 'rgba(232,200,74,0.18)' : 'rgba(224,127,130,0.20)',
        }}
      >
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div
            className="relative w-12 h-12 rounded-full overflow-hidden shrink-0"
            style={{
              border: `2px solid ${accentRing}`,
              boxShadow: `0 0 14px ${accentRing}, inset 0 0 0 2px rgba(0,0,0,0.4)`,
              background: isWitness ? 'rgba(232,200,74,0.06)' : 'rgba(224,127,130,0.06)',
            }}
          >
            <img
              src={avatarUrl(character.name, character.role)}
              alt={character.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-serif text-[16px] font-bold truncate" style={{ color: '#f5e6c8' }}>
                {character.name}
              </h3>
              <span
                className="shrink-0 font-mono text-[8px] tracking-[0.3em] uppercase rounded px-1.5 py-0.5"
                style={{
                  border: `1px solid ${accentRing}`,
                  color: accentColor,
                  background: isWitness ? 'rgba(232,200,74,0.06)' : 'rgba(224,127,130,0.08)',
                }}
              >
                {isWitness ? 'Witness' : 'Suspect'}
              </span>
            </div>
            <p className="text-[11px] font-mono truncate" style={{ color: 'rgba(255,243,210,0.55)' }}>
              Age {character.age} &middot;{' '}
              {isWitness
                ? (character as Witness).relationship_to_suspects
                : (character as Suspect).relationship_to_victim}
            </p>
          </div>

          <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
            <div className="flex flex-col items-end max-w-[180px]">
              <p className="font-mono text-[8px] tracking-[0.35em] uppercase" style={{ color: accentColor, opacity: 0.85 }}>
                {isWitness ? 'Demeanor' : 'Personality'}
              </p>
              <p className="text-[11px] italic font-serif truncate" style={{ color: 'rgba(255,243,210,0.78)' }}>
                {character.personality}
              </p>
            </div>
            {/* Voice toggle */}
            {tts.supported && (
              <button
                onClick={() => {
                  if (voiceEnabled) { tts.stop(); setSpeakingMsgIdx(null); }
                  setVoiceEnabled((v) => !v);
                }}
                title={voiceEnabled ? 'Disable voice responses' : 'Enable voice responses'}
                className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono tracking-[0.25em] uppercase transition-colors"
                style={
                  voiceEnabled
                    ? { border: `1px solid ${accentRing}`, color: accentColor, background: isWitness ? 'rgba(232,200,74,0.10)' : 'rgba(224,127,130,0.12)' }
                    : { border: '1px solid rgba(255,243,210,0.18)', color: 'rgba(255,243,210,0.45)' }
                }
              >
                {voiceEnabled
                  ? <><Volume2 size={10} /> Voice On</>
                  : <><VolumeX size={10} /> Voice Off</>}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="h-full flex flex-col items-center justify-center px-2 sm:px-6 py-4"
          >
            {/* Big avatar with rings */}
            <div className="relative mb-5">
              <motion.span
                className="absolute inset-0 rounded-full"
                style={{ border: `1px solid ${accentRing}` }}
                animate={{ scale: [1, 1.6, 1.6], opacity: [0.5, 0, 0] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: 'easeOut' }}
              />
              <motion.span
                className="absolute inset-0 rounded-full"
                style={{ border: `1px solid ${accentRing}` }}
                animate={{ scale: [1, 1.6, 1.6], opacity: [0.5, 0, 0] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: 'easeOut', delay: 1.3 }}
              />
              <div
                className="relative w-24 h-24 rounded-full overflow-hidden"
                style={{
                  border: `2px solid ${accentRing}`,
                  boxShadow: `0 0 32px ${accentRing}, inset 0 0 0 2px rgba(0,0,0,0.5)`,
                  background: isWitness ? 'rgba(232,200,74,0.08)' : 'rgba(224,127,130,0.08)',
                }}
              >
                <img
                  src={avatarUrl(character.name, character.role)}
                  alt={character.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Title */}
            <p
              className="font-mono text-[10px] tracking-[0.45em] uppercase mb-1"
              style={{ color: accentColor }}
            >
              {isWitness ? 'Witness Statement' : 'Interrogation Room'}
            </p>
            <h2
              className="font-display font-black text-[22px] sm:text-2xl tracking-tight text-center mb-1"
              style={{ color: '#f5e6c8' }}
            >
              {character.name}
            </h2>
            <p className="font-serif italic text-[13px] text-center mb-6 max-w-md leading-snug" style={{ color: 'rgba(255,243,210,0.6)' }}>
              {isWitness
                ? `${character.name} sits across the table. They saw something. The question is whether they will tell you.`
                : `${character.name} folds their hands. Eyes steady. Every word from here is on the record.`}
            </p>

            {/* Suggested question chips */}
            <div className="w-full max-w-md">
              <div className="flex items-center gap-2 mb-2.5">
                <MessageCircle size={11} style={{ color: accentColor, opacity: 0.7 }} />
                <span className="font-mono text-[9px] tracking-[0.4em] uppercase" style={{ color: 'rgba(255,243,210,0.55)' }}>
                  Opening Lines
                </span>
                <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, ${accentRing}, transparent)` }} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {sampleQuestions.map((q, i) => (
                  <motion.button
                    key={q}
                    type="button"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.06, duration: 0.4 }}
                    onClick={() => setInput(q)}
                    className="text-left px-3 py-2 rounded-md font-serif text-[12px] leading-snug transition-all duration-200"
                    style={{
                      background: 'rgba(0,0,0,0.45)',
                      border: '1px solid rgba(255,243,210,0.10)',
                      color: 'rgba(255,243,210,0.78)',
                    }}
                    whileHover={{
                      x: 2,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = accentRing;
                      e.currentTarget.style.color = '#f5e6c8';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,243,210,0.10)';
                      e.currentTarget.style.color = 'rgba(255,243,210,0.78)';
                    }}
                  >
                    &ldquo;{q}&rdquo;
                  </motion.button>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-center gap-1.5">
                <Fingerprint size={11} style={{ color: 'rgba(255,243,210,0.3)' }} />
                <span className="font-mono text-[9px] tracking-[0.35em] uppercase" style={{ color: 'rgba(255,243,210,0.35)' }}>
                  Every word reveals or conceals the truth
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {messages.map((msg, idx) => {
          const isDetective = msg.role === 'detective';
          const isBeingSpoken = speakingMsgIdx === idx;
          return (
            <div
              key={idx}
              className={twMerge(
                'flex flex-col max-w-[80%] animate-fade-in',
                isDetective ? 'ml-auto items-end' : 'mr-auto items-start',
              )}
            >
              <span className="text-xs font-mono text-muted mb-1 px-1 flex items-center gap-1.5">
                {isDetective ? 'Detective' : msg.suspectName ?? character.name}
                {isBeingSpoken && (
                  <span className="inline-flex items-center gap-0.5" title="Speaking…">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="inline-block w-0.5 rounded-full bg-accent"
                        style={{
                          height: `${8 + i * 3}px`,
                          animation: `speakerBar 0.6s ease-in-out ${i * 0.15}s infinite alternate`,
                        }}
                      />
                    ))}
                  </span>
                )}
              </span>
              <div
                className={twMerge(
                  'px-4 py-3 text-sm font-serif leading-relaxed',
                  isDetective ? 'chat-bubble-detective text-accent' : 'chat-bubble-suspect text-foreground',
                  isBeingSpoken && 'ring-1 ring-accent/30',
                )}
              >
                {msg.content}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start gap-2 animate-fade-in">
            <div className="chat-bubble-suspect px-4 py-3 flex items-center gap-2">
              <span className="text-muted text-xs font-mono italic">
                {character.name} is thinking
              </span>
              <Spinner size="sm" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="shrink-0 p-3 border-t"
        style={{
          background: 'rgba(0,0,0,0.4)',
          borderColor: isWitness ? 'rgba(232,200,74,0.18)' : 'rgba(224,127,130,0.20)',
        }}
      >
        {micError && (
          <p className="font-mono text-[10px] mb-2 px-1 tracking-wide" style={{ color: '#e07f82' }}>
            {micError}
          </p>
        )}
        <div className="flex items-center gap-2">
          {/* Microphone (free Web Speech Recognition; only render if supported) */}
          {recognitionSupported && (
            <button
              type="button"
              onClick={handleMicToggle}
              disabled={loading}
              aria-label={listening ? 'Stop voice input' : 'Speak your question'}
              title={listening ? 'Listening… click to stop' : 'Speak your question'}
              className="relative w-11 h-11 rounded-md flex items-center justify-center shrink-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.96]"
              style={
                listening
                  ? {
                      background: 'rgba(155,34,38,0.18)',
                      border: '1px solid rgba(224,127,130,0.55)',
                      color: '#e07f82',
                      boxShadow: '0 0 0 3px rgba(224,127,130,0.10), inset 0 0 12px rgba(224,127,130,0.18)',
                    }
                  : {
                      background: 'rgba(20,16,10,0.95)',
                      border: '1px solid rgba(255,243,210,0.16)',
                      color: 'rgba(241,234,212,0.7)',
                    }
              }
            >
              {listening ? <Mic size={16} strokeWidth={2.2} /> : <MicOff size={16} strokeWidth={2} />}
              {listening && (
                <motion.span
                  className="absolute inset-0 rounded-md pointer-events-none"
                  style={{ border: '1px solid rgba(224,127,130,0.6)' }}
                  animate={{ opacity: [0.7, 0, 0.7], scale: [1, 1.25, 1] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
                />
              )}
            </button>
          )}

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              listening
                ? 'Listening...'
                : (isWitness ? 'Ask the witness...' : `Press ${character.name.split(' ')[0]} for the truth...`)
            }
            disabled={loading}
            className="flex-1 rounded-md px-3.5 py-2.5 text-[13px] font-serif transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
            style={{
              background: 'rgba(20,16,10,0.95)',
              border: '1px solid rgba(255,243,210,0.14)',
              color: '#f5e6c8',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = accentRing;
              e.currentTarget.style.boxShadow = `0 0 0 3px ${isWitness ? 'rgba(232,200,74,0.10)' : 'rgba(224,127,130,0.10)'}`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,243,210,0.14)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />

          <button
            type="submit"
            disabled={loading || !input.trim()}
            aria-label="Send question"
            className="w-11 h-11 rounded-md flex items-center justify-center shrink-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.96]"
            style={{
              background: 'linear-gradient(180deg, #d4af37 0%, #b8860b 100%)',
              color: '#0a0805',
              boxShadow:
                '0 4px 12px rgba(155,34,38,0.25), inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -1px 0 rgba(0,0,0,0.25)',
            }}
          >
            {loading ? <Spinner size="sm" className="border-background" /> : <Send size={16} strokeWidth={2.4} />}
          </button>
        </div>
      </form>
    </div>
  );
}
