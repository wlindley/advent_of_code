# 2020 Day 6 Shared Domain (`Custom Customs`)

## Consumer Guide

Import pure domain types, policies, and solvers from `2020/day06/shared`:

- `parseCustomsBatch(raw)` -> `CustomsBatch` of validated, immutable `CustomsGroup` and `PersonDeclaration` value objects.
- `ANY_YES_POLICY` / `ALL_YES_POLICY` -> `GroupConsensusPolicy` strategies evaluating group union (OR) or intersection (AND) over 26-bit `'a'..'z'` masks.
- `sumGroupConsensus(batch, policy)` -> total consensus count across all groups.
- `traceCustomsBatch(batch, policy, maxSteps?)` -> budget-bounded `CustomsTraceFrame[]` snapshots preserving running sums and endpoints.
- `new CustomsSolver(policy)` -> `PuzzleSolver` implementation exposing `parse`, `solve`, and `trace`.

Interactive React visualizers live separately under `2020/day06/shared/viz/` and are never re-exported by `shared/index.ts`.

## Maintainer Architecture

Strict one-way DAG:

`shared/core -> question.ts -> declaration.ts -> policy.ts -> trace.ts -> solver.ts -> index.ts`

- Every domain value object is deeply frozen (`Object.freeze(this)`) with zero stored derived state.
- `popcount26(mask)` uses 32-bit SWAR (`Math.imul`) over validated 26-bit masks (`0..0x3ffffff`).
- `encodeAnswerLine` intentionally does not trim; `parseCustomsBatch` handles line trimming and blank-line group splitting.
