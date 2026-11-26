# 2021 Day 3 Shared Binary Diagnostic Core (`2021/day03/shared`)

Reusable binary report model, column tallying and row-subset filtering primitives, bit-selection criteria, power analysis, bounded SVG chart geometry, and interactive visualizer shared across Part 1 and Part 2.

## Consumer Interface

- `report.ts`: `Bit`, `BitTally`, `DiagnosticReport` (`countBitsAtColumn`, `filterRowsByBit`, `valueAt`), and `parseDiagnosticReport`.
- `criteria.ts`: `BitCriterion`, `MOST_COMMON_CRITERION`, and `LEAST_COMMON_CRITERION`.
- `powerAnalysis.ts`: `DEFAULT_MAX_TRACE_STEPS` (`120`), `PowerRates`, `PowerTraceFrame`, `tallyAllColumns`, `analyzePowerConsumption`, and `tracePowerConsumption`.
- `chartGeometry.ts`: `CHART_VIEWBOX`, `MAX_VISIBLE_COLUMNS` (`64`), `formatBitPreview`, and `buildColumnChartGeometry`.
- `index.ts`: pure TypeScript barrel exporting domain APIs without any UI/React imports.
- `viz/`: light-mode `ColumnTallyChart.tsx` and `PowerDiagnosticVisualizer.tsx`.

## Maintainer Architecture

- **Single Validation Boundary**: `DiagnosticReport` validates non-emptiness, binary digits, and uniform bit width once; `parseDiagnosticReport` trims/splits lines and delegates directly.
- **Exact BigInt Rates**: Gamma, epsilon, and power consumption use `bigint`, while `PowerRates` computes `powerConsumption`, `gammaBinary`, and `epsilonBinary` dynamically via getters.
- **Bounded Visualization**: `tracePowerConsumption` caps playback frames at `120` via `sampleTraceIndices`, and `buildColumnChartGeometry` clamps rendered bars to a sliding window of `<= 64` columns.
