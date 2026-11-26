/** Cardinal facing index aligned with `DIRS_4` (`0: ^`, `1: >`, `2: v`, `3: <`). */
export type GuardDirection = 0 | 1 | 2 | 3;

export const GUARD_SYMBOLS = Object.freeze(['^', '>', 'v', '<'] as const);

export function isGuardDirection(value: number): value is GuardDirection {
  return Number.isInteger(value) && value >= 0 && value <= 3;
}

export function parseGuardDirection(symbol: string): GuardDirection | undefined {
  const index = GUARD_SYMBOLS.indexOf(symbol as (typeof GUARD_SYMBOLS)[number]);
  return index === -1 ? undefined : (index as GuardDirection);
}

export function turnRight(dir: GuardDirection): GuardDirection {
  return ((dir + 1) & 3) as GuardDirection;
}
