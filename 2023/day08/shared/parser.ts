import { WastelandNetwork, type NetworkNodeSpec, type Turn } from './network';

export const TAPE_PATTERN = /^[LR]+$/;
export const NODE_LINE_PATTERN = /^([A-Za-z0-9]+)\s*=\s*\(([A-Za-z0-9]+),\s*([A-Za-z0-9]+)\)$/;

export interface ParsedNodeEntry {
  readonly label: string;
  readonly left: string;
  readonly right: string;
}

export function parseTape(line: string): readonly Turn[] {
  const trimmed = line.trim();
  if (!TAPE_PATTERN.test(trimmed)) {
    throw new Error(`Invalid instruction tape "${trimmed}": expected non-empty L/R sequence`);
  }
  return Object.freeze([...trimmed] as Turn[]);
}

export function parseNodeLine(line: string): ParsedNodeEntry {
  const trimmed = line.trim();
  const match = NODE_LINE_PATTERN.exec(trimmed);
  if (!match) {
    throw new Error(`Invalid node definition "${trimmed}": expected "SRC = (LEFT, RIGHT)"`);
  }
  return Object.freeze({
    label: match[1]!,
    left: match[2]!,
    right: match[3]!,
  });
}

function resolveTarget(
  labelToId: ReadonlyMap<string, number>,
  target: string,
  ownerLabel: string,
): number {
  const id = labelToId.get(target);
  if (id === undefined) {
    throw new Error(`Unknown target node "${target}" referenced by "${ownerLabel}"`);
  }
  return id;
}

function buildNodeSpecs(entries: readonly ParsedNodeEntry[]): readonly NetworkNodeSpec[] {
  const labelToId = new Map<string, number>();
  for (let i = 0; i < entries.length; i += 1) {
    const label = entries[i]!.label;
    if (labelToId.has(label)) {
      throw new Error(`Duplicate node label "${label}"`);
    }
    labelToId.set(label, i);
  }
  return entries.map((entry) => ({
    label: entry.label,
    leftId: resolveTarget(labelToId, entry.left, entry.label),
    rightId: resolveTarget(labelToId, entry.right, entry.label),
  }));
}

/** Parses AoC 2023 Day 8 input (L/R tape followed by node mapping lines) into a WastelandNetwork. */
export function parseWastelandNetwork(raw: string): WastelandNetwork {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (lines.length === 0) {
    throw new Error('Input is empty');
  }
  const turns = parseTape(lines[0]!);
  if (lines.length < 2) {
    throw new Error('Network must contain at least one node definition');
  }
  const entries = lines.slice(1).map(parseNodeLine);
  return new WastelandNetwork(turns, buildNodeSpecs(entries));
}
