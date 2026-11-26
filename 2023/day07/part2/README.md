# 2023 Day 07 Part 2 — Camel Cards (Jokers)

## Consumer Guide

- **Domain entrypoint** ([domain/index.ts](domain/index.ts)): exports `JOKER_CARD_ORDER`, `classifyJokerHand`, `jokerHandRule`, `solveCamelCardsPart2`, `traceCamelCardsPart2`, and `solver` (`parse`, `solve`, `trace`) backed by [../../shared](../../shared/index.ts).
- **Site manifest** ([index.ts](index.ts)): registers Part 2 metadata, 5-hand example (`exampleAnswer: '5905'`), `solver`, and `Visualizer`.

## Maintainer Guide

- `classifyJokerHand` tallies cards via `tallyCards`, separates `'J'` wildcards, promotes `FiveOfAKind` directly when all five cards are `'J'`, and adds `jokers` to the largest descending non-joker frequency before calling `classifyFrequencySignature`.
- `jokerHandRule` sets `wildLabel: 'J'` and `JOKER_CARD_ORDER` (`'J'` at strength `0`, `'2'..'A'` at `1..12`) so `packHandStrengthKey` and `CamelCardsVisualizer` handle wildcard highlighting and tie-break comparison uniformly without touching Part 1 or shared code.
