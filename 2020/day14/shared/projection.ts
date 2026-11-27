import { assertUint36, WORD_BITS, type DockingInstruction, type MaskChar } from './model';
import type { DecoderPolicyId, DockingTraceFrame } from './policies';

export type BitGateRole = 'force-one' | 'force-zero' | 'pass' | 'float';

export interface BitGateColumn {
  readonly index: number;
  readonly bitPower: number;
  readonly maskChar: MaskChar;
  readonly inputBit: '0' | '1' | null;
  readonly outputBit: MaskChar | null;
  readonly role: BitGateRole;
  readonly changed: boolean;
}

export interface StepLedgerSummary {
  readonly stepTitle: string;
  readonly inputLabel: string;
  readonly outputLabel: string;
  readonly inputBinary: string | null;
  readonly outputDisplay: string | null;
  readonly writesSummary: string;
}

/** Formats an unsigned 36-bit BigInt as a zero-padded 36-character binary string. */
export function formatUint36Binary(value: bigint): string {
  return assertUint36(value, 'value').toString(2).padStart(WORD_BITS, '0');
}

/** Formats a docking instruction into a canonical single-line summary. */
export function formatInstructionLabel(instruction: DockingInstruction): string {
  return instruction.kind === 'mask'
    ? `mask = ${instruction.mask.pattern}`
    : `mem[${instruction.address}] = ${instruction.value}`;
}

function resolveGateRole(policyId: DecoderPolicyId, maskChar: MaskChar): BitGateRole {
  if (maskChar === '1') return 'force-one';
  if (policyId === 'decoder-v1') return maskChar === '0' ? 'force-zero' : 'pass';
  return maskChar === 'X' ? 'float' : 'pass';
}

function resolveOutputBit(policyId: DecoderPolicyId, maskChar: MaskChar, inputBit: '0' | '1'): MaskChar {
  if (policyId === 'decoder-v1') return maskChar === 'X' ? inputBit : maskChar;
  return maskChar === '0' ? inputBit : maskChar;
}

/** Projects a trace frame into 36 MSB-to-LSB bit-gate columns for SVG rendering. */
export function projectBitGateColumns(frame: DockingTraceFrame): readonly BitGateColumn[] {
  const instr = frame.instruction;
  const inputBin =
    instr.kind === 'mem'
      ? formatUint36Binary(frame.policyId === 'decoder-v1' ? instr.value : instr.address)
      : null;
  const columns: BitGateColumn[] = [];
  for (let i = 0; i < WORD_BITS; i += 1) {
    const maskChar = frame.activeMask.pattern.charAt(i) as MaskChar;
    const role = resolveGateRole(frame.policyId, maskChar);
    const inputBit = inputBin === null ? null : (inputBin.charAt(i) as '0' | '1');
    const outputBit = inputBit === null ? null : resolveOutputBit(frame.policyId, maskChar, inputBit);
    columns.push(
      Object.freeze({
        index: i,
        bitPower: WORD_BITS - 1 - i,
        maskChar,
        inputBit,
        outputBit,
        role,
        changed: inputBit !== null && outputBit !== inputBit,
      }),
    );
  }
  return Object.freeze(columns);
}

function buildWriteStepSummary(frame: DockingTraceFrame, address: bigint, value: bigint): StepLedgerSummary {
  const stepTitle = `mem[${address}] = ${value}`;
  const writesSummary = `${frame.writesInStep} write${frame.writesInStep === 1 ? '' : 's'}`;
  if (frame.policyId === 'decoder-v1') {
    const masked = frame.activeMask.applyToValue(value);
    return Object.freeze({
      stepTitle,
      inputLabel: `Value ${value}`,
      outputLabel: `Masked ${masked} -> mem[${address}]`,
      inputBinary: formatUint36Binary(value),
      outputDisplay: formatUint36Binary(masked),
      writesSummary,
    });
  }
  const base = frame.activeMask.baseAddressFor(address);
  const outputDisplay = projectBitGateColumns(frame).map((col) => col.outputBit).join('');
  return Object.freeze({
    stepTitle,
    inputLabel: `Address ${address}`,
    outputLabel: `Base ${base} (${frame.writesInStep} target${frame.writesInStep === 1 ? '' : 's'})`,
    inputBinary: formatUint36Binary(address),
    outputDisplay,
    writesSummary,
  });
}

/** Projects a trace frame into concise human-readable telemetry labels and bit strings. */
export function projectStepSummary(frame: DockingTraceFrame): StepLedgerSummary {
  const instr = frame.instruction;
  if (instr.kind === 'mem') return buildWriteStepSummary(frame, instr.address, instr.value);
  const m = frame.activeMask;
  return Object.freeze({
    stepTitle: `mask update (${m.forcedOneCount}×1, ${m.forcedZeroCount}×0, ${m.floatingCount}×X)`,
    inputLabel: 'No memory write on mask load',
    outputLabel: `Decoder ${frame.policyId === 'decoder-v1' ? 'v1' : 'v2'} armed`,
    inputBinary: null,
    outputDisplay: null,
    writesSummary: '0 writes',
  });
}
