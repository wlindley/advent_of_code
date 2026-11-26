# 2023 Day 07 Shared Camel Cards Domain & Visualizer

## Consumer Guide

- **Domain barrel** ([index.ts](index.ts)): pure TypeScript exports for card primitives (`STANDARD_CARD_LABELS`, `HandType`, `parseCardTuple`), rule abstractions (`CamelHandRule`, `packHandStrengthKey`), immutable hand/deal entities (`CamelHand`, `RankedHand`, `CamelCardsDeal`), parsing (`parseCamelCardsDeal`), and bounded trace generation (`traceCamelCardsDeal`, `CamelCardsTraceFrame`, `ratioBigInt`).
- **Reusable visualizer** ([viz/CamelCardsVisualizer.tsx](viz/CamelCardsVisualizer.tsx)): renders any `PuzzleSolver<CamelCardsDeal, bigint, CamelCardsTraceFrame>` with card spotlight, tie-break highlights, 7-tier distribution chart, cumulative winnings sparkline, and rank ledger.

## Maintainer Guide

- `packHandStrengthKey` encodes each hand into a 24-bit integer `(handType << 20) | (s0 << 16) | (s1 << 12) | (s2 << 8) | (s3 << 4) | s4`, enabling fast numeric comparison while breaking ties deterministically on `inputIndex`.
- `CamelCardsTraceFrame` retains the exact `rank - 1` predecessor from the full sorted deal even when `traceCamelCardsDeal` samples down to `maxSteps` frames.
- `shared/index.ts` intentionally omits `.tsx` re-exports so pure Node/CLI consumers never pull React or DOM types.
