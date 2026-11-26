# Code Quality Metrics Generator (`tools/quality`)

## Consumer Guide
Generates [`site/data/quality.json`](../../site/data/quality.json) from live Vitest V8 coverage (`coverage/coverage-summary.json`) and TypeScript Compiler API static AST analysis.

```bash
npm run test:coverage
npm run metrics
```

Outputs overall, per-year, and per-puzzle-part metrics:
- **Coverage**: Statements, Branches, Functions, and Lines (exact `covered`/`total` counts from Vitest V8).
- **Complexity & Maintainability**: Source Lines of Code (SLOC), Test SLOC (enabling Test-to-Code ratio), function count, average & max McCabe Cyclomatic Complexity, max control-flow nesting depth, and SEI/Visual Studio normalized Maintainability Index (0–100).

## Maintainer Guide
- `astMetrics.ts`: Pure TypeScript AST/scanner analyzer with zero filesystem I/O. Excludes comments/blank lines from SLOC, computes Halstead volume from scanner tokens, isolates nested function complexity so outer functions are not double-counted, and treats `else if` chains as flat nesting.
- `report.ts`: Pure aggregator merging `AnalyzedFileEntry[]` and `RawCoverageSummary` into a `QualityReport` (`overall`, `years`, `parts`) with strict non-overlapping scope attribution.
- `generate.ts`: Thin Node CLI entrypoint (excluded from unit coverage like `tools/aoc/cli.ts`) that scans workspace `.ts`/`.tsx` files and writes `site/data/quality.json`.
