import {
  type DigDirection,
  type DigPlanDecoder,
  DigStep,
  type RawDigEntry,
} from '../../shared';

export type HexDirectionCode = '0' | '1' | '2' | '3';

export interface DecodedHexInstruction {
  readonly direction: DigDirection;
  readonly distance: bigint;
}

export const HEX_DIRECTION_CODES: Readonly<Record<HexDirectionCode, DigDirection>> = Object.freeze({
  '0': 'R',
  '1': 'D',
  '2': 'L',
  '3': 'U',
});

const SIX_HEX_PATTERN = /^[0-9a-f]{6}$/i;

/** Decodes a 6-digit hex code (`DDDDDM`) into an orthogonal Part 2 dig instruction. */
export function decodeHexCode(hexCode: string): DecodedHexInstruction {
  if (!SIX_HEX_PATTERN.test(hexCode)) {
    throw new SyntaxError(`Invalid 6-digit hex code: "${hexCode}"`);
  }
  const dirCode = hexCode[5]!;
  const direction: DigDirection | undefined = HEX_DIRECTION_CODES[dirCode as HexDirectionCode];
  if (!direction) {
    throw new SyntaxError(`Invalid Part 2 direction code '${dirCode}' in "${hexCode}"`);
  }
  const distance = BigInt(`0x${hexCode.slice(0, 5)}`);
  if (distance === 0n) {
    throw new RangeError(`Decoded Part 2 distance must be positive, got 0 in "${hexCode}"`);
  }
  return Object.freeze({ direction, distance });
}

/** Part 2 decoder: derives direction and distance from the 6-digit hex code while keeping paint color. */
export const HEX_DIG_PLAN_DECODER: DigPlanDecoder = Object.freeze({
  decodeStep(entry: RawDigEntry): DigStep {
    const { direction, distance } = decodeHexCode(entry.hexCode);
    return new DigStep(direction, distance, entry.color);
  },
});
