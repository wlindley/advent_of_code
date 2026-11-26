import { describe, expect, it } from 'vitest';
import {
  combineYearStatuses,
  computeSolveDurationSeconds,
  computeYearProgress,
  findActiveParts,
  findPartRecord,
  formatDuration,
  validateStatusDocument,
  type StatusDocument,
} from './status';

const sampleDoc: StatusDocument = {
  updatedAt: '2026-11-25T20:00:00Z',
  years: [
    {
      year: 2025,
      totalDays: 12,
      parts: [
        {
          year: 2025,
          day: 1,
          part: 1,
          title: 'Secret Entrance',
          puzzleUrl: 'https://adventofcode.com/2025/day/1',
          status: 'solved',
          summary: 'Track dial rotations.',
          algorithmSummary: 'Single-pass modular arithmetic.',
          complexity: 'O(n) time, O(1) space',
          runtime: 'main-thread',
          personalInputElapsedMs: 1.4,
          attemptsCount: 1,
          learnings: ['Normalize negative modulo in JS'],
          startedAt: '2026-11-25T20:00:00Z',
          verifiedAt: '2026-11-25T20:05:00Z',
        },
        {
          year: 2025,
          day: 1,
          part: 2,
          title: 'Secret Entrance',
          puzzleUrl: 'https://adventofcode.com/2025/day/1#part2',
          status: 'in_progress',
          phase: 'design_selected',
          summary: 'Count every zero crossing during rotations.',
          proposals: [
            { id: 'direct', name: 'Closed-form', summary: 'Count crossings arithmetically', complexity: 'O(n)', tradeoffs: 'Watch boundary at 0' },
          ],
          selectedProposalId: 'direct',
          selectionRationale: 'O(n) regardless of rotation magnitude.',
          inFlightWork: 'Implementing domain tests via TDD',
          attempts: [],
          updatedAt: '2026-11-25T20:10:00Z',
        },
        {
          year: 2025,
          day: 2,
          part: 1,
          title: 'Day 2',
          puzzleUrl: 'https://adventofcode.com/2025/day/2',
          status: 'blocked',
          reason: '3 wrong submissions',
          proposals: [],
          attempts: [{ attempt: 1, outcome: 'wrong_too_high', note: 'Off by one', timestamp: '2026-11-25T20:20:00Z' }],
          updatedAt: '2026-11-25T20:25:00Z',
        },
        {
          year: 2025,
          day: 2,
          part: 2,
          title: 'Day 2',
          puzzleUrl: 'https://adventofcode.com/2025/day/2#part2',
          status: 'pending',
        },
      ],
    },
  ],
};

