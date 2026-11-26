import type { EngineSchematic, PartNumber } from '../../shared';

/** Returns the BigInt gear ratio when `adjacent` has exactly two part numbers, or `null` otherwise. */
export function gearRatioOf(adjacent: readonly PartNumber[]): bigint | null {
  return adjacent.length === 2 ? BigInt(adjacent[0]!.value) * BigInt(adjacent[1]!.value) : null;
}

/** Sums gear ratios across all `'*'` symbols with exactly two adjacent part numbers. */
export function sumGearRatios(schematic: EngineSchematic): bigint {
  let sum = 0n;
  for (const symbol of schematic.symbols) {
    if (!symbol.isGearCandidate) continue;
    const ratio = gearRatioOf(schematic.adjacentNumbersOf(symbol));
    if (ratio !== null) sum += ratio;
  }
  return sum;
}
