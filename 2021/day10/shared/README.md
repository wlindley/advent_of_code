# 2021 Day 10 — Shared Syntax Scoring Domain

## Consumer Guide

Import the pure TypeScript domain model from `2021/day10/shared` (zero DOM/React dependencies):

- `SyntaxScoringSolver(policy)` — implements `PuzzleSolver<readonly string[], bigint, TTrace>` using either `CORRUPTION_SCORE_POLICY` (Part 1) or `AUTOCOMPLETE_MEDIAN_POLICY` (Part 2).
- `parseNavigationSubsystem(raw)` — splits CRLF/LF text, trims outer blank lines, rejects empty inputs, interior blank lines, and non-bracket characters.
- `classifySyntaxLine(lineIndex, text)` & `analyzeSyntax(lines)` — single-pass stack classification into frozen `CorruptedLineResult`, `IncompleteLineResult`, or `CompleteLineResult` instances inside a frozen `SyntaxAnalysis`.

Visual components live separately under `2021/day10/shared/viz/` (`SyntaxScoringVisualizer`) so headless runners and tests never pull in React.

## Maintainer Guide

One-way module DAG:

`brackets.ts` -> `line.ts` -> `parser.ts` / `analysis.ts` -> `trace.ts` -> `policy.ts` -> `solver.ts` -> `index.ts`

Invariants:
- **Upfront character validation**: `validateBracketText` validates every character before stack scanning, preventing trailing invalid characters after a syntax clash from being silently ignored.
- **Zero stored derived state**: Result, analysis, and trace frame classes store only minimal canonical indices/inputs and compute scores, completions, char roles, and medians dynamically via getters.
- **Exact `bigint` arithmetic**: Autocomplete base-5 totals grow past `2^53` and `2^63` on deep stacks and are represented exclusively as `bigint`.
- **Prototype-safe guards**: `isOpenBracket` and `isCloseBracket` use `ReadonlySet.has(...)` rather than `in`.
