import type { PuzzleSolver, TraceOptions } from '../../../shared/core';
import { parseHexBitstream, type HexBitstream } from './bitstream';
import { decodeTransmission, type DecodedTransmission } from './decoder';
import type { PacketPolicy } from './evaluator';
import { traceTransmission, type PacketTraceFrame } from './trace';

/** Parameterizable solver for 2021 Day 16 Packet Decoder (Part 1 = version sum, Part 2 = evaluate). */
export class PacketSolver
  implements Required<PuzzleSolver<HexBitstream, bigint, PacketTraceFrame>>
{
  constructor(readonly policy: PacketPolicy) {
    Object.freeze(this);
  }

  parse(raw: string): HexBitstream {
    return parseHexBitstream(raw);
  }

  analyze(input: HexBitstream): DecodedTransmission {
    return decodeTransmission(input);
  }

  solve(input: HexBitstream): bigint {
    return this.policy.compute(this.analyze(input).root);
  }

  trace(input: HexBitstream, options?: TraceOptions): readonly PacketTraceFrame[] {
    return traceTransmission(this.analyze(input), this.policy, options);
  }

  formatAnswer(answer: bigint): string {
    return answer.toString();
  }
}
