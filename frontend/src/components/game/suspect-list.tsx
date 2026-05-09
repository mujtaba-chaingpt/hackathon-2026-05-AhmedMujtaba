'use client';

import React from 'react';
import type { Suspect, Witness } from '@/lib/types';

/**
 * DiceBear avatar URL with a solid paper-cream background so the line-art
 * figure always renders against a high-contrast plate (the previous
 * `backgroundColor=transparent` made witnesses invisible on the dark UI).
 */
function avatarUrl(name: string, role: 'suspect' | 'witness' = 'suspect'): string {
  const seed = encodeURIComponent(name);
  const style = role === 'witness' ? 'lorelei-neutral' : 'lorelei';
  // f1ead4 = warm parchment; dccfb8 = aged-cream for witnesses (subtly distinct)
  const bg = role === 'witness' ? 'dccfb8' : 'f1ead4';
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&backgroundColor=${bg}`;
}

/* ── Restrained palette (one accent per role) ─────── */
const TONE = {
  suspect: { stripe: 'rgba(176,86,72,0.85)', dim: 'rgba(176,86,72,0.18)', text: '#c97a6e' },
  witness: { stripe: 'rgba(190,156,84,0.85)', dim: 'rgba(190,156,84,0.18)', text: '#c9ad6c' },
};

/* ── Evidence-marker badge (uniform cream tone) ─── */
function EvidenceBadge({ number }: { number: number }) {
  return (
    <div
      className="shrink-0 w-6 h-6 rounded flex items-center justify-center text-[10px] font-mono font-black"
      style={{
        background: 'rgba(0,0,0,0.4)',
        border: '1px solid rgba(241,234,212,0.18)',
        color: 'rgba(241,234,212,0.7)',
      }}
    >
      {number < 10 ? `0${number}` : number}
    </div>
  );
}

/* ── Single character row ─────────────────────────── */
interface CharacterRowProps {
  id: string;
  index: number;
  name: string;
  age: number;
  subtitle: string;
  badge?: string;
  role: 'suspect' | 'witness';
  isSelected: boolean;
  onClick: () => void;
}

function CharacterRow({
  index, name, age, subtitle, badge, role, isSelected, onClick,
}: CharacterRowProps) {
  const tone = TONE[role];

  return (
    <button
      onClick={onClick}
      className="group relative w-full text-left rounded-lg overflow-hidden transition-all duration-200"
      style={{
        background: isSelected ? 'rgba(28,22,14,0.95)' : 'rgba(18,15,10,0.85)',
        border: `1px solid ${isSelected ? tone.dim : 'rgba(241,234,212,0.08)'}`,
        boxShadow: isSelected
          ? `0 6px 18px rgba(0,0,0,0.5), inset 0 1px 0 rgba(241,234,212,0.05)`
          : '0 2px 8px rgba(0,0,0,0.3)',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(24,19,12,0.95)';
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(241,234,212,0.14)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(18,15,10,0.85)';
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(241,234,212,0.08)';
        }
      }}
    >
      {/* Left accent stripe — thin, role-tinted */}
      <div
        className="absolute inset-y-0 left-0 transition-all duration-200"
        style={{
          width: isSelected ? 3 : 2,
          background: isSelected ? tone.stripe : tone.dim,
        }}
      />

      <div className="flex items-start gap-3 p-3 pl-4">
        <EvidenceBadge number={index + 1} />

        {/* Avatar with paper-cream backing */}
        <div
          className="w-10 h-10 rounded-full overflow-hidden shrink-0 transition-all duration-200"
          style={{
            border: `1.5px solid ${isSelected ? tone.stripe : 'rgba(241,234,212,0.20)'}`,
            background: '#f1ead4',
            boxShadow: 'inset 0 0 0 2px rgba(0,0,0,0.4)',
          }}
        >
          <img
            src={avatarUrl(name, role)}
            alt={name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <p
            className="font-serif font-bold text-[14px] truncate leading-tight"
            style={{ color: isSelected ? '#f5e6c8' : 'rgba(241,234,212,0.92)' }}
          >
            {name}
          </p>
          <p
            className="text-[11px] font-mono truncate mt-0.5"
            style={{ color: 'rgba(241,234,212,0.5)' }}
          >
            Age {age} &middot; {subtitle}
          </p>
          {badge && (
            <p
              className="text-[10px] font-mono mt-1 truncate leading-snug italic"
              style={{ color: isSelected ? tone.text : 'rgba(241,234,212,0.45)' }}
            >
              <span className="opacity-60 not-italic mr-0.5">&ldquo;</span>
              {badge}
              <span className="opacity-60 not-italic ml-0.5">&rdquo;</span>
            </p>
          )}
        </div>

        {/* Selected indicator dot */}
        {isSelected && (
          <span
            className="ml-auto shrink-0 w-1.5 h-1.5 rounded-full mt-2 animate-pulse"
            style={{ background: tone.stripe }}
          />
        )}
      </div>
    </button>
  );
}

/* ── Section header (clean, no colored fill) ───── */
function SectionHeader({
  label, count, variant = 'suspect',
}: { label: string; count: number; variant?: 'suspect' | 'witness' }) {
  const tone = TONE[variant];
  return (
    <div className="flex items-center gap-2 px-1 py-1.5 mb-2">
      <div
        className="w-0.5 h-3.5 rounded-full shrink-0"
        style={{ background: tone.stripe }}
      />
      <span
        className="font-mono text-[10px] tracking-[0.4em] uppercase font-bold"
        style={{ color: 'rgba(241,234,212,0.7)' }}
      >
        {label}
      </span>
      <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, rgba(241,234,212,0.10), transparent)' }} />
      <span
        className="shrink-0 font-mono text-[9px] tabular-nums rounded px-1.5 py-0.5"
        style={{
          color: tone.text,
          background: 'rgba(0,0,0,0.4)',
          border: `1px solid ${tone.dim}`,
        }}
      >
        {count}
      </span>
    </div>
  );
}

/* ── Quiet divider (no busy stripes) ─────────────── */
function QuietDivider() {
  return (
    <div
      className="my-3 h-px w-full"
      style={{ background: 'linear-gradient(to right, transparent, rgba(241,234,212,0.10), transparent)' }}
    />
  );
}

/* ── Full list ────────────────────────────────────── */
interface SuspectListProps {
  suspects: Suspect[];
  witnesses: Witness[];
  selectedId: string | null;
  onSelect: (character: Suspect | Witness) => void;
}

export function SuspectList({ suspects, witnesses, selectedId, onSelect }: SuspectListProps) {
  return (
    <div className="space-y-1">
      {/* Suspects */}
      <SectionHeader label="Persons of Interest" count={suspects.length} variant="suspect" />
      <div className="space-y-2">
        {suspects.map((s, i) => (
          <CharacterRow
            key={s.id}
            id={s.id}
            index={i}
            name={s.name}
            age={s.age}
            subtitle={s.relationship_to_victim}
            badge={s.why_suspect}
            role="suspect"
            isSelected={s.id === selectedId}
            onClick={() => onSelect(s)}
          />
        ))}
      </div>

      {/* Witnesses */}
      {witnesses.length > 0 && (
        <>
          <QuietDivider />
          <SectionHeader label="Alibi Witnesses" count={witnesses.length} variant="witness" />
          <div className="space-y-2">
            {witnesses.map((w, i) => (
              <CharacterRow
                key={w.id}
                id={w.id}
                index={i}
                name={w.name}
                age={w.age}
                subtitle={w.relationship_to_suspects}
                badge={w.why_relevant}
                role="witness"
                isSelected={w.id === selectedId}
                onClick={() => onSelect(w)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
