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
      if (part.status === 'solved' && part.personalInputElapsedMs < 0) {
        throw new Error(`personalInputElapsedMs must be non-negative for ${key}`);
      }
    }
  }
  return doc;
}

export function computeYearProgress(yearStatus: YearStatus): YearProgress {
  const totalParts = yearStatus.totalDays * 2;
  let solvedParts = 0;
  let inProgressParts = 0;
  let blockedParts = 0;

  for (const part of yearStatus.parts) {
    if (part.status === 'solved') solvedParts += 1;
    else if (part.status === 'in_progress') inProgressParts += 1;
    else if (part.status === 'blocked') blockedParts += 1;
  }

  return {
    totalParts,
    solvedParts,
    inProgressParts,
    blockedParts,
    pendingParts: Math.max(0, totalParts - solvedParts - inProgressParts - blockedParts),
    completionPercent: Math.round((solvedParts / totalParts) * 100),
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
