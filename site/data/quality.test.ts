import { describe, expect, it } from 'vitest';
import {
  averageCyclomatic,
  computeQualityGrade,
  coveragePercent,
  filterFilesForScope,
  findPartQuality,
  findYearQuality,
  githubBlobUrl,
  minCoveragePercent,
  testToCodeRatio,
  type FileQualityRow,
  type QualityReport,
  type ScopeQuality,
} from './quality';

function makeScope(overrides?: {
  covCovered?: number;
  covTotal?: number;
  mi?: number;
  sloc?: number;
  testSloc?: number;
  fns?: number;
  totalCc?: number;
}): ScopeQuality {
  const c = overrides?.covCovered ?? 100;
  const t = overrides?.covTotal ?? 100;
  return {
    coverage: {
      statements: { covered: c, total: t },
      branches: { covered: c, total: t },
      functions: { covered: c, total: t },
      lines: { covered: c, total: t },
    },
    complexity: {
      fileCount: 2,
      sloc: overrides?.sloc ?? 80,
      testSloc: overrides?.testSloc ?? 100,
      functionCount: overrides?.fns ?? 4,
      totalCyclomatic: overrides?.totalCc ?? 10,
      maxCyclomatic: 4,
      maxNestingDepth: 2,
      maxFunctionSloc: 18,
      nestedFunctionCount: 0,
      maintainabilityIndex: overrides?.mi ?? 82,
      maxCyclomaticHotspot: null,
      maxNestingHotspot: null,
      longestFunctionHotspot: null,
    },
  };
}

describe('quality derived metrics, GitHub URLs, and grading', () => {
  it('computes coverage percentages, averages, ratios, URLs, and scope filters', () => {
    expect(coveragePercent({ covered: 0, total: 0 })).toBe(100);
    expect(coveragePercent({ covered: 19, total: 20 })).toBe(95);
    const scope = makeScope({ covCovered: 90, covTotal: 100, fns: 4, totalCc: 11, sloc: 80, testSloc: 100 });
    expect(minCoveragePercent(scope.coverage)).toBe(90);
    expect(averageCyclomatic(scope.complexity)).toBe(2.8);
    expect(testToCodeRatio(scope.complexity)).toBe(1.25);

    const empty = makeScope({ fns: 0, sloc: 0, testSloc: 0 });
    expect(averageCyclomatic(empty.complexity)).toBe(0);
    expect(testToCodeRatio(empty.complexity)).toBe(0);

    expect(githubBlobUrl('/shared/core/math.ts')).toBe(
      'https://github.com/wlindley/advent_of_code/blob/main/shared/core/math.ts',
    );
    expect(githubBlobUrl('shared/core/math.ts', 10, 10)).toBe(
      'https://github.com/wlindley/advent_of_code/blob/main/shared/core/math.ts#L10',
    );
    expect(githubBlobUrl('shared/core/math.ts', 10, 25)).toBe(
      'https://github.com/wlindley/advent_of_code/blob/main/shared/core/math.ts#L10-L25',
    );

    const files: FileQualityRow[] = [
      { path: 'shared/core/math.ts', sloc: 20, maintainabilityIndex: 95, maxCyclomatic: 3, maxNestingDepth: 1, maxFunctionSloc: 10, nestedFunctionCount: 0, coveragePct: 100 },
      { path: '2025/day01/part1/domain/solver.ts', sloc: 40, maintainabilityIndex: 90, maxCyclomatic: 4, maxNestingDepth: 2, maxFunctionSloc: 15, nestedFunctionCount: 0, coveragePct: 100 },
    ];
    expect(filterFilesForScope(files)).toHaveLength(2);
    expect(filterFilesForScope(files, '2025/day01/part1').map((f) => f.path)).toEqual([
      '2025/day01/part1/domain/solver.ts',
    ]);
    expect(filterFilesForScope(files, 'shared/')).toHaveLength(1);

    const report: QualityReport = {
      generatedAt: '2026-11-26T00:00:00Z',
      overall: scope,
      years: { '2025': scope },
      parts: { '2025/day01/part1': scope },
      files,
    };
    expect(findYearQuality(report, 2025)).toBe(scope);
    expect(findYearQuality(report, 2024)).toBeUndefined();
    expect(findPartQuality(report, '2025/day01/part1')).toBe(scope);
    expect(findPartQuality(report, '2025/day99/part1')).toBeUndefined();
  });

  it('assigns A/B/C/D quality grades across thresholds', () => {
    expect(computeQualityGrade(makeScope({ covCovered: 100, mi: 85, fns: 4, totalCc: 12 }))).toBe('A');
    expect(computeQualityGrade(makeScope({ covCovered: 90, mi: 85, fns: 4, totalCc: 12 }))).toBe('B');
    expect(computeQualityGrade(makeScope({ covCovered: 100, mi: 72, fns: 4, totalCc: 12 }))).toBe('B');
    expect(computeQualityGrade(makeScope({ covCovered: 100, mi: 85, fns: 4, totalCc: 28 }))).toBe('B');
    expect(computeQualityGrade(makeScope({ covCovered: 75, mi: 55, fns: 4, totalCc: 40 }))).toBe('C');
    expect(computeQualityGrade(makeScope({ covCovered: 65, mi: 85, fns: 4, totalCc: 8 }))).toBe('D');
    expect(computeQualityGrade(makeScope({ covCovered: 100, mi: 42, fns: 4, totalCc: 8 }))).toBe('D');
  });
});
