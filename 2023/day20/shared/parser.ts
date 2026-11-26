import { CircuitBlueprint, ModuleSpec } from './blueprint';
import type { ModuleKind } from './types';

const PREFIX_KINDS: Readonly<Record<string, ModuleKind>> = Object.freeze({
  '%': 'flip-flop',
  '&': 'conjunction',
});

function parseModuleLine(line: string): ModuleSpec {
  const parts = line.split('->');
  if (parts.length !== 2) {
    throw new Error(`Malformed module line: "${line}"`);
  }
  const lhs = parts[0]!.trim();
  const rhs = parts[1]!.trim();
  if (rhs.length === 0) {
    throw new Error(`Missing destinations in line: "${line}"`);
  }
  const prefixedKind = PREFIX_KINDS[lhs.charAt(0)];
  const kind: ModuleKind = prefixedKind ?? 'broadcaster';
  const name = prefixedKind ? lhs.slice(1) : lhs;
  const destinations = rhs.split(',').map((dest) => dest.trim());
  return new ModuleSpec(name, kind, destinations);
}

/** Parses AoC 2023 Day 20 module configuration lines into an immutable CircuitBlueprint. */
export function parseCircuitBlueprint(raw: string): CircuitBlueprint {
  const specs: ModuleSpec[] = [];
  for (const rawLine of raw.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.length === 0) continue;
    specs.push(parseModuleLine(line));
  }
  if (specs.length === 0) {
    throw new Error('Circuit input contains no module declarations');
  }
  return new CircuitBlueprint(specs);
}
