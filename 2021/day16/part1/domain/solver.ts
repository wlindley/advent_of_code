import { PacketSolver, VERSION_SUM_POLICY } from '../../shared';

/** Part 1 solver: decodes a BITS hexadecimal transmission and sums all packet versions. */
export const solver = new PacketSolver(VERSION_SUM_POLICY);
