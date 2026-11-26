import { BootCodeSolver, REPAIR_BOOT_POLICY } from '../../shared';

/** Part 2 solver finding the unique jmp/nop repair that reaches normal termination. */
export const solver = new BootCodeSolver(REPAIR_BOOT_POLICY);
