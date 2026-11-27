import { describe, expect, it } from 'vitest';
import { computeOverallProgress } from './overallProgress';
import type { PartRecord, StatusDocument } from './status';

function makeSolvedPart(
  year: number,
  day: number,
  part: 1 | 2,
  durationSeconds: number,
  attemptsCount: number,
): Extract<PartRecord, { status: 'solved' }> {
  const start = Date.parse('2026-11-26T00:00:00Z');
  const end = new Date(start + durationSeconds * 1000).toISOString();
  return {
    year,
    day,
    part,
    title: `Day ${day}`,
    puzzleUrl: `https://adventofcode.com/${year}/day/${day}`,
    status: 'solved',
    summary: 'Solved part.',
    algorithmSummary: 'Fast algorithm.',
    complexity: 'O(N)',
    runtime: 'main-thread',
    personalInputElapsedMs: 1.5,
    attemptsCount,
    learnings: [],
    startedAt: '2026-11-26T00:00:00Z',
    verifiedAt: end,
  };
}

describe('computeOverallProgress', () => {
  it('handles an empty status document with zero years', () => {
    const empty: StatusDocument = { updatedAt: '2026-11-26T00:00:00Z', years: [] };
    expect(computeOverallProgress(empty)).toEqual({
      totalYears: 0,
      completedYears: 0,
      inProgressYears: 0,
      pendingYears: 0,
      totalParts: 0,
      solvedParts: 0,
      inProgressParts: 0,
      blockedParts: 0,
      pendingParts: 0,
      completionPercent: 0,
      totalSolveSeconds: 0,
      firstTryCount: 0,
      firstTryPercent: 0,
      years: [],
    });
  });

  it('rolls up completed, in-progress, blocked-only, and pending years accurately', () => {
    const doc: StatusDocument = {
      updatedAt: '2026-11-26T01:00:00Z',
      years: [
        {
          year: 2025,
          totalDays: 1,
          parts: [makeSolvedPart(2025, 1, 1, 120, 1), makeSolvedPart(2025, 1, 2, 180, 2)],
        },
        {
          year: 2024,
          totalDays: 2,
          parts: [
            makeSolvedPart(2024, 1, 1, 60, 1),
            {
              year: 2024,
              day: 1,
              part: 2,
              title: 'Day 1',
              puzzleUrl: 'https://adventofcode.com/2024/day/1#part2',
              status: 'in_progress',
              phase: 'implementing',
              summary: 'In flight.',
              proposals: [],
              selectedProposalId: null,
              selectionRationale: '',
              inFlightWork: 'TDD',
              attempts: [],
              updatedAt: '2026-11-26T00:30:00Z',
            },
          ],
        },
        {
          year: 2023,
          totalDays: 1,
          parts: [
            {
              year: 2023,
              day: 1,
              part: 1,
              title: 'Day 1',
              puzzleUrl: 'https://adventofcode.com/2023/day/1',
              status: 'blocked',
              reason: 'Needs review',
              proposals: [],
              attempts: [],
              updatedAt: '2026-11-26T00:40:00Z',
            },
          ],
        },
        {
          year: 2022,
          totalDays: 2,
          parts: [],
        },
      ],
    };

    const rollup = computeOverallProgress(doc);
    expect(rollup.totalYears).toBe(4);
    expect(rollup.completedYears).toBe(1);
    expect(rollup.inProgressYears).toBe(2);
    expect(rollup.pendingYears).toBe(1);
    expect(rollup.totalParts).toBe(12);
    expect(rollup.solvedParts).toBe(3);
    expect(rollup.inProgressParts).toBe(1);
    expect(rollup.blockedParts).toBe(1);
    expect(rollup.pendingParts).toBe(7);
    expect(rollup.completionPercent).toBe(25);
    expect(rollup.totalSolveSeconds).toBe(360);
    expect(rollup.firstTryCount).toBe(2);
    expect(rollup.firstTryPercent).toBe(67);
    expect(rollup.years).toEqual([
      { year: 2025, solvedParts: 2, totalParts: 2, completionPercent: 100, state: 'completed', totalSolveSeconds: 300 },
      { year: 2024, solvedParts: 1, totalParts: 4, completionPercent: 25, state: 'in_progress', totalSolveSeconds: 60 },
      { year: 2023, solvedParts: 0, totalParts: 2, completionPercent: 0, state: 'in_progress', totalSolveSeconds: 0 },
      { year: 2022, solvedParts: 0, totalParts: 4, completionPercent: 0, state: 'pending', totalSolveSeconds: 0 },
    ]);
  });

  it('reports 100% completion and 100% first-try rate when all parts are solved on first try', () => {
    const doc: StatusDocument = {
      updatedAt: '2026-11-26T02:00:00Z',
      years: [
        {
          year: 2025,
          totalDays: 1,
          parts: [makeSolvedPart(2025, 1, 1, 90, 1), makeSolvedPart(2025, 1, 2, 110, 1)],
        },
      ],
    };
    const rollup = computeOverallProgress(doc);
    expect(rollup.completedYears).toBe(1);
    expect(rollup.completionPercent).toBe(100);
    expect(rollup.firstTryPercent).toBe(100);
    expect(rollup.pendingParts).toBe(0);
  });
});
