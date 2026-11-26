import { AMPLIFIER_LABELS } from './circuitModels';

export const CIRCUIT_SVG_WIDTH = 860;
export const CIRCUIT_SVG_HEIGHT = 250;

const NODE_WIDTH = 104;
const NODE_HEIGHT = 76;
const NODE_Y = 66;
const NODE_START_X = 76;
const NODE_STRIDE_X = 148;
const WIRE_Y = NODE_Y + NODE_HEIGHT / 2;

export interface CircuitNodeLayout {
  readonly label: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface CircuitWireLayout {
  readonly fromLabel: string;
  readonly toLabel: string;
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
  readonly labelX: number;
  readonly labelY: number;
}

export interface CircuitDiagramLayout {
  readonly width: number;
  readonly height: number;
  readonly nodes: readonly CircuitNodeLayout[];
  readonly wires: readonly CircuitWireLayout[];
  readonly feedbackPath: string | null;
  readonly feedbackLabelX: number;
  readonly feedbackLabelY: number;
}

function buildWire(fromLabel: string, toLabel: string, x1: number, x2: number): CircuitWireLayout {
  return Object.freeze({
    fromLabel,
    toLabel,
    x1,
    y1: WIRE_Y,
    x2,
    y2: WIRE_Y,
    labelX: Math.round((x1 + x2) / 2),
    labelY: WIRE_Y - 12,
  });
}

function buildNodes(): readonly CircuitNodeLayout[] {
  const nodes: CircuitNodeLayout[] = [];
  for (let i = 0; i < AMPLIFIER_LABELS.length; i += 1) {
    const x = NODE_START_X + i * NODE_STRIDE_X;
    nodes.push(Object.freeze({ label: AMPLIFIER_LABELS[i]!, x, y: NODE_Y, width: NODE_WIDTH, height: NODE_HEIGHT }));
  }
  return Object.freeze(nodes);
}

function buildWires(nodes: readonly CircuitNodeLayout[]): readonly CircuitWireLayout[] {
  const first = nodes[0]!;
  const last = nodes[nodes.length - 1]!;
  const wires: CircuitWireLayout[] = [buildWire('IN', first.label, 24, first.x)];
  for (let i = 0; i < nodes.length - 1; i += 1) {
    const left = nodes[i]!;
    const right = nodes[i + 1]!;
    wires.push(buildWire(left.label, right.label, left.x + left.width, right.x));
  }
  wires.push(buildWire(last.label, 'OUT', last.x + last.width, 824));
  return Object.freeze(wires);
}

/** Computes deterministic 860x250 SVG coordinates for the 5-stage amplifier schematic. */
export function computeCircuitDiagramLayout(hasFeedbackLoop: boolean): CircuitDiagramLayout {
  const nodes = buildNodes();
  const wires = buildWires(nodes);
  const firstCenter = nodes[0]!.x + NODE_WIDTH / 2;
  const lastCenter = nodes[nodes.length - 1]!.x + NODE_WIDTH / 2;
  const bottomY = NODE_Y + NODE_HEIGHT;
  const returnY = 208;
  const feedbackPath = hasFeedbackLoop
    ? `M ${lastCenter} ${bottomY} V ${returnY} H ${firstCenter} V ${bottomY}`
    : null;

  return Object.freeze({
    width: CIRCUIT_SVG_WIDTH,
    height: CIRCUIT_SVG_HEIGHT,
    nodes,
    wires,
    feedbackPath,
    feedbackLabelX: Math.round((firstCenter + lastCenter) / 2),
    feedbackLabelY: returnY + 20,
  });
}

/** Formats a 5-phase tuple as a comma-separated string. */
export function formatPhaseTuple(phases: readonly bigint[]): string {
  return phases.join(', ');
}

function groupThousands(digits: string): string {
  const parts: string[] = [];
  for (let end = digits.length; end > 0; end -= 3) {
    const start = Math.max(0, end - 3);
    parts.push(digits.slice(start, end));
  }
  parts.reverse();
  return parts.join(',');
}

/** Formats arbitrary-precision BigInt signals without precision-losing Number() conversions. */
export function formatSignalValue(value: bigint): string {
  const sign = value < 0n ? '-' : '';
  const digits = (value < 0n ? -value : value).toString();
  if (digits.length <= 15) {
    return `${sign}${groupThousands(digits)}`;
  }
  const exp = digits.length - 1;
  return `${sign}${digits[0]!}.${digits.slice(1, 4)}e+${exp}`;
}

/** Normalizes a BigInt signal into [0, 1] using BigInt fixed-point scaling. */
export function normalizeSignalRatio(value: bigint, minValue: bigint, maxValue: bigint): number {
  if (maxValue < minValue) {
    throw new RangeError(`maxValue (${maxValue}) must be >= minValue (${minValue})`);
  }
  const span = maxValue - minValue;
  if (span === 0n) {
    return 1;
  }
  const clamped = value < minValue ? minValue : value > maxValue ? maxValue : value;
  return Number(((clamped - minValue) * 10000n) / span) / 10000;
}
