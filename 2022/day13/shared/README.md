# 2022 Day 13 Shared Domain & Visualization

## Consumer Guide

`2022/day13/shared/index.ts` exports the pure TypeScript packet AST, recursive-descent parser, zero-allocation comparator, and comparison trace builder:

- `PacketInt`, `PacketList`, `PacketPair`, `SignalInput`: immutable frozen packet AST nodes and validated pair collections (`PacketValue = PacketInt | PacketList`).
- `parsePacket(line)` / `parseSignalInput(raw)`: strict recursive-descent parser (`MAX_PACKET_DEPTH = 128`) rejecting malformed syntax, leading zeros, extra whitespace, and non-pair blocks.
- `comparePackets(left, right)` / `negateOrder(order)`: returns `-1 | 0 | 1` using virtual `[n]` promotion without allocating wrapper lists.
- `traceComparison(left, right)` / `ComparisonTrace`: records structured `ComparisonStep` events (`compare-list`, `compare-int`, `promote-left`, `promote-right`, `left-exhausted`, `right-exhausted`).

`2022/day13/shared/viz/PacketComparePanel.tsx` renders any `{ left, right, comparison, leftLabel?, rightLabel? }` comparison with its step trace.

## Maintainer Guide

- **Zero-Allocation Hot Path vs. Trace Path**: `comparePackets` handles int-vs-list via `compareIntToList` and `negateOrder` without allocating, while `traceComparison` constructs `new PacketList([int])` on mixed-type promotions so structural equivalence is cross-checked in tests.
- **Immutability & No Stored Derived State**: All domain classes call `Object.freeze(this)` and expose derived metrics (`length`, `isEmpty`, `pairCount`, `packets`) via dynamic getters.
- **Module Boundary**: `shared/index.ts` is pure TypeScript with zero `viz/` imports; all UI components live in `.tsx` files under `shared/viz/`.
