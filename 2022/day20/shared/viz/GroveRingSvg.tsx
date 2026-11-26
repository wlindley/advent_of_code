import type { MixingTraceFrame, VisibleRingSlot } from '../trace';

const SIZE = 420;
const CENTER = 210;
const RING_RADIUS = 144;
const LABEL_RADIUS = 178;

interface Point {
  readonly x: number;
  readonly y: number;
}

function slotPoint(ringIndex: number, ringLength: number, radius: number): Point {
  const angle = 2 * Math.PI * (ringIndex / ringLength) - Math.PI / 2;
  return { x: CENTER + radius * Math.cos(angle), y: CENTER + radius * Math.sin(angle) };
}

function slotStroke(slot: VisibleRingSlot): string {
  if (slot.isZero) return 'var(--ok)';
  if (slot.groveOrdinals.length > 0) return 'var(--gold)';
  if (slot.isActive) return 'var(--accent)';
  return 'var(--border)';
}

function formatOrdinals(ordinals: readonly (1 | 2 | 3)[]): string {
  return ordinals.map((ord) => `+${ord}k`).join('/');
}

function formatCompactValue(value: bigint): string {
  const text = value.toString();
  return text.length > 7 ? `${text.slice(0, 6)}…` : text;
}

function RingChord({ frame }: { readonly frame: MixingTraceFrame }) {
  const move = frame.lastMove;
  if (!move || move.fromIndex === move.toIndex) return null;
  const start = slotPoint(move.fromIndex, frame.ringLength, RING_RADIUS);
  const end = slotPoint(move.toIndex, frame.ringLength, RING_RADIUS);
  return (
    <g>
      <circle cx={start.x} cy={start.y} r={5} fill="none" stroke="var(--accent)" strokeWidth={1.75} />
      <path
        d={`M ${start.x.toFixed(1)} ${start.y.toFixed(1)} Q ${CENTER} ${CENTER} ${end.x.toFixed(1)} ${end.y.toFixed(1)}`}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={2}
        strokeDasharray="5 3"
        markerEnd="url(#grove-move-arrow)"
      />
    </g>
  );
}

interface RingNodeProps {
  readonly slot: VisibleRingSlot;
  readonly ringLength: number;
  readonly dense: boolean;
}

function RingNode({ slot, ringLength, dense }: RingNodeProps) {
  const pos = slotPoint(slot.ringIndex, ringLength, RING_RADIUS);
  const labelPos = slotPoint(slot.ringIndex, ringLength, LABEL_RADIUS);
  const hasBadge = slot.isZero || slot.groveOrdinals.length > 0;
  const radius = dense ? (hasBadge || slot.isActive ? 8 : 4.5) : 16;
  const ordTag = formatOrdinals(slot.groveOrdinals);
  const badgeText = slot.isZero ? (ordTag ? `0 ${ordTag}` : '0') : ordTag;

  return (
    <g>
      <title>{`slot ${slot.ringIndex} | id #${slot.id} | value ${slot.value.toString()}${badgeText ? ` (${badgeText})` : ''}`}</title>
      {slot.isActive && (
        <circle cx={pos.x} cy={pos.y} r={radius + 4} fill="none" stroke="var(--accent)" strokeWidth={1.75} strokeDasharray="3 2" />
      )}
      <circle
        cx={pos.x}
        cy={pos.y}
        r={radius}
        fill={slot.isActive ? 'var(--accent)' : 'var(--surface)'}
        stroke={slotStroke(slot)}
        strokeWidth={hasBadge || slot.isActive ? 2.5 : 1.5}
      />
      {!dense && (
        <text x={pos.x} y={pos.y + 4} textAnchor="middle" fontSize={11} fontWeight={600} fill={slot.isActive ? 'var(--surface)' : 'var(--text)'}>
          {formatCompactValue(slot.value)}
        </text>
      )}
      {hasBadge && (
        <text x={labelPos.x} y={labelPos.y + 4} textAnchor="middle" fontSize={11} fontWeight={700} fill={slot.isZero ? 'var(--ok)' : 'var(--gold)'}>
          {badgeText}
        </text>
      )}
    </g>
  );
}

export interface GroveRingSvgProps {
  readonly frame: MixingTraceFrame;
}

/** Circular ring SVG visualizing element relocations and +1k/+2k/+3k grove landmarks. */
export function GroveRingSvg({ frame }: GroveRingSvgProps) {
  const dense = frame.slots.length > 18;
  const moveLabel =
    frame.activeId === null || frame.lastMove === null
      ? 'Initial ring'
      : `#${frame.activeId} (${formatCompactValue(frame.activeValue ?? 0n)}) : ${frame.lastMove.fromIndex} → ${frame.lastMove.toIndex}`;

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      width="100%"
      style={{ maxWidth: 440, display: 'block', margin: '0 auto', background: 'var(--surface)', borderRadius: 10, border: '1px solid var(--border)' }}
      role="img"
      aria-label={`Circular mixing ring at move ${frame.moveCount} of ${frame.totalMoves}`}
    >
      <defs>
        <marker id="grove-move-arrow" viewBox="0 0 10 10" refX={8} refY={5} markerWidth={6} markerHeight={6} orient="auto">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--accent)" />
        </marker>
      </defs>
      <circle cx={CENTER} cy={CENTER} r={RING_RADIUS} fill="none" stroke="var(--border)" strokeWidth={1.25} />
      <RingChord frame={frame} />
      {frame.slots.map((slot) => (
        <RingNode key={`${slot.ringIndex}-${slot.id}`} slot={slot} ringLength={frame.ringLength} dense={dense} />
      ))}
      <text x={CENTER} y={CENTER - 14} textAnchor="middle" fontSize={11} fontWeight={600} fill="var(--text)">
        Grove Sum
      </text>
      <text x={CENTER} y={CENTER + 8} textAnchor="middle" fontSize={16} fontWeight={700} fill="var(--gold)">
        {frame.coordinates.sum.toLocaleString()}
      </text>
      <text x={CENTER} y={CENTER + 28} textAnchor="middle" fontSize={11} fill="var(--text)">
        {moveLabel}
      </text>
      {frame.isSampled && (
        <text x={CENTER} y={SIZE - 14} textAnchor="middle" fontSize={10} fill="var(--text)">
          {`Showing ${frame.slots.length} / ${frame.ringLength} slots (landmarks preserved)`}
        </text>
      )}
    </svg>
  );
}
