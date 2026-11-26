export const BROADCASTER_NAME = 'broadcaster';
export const BUTTON_NAME = 'button';
export const DEFAULT_MAX_PULSES_PER_PRESS = 1_000_000;

export type ModuleKind = 'broadcaster' | 'flip-flop' | 'conjunction' | 'sink';
export type Pulse = 'low' | 'high';

export interface ModuleDescriptor {
  readonly name: string;
  readonly kind: ModuleKind;
  readonly destinations: readonly string[];
}

export interface PulseEvent {
  readonly press: number;
  readonly from: string;
  readonly to: string;
  readonly pulse: Pulse;
}

export interface PressSummary {
  readonly press: number;
  readonly lowPulses: number;
  readonly highPulses: number;
}

export type NodeStateSnapshot =
  | { readonly kind: 'broadcaster' }
  | { readonly kind: 'flip-flop'; readonly isOn: boolean }
  | { readonly kind: 'conjunction'; readonly memory: Readonly<Record<string, Pulse>> }
  | { readonly kind: 'sink' };

const MODULE_NAME_RE = /^[a-z]+$/;

/** Validates a lowercase module identifier and forbids the reserved button name. */
export function validateModuleName(name: string): string {
  if (!MODULE_NAME_RE.test(name) || name === BUTTON_NAME) {
    throw new Error(`Invalid module name: "${name}"`);
  }
  return name;
}

/** Validates that a numeric parameter is a positive integer (>= 1). */
export function validatePositiveInt(value: number, label: string): number {
  if (!Number.isInteger(value) || value < 1) {
    throw new RangeError(`${label} must be a positive integer, got ${value}`);
  }
  return value;
}
