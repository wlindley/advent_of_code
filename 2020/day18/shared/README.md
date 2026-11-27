# Day 18 Shared Domain & Visualizer (`Operation Order`)

## User / Consumer Overview
- `OperationOrderSolver(policy)` implements `Required<PuzzleSolver<HomeworkProgram, bigint, OperationTraceFrame>>` for both Part 1 (`EQUAL_PRECEDENCE_POLICY`) and Part 2 (`ADD_BEFORE_MUL_POLICY`).
- `parseHomework(raw, policy)` parses multi-line expressions with exact `BigInt` operands, ignoring blank lines while preserving 1-based `lineNumber` diagnostics.
- `traceHomework(program, maxSteps)` produces uniformly sampled post-order evaluation frames (`OperationTraceFrame`) capped via `sampleTraceIndices`.

## Developer / Maintainer Architecture
Strict one-way DAG (`policies` -> `lexer` -> `ast` -> `parser` -> `trace` -> `solver` -> `index`, with `viz/` consuming `index` only):
- `policies.ts`: frozen precedence policies and `OPERATOR_EVAL` dispatch map.
- `lexer.ts`: line tokenizer with 1-based column tracking and `BigInt` integer parsing.
- `ast.ts`: polymorphic `ExprNode` hierarchy (`LiteralExpr`, `GroupExpr`, `BinaryExpr`) with post-order `collectSteps`.
- `parser.ts`: Pratt parser parameterized by `PrecedencePolicy` and `HomeworkProgram` with dynamic `totalSteps`.
- `trace.ts`: `ExpressionTraceCollector` with range-skip and inner-skip sampling that preserves the final `cumulativeSum`.
- `viz/`: React SVG AST visualizer (`AstTreeSvg.tsx` + `OperationOrderVisualizer.tsx`).
