import { computeYearProgress, type StatusDocument, type YearProgress } from './status';

export type YearRollupState = 'completed' | 'in_progress' | 'pending';

export interface YearRollupEntry {
  readonly year: number;
  readonly solvedParts: number;
  readonly totalParts: number;
  readonly completionPercent: number;
  readonly state: YearRollupState;
  readonly totalSolveSeconds: number;
}

export interface OverallProgress {
  readonly totalYears: number;
  readonly completedYears: number;
  readonly inProgressYears: number;
  readonly pendingYears: number;
  readonly totalParts: number;
  readonly solvedParts: number;
  readonly inProgressParts: number;
  readonly blockedParts: number;
  readonly pendingParts: number;
  readonly completionPercent: number;
  readonly totalSolveSeconds: number;
  readonly firstTryCount: number;
  readonly firstTryPercent: number;
  readonly years: readonly YearRollupEntry[];
}

function classifyYearState(progress: YearProgress): YearRollupState {
  if (progress.solvedParts === progress.totalParts) return 'completed';
  if (progress.solvedParts > 0 || progress.inProgressParts > 0 || progress.blockedParts > 0) {
    return 'in_progress';
  }
  return 'pending';
}

function toRollupEntry(year: number, progress: YearProgress): YearRollupEntry {
  return {
    year,
    solvedParts: progress.solvedParts,
    totalParts: progress.totalParts,
    completionPercent: progress.completionPercent,
    state: classifyYearState(progress),
    totalSolveSeconds: progress.totalSolveSeconds,
  };
}

interface OverallAcc {
  completedYears: number;
  inProgressYears: number;
  pendingYears: number;
  totalParts: number;
  solvedParts: number;
  inProgressParts: number;
  blockedParts: number;
  pendingParts: number;
  totalSolveSeconds: number;
  firstTryCount: number;
  readonly years: YearRollupEntry[];
}

function accumulateYear(acc: OverallAcc, year: number, prog: YearProgress): void {
  const entry = toRollupEntry(year, prog);
  acc.years.push(entry);
  if (entry.state === 'completed') acc.completedYears += 1;
  else if (entry.state === 'in_progress') acc.inProgressYears += 1;
  else acc.pendingYears += 1;
  acc.totalParts += prog.totalParts;
  acc.solvedParts += prog.solvedParts;
  acc.inProgressParts += prog.inProgressParts;
  acc.blockedParts += prog.blockedParts;
  acc.pendingParts += prog.pendingParts;
  acc.totalSolveSeconds += prog.totalSolveSeconds;
  acc.firstTryCount += prog.firstTryCount;
}

export function computeOverallProgress(statusDoc: StatusDocument): OverallProgress {
  const acc: OverallAcc = {
    completedYears: 0, inProgressYears: 0, pendingYears: 0,
    totalParts: 0, solvedParts: 0, inProgressParts: 0, blockedParts: 0,
    pendingParts: 0, totalSolveSeconds: 0, firstTryCount: 0, years: [],
  };
  for (const yearStatus of statusDoc.years) {
    accumulateYear(acc, yearStatus.year, computeYearProgress(yearStatus));
  }
  const completionPercent =
    acc.totalParts === 0 ? 0 : Math.round((acc.solvedParts / acc.totalParts) * 1000) / 10;
  const firstTryPercent =
    acc.solvedParts === 0 ? 0 : Math.round((acc.firstTryCount / acc.solvedParts) * 100);
  return { ...acc, totalYears: acc.years.length, completionPercent, firstTryPercent };
}
