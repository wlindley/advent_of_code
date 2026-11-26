import { describe, expect, it } from 'vitest';
import { analyzeSourceFile } from './astMetrics';
import { buildQualityReport, classifyPathScopes, normalizeCoveragePath, type AnalyzedFileEntry } from './report';

describe('quality report builder', () => {
  it('classifies repo-relative paths into year and part scopes', () => {
    expect(classifyPathScopes('2025/day01/part1/domain/solver.ts')).toEqual({
      year: '2025',
      partKey: '2025/day01/part1',
    });
    expect(classifyPathScopes('2025\\day01\\shared\\dial.ts')).toEqual({ year: '2025' });
    expect(classifyPathScopes('./shared/core/math.ts')).toEqual({});
    expect(normalizeCoveragePath('/repo/2025/day01/part1/domain/solver.ts', '/repo')).toBe(
      '2025/day01/part1/domain/solver.ts',
    );
    expect(normalizeCoveragePath('relative/file.ts', '/repo')).toBe('relative/file.ts');
  });

  it('aggregates AST complexity and V8 coverage without double-counting shared files', () => {
    const entries: AnalyzedFileEntry[] = [
      {
        relativePath: 'shared/core/math.ts',
        isTest: false,
        metrics: analyzeSourceFile('shared/core/math.ts', 'export const mod = (a: number, m: number) => ((a % m) + m) % m;'),
      },
      {
        relativePath: '2025/day01/shared/dial.ts',
        isTest: false,
        metrics: analyzeSourceFile('2025/day01/shared/dial.ts', 'export function turn(p: number, d: number) { if (d > 0) return p + d; return p - d; }'),
      },
      {
        relativePath: '2025/day01/part1/domain/solver.ts',
        isTest: false,
        metrics: analyzeSourceFile('2025/day01/part1/domain/solver.ts', 'export function solve(xs: number[]) { let s = 0; for (const x of xs) { if (x === 0) s++; } return s; }'),
      },
      {
        relativePath: '2025/day01/part1/domain/solver.test.ts',
        isTest: true,
        metrics: analyzeSourceFile('2025/day01/part1/domain/solver.test.ts', 'export const t = 1;\nexport const u = 2;'),
      },
      {
        relativePath: '2025/day01/part2/domain/solver.ts',
        isTest: false,
        metrics: analyzeSourceFile('2025/day01/part2/domain/solver.ts', 'export const solve = () => 42;'),
      },
    ];

    const cov = {
      total: {
        statements: { covered: 999, total: 999 },
        branches: { covered: 999, total: 999 },
        functions: { covered: 999, total: 999 },
        lines: { covered: 999, total: 999 },
      },
      '/repo/shared/core/math.ts': {
        statements: { covered: 2, total: 2 },
        branches: { covered: 0, total: 0 },
        functions: { covered: 1, total: 1 },
        lines: { covered: 2, total: 2 },
      },
      '/repo/2025/day01/shared/dial.ts': {
        statements: { covered: 4, total: 4 },
        branches: { covered: 2, total: 2 },
        functions: { covered: 1, total: 1 },
        lines: { covered: 4, total: 4 },
      },
      '/repo/2025/day01/part1/domain/solver.ts': {
        statements: { covered: 5, total: 5 },
        branches: { covered: 2, total: 2 },
        functions: { covered: 1, total: 1 },
        lines: { covered: 5, total: 5 },
      },
      '/repo/2025/day01/part2/domain/solver.ts': {
        statements: { covered: 1, total: 2 },
        branches: { covered: 0, total: 0 },
        functions: { covered: 1, total: 1 },
        lines: { covered: 1, total: 2 },
      },
    };

    const report = buildQualityReport(entries, cov, '/repo', '2026-11-26T00:00:00Z');
    expect(report.overall.complexity.fileCount).toBe(4);
    expect(report.overall.complexity.testSloc).toBe(2);
    expect(report.overall.coverage.statements).toEqual({ covered: 12, total: 13 });
    expect(report.years['2025']?.complexity.fileCount).toBe(3);
    expect(report.years['2025']?.coverage.statements).toEqual({ covered: 10, total: 11 });
    expect(report.parts['2025/day01/part1']?.complexity.maxNestingDepth).toBe(2);
    expect(report.parts['2025/day01/part1']?.complexity.testSloc).toBe(2);
    expect(report.parts['2025/day01/part2']?.coverage.lines).toEqual({ covered: 1, total: 2 });

    // Empty report exercises zero-weight MI fallback
    const empty = buildQualityReport([], {}, '/repo', '2026-11-26T00:00:00Z');
    expect(empty.overall.complexity.maintainabilityIndex).toBe(100);
  });
});
