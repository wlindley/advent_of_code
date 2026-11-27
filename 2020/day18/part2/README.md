# 2020 Day 18 Part 2: Operation Order

## User / Consumer Usage
- **Domain entry**: `solver` exported from `2020/day18/part2/domain/solver.ts` (and `domain/index.ts`).
- **UI manifest**: `manifest` exported from `2020/day18/part2/index.ts` with `exampleAnswer = '694173'`.
- **CLI**: `npm run aoc -- run 2020 18 2`.

## Developer / Maintainer Notes
- Thin wrapper instantiating `new OperationOrderSolver(ADD_BEFORE_MUL_POLICY)` from `../shared`.
- `OperationOrderPart2Visualizer` delegates interactive AST playback to `../../shared/viz/OperationOrderVisualizer.tsx`.
- All arithmetic uses exact `BigInt` values via the shared Pratt parser and polymorphic AST nodes.
