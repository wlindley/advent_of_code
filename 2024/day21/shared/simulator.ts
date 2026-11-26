import { DIRECTIONAL_KEYPAD, type Keypad, NUMERIC_KEYPAD } from './keypad';
import { DIRECTION_DELTAS, GridCoord, KeypadConfig, type MoveDirection } from './model';

/** Simulates robot `commands` on `keypad`, returning activated key labels or throwing on gap/OOB/invalid chars. */
export function simulateKeypad<K extends string>(keypad: Keypad<K>, commands: string): string {
  let pos = keypad.positionOf(keypad.startKey);
  let currentKey = keypad.startKey;
  let output = '';
  for (const ch of commands) {
    if (ch === 'A') {
      output += currentKey;
      continue;
    }
    const delta = DIRECTION_DELTAS[ch as MoveDirection] as GridCoord | undefined;
    if (delta === undefined) {
      throw new RangeError(`Invalid keypad command: "${ch}"`);
    }
    const nextPos = new GridCoord(pos.row + delta.row, pos.col + delta.col);
    const nextKey = keypad.keyAt(nextPos);
    if (nextKey === null) {
      throw new RangeError(`Keypad arm hit gap or boundary at (${nextPos.row}, ${nextPos.col})`);
    }
    pos = nextPos;
    currentKey = nextKey;
  }
  return output;
}

/** Simulates a full chain of `directionalRobots` directional pads followed by the numeric keypad. */
export function simulateRobotChain(humanCommands: string, directionalRobots: number): string {
  const config = new KeypadConfig(directionalRobots);
  let seq = humanCommands;
  for (let i = 0; i < config.directionalRobots; i += 1) {
    seq = simulateKeypad(DIRECTIONAL_KEYPAD, seq);
  }
  return simulateKeypad(NUMERIC_KEYPAD, seq);
}
