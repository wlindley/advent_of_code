# 2020 Day 19 Shared Domain (`Monster Messages`)

## Consumer Overview

Pure TypeScript domain modules for parsing, normalizing, and matching context-free grammar messages using a bitset-accelerated CYK chart parameterized by `GrammarPolicy`:

- `RAW_GRAMMAR_POLICY` (Part 1): uses the parsed grammar unchanged.
- `LOOP_PATCHED_GRAMMAR_POLICY` (Part 2): patches rules `8` (`42 | 42 8`) and `11` (`42 31 | 42 11 31`).
- `MonsterMessagesSolver`: implements `PuzzleSolver<MonsterMessagesInput, number, MonsterTraceFrame>`.

## Developer Architecture

```text
grammar.ts + policies.ts -> parser.ts -> cnf.ts -> cyk.ts -> spans.ts -> trace.ts -> solver.ts -> index.ts
```

- **CNF Compilation (`cnf.ts`)**: Dense-indexes original rules, right-binarizes sequences of length `>= 3`, computes reflexive-transitive unit-rule closure via cycle-safe BFS (`Int32Array` visit stamps), deduplicates binary rules, and packs Left-CSR and LHS-CSR lookup tables.
- **Bitset CYK (`cyk.ts`)**: Evaluates triangular `Uint32Array` bitset rows using bit-31-safe `bits & -bits` + `Math.clz32` iteration and reuses a single buffer across all candidate messages.
- **Witness & Triangle (`spans.ts`)**: Reconstructs an unfolded witness derivation tree (`sym >= origCount` skipped) and classifies triangle cells into `'0' | '4' | '3' | 'w' | 'r' | '.'`.
