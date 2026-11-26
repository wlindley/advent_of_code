export const GITHUB_REPO_BLOB_BASE = 'https://github.com/wlindley/advent_of_code/blob/main';

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

export interface CodeHotspot {
  readonly filePath: string;
  readonly name: string;
  readonly startLine: number;
  readonly endLine: number;
  readonly value: number;
}

export interface ComplexitySummary {
  readonly fileCount: number;
  readonly sloc: number;
  readonly testSloc: number;
  readonly functionCount: number;
  readonly totalCyclomatic: number;
  readonly maxCyclomatic: number;
  readonly maxNestingDepth: number;
  readonly maxFunctionSloc: number;
  readonly nestedFunctionCount: number;
  readonly maintainabilityIndex: number;
  readonly maxCyclomaticHotspot: CodeHotspot | null;
  readonly maxNestingHotspot: CodeHotspot | null;
  readonly longestFunctionHotspot: CodeHotspot | null;
}

export interface ScopeQuality {
  readonly coverage: CoverageSummary;
  readonly complexity: ComplexitySummary;
}

export interface FileQualityRow {
  readonly path: string;
  readonly sloc: number;
  readonly maintainabilityIndex: number;
  readonly maxCyclomatic: number;
  readonly maxNestingDepth: number;
  readonly maxFunctionSloc: number;
  readonly nestedFunctionCount: number;
  readonly coveragePct: number | null;
}

export interface QualityReport {
  readonly generatedAt: string;
  readonly overall: ScopeQuality;
  readonly years: Readonly<Record<string, ScopeQuality>>;
  readonly parts: Readonly<Record<string, ScopeQuality>>;
  readonly files: readonly FileQualityRow[];
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

export function githubBlobUrl(filePath: string, startLine?: number, endLine?: number): string {
  const base = `${GITHUB_REPO_BLOB_BASE}/${filePath.replace(/^\/+/, '')}`;
  if (startLine === undefined) return base;
  if (endLine !== undefined && endLine > startLine) return `${base}#L${startLine}-L${endLine}`;
  return `${base}#L${startLine}`;
}

export function filterFilesForScope(
  files: readonly FileQualityRow[],
  scopePrefix?: string,
): readonly FileQualityRow[] {
  if (!scopePrefix) return files;
  const normalized = scopePrefix.endsWith('/') ? scopePrefix : `${scopePrefix}/`;
  return files.filter((file) => file.path.startsWith(normalized));
}

export function findPartQuality(report: QualityReport, partKey: string): ScopeQuality | undefined {
  return report.parts[partKey];
}

export function findYearQuality(report: QualityReport, year: number): ScopeQuality | undefined {
  return report.years[String(year)];
}
