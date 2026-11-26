import { bigintLog2 } from '../../../shared/core';

export const PRIORITY_COUNT = 52;
const MAX_ITEM_BIT = 1n << 51n;

/** Validates that a numeric item priority is an integer in `[1, 52]`. */
export function assertPriority(priority: number): void {
  if (!Number.isInteger(priority) || priority < 1 || priority > PRIORITY_COUNT) {
    throw new RangeError(`Priority must be an integer in [1, ${PRIORITY_COUNT}], got ${priority}`);
  }
}

/** Converts a single ASCII letter (`a..z` -> `1..26`, `A..Z` -> `27..52`) to its priority. */
export function itemPriority(item: string): number {
  if (item.length !== 1) {
    throw new RangeError(`Item must be a single character, got "${item}"`);
  }
  const code = item.charCodeAt(0);
  if (code >= 97 && code <= 122) return code - 96;
  if (code >= 65 && code <= 90) return code - 38;
  throw new RangeError(`Item must be an ASCII letter [a-zA-Z], got "${item}"`);
}

/** Converts a priority in `[1, 52]` back to its ASCII item letter. */
export function priorityToItem(priority: number): string {
  assertPriority(priority);
  return String.fromCharCode(priority <= 26 ? 96 + priority : 38 + priority);
}

/** Encodes a string of item characters into a 52-bit BigInt bitmask. */
export function encodeItemMask(items: string): bigint {
  let mask = 0n;
  for (let i = 0; i < items.length; i += 1) {
    mask |= 1n << BigInt(itemPriority(items[i]!) - 1);
  }
  return mask;
}

/** Extracts the 1-based priority from a single-bit 52-bit item mask. */
export function extractSinglePriority(mask: bigint): number {
  if (mask <= 0n || mask > MAX_ITEM_BIT || (mask & (mask - 1n)) !== 0n) {
    throw new RangeError(`Mask must have exactly one set bit in [1, 52], got ${mask}`);
  }
  return bigintLog2(mask) + 1;
}
