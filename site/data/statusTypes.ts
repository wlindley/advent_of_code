import type { PuzzlePart, RuntimeMode } from '../../shared/core';

export interface Proposal {
  readonly id: string;
  readonly name: string;
  readonly summary: string;
  readonly complexity: string;
  readonly tradeoffs: string;
}

export interface AttemptLog {
  readonly attempt: number;
  readonly outcome: 'wrong_too_low' | 'wrong_too_high' | 'wrong' | 'rate_limited';
  readonly note: string;
  readonly timestamp: string;
}

export type InProgressPhase = 'analyzing' | 'design_selected' | 'implementing' | 'verifying';

interface PartBase {
  readonly year: number;
  readonly day: number;
  readonly part: PuzzlePart;
  readonly title: string;
  readonly puzzleUrl: string;
}

export type PartRecord =
  | (PartBase & { readonly status: 'pending' })
  | (PartBase & {
      readonly status: 'in_progress';
      readonly phase: InProgressPhase;
      readonly summary: string;
      readonly proposals: readonly Proposal[];
      readonly selectedProposalId: string | null;
      readonly selectionRationale: string;
      readonly inFlightWork: string;
      readonly attempts: readonly AttemptLog[];
      readonly updatedAt: string;
    })
  | (PartBase & {
      readonly status: 'solved';
      readonly summary: string;
      readonly algorithmSummary: string;
      readonly complexity: string;
      readonly runtime: RuntimeMode;
      readonly personalInputElapsedMs: number;
      readonly attemptsCount: number;
      readonly learnings: readonly string[];
      readonly verifiedAt: string;
    })
  | (PartBase & {
      readonly status: 'blocked';
      readonly reason: string;
      readonly proposals: readonly Proposal[];
      readonly attempts: readonly AttemptLog[];
      readonly updatedAt: string;
    });

export interface YearStatus {
  readonly year: number;
  readonly totalDays: number;
  readonly parts: readonly PartRecord[];
}

export interface StatusDocument {
  readonly updatedAt: string;
  readonly years: readonly YearStatus[];
}

export interface YearProgress {
  readonly totalParts: number;
  readonly solvedParts: number;
  readonly inProgressParts: number;
  readonly blockedParts: number;
  readonly pendingParts: number;
  readonly completionPercent: number;
}
