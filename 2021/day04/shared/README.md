# 2021 Day 4 Shared Giant Squid Core (`2021/day04/shared`)

Reusable 5x5 Bingo board/game model, parser, minimax row/column solver, policy-driven winner selection, bounded trace generator, and interactive visualizer shared across Part 1 and Part 2.

## Consumer Interface

- `types.ts`: `BOARD_SIZE`, `BOARD_CELL_COUNT`, `BingoBoard`, `BingoGame`, `BoardWin` (dynamic `score: bigint`), and `WinnerSelectionPolicy`.
- `parser.ts`: `parseBingoGame` validating draw headers and 5x5 board syntax before delegating to domain constructors.
- `engine.ts`: `buildFirstDrawIndex`, `evaluateBoard`, `rankWinningBoards`, `FIRST_WINNER_POLICY`, `LAST_WINNER_POLICY`, and `solveBingoGame`.
- `trace.ts`: `BoardSnapshot`, `BingoTraceFrame`, `buildDrawWindow`, `traceBingoGame` (capped at `DEFAULT_MAX_TRACE_STEPS = 120`), and `createBingoSolver`.
- `index.ts`: pure TypeScript barrel with zero UI/React imports.
- `viz/`: light-mode `DrawStreamBar.tsx`, `BingoBoardCard.tsx`, `BoardStatusStrip.tsx`, and `BingoVisualizer.tsx`.

## Maintainer Architecture

- **Minimax Evaluation**: `evaluateBoard` maps draws to earliest indices (preserving first-occurrence semantics on duplicate draws) and takes the minimum completion time over 5 rows and 5 columns, summing all 25 positions with draw time `> winDrawIndex` as exact `BigInt`.
- **No Stored Derived State**: `BingoGame`, `BoardWin`, `BoardSnapshot`, and `BingoTraceFrame` derive counts, sums, scores, and win flags via getters.
