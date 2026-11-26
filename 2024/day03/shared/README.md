# `2024/day03/shared`

## Consumer Guide
Shared pure-TypeScript domain primitives for Advent of Code 2024 Day 3 ("Mull It Over").

### Public API (`2024/day03/shared/index.ts`)
- `MIN_OPERAND`, `MAX_OPERAND`, `MAX_OPERAND_DIGITS`, `ControlKind`, `MemoryInstruction`
- `MulInstruction`: frozen value object holding `x`, `y` (`[0, 999]`), span `[start, end)`, and dynamic `product`.
- `ControlInstruction`: frozen value object holding `'do' | 'dont'` and span `[start, end)`.
- `ParsedMemory`: frozen container holding `raw`, validated non-overlapping `instructions`, and dynamic `mulInstructions`.
- `parseCorruptedMemory(raw)`: single-pass zero-backtracking `charCodeAt` scanner over a continuous stream.

## Maintainer Guide
- **Pure domain**: zero DOM/React/Node dependencies; immutable frozen value objects with no stored derived state.
- **Zero-backtracking scanner**: on mismatch at `c > start`, `tryScanMul` and `tryScanControl` return `nextPos = c` (never `c + 1`) so an inner `'m'` or `'d'` starts a fresh token immediately.
- **Continuous stream**: never splits lines; newlines inside tokens break the match cleanly.
