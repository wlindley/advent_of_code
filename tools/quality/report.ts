import {
  minCoveragePercent,
  type CodeHotspot,
  type ComplexitySummary,
  type CoverageCounter,
  type CoverageSummary,
  type FileQualityRow,
  type QualityReport,
  type ScopeQuality,
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
  maxFunctionSloc: number;
  nestedFunctionCount: number;
  weightedMiSum: number;
  miWeightSloc: number;
  maxCyclomaticHotspot: CodeHotspot | null;
  maxNestingHotspot: CodeHotspot | null;
  longestFunctionHotspot: CodeHotspot | null;
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
    maxFunctionSloc: 0,
    nestedFunctionCount: 0,
    weightedMiSum: 0,
    miWeightSloc: 0,
    maxCyclomaticHotspot: null,
    maxNestingHotspot: null,
    longestFunctionHotspot: null,
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

function pickHigherHotspot(current: CodeHotspot | null, candidate: CodeHotspot | null): CodeHotspot | null {
  if (!candidate) return current;
  if (!current || candidate.value > current.value) return candidate;
  return current;
}

function addFileMetrics(acc: ScopeAccumulator, entry: AnalyzedFileEntry): void {
  if (entry.isTest) {
    acc.testSloc += entry.metrics.sloc;
    return;
  }
  const m = entry.metrics;
  acc.fileCount += 1;
  acc.sloc += m.sloc;
  acc.functionCount += m.functionCount;
  acc.totalCyclomatic += m.totalCyclomatic;
  acc.nestedFunctionCount += m.nestedFunctionCount;
  if (m.maxCyclomatic > acc.maxCyclomatic) acc.maxCyclomatic = m.maxCyclomatic;
  if (m.maxNestingDepth > acc.maxNestingDepth) acc.maxNestingDepth = m.maxNestingDepth;
  if (m.maxFunctionSloc > acc.maxFunctionSloc) acc.maxFunctionSloc = m.maxFunctionSloc;
  acc.maxCyclomaticHotspot = pickHigherHotspot(acc.maxCyclomaticHotspot, m.maxCyclomaticHotspot);
  acc.maxNestingHotspot = pickHigherHotspot(acc.maxNestingHotspot, m.maxNestingHotspot);
  acc.longestFunctionHotspot = pickHigherHotspot(acc.longestFunctionHotspot, m.longestFunctionHotspot);
  const weight = Math.max(1, m.sloc);
  acc.weightedMiSum += m.maintainabilityIndex * weight;
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
    maxFunctionSloc: acc.maxFunctionSloc,
    nestedFunctionCount: acc.nestedFunctionCount,
    maintainabilityIndex:
      acc.miWeightSloc > 0 ? Math.round((acc.weightedMiSum / acc.miWeightSloc) * 10) / 10 : 100,
    maxCyclomaticHotspot: acc.maxCyclomaticHotspot,
    maxNestingHotspot: acc.maxNestingHotspot,
    longestFunctionHotspot: acc.longestFunctionHotspot,
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

function buildFileRows(
  files: readonly AnalyzedFileEntry[],
  covByRelPath: ReadonlyMap<string, RawCoverageFileEntry>,
): FileQualityRow[] {
  return files
    .filter((entry) => !entry.isTest)
    .map((entry) => {
      const cov = covByRelPath.get(entry.relativePath);
      return {
        path: entry.relativePath,
        sloc: entry.metrics.sloc,
        maintainabilityIndex: entry.metrics.maintainabilityIndex,
        maxCyclomatic: entry.metrics.maxCyclomatic,
        maxNestingDepth: entry.metrics.maxNestingDepth,
        maxFunctionSloc: entry.metrics.maxFunctionSloc,
        nestedFunctionCount: entry.metrics.nestedFunctionCount,
        coveragePct: cov ? minCoveragePercent(cov) : null,
      };
    })
    .sort((a, b) => a.path.localeCompare(b.path));
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

  const covByRel = new Map<string, RawCoverageFileEntry>();
  for (const [rawKey, cov] of Object.entries(coverageSummary)) {
    if (rawKey === 'total') continue;
    const rel = normalizeCoveragePath(rawKey, rootDir);
    covByRel.set(rel, cov);
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

  return {
    generatedAt,
    overall: finalizeScope(overall),
    years,
    parts,
    files: buildFileRows(files, covByRel),
  };
}
