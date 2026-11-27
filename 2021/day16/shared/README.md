# 2021 Day 16 — Shared Packet Decoder Domain

Pure TypeScript BITS bitstream reader, recursive-descent AST decoder, BigInt policy evaluator, and reusable visualizer for Advent of Code 2021 Day 16 (*Packet Decoder*).

## Consumer API (`shared/index.ts`)

- **Bitstream (`bitstream.ts`)**: `parseHexNibble`, `parseHexBitstream(raw)`, `HexBitstream`, and stateful `BitCursor` (`readUint(1..30)`).
- **Packet AST (`packet.ts`)**: `BitSpan`, `LITERAL_TYPE_ID`, `LiteralPacket`, `OperatorPacket`, and structural derived getters (`versionSum`, `packetCount`, `maxDepth`).
- **Decoder (`decoder.ts`)**: `DecodedTransmission`, `decodeNextPacket(cursor)`, and `decodeTransmission(stream)` with strict zero-padding and length-bound checks.
- **Evaluator (`evaluator.ts`)**: Frozen `OPERATOR_SPECS` lookup table, `PacketPolicy`, `VERSION_SUM_POLICY`, `EVALUATE_EXPRESSION_POLICY`, and `evaluatePacket(packet)`.
- **Trace (`trace.ts`)**: `DEFAULT_MAX_TRACE_STEPS`, `IndexedPacketNode`, `PacketTraceSnapshot`, `PacketTraceFrame`, and `traceTransmission(tx, policy, options)`.
- **Solver (`solver.ts`)**: `PacketSolver` parameterized by `PacketPolicy`.

## Maintainer Architecture

- **Dependency DAG**: `bitstream` → `packet` → `decoder` → `evaluator` → `trace` → `solver` → `index.ts` (zero `viz/` imports).
- **Immutability & Typed Buffers**: Value objects call `Object.freeze(this)` without freezing `Uint8Array` or `Int32Array` buffers.
- **Total Operator Dispatch**: `OPERATOR_SPECS` maps all 7 operator type IDs (`0, 1, 2, 3, 5, 6, 7`) without `switch` chains, while `VERSION_SUM_POLICY` bypasses expression arity rules.
- **Shared Visualization (`shared/viz/`)**: `PacketVisualizer`, `PacketTelemetry`, `BitSpanStrip` (capped at 64 bits), and `PacketAstTree` (windowed at 120 rows) sample at most 60 frames using light-mode CSS tokens.
