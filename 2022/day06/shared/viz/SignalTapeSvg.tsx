import { ALPHABET_SIZE, ASCII_LOWER_A } from '../buffer';
import type { MarkerTraceFrame } from '../trace';

const SVG_W = 780;
const SVG_H = 235;
const TAPE_X = 20;
const TAPE_Y = 74;
const TAPE_SLOTS = 24;
const CELL_PITCH = 30.8;
const CELL_W = 26;
const CELL_H = 32;
const REG_Y = 160;
const REG_PITCH = 28.46;
const REG_W = 25;
const REG_H = 44;

interface OverlayProps {
  readonly frame: MarkerTraceFrame;
  readonly viewStart: number;
  readonly accentColor: string;
}

function cellCenterX(slot: number): number {
  return TAPE_X + slot * CELL_PITCH + CELL_W / 2;
}

function computeViewStart(frame: MarkerTraceFrame): number {
  const maxStart = Math.max(0, frame.signal.length - TAPE_SLOTS);
  return Math.max(0, Math.min(maxStart, frame.cursor - 15));
}

function TapeOverlay({ frame, viewStart, accentColor }: OverlayProps) {
  const winStartX = TAPE_X + Math.max(0, frame.windowStart - viewStart) * CELL_PITCH;
  const cursorX = cellCenterX(frame.cursor - viewStart);
  const winEndX = TAPE_X + (frame.cursor - viewStart) * CELL_PITCH + CELL_W;

  if (frame.collisionIndex !== null) {
    const fromSlot = Math.max(0, frame.collisionIndex - viewStart);
    const fromX = frame.collisionIndex >= viewStart ? cellCenterX(fromSlot) : TAPE_X;
    const midX = (fromX + cursorX) / 2;
    return (
      <g>
        <path d={`M ${fromX} ${TAPE_Y - 4} Q ${midX} 16 ${cursorX} ${TAPE_Y - 4}`} fill="none" stroke="var(--err)" strokeWidth={2} strokeDasharray="4 3" />
        <circle cx={fromX} cy={TAPE_Y - 4} r={3.5} fill="var(--surface)" stroke="var(--err)" strokeWidth={2} />
        <circle cx={cursorX} cy={TAPE_Y - 4} r={4} fill="var(--err)" />
        <rect x={midX - 54} y={8} width={108} height={20} rx={10} fill="var(--surface)" stroke="var(--err)" strokeWidth={1.5} />
        <text x={midX} y={22} fontSize={11} fontWeight={700} textAnchor="middle" fill="var(--err)">
          {`dup '${frame.currentChar}' · jump +${frame.jumpDistance}`}
        </text>
      </g>
    );
  }
  const stroke = frame.isMarkerFound ? 'var(--ok)' : accentColor;
  const label = frame.isMarkerFound ? `LOCKED · ${frame.windowSize} DISTINCT` : `window ${frame.windowLength}/${frame.windowSize}`;
  return (
    <g>
      <path d={`M ${winStartX} ${TAPE_Y - 8} V ${TAPE_Y - 14} H ${winEndX} V ${TAPE_Y - 8}`} fill="none" stroke={stroke} strokeWidth={2} />
      <text x={(winStartX + winEndX) / 2} y={TAPE_Y - 20} fontSize={11} fontWeight={700} textAnchor="middle" fill={stroke}>{label}</text>
    </g>
  );
}

