# 2019 Day 11 Part 2 — Space Police

## Consumer Guide

- **Entry point**: `manifest` in `index.ts` and `solver` in `domain/solver.ts`.
- **CLI execution**: `npm run aoc -- run 2019 11 2` (or pass custom Intcode input).
- **Behavior**: Parses a complete Intcode program, runs the hull-painting robot starting at `(0, 0)` facing `UP` on a white starting panel (`startPanelColor = 1`), and decodes the uppercase 5×6 registration identifier from the final white panels.
- **Visualizer**: `viz/Visualizer.tsx` renders an interactive playback of up to `120` sampled frames with a live `Decoded Hull Registration` banner, panel repaint highlights, recent robot trail, and heading arrow.

## Maintainer Guide

- `domain/solver.ts` instantiates `new PaintingRobotSolver(REGISTRATION_ID_POLICY)` from `../../shared`, delegating VM execution, robot kinematics, 30-bit 5×6 OCR decoding, and trace sampling to the shared Day 11 kernel.
- `domain/index.ts` re-exports `solver` as pure TypeScript with zero React/DOM imports for manifest and CLI consumers.
- `viz/Visualizer.tsx` wraps `HullPainterVisualizer` with `solver` bound to Part 2's registration policy.
