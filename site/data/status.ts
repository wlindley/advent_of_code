import { formatPartKey, type PuzzlePart } from '../../shared/core';
import type {
  PartDurationSummary,
  PartRecord,
  StatusDocument,
  YearProgress,
  YearStatus,
} from './statusTypes';

export type {
  AttemptLog,
  InProgressPhase,
  PartDurationSummary,
  PartRecord,
  Proposal,
  StatusDocument,
  YearProgress,
  YearStatus,
} from './statusTypes';

function validateSolvedPart(part: Extract<PartRecord, { status: 'solved' }>, key: string): void {
  if (part.personalInputElapsedMs < 0) {
    throw new Error(`personalInputElapsedMs must be non-negative for ${key}`);
  }
  const startMs = Date.parse(part.startedAt);
  const endMs = Date.parse(part.verifiedAt);
  if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs < startMs) {
    throw new Error(`verifiedAt must not precede startedAt for ${key}`);
  }
  const wait = part.humanWaitSeconds ?? 0;
  const rawSeconds = Math.round((endMs - startMs) / 1000);
  if (!Number.isInteger(wait) || wait < 0 || wait > rawSeconds) {
    throw new Error(`humanWaitSeconds must be an integer in [0, ${rawSeconds}] for ${key}`);
  }
}

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
      if (part.status === 'solved') validateSolvedPart(part, key);
    }
  }
  return doc;
}

export function combineYearStatuses(years: readonly YearStatus[]): StatusDocument {
  const sorted = [...years].sort((a, b) => b.year - a.year);
  let latest = '';
  for (const year of sorted) {
    if (year.updatedAt && year.updatedAt > latest) latest = year.updatedAt;
    for (const part of year.parts) {
      const ts = part.status === 'solved' ? part.verifiedAt : part.status === 'pending' ? '' : part.updatedAt;
      if (ts > latest) latest = ts;
    }
  }
  return validateStatusDocument({ updatedAt: latest || '1970-01-01T00:00:00Z', years: sorted });
}

export function computeSolveDurationSeconds(
  part: Extract<PartRecord, { status: 'solved' }>,
): number {
  const raw = Math.round((Date.parse(part.verifiedAt) - Date.parse(part.startedAt)) / 1000);
  return Math.max(0, raw - (part.humanWaitSeconds ?? 0));
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

function medianNumber(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

export function computeYearProgress(yearStatus: YearStatus): YearProgress {
  const totalParts = yearStatus.totalDays * 2;
  let solvedParts = 0;
  let inProgressParts = 0;
  let blockedParts = 0;
  let totalSolveSeconds = 0;
  let firstTryCount = 0;
  const durations: number[] = [];
  const runMs: number[] = [];
  let fastestPart: PartDurationSummary | null = null;
  let slowestPart: PartDurationSummary | null = null;

  for (const part of yearStatus.parts) {
    if (part.status === 'solved') {
      const sec = computeSolveDurationSeconds(part);
      solvedParts += 1;
      totalSolveSeconds += sec;
      if (part.attemptsCount === 1) firstTryCount += 1;
      durations.push(sec);
      runMs.push(part.personalInputElapsedMs);
      if (!fastestPart || sec < fastestPart.seconds) fastestPart = { day: part.day, part: part.part, seconds: sec };
      if (!slowestPart || sec > slowestPart.seconds) slowestPart = { day: part.day, part: part.part, seconds: sec };
    } else if (part.status === 'in_progress') inProgressParts += 1;
    else if (part.status === 'blocked') blockedParts += 1;
  }

  return {
    totalParts,
    solvedParts,
    inProgressParts,
    blockedParts,
    pendingParts: Math.max(0, totalParts - solvedParts - inProgressParts - blockedParts),
    completionPercent: Math.round((solvedParts / totalParts) * 100),
    totalSolveSeconds,
    firstTryCount,
    medianSolveSeconds: Math.round(medianNumber(durations)),
    medianRunMs: Math.round(medianNumber(runMs) * 100) / 100,
    fastestPart,
    slowestPart,
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
