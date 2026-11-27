# 2020 Day 18 Part 1: Operation Order

## User / Consumer Usage
- **Domain entry**: `solver` exported from `2020/day18/part1/domain/solver.ts` (and `domain/index.ts`).
- **UI manifest**: `manifest` exported from `2020/day18/part1/index.ts` with `exampleAnswer = '26457'`.
- **CLI**: `npm run aoc -- run 2020 18 1`.

## Developer / Maintainer Notes
- Thin wrapper instantiating `new OperationOrderSolver(EQUAL_PRECEDENCE_POLICY)` from `../shared`.
- `OperationOrderPart1Visualizer` delegates interactive AST playback to `../../shared/viz/OperationOrderVisualizer.tsx`.
- All arithmetic uses exact `BigInt` values via the shared Pratt parser and polymorphic AST nodes.
