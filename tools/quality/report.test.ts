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

  it('aggregates AST complexity, hotspots, file rows, and V8 coverage', () => {
    const entries: AnalyzedFileEntry[] = [
      {
        relativePath: 'shared/core/empty.ts',
        isTest: false,
        metrics: analyzeSourceFile('shared/core/empty.ts', 'export type Empty = number;'),
      },
      {
        relativePath: 'shared/core/math.ts',
        isTest: false,
        metrics: analyzeSourceFile('shared/core/math.ts', 'export const mod = (a: number, m: number) => ((a % m) + m) % m;'),
      },
      {
        relativePath: '2025/day01/shared/dial.ts',
        isTest: false,
        metrics: analyzeSourceFile('2025/day01/shared/dial.ts', 'export function turn(p: number, d: number) {\n  if (d > 0) return p + d;\n  return p - d;\n}'),
      },
      {
        relativePath: '2025/day01/part1/domain/solver.ts',
        isTest: false,
        metrics: analyzeSourceFile('2025/day01/part1/domain/solver.ts', 'export function solve(xs: number[]) {\n  let s = 0;\n  for (const x of xs) {\n    if (x === 0) s++;\n  }\n  return s;\n}'),
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
    expect(report.overall.complexity.fileCount).toBe(5);
    expect(report.overall.complexity.maxCyclomaticHotspot?.filePath).toBe('2025/day01/part1/domain/solver.ts');
    expect(report.overall.complexity.longestFunctionHotspot?.value).toBe(7);
    expect(report.files).toHaveLength(5);
    expect(report.files.find((f) => f.path === 'shared/core/empty.ts')?.coveragePct).toBeNull();
    expect(report.files.find((f) => f.path === '2025/day01/part2/domain/solver.ts')?.coveragePct).toBe(50);

    const empty = buildQualityReport([], {}, '/repo', '2026-11-26T00:00:00Z');
    expect(empty.overall.complexity.maintainabilityIndex).toBe(100);
    expect(empty.files).toEqual([]);
  });
});
