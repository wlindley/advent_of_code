import { ClosedInterval } from '../../../shared/core';
import { Cuboid } from './cuboid';

export type RebootAction = 'on' | 'off';

export interface RebootStep {
  readonly action: RebootAction;
  readonly cuboid: Cuboid;
}

const STEP_PATTERN =
  /^(on|off) x=(-?\d+)\.\.(-?\d+),y=(-?\d+)\.\.(-?\d+),z=(-?\d+)\.\.(-?\d+)$/;

function parseStepLine(line: string, lineNumber: number): RebootStep {
  const match = STEP_PATTERN.exec(line);
  if (match === null) {
    throw new Error(`Invalid reboot step at line ${lineNumber}: "${line}"`);
  }
  const action = match[1] as RebootAction;
  const x = new ClosedInterval(BigInt(match[2]!), BigInt(match[3]!));
  const y = new ClosedInterval(BigInt(match[4]!), BigInt(match[5]!));
  const z = new ClosedInterval(BigInt(match[6]!), BigInt(match[7]!));
  return Object.freeze({ action, cuboid: new Cuboid(x, y, z) });
}

/** Parses Day 22 reboot instructions; rejects empty inputs, interior blank lines, and malformed bounds. */
export function parseRebootSteps(raw: string): readonly RebootStep[] {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    throw new Error('Reboot input must not be empty');
  }
  const lines = trimmed.split(/\r?\n/);
  const steps: RebootStep[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]!;
    if (line.length === 0) {
      throw new Error(`Unexpected blank line at line ${i + 1}`);
    }
    steps.push(parseStepLine(line, i + 1));
  }
  return Object.freeze(steps);
}