describe('status schema, human-wait subtraction, and year stats', () => {
  it('validates status documents, subtracts humanWaitSeconds, and computes year summary stats', () => {
    const validated = validateStatusDocument(sampleDoc);
    expect(computeYearProgress(validated.years[0]!)).toEqual({
      totalParts: 24,
      solvedParts: 1,
      inProgressParts: 1,
      blockedParts: 1,
      pendingParts: 21,
      completionPercent: 4,
      totalSolveSeconds: 300,
      firstTryCount: 1,
      medianSolveSeconds: 300,
      medianRunMs: 1.4,
      fastestPart: { day: 1, part: 1, seconds: 300 },
      slowestPart: { day: 1, part: 1, seconds: 300 },
    });

    expect(computeYearProgress({ year: 2024, totalDays: 25, parts: [] })).toEqual({
      totalParts: 50,
      solvedParts: 0,
      inProgressParts: 0,
      blockedParts: 0,
      pendingParts: 50,
      completionPercent: 0,
      totalSolveSeconds: 0,
      firstTryCount: 0,
      medianSolveSeconds: 0,
      medianRunMs: 0,
      fastestPart: null,
      slowestPart: null,
    });

    const base = sampleDoc.years[0]!.parts[0]! as Extract<StatusDocument['years'][0]['parts'][number], { status: 'solved' }>;
    const multi = computeYearProgress({
      year: 2025,
      totalDays: 12,
      parts: [
        { ...base, day: 1, part: 1, startedAt: '2026-11-25T20:00:00Z', verifiedAt: '2026-11-25T20:06:00Z', humanWaitSeconds: 60, personalInputElapsedMs: 2.0, attemptsCount: 2 },
        { ...base, day: 1, part: 2, startedAt: '2026-11-25T20:10:00Z', verifiedAt: '2026-11-25T20:13:00Z', personalInputElapsedMs: 4.0, attemptsCount: 1 },
      ],
    });
    expect(multi.totalSolveSeconds).toBe(480);
    expect(multi.firstTryCount).toBe(1);
    expect(multi.medianSolveSeconds).toBe(240);
    expect(multi.medianRunMs).toBe(3);
    expect(multi.fastestPart).toEqual({ day: 1, part: 2, seconds: 180 });
    expect(multi.slowestPart).toEqual({ day: 1, part: 1, seconds: 300 });

    const solved = findPartRecord(validated, 2025, 1, 1);
    expect(computeSolveDurationSeconds(solved as typeof base)).toBe(300);
    expect(formatDuration(45)).toBe('45s');
    expect(formatDuration(300)).toBe('5m 00s');
    expect(formatDuration(3725)).toBe('1h 02m');
    expect(findActiveParts(validated).map((p) => `${p.day}.${p.part}`)).toEqual(['1.2', '2.1']);
    expect(findPartRecord(validated, 2025, 9, 1)).toBeUndefined();
  });

  it('combines per-year statuses in descending year order with latest timestamp', () => {
    const combined = combineYearStatuses([
      { year: 2024, totalDays: 25, updatedAt: '2026-11-26T05:00:00Z', parts: [] },
      sampleDoc.years[0]!,
    ]);
    expect(combined.years.map((y) => y.year)).toEqual([2025, 2024]);
    expect(combined.updatedAt).toBe('2026-11-26T05:00:00Z');
    expect(combineYearStatuses([{ year: 2023, totalDays: 25, parts: [] }]).updatedAt).toBe('1970-01-01T00:00:00Z');
  });

  it('rejects duplicate parts, invalid totalDays, and invalid solved/in_progress fields', () => {
    const base = sampleDoc.years[0]!.parts[0]! as Extract<StatusDocument['years'][0]['parts'][number], { status: 'solved' }>;
    const inProg = sampleDoc.years[0]!.parts[1]! as Extract<StatusDocument['years'][0]['parts'][number], { status: 'in_progress' }>;

    expect(() => validateStatusDocument({ updatedAt: 'x', years: [{ year: 2025, totalDays: 12, parts: [base, base] }] })).toThrow('Duplicate part entry');
    expect(() => validateStatusDocument({ updatedAt: 'x', years: [{ year: 2025, totalDays: 0, parts: [] }] })).toThrow('totalDays must be an integer between 1 and 25');
    expect(() => validateStatusDocument({ updatedAt: 'x', years: [{ year: 2025, totalDays: 12, parts: [{ ...inProg, selectedProposalId: 'missing' }] }] })).toThrow('Unknown selectedProposalId');
    expect(() => validateStatusDocument({ updatedAt: 'x', years: [{ year: 2025, totalDays: 12, parts: [{ ...base, personalInputElapsedMs: -1 }] }] })).toThrow('personalInputElapsedMs must be non-negative');
    expect(() => validateStatusDocument({ updatedAt: 'x', years: [{ year: 2025, totalDays: 12, parts: [{ ...base, startedAt: '2026-11-25T20:10:00Z' }] }] })).toThrow('verifiedAt must not precede startedAt');
    expect(() => validateStatusDocument({ updatedAt: 'x', years: [{ year: 2025, totalDays: 12, parts: [{ ...base, humanWaitSeconds: -1 }] }] })).toThrow('humanWaitSeconds');
    expect(() => validateStatusDocument({ updatedAt: 'x', years: [{ year: 2025, totalDays: 12, parts: [{ ...base, humanWaitSeconds: 400 }] }] })).toThrow('humanWaitSeconds');
    expect(() => formatDuration(-1)).toThrow('Duration seconds must be a non-negative integer');
  });
});
