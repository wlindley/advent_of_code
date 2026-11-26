# `2022/day02/shared`

## Consumer Guide
Shared pure-TypeScript domain primitives for Advent of Code 2022 Day 2 ("Rock Paper Scissors").

### Public API (`2022/day02/shared/index.ts`)
- `Shape`, `Outcome`, `SHAPE_LABELS`, `OUTCOME_LABELS`, `isShape`, `evaluateOutcome`: modular Rock-Paper-Scissors encoding (`0 | 1 | 2`) where `evaluateOutcome(opponent, player)` computes `euclideanMod(player - opponent + 1, 3)`.
- `StrategyRound`, `parseStrategyGuide(raw)`: parses `LF`/`CRLF` round lines (`A|B|C` + `X|Y|Z`), skipping blank lines while reporting 1-based physical `Line N` validation errors and sequential 1-based `roundNumber` values.
- `ResolvedRound`, `RoundResolver`, `MatchupSummary`, `scoreStrategyGuide`, `traceStrategyGuide`: strategy-agnostic scoring and bounded-trace simulation (`DEFAULT_MAX_TRACE_STEPS = 120`) producing immutable 3x3 matchup count snapshots.

## Maintainer Guide
- **Pure domain**: depends only on `shared/core` (`euclideanMod`, `sampleTraceIndices`, `validateMaxSteps`, `TraceOptions`); zero DOM/React/Node dependencies.
- **Invariants**: `StrategyRound`, `ResolvedRound`, and `MatchupSummary` are frozen immutable value objects with no stored derived state (`opponentShape`, `outcome`, `shapeScore`, `outcomeScore`, `totalScore`, `totalRounds`, `wins`, `draws`, `losses` are dynamic getters). `MatchupSummary` copies and validates its 9-slot `counts` array (`opponent * 3 + player`) on construction so trace frames remain isolated across simulation steps.