function TapeCell({ idx, viewStart, frame, accentColor }: { readonly idx: number; readonly viewStart: number; readonly frame: MarkerTraceFrame; readonly accentColor: string }) {
  const x = TAPE_X + (idx - viewStart) * CELL_PITCH;
  const ch = frame.signal.charAt(idx);
  const isHead = idx === frame.cursor;
  const isCollision = idx === frame.collisionIndex;
  const isActive = idx >= frame.windowStart && idx <= frame.cursor;
  const isEvicted = idx >= frame.prevWindowStart && idx < frame.windowStart;
  const activeColor = frame.isMarkerFound ? 'var(--ok)' : accentColor;
  const stroke = isCollision ? 'var(--err)' : isHead && frame.hasCollision ? 'var(--err)' : isActive ? activeColor : isEvicted ? 'var(--warn)' : 'var(--border)';
  const fill = isCollision ? '#ffebe9' : isActive ? (frame.isMarkerFound ? '#dafbe1' : 'var(--surface)') : isEvicted ? '#fff8c5' : 'var(--bg)';
  const textFill = isActive || isCollision ? 'var(--text)' : 'var(--muted)';

  return (
    <g>
      <rect x={x} y={TAPE_Y} width={CELL_W} height={CELL_H} rx={4} fill={fill} stroke={stroke} strokeWidth={isHead || isActive || isCollision ? 2 : 1} strokeDasharray={isEvicted && !isCollision ? '3 2' : undefined} />
      <text x={x + CELL_W / 2} y={TAPE_Y + 21} fontSize={14} fontWeight={isActive ? 700 : 500} textAnchor="middle" fill={textFill} fontFamily="ui-monospace, monospace">{ch}</text>
      {isHead && <text x={x + CELL_W / 2} y={TAPE_Y + CELL_H + 14} fontSize={11} fontWeight={700} textAnchor="middle" fill={stroke}>▲</text>}
      {!isHead && idx % 5 === 0 && <text x={x + CELL_W / 2} y={TAPE_Y + CELL_H + 14} fontSize={9} textAnchor="middle" fill="var(--muted)">{idx}</text>}
    </g>
  );
}

function AlphabetTile({ code, seen, frame, accentColor }: { readonly code: number; readonly seen: number; readonly frame: MarkerTraceFrame; readonly accentColor: string }) {
  const x = TAPE_X + code * REG_PITCH;
  const ch = String.fromCharCode(ASCII_LOWER_A + code);
  const isCurrent = ch === frame.currentChar;
  const isActive = seen >= frame.windowStart;
  const isColliding = isCurrent && frame.hasCollision;
  const stroke = isColliding ? 'var(--err)' : isActive ? (frame.isMarkerFound ? 'var(--ok)' : accentColor) : 'var(--border)';
  const fill = isColliding ? '#ffebe9' : isActive ? (frame.isMarkerFound ? '#dafbe1' : 'var(--surface)') : seen >= 0 ? 'var(--bg)' : 'var(--surface)';
  const labelFill = isActive || isColliding ? 'var(--text)' : 'var(--muted)';

  return (
    <g>
      <rect x={x} y={REG_Y} width={REG_W} height={REG_H} rx={4} fill={fill} stroke={stroke} strokeWidth={isActive || isColliding ? 1.8 : 1} strokeDasharray={seen < 0 ? '2 2' : undefined} />
      <text x={x + REG_W / 2} y={REG_Y + 18} fontSize={12} fontWeight={isActive ? 700 : 500} textAnchor="middle" fill={labelFill} fontFamily="ui-monospace, monospace">{ch}</text>
      <text x={x + REG_W / 2} y={REG_Y + 35} fontSize={10} textAnchor="middle" fill={isColliding ? 'var(--err)' : isActive ? stroke : 'var(--muted)'}>{seen >= 0 ? seen : '—'}</text>
    </g>
  );
}

/** Pure SVG signal tape deck + 26-letter register visualizer for Day 6 marker scans. */
export function SignalTapeSvg({ frame, accentColor }: { readonly frame: MarkerTraceFrame; readonly accentColor: string }) {
  const viewStart = computeViewStart(frame);
  const visibleCount = Math.min(TAPE_SLOTS, frame.signal.length - viewStart);
  const slots = Array.from({ length: visibleCount }, (_, offset) => viewStart + offset);
  const letters = Array.from({ length: ALPHABET_SIZE }, (_, code) => code);

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', padding: '0.5rem', margin: '0.5rem 0' }}>
      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ width: '100%', height: 'auto', display: 'block' }} role="img" aria-label="Signal tape and alphabet register">
        <TapeOverlay frame={frame} viewStart={viewStart} accentColor={accentColor} />
        {slots.map((idx) => <TapeCell key={idx} idx={idx} viewStart={viewStart} frame={frame} accentColor={accentColor} />)}
        <text x={TAPE_X} y={149} fontSize={11} fontWeight={600} fill="var(--muted)">Alphabet Register (lastSeen[a–z])</text>
        {letters.map((code) => <AlphabetTile key={code} code={code} seen={frame.lastSeen[code] ?? -1} frame={frame} accentColor={accentColor} />)}
      </svg>
    </div>
  );
}
