import { describe, expect, it } from 'vitest';
import {
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

describe('status schema and selectors', () => {
  it('validates a well-formed status document and computes derived progress', () => {
    const validated = validateStatusDocument(sampleDoc);
    expect(computeYearProgress(validated.years[0]!)).toEqual({
      totalParts: 24,
      solvedParts: 1,
      inProgressParts: 1,
      blockedParts: 1,
      pendingParts: 21,
      completionPercent: 4,
      totalSolveSeconds: 300,
      elapsedSolveSeconds: 300,
    });
    expect(computeYearProgress({ year: 2024, totalDays: 25, parts: [] })).toEqual({
      totalParts: 50,
      solvedParts: 0,
      inProgressParts: 0,
      blockedParts: 0,
      pendingParts: 50,
      completionPercent: 0,
      totalSolveSeconds: 0,
      elapsedSolveSeconds: 0,
    });
    const baseSolved = sampleDoc.years[0]!.parts[0]! as Extract<StatusDocument['years'][0]['parts'][number], { status: 'solved' }>;
    const gappedYear = computeYearProgress({
      year: 2025,
      totalDays: 12,
      parts: [
        { ...baseSolved, day: 1, part: 2, startedAt: '2026-11-25T20:10:00Z', verifiedAt: '2026-11-25T20:14:00Z' },
        { ...baseSolved, day: 1, part: 1, startedAt: '2026-11-25T20:00:00Z', verifiedAt: '2026-11-25T20:05:00Z' },
      ],
    });
    expect(gappedYear.totalSolveSeconds).toBe(540);
    expect(gappedYear.elapsedSolveSeconds).toBe(840);
    const solved = findPartRecord(validated, 2025, 1, 1);
    expect(solved?.status).toBe('solved');
    expect(computeSolveDurationSeconds(solved as Extract<NonNullable<typeof solved>, { status: 'solved' }>)).toBe(300);
    expect(formatDuration(45)).toBe('45s');
    expect(formatDuration(300)).toBe('5m 00s');
    expect(formatDuration(3725)).toBe('1h 02m');
    expect(findActiveParts(validated).map((p) => `${p.day}.${p.part}`)).toEqual(['1.2', '2.1']);
    expect(findPartRecord(validated, 2025, 9, 1)).toBeUndefined();
  });

  it('rejects duplicate parts, invalid totalDays, and invalid state fields', () => {
    const dup: StatusDocument = {
      updatedAt: sampleDoc.updatedAt,
      years: [{ year: 2025, totalDays: 12, parts: [sampleDoc.years[0]!.parts[0]!, sampleDoc.years[0]!.parts[0]!] }],
    };
    expect(() => validateStatusDocument(dup)).toThrow('Duplicate part entry');
    expect(() =>
      validateStatusDocument({ updatedAt: 'x', years: [{ year: 2025, totalDays: 0, parts: [] }] }),
    ).toThrow('totalDays must be an integer between 1 and 25');

    const badSelected: StatusDocument = {
      updatedAt: 'x',
      years: [{
        year: 2025,
        totalDays: 12,
        parts: [{ ...(sampleDoc.years[0]!.parts[1]! as Extract<StatusDocument['years'][0]['parts'][number], { status: 'in_progress' }>), selectedProposalId: 'missing' }],
      }],
    };
    expect(() => validateStatusDocument(badSelected)).toThrow('Unknown selectedProposalId');

    const badSolved: StatusDocument = {
      updatedAt: 'x',
      years: [{
        year: 2025,
        totalDays: 12,
        parts: [{ ...(sampleDoc.years[0]!.parts[0]! as Extract<StatusDocument['years'][0]['parts'][number], { status: 'solved' }>), personalInputElapsedMs: -1 }],
      }],
    };
    expect(() => validateStatusDocument(badSolved)).toThrow('personalInputElapsedMs must be non-negative');

    const badTimestamps: StatusDocument = {
      updatedAt: 'x',
      years: [{
        year: 2025,
        totalDays: 12,
        parts: [{ ...(sampleDoc.years[0]!.parts[0]! as Extract<StatusDocument['years'][0]['parts'][number], { status: 'solved' }>), startedAt: '2026-11-25T20:10:00Z' }],
      }],
    };
    expect(() => validateStatusDocument(badTimestamps)).toThrow('verifiedAt must not precede startedAt');
    expect(() => formatDuration(-1)).toThrow('Duration seconds must be a non-negative integer');
  });
});
