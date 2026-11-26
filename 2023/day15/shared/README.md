# AoC 2023 Day 15 Shared Domain & Visualization

## Consumer Guide

- **Domain barrel (`2023/day15/shared/index.ts`)**: Pure TypeScript entrypoint (zero React/DOM/viz imports) exporting:
  - HASH primitives: `HASH_MULTIPLIER`, `HASH_BUCKET_COUNT`, `HASH_MASK`, `assertPrintableAscii`, `HashCharTransition`, `hashAscii`, `traceHashCharacters`.
  - Sequence parser: `parseInitSequence`.
- **Visualization (`2023/day15/shared/viz/HashPipelineRibbon.tsx`)**: Reusable horizontal character-by-character HASH pipeline ribbon (`char (ASCII) -> +code -> x17 -> &255 = after`) shared across Part 1 and Part 2.

## Maintainer Architecture

- `hash.ts`: Validates printable ASCII (`0x20..0x7E`), implements `((h + code) * 17) & 255`, and models per-character steps via `HashCharTransition` with dynamic `ascii`, `added`, `multiplied`, and `after` getters (zero stored derived state).
- `sequence.ts`: Strips `/[\r\n]+/g`, splits on `,`, rejects empty inputs, empty tokens, spaces, and non-printable ASCII, and returns a frozen token array.
- `hash.test.ts` & `sequence.test.ts`: Unit tests covering official HASH transitions, boundary ASCII values, and every validation guard.
