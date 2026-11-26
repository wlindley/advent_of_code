# `2019/day05/shared` — TEST Diagnostic Runner & Visualization Primitives

## Consumer Guide
Pure TypeScript TEST diagnostic runner and shared interactive visualizer for AoC 2019 Day 5.

- `index.ts`: pure TS barrel exporting `AIR_CONDITIONER_SYSTEM_ID`, `THERMAL_RADIATOR_SYSTEM_ID`, `DiagnosticReport`, `DiagnosticSolver`, `createDiagnosticSolver`, `runDiagnostic`, `solveDiagnostic`, `traceDiagnostic`, and `vizLayout` helpers. Zero React/DOM imports.
- `viz/DiagnosticVisualizer.tsx`, `viz/IoStreamPanel.tsx`, `viz/MemoryWindowPanel.tsx`: interactive light-mode TEST diagnostic debugger.

## Maintainer Guide
- `diagnosticRunner.ts`: two-pass probe-then-capture trace (`DEFAULT_MAX_TRACE_STEPS = 160`, `DEFAULT_MAX_MACHINE_STEPS = 100_000`) preserving failing intermediate outputs for inspection while enforcing `allTestsPassed` in `solveDiagnostic`.
- `vizLayout.ts`: arity-bounded cell role classification (`write > ip > read > param > idle`), output badge classification (`pass | fail | diagnostic`), decoded operand formatting, and bounded tape window (`MAX_VISIBLE_TAPE_CELLS = 96`).
