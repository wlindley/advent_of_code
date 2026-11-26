import type {
  ComplexitySummary,
  CoverageCounter,
  CoverageSummary,
  QualityReport,
  ScopeQuality,
} from '../../site/data/quality';
import type { FileAstMetrics } from './astMetrics';

export interface AnalyzedFileEntry {
  readonly relativePath: string;
  readonly isTest: boolean;
  readonly metrics: FileAstMetrics;
}

export interface RawCoverageFileEntry {
  readonly statements: CoverageCounter;
  readonly branches: CoverageCounter;
  readonly functions: CoverageCounter;
  readonly lines: CoverageCounter;
}

export type RawCoverageSummary = Readonly<Record<string, RawCoverageFileEntry>>;

interface ScopeAccumulator {
  fileCount: number;
  sloc: number;
  testSloc: number;
  functionCount: number;
  totalCyclomatic: number;
  maxCyclomatic: number;
  maxNestingDepth: number;
  weightedMiSum: number;
  miWeightSloc: number;
  statements: { covered: number; total: number };
  branches: { covered: number; total: number };
  functions: { covered: number; total: number };
  lines: { covered: number; total: number };
}

function createAccumulator(): ScopeAccumulator {
  return {
    fileCount: 0,
    sloc: 0,
    testSloc: 0,
    functionCount: 0,
    totalCyclomatic: 0,
    maxCyclomatic: 0,
    maxNestingDepth: 0,
    weightedMiSum: 0,
    miWeightSloc: 0,
    statements: { covered: 0, total: 0 },
    branches: { covered: 0, total: 0 },
    functions: { covered: 0, total: 0 },
    lines: { covered: 0, total: 0 },
  };
}

function getOrCreate(map: Map<string, ScopeAccumulator>, key: string): ScopeAccumulator {
  let acc = map.get(key);
  if (!acc) {
    acc = createAccumulator();
    map.set(key, acc);
  }
  return acc;
}

function addFileMetrics(acc: ScopeAccumulator, entry: AnalyzedFileEntry): void {
  if (entry.isTest) {
    acc.testSloc += entry.metrics.sloc;
    return;
  }
  acc.fileCount += 1;
  acc.sloc += entry.metrics.sloc;
  acc.functionCount += entry.metrics.functionCount;
  acc.totalCyclomatic += entry.metrics.totalCyclomatic;
  if (entry.metrics.maxCyclomatic > acc.maxCyclomatic) acc.maxCyclomatic = entry.metrics.maxCyclomatic;
  if (entry.metrics.maxNestingDepth > acc.maxNestingDepth) acc.maxNestingDepth = entry.metrics.maxNestingDepth;
  const weight = Math.max(1, entry.metrics.sloc);
  acc.weightedMiSum += entry.metrics.maintainabilityIndex * weight;
  acc.miWeightSloc += weight;
}

function addCoverage(acc: ScopeAccumulator, cov: RawCoverageFileEntry): void {
  acc.statements.covered += cov.statements.covered;
  acc.statements.total += cov.statements.total;
  acc.branches.covered += cov.branches.covered;
  acc.branches.total += cov.branches.total;
  acc.functions.covered += cov.functions.covered;
  acc.functions.total += cov.functions.total;
  acc.lines.covered += cov.lines.covered;
  acc.lines.total += cov.lines.total;
}

function finalizeScope(acc: ScopeAccumulator): ScopeQuality {
  const coverage: CoverageSummary = {
    statements: { ...acc.statements },
    branches: { ...acc.branches },
    functions: { ...acc.functions },
    lines: { ...acc.lines },
  };
  const complexity: ComplexitySummary = {
    fileCount: acc.fileCount,
    sloc: acc.sloc,
    testSloc: acc.testSloc,
    functionCount: acc.functionCount,
    totalCyclomatic: acc.totalCyclomatic,
    maxCyclomatic: acc.maxCyclomatic,
    maxNestingDepth: acc.maxNestingDepth,
    maintainabilityIndex:
      acc.miWeightSloc > 0 ? Math.round((acc.weightedMiSum / acc.miWeightSloc) * 10) / 10 : 100,
  };
  return { coverage, complexity };
}

export function classifyPathScopes(relativePath: string): { year?: string; partKey?: string } {
  const normalized = relativePath.replaceAll('\\', '/').replace(/^\.\//, '');
  const partMatch = normalized.match(/^(\d{4})\/(day\d{2})\/(part[12])\//);
  if (partMatch) {
    return { year: partMatch[1], partKey: `${partMatch[1]}/${partMatch[2]}/${partMatch[3]}` };
  }
  const yearMatch = normalized.match(/^(\d{4})\//);
  if (yearMatch) return { year: yearMatch[1] };
  return {};
}

export function normalizeCoveragePath(rawKey: string, rootDir: string): string {
  const normRoot = rootDir.replaceAll('\\', '/').replace(/\/$/, '') + '/';
  const normKey = rawKey.replaceAll('\\', '/');
  return normKey.startsWith(normRoot) ? normKey.slice(normRoot.length) : normKey;
}

export function buildQualityReport(
  files: readonly AnalyzedFileEntry[],
  coverageSummary: RawCoverageSummary,
  rootDir: string,
  generatedAt: string,
): QualityReport {
  const overall = createAccumulator();
  const yearMap = new Map<string, ScopeAccumulator>();
  const partMap = new Map<string, ScopeAccumulator>();

  for (const entry of files) {
    addFileMetrics(overall, entry);
    const { year, partKey } = classifyPathScopes(entry.relativePath);
    if (year) addFileMetrics(getOrCreate(yearMap, year), entry);
    if (partKey) addFileMetrics(getOrCreate(partMap, partKey), entry);
  }

  for (const [rawKey, cov] of Object.entries(coverageSummary)) {
    if (rawKey === 'total') continue;
    const rel = normalizeCoveragePath(rawKey, rootDir);
    addCoverage(overall, cov);
    const { year, partKey } = classifyPathScopes(rel);
    if (year) addCoverage(getOrCreate(yearMap, year), cov);
    if (partKey) addCoverage(getOrCreate(partMap, partKey), cov);
  }

  const years: Record<string, ScopeQuality> = {};
  for (const [key, acc] of [...yearMap.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    years[key] = finalizeScope(acc);
  }
  const parts: Record<string, ScopeQuality> = {};
  for (const [key, acc] of [...partMap.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    parts[key] = finalizeScope(acc);
  }

  return { generatedAt, overall: finalizeScope(overall), years, parts };
}
