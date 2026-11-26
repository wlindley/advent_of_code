import type { Turn } from '../network';
import type { WastelandTraceFrame } from '../trace';

export interface TapeRibbonProps {
  readonly frame: WastelandTraceFrame;
}

interface TapeSlot {
  readonly key: string;
  readonly index: number;
  readonly turn: Turn;
}

const WINDOW_RADIUS = 9;

function buildTapeSlots(frame: WastelandTraceFrame): readonly TapeSlot[] {
  const len = frame.network.tapeLength;
  if (len <= WINDOW_RADIUS * 2 + 1) {
    return Array.from({ length: len }, (_, index) => ({
      key: `idx-${index}`,
      index,
      turn: frame.network.turnAt(index),
    }));
  }
  const slots: TapeSlot[] = [];
  for (let offset = -WINDOW_RADIUS; offset <= WINDOW_RADIUS; offset += 1) {
    const index = (((frame.nextTapeIndex + offset) % len) + len) % len;
    slots.push({ key: `off-${offset}`, index, turn: frame.network.turnAt(index) });
  }
  return slots;
}

function renderPill(slot: TapeSlot, frame: WastelandTraceFrame) {
  const isNext = !frame.isGoal && slot.index === frame.nextTapeIndex;
  const isLast = slot.index === frame.lastTapeIndex;
  const borderColor = isNext ? 'var(--accent)' : isLast ? 'var(--gold)' : 'var(--border)';
  const background = isNext ? 'var(--accent)' : 'var(--bg)';
  const color = isNext ? 'var(--surface)' : 'var(--text)';

  return (
    <div
      key={slot.key}
      title={`Tape[${slot.index}] = ${slot.turn}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minWidth: 28,
        padding: '0.2rem 0.35rem',
        borderRadius: 6,
        border: `2px solid ${borderColor}`,
        background,
        color,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      <strong style={{ fontSize: '0.88rem', lineHeight: 1.15 }}>{slot.turn}</strong>
      <span style={{ fontSize: '0.64rem', opacity: isNext ? 0.9 : 0.7 }}>{slot.index}</span>
    </div>
  );
}

export function TapeRibbon({ frame }: TapeRibbonProps) {
  const slots = buildTapeSlots(frame);
  const len = frame.network.tapeLength;

  return (
    <section
      aria-label="Cyclic instruction tape"
      style={{ padding: '0.7rem 0.85rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)' }}
    >
      <div className="meta-row" style={{ marginTop: 0, marginBottom: '0.5rem', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)' }}>
          Instruction Tape (len {len})
        </span>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {frame.lastTurn !== undefined && (
            <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>
              Last: {frame.lastTurn} @ {frame.lastTapeIndex}
            </span>
          )}
          <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
            {frame.isGoal ? 'Goal Reached' : `Next: ${frame.nextTurn} @ ${frame.nextTapeIndex}`}
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', alignItems: 'center' }}>
        {slots.map((slot) => renderPill(slot, frame))}
      </div>
    </section>
  );
}
