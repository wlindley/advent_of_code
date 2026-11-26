# `2019/day02/shared` — Gravity Assist Domain & Tape Visualization Primitives

## Consumer Guide
Pure TypeScript Gravity Assist runner and shared interactive tape visualizer for AoC 2019 Day 2.

- `index.ts`: pure TS barrel exporting `ALARM_1202_INPUTS`, `createAlarmSolver`, `patchProgramInputs`, `runGravityAssist`, `traceGravityAssist`, and `vizLayout` helpers (`classifyCellRole`, `formatInstructionSummary`, `computeTapeWindow`, `computeTapeGridDimensions`). Zero React/DOM imports.
- `viz/IntcodeTapeVisualizer.tsx` & `viz/TapeGridPanel.tsx`: interactive light-mode memory tape step visualizer.

## Maintainer Guide
- `alarmRunner.ts`: two-pass probe-then-capture trace (`DEFAULT_MAX_TRACE_STEPS = 120`, `DEFAULT_MAX_MACHINE_STEPS = 100_000`) snapshotting memory only at sampled indices.
- `vizLayout.ts`: cell role precedence (`write > ip > read > param > patched > idle`), instruction summary formatter, and bounded tape window (`MAX_VISIBLE_TAPE_CELLS = 192`).
