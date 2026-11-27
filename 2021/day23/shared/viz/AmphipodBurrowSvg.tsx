import {
  type AmphipodSpecies,
  type BurrowMove,
  type BurrowPosition,
  type BurrowState,
  HALL_COLS,
  HALL_COUNT,
  ROOM_COLS,
  ROOM_COUNT,
  SPECIES,
} from '../index';

export interface AmphipodBurrowSvgProps {
  readonly state: BurrowState;
  readonly lastMove: BurrowMove | null;
}

interface TokenItem {
  readonly species: AmphipodSpecies;
  readonly pos: BurrowPosition;
  readonly settled: boolean;
}

const CELL = 44;
const PAD = 26;
const HALL_SET = new Set<number>(HALL_COLS);
const SPECIES_COLOR: Record<AmphipodSpecies, string> = {
  A: 'var(--ok)',
  B: 'var(--gold)',
  C: 'var(--accent)',
  D: 'var(--err)',
};

function colX(col: number): number {
  return PAD + col * CELL + CELL / 2;
}

function rowY(row: number): number {
  return PAD + row * CELL + CELL / 2;
}

function posPoint(pos: BurrowPosition): { readonly x: number; readonly y: number } {
  const col = pos.kind === 'hallway' ? HALL_COLS[pos.slot]! : ROOM_COLS[pos.room]!;
  return { x: colX(col), y: rowY(pos.kind === 'hallway' ? 0 : pos.depth + 1) };
}

function isSamePos(a: BurrowPosition | undefined, b: BurrowPosition): boolean {
  if (a === undefined || a.kind !== b.kind) return false;
  return a.kind === 'hallway'
    ? a.slot === (b as { readonly slot: number }).slot
    : a.room === (b as { readonly room: number }).room &&
        a.depth === (b as { readonly depth: number }).depth;
}

function collectTokens(state: BurrowState): readonly TokenItem[] {
  const tokens: TokenItem[] = [];
  for (let s = 0; s < HALL_COUNT; s += 1) {
    const ch = state.hallwayAt(s);
    if (ch !== '.') tokens.push({ species: ch, pos: { kind: 'hallway', slot: s }, settled: false });
  }
  for (let r = 0; r < ROOM_COUNT; r += 1) {
    for (let d = 0; d < state.roomDepth; d += 1) {
      const ch = state.roomAt(r, d);
      if (ch !== '.') {
        tokens.push({ species: ch, pos: { kind: 'room', room: r, depth: d }, settled: state.isSlotSettled(r, d) });
      }
    }
  }
  return tokens;
}

function BurrowGrid({ roomDepth }: { readonly roomDepth: number }) {
  return (
    <g>
      {Array.from({ length: 11 }, (_, col) => {
        const isDoor = !HALL_SET.has(col);
        return (
          <rect
            key={col}
            x={colX(col) - CELL / 2}
            y={rowY(0) - CELL / 2}
            width={CELL}
            height={CELL}
            rx={4}
            fill={isDoor ? 'var(--bg)' : 'var(--surface)'}
            stroke="var(--border)"
            strokeDasharray={isDoor ? '3 3' : undefined}
          />
        );
      })}
      {ROOM_COLS.map((col, room) => (
        <g key={room}>
          {Array.from({ length: roomDepth }, (_, d) => (
            <rect
              key={d}
              x={colX(col) - CELL / 2}
              y={rowY(d + 1) - CELL / 2}
              width={CELL}
              height={CELL}
              rx={4}
              fill="var(--surface)"
              stroke="var(--border)"
            />
          ))}
          <text x={colX(col)} y={rowY(roomDepth) + CELL / 2 + 16} textAnchor="middle" fontSize={12} fontWeight={700} fill="var(--muted)">
            Room {SPECIES[room]}
          </text>
        </g>
      ))}
    </g>
  );
}

function MoveOverlay({ move }: { readonly move: BurrowMove }) {
  const fromPt = posPoint(move.from);
  const toPt = posPoint(move.to);
  const hallY = rowY(0);
  const pts = `${fromPt.x},${fromPt.y} ${fromPt.x},${hallY} ${toPt.x},${hallY} ${toPt.x},${toPt.y}`;
  return (
    <g pointerEvents="none">
      <polyline points={pts} fill="none" stroke="var(--accent)" strokeWidth={2.5} strokeDasharray="5 3" />
      <circle cx={fromPt.x} cy={fromPt.y} r={14} fill="none" stroke="var(--muted)" strokeWidth={1.5} strokeDasharray="3 2" />
    </g>
  );
}

/** Dynamic SVG diagram of the amphipod hallway, side rooms, settled rings, and last-move path. */
export function AmphipodBurrowSvg({ state, lastMove }: AmphipodBurrowSvgProps) {
  const width = PAD * 2 + 11 * CELL;
  const height = PAD * 2 + (state.roomDepth + 1) * CELL + 20;
  const tokens = collectTokens(state);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg" role="img" aria-label={`Amphipod burrow with ${state.settledCount} of ${state.roomDepth * ROOM_COUNT} settled`}>
      <BurrowGrid roomDepth={state.roomDepth} />
      {lastMove !== null && <MoveOverlay move={lastMove} />}
      {tokens.map((t, idx) => {
        const pt = posPoint(t.pos);
        const color = SPECIES_COLOR[t.species];
        return (
          <g key={idx}>
            {t.settled && <circle cx={pt.x} cy={pt.y} r={18} fill="none" stroke="var(--ok)" strokeWidth={2} />}
            <circle cx={pt.x} cy={pt.y} r={14} fill={`color-mix(in srgb, ${color} 18%, var(--surface))`} stroke={color} strokeWidth={isSamePos(lastMove?.to, t.pos) ? 2.8 : 1.8} />
            <text x={pt.x} y={pt.y + 4} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--text)">{t.species}</text>
          </g>
        );
      })}
    </svg>
  );
}
