import React from 'react';
import type { PublicCase } from '@/lib/types';

interface CaseFileProps {
  caseData: PublicCase;
}

export function CaseFile({ caseData }: CaseFileProps) {
  const { victim, crime_scene_description } = caseData;

  return (
    <div className="aged-paper rounded p-4 space-y-4">
      {/* Header */}
      <div className="border-b border-border pb-3">
        <p className="font-mono text-xs text-muted tracking-widest uppercase mb-1">
          — Classified —
        </p>
        <h2 className="font-serif text-accent text-base font-bold tracking-widest uppercase">
          Case File
        </h2>
      </div>

      {/* Victim section */}
      <div className="space-y-2">
        <h3 className="font-mono text-xs text-muted uppercase tracking-widest">
          Victim
        </h3>
        <div className="space-y-1 text-sm">
          <div className="flex gap-2">
            <span className="text-muted font-mono text-xs w-24 shrink-0 pt-0.5">Name</span>
            <span className="text-foreground font-serif font-semibold">{victim.name}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted font-mono text-xs w-24 shrink-0 pt-0.5">Occupation</span>
            <span className="text-foreground">{victim.occupation}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted font-mono text-xs w-24 shrink-0 pt-0.5">Found at</span>
            <span className="text-foreground">{victim.found_at}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted font-mono text-xs w-24 shrink-0 pt-0.5">Time of death</span>
            <span className="text-foreground">{victim.time_of_death}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted font-mono text-xs w-24 shrink-0 pt-0.5">Cause</span>
            <span className="text-danger font-semibold">{victim.cause}</span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border pt-3">
        <h3 className="font-mono text-xs text-muted uppercase tracking-widest mb-2">
          Crime Scene
        </h3>
        <p className="text-foreground text-sm font-serif italic leading-relaxed">
          {crime_scene_description}
        </p>
      </div>
    </div>
  );
}
