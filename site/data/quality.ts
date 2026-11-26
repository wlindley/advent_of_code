export interface CoverageCounter {
  readonly covered: number;
  readonly total: number;
}

export interface CoverageSummary {
  readonly statements: CoverageCounter;
  readonly branches: CoverageCounter;
  readonly functions: CoverageCounter;
  readonly lines: CoverageCounter;
}

export interface ComplexitySummary {
  readonly fileCount: number;
  readonly sloc: number;
  readonly testSloc: number;
  readonly functionCount: number;
  readonly totalCyclomatic: number;
  readonly maxCyclomatic: number;
  readonly maxNestingDepth: number;
  readonly maintainabilityIndex: number;
}

export interface ScopeQuality {
  readonly coverage: CoverageSummary;
  readonly complexity: ComplexitySummary;
}

export interface QualityReport {
  readonly generatedAt: string;
  readonly overall: ScopeQuality;
  readonly years: Readonly<Record<string, ScopeQuality>>;
  readonly parts: Readonly<Record<string, ScopeQuality>>;
}

export type QualityGrade = 'A' | 'B' | 'C' | 'D';

export function coveragePercent(counter: CoverageCounter): number {
  if (counter.total === 0) return 100;
  return Math.round((counter.covered / counter.total) * 1000) / 10;
}

export function minCoveragePercent(coverage: CoverageSummary): number {
  return Math.min(
    coveragePercent(coverage.statements),
    coveragePercent(coverage.branches),
    coveragePercent(coverage.functions),
    coveragePercent(coverage.lines),
  );
}

export function averageCyclomatic(complexity: ComplexitySummary): number {
  if (complexity.functionCount === 0) return 0;
  return Math.round((complexity.totalCyclomatic / complexity.functionCount) * 10) / 10;
}

export function testToCodeRatio(complexity: ComplexitySummary): number {
  if (complexity.sloc === 0) return 0;
  return Math.round((complexity.testSloc / complexity.sloc) * 100) / 100;
}

export function computeQualityGrade(scope: ScopeQuality): QualityGrade {
  const minCov = minCoveragePercent(scope.coverage);
  const { maintainabilityIndex: mi } = scope.complexity;
  const avgCc = averageCyclomatic(scope.complexity);
  if (minCov >= 95 && mi >= 80 && avgCc <= 5) return 'A';
  if (minCov >= 85 && mi >= 65 && avgCc <= 8) return 'B';
  if (minCov >= 70 && mi >= 50) return 'C';
  return 'D';
}

export function findPartQuality(report: QualityReport, partKey: string): ScopeQuality | undefined {
  return report.parts[partKey];
}

export function findYearQuality(report: QualityReport, year: number): ScopeQuality | undefined {
  return report.years[String(year)];
}
