import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { analyzeSourceFile } from './astMetrics';
import { buildQualityReport, type AnalyzedFileEntry, type RawCoverageSummary } from './report';

const IGNORED_DIRS = new Set(['node_modules', 'dist', 'coverage', '.git', '.aoc-cache', '.worktrees', 'archive']);

function collectSourceFiles(dir: string, rootDir: string, out: AnalyzedFileEntry[]): void {
  for (const name of readdirSync(dir)) {
    if (IGNORED_DIRS.has(name)) continue;
    const full = join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      collectSourceFiles(full, rootDir, out);
    } else if (name.endsWith('.ts') || name.endsWith('.tsx')) {
      if (name.endsWith('.d.ts')) continue;
      const relativePath = relative(rootDir, full).replaceAll('\\', '/');
      const sourceText = readFileSync(full, 'utf8');
      out.push({
        relativePath,
        isTest: /\.test\.tsx?$/.test(name),
        metrics: analyzeSourceFile(relativePath, sourceText),
      });
    }
  }
}

const rootDir = resolve(process.cwd());
const coveragePath = join(rootDir, 'coverage', 'coverage-summary.json');
const coverageSummary = JSON.parse(readFileSync(coveragePath, 'utf8')) as RawCoverageSummary;

const files: AnalyzedFileEntry[] = [];
collectSourceFiles(rootDir, rootDir, files);

const report = buildQualityReport(files, coverageSummary, rootDir, new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'));
const outputPath = join(rootDir, 'site', 'data', 'quality.json');
writeFileSync(outputPath, `${JSON.stringify(report)}\n`, 'utf8');
console.log(
  `Wrote ${outputPath}: ${report.overall.complexity.fileCount} files, ${report.overall.complexity.sloc} SLOC, MI ${report.overall.complexity.maintainabilityIndex}`,
);
