import { formatPartKey, type PuzzlePart } from '../../shared/core';
import type { PartRecord, StatusDocument, YearProgress, YearStatus } from './statusTypes';

export type {
  AttemptLog,
  InProgressPhase,
  PartRecord,
  Proposal,
  StatusDocument,
  YearProgress,
  YearStatus,
} from './statusTypes';

export function validateStatusDocument(doc: StatusDocument): StatusDocument {
  const seen = new Set<string>();
  for (const yearEntry of doc.years) {
    if (!Number.isInteger(yearEntry.totalDays) || yearEntry.totalDays < 1 || yearEntry.totalDays > 25) {
      throw new Error(`totalDays must be an integer between 1 and 25, got ${yearEntry.totalDays}`);
    }
    for (const part of yearEntry.parts) {
      const key = formatPartKey(part.year, part.day, part.part);
      if (seen.has(key)) throw new Error(`Duplicate part entry: ${key}`);
      seen.add(key);

      if (part.status === 'in_progress' && part.selectedProposalId !== null) {
        const exists = part.proposals.some((proposal) => proposal.id === part.selectedProposalId);
        if (!exists) throw new Error(`Unknown selectedProposalId: ${part.selectedProposalId}`);
      }
      if (part.status === 'solved') {
        if (part.personalInputElapsedMs < 0) {
          throw new Error(`personalInputElapsedMs must be non-negative for ${key}`);
        }
        const startMs = Date.parse(part.startedAt);
        const endMs = Date.parse(part.verifiedAt);
        if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs < startMs) {
          throw new Error(`verifiedAt must not precede startedAt for ${key}`);
        }
      }
    }
  }
  return doc;
}

export function computeSolveDurationSeconds(
  part: Extract<PartRecord, { status: 'solved' }>,
): number {
  return Math.round((Date.parse(part.verifiedAt) - Date.parse(part.startedAt)) / 1000);
}

export function formatDuration(totalSeconds: number): string {
  if (!Number.isInteger(totalSeconds) || totalSeconds < 0) {
    throw new Error('Duration seconds must be a non-negative integer');
  }
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  if (minutes > 0) return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
  return `${seconds}s`;
}

export function computeYearProgress(yearStatus: YearStatus): YearProgress {
  const totalParts = yearStatus.totalDays * 2;
  let solvedParts = 0;
  let inProgressParts = 0;
  let blockedParts = 0;
  let totalSolveSeconds = 0;
  let earliestStartMs = Number.POSITIVE_INFINITY;
  let latestEndMs = Number.NEGATIVE_INFINITY;

  for (const part of yearStatus.parts) {
    if (part.status === 'solved') {
      solvedParts += 1;
      totalSolveSeconds += computeSolveDurationSeconds(part);
      const startMs = Date.parse(part.startedAt);
      const endMs = Date.parse(part.verifiedAt);
      if (startMs < earliestStartMs) earliestStartMs = startMs;
      if (endMs > latestEndMs) latestEndMs = endMs;
    } else if (part.status === 'in_progress') inProgressParts += 1;
    else if (part.status === 'blocked') blockedParts += 1;
  }

  const elapsedSolveSeconds =
    solvedParts > 0 ? Math.round((latestEndMs - earliestStartMs) / 1000) : 0;

  return {
    totalParts,
    solvedParts,
    inProgressParts,
    blockedParts,
    pendingParts: Math.max(0, totalParts - solvedParts - inProgressParts - blockedParts),
    completionPercent: Math.round((solvedParts / totalParts) * 100),
    totalSolveSeconds,
    elapsedSolveSeconds,
  };
}

export function findActiveParts(doc: StatusDocument): readonly PartRecord[] {
  return doc.years.flatMap((year) =>
    year.parts.filter((part) => part.status === 'in_progress' || part.status === 'blocked'),
  );
}

export function findPartRecord(
  doc: StatusDocument,
  year: number,
  day: number,
  part: PuzzlePart,
): PartRecord | undefined {
  return doc.years
    .find((entry) => entry.year === year)
    ?.parts.find((entry) => entry.day === day && entry.part === part);
}
