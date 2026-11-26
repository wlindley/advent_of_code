import type { MemoryInstruction } from '../../shared';

const TAPE_WINDOW = 36;
const TAPE_COLS = 18;

interface TapeProps {
  readonly raw: string;
  readonly instructions: readonly MemoryInstruction[];
  readonly states: readonly boolean[];
  readonly active: MemoryInstruction | null;
  readonly enabled: boolean;
  readonly totalInstructions: number;
}

function computeTapeStart(rawLength: number, active: MemoryInstruction | null): number {
  if (rawLength <= TAPE_WINDOW || !active) return 0;
  const center = Math.floor((active.start + active.end) / 2);
  return Math.max(0, Math.min(rawLength - TAPE_WINDOW, center - Math.floor(TAPE_WINDOW / 2)));
}

function tapeCellColor(
  idx: number,
  instructions: readonly MemoryInstruction[],
  states: readonly boolean[],
  active: MemoryInstruction | null,
): string {
  if (active && idx >= active.start && idx < active.end) return 'var(--gold)';
  for (let i = 0; i < instructions.length; i += 1) {
    const inst = instructions[i]!;
    if (idx >= inst.start && idx < inst.end) {
      return inst.kind === 'mul' ? (states[i] ? 'var(--ok)' : 'var(--muted)') : 'var(--accent)';
    }
  }
  return 'var(--border)';
}

function describeActive(active: MemoryInstruction | null, enabled: boolean, total: number): string {
  if (!active) return total === 0 ? 'No valid instructions found' : 'Ready — gate starts ENABLED';
  if (active.kind !== 'mul') {
    const label = active.kind === 'do' ? 'do() -> gate ENABLED' : "don't() -> gate DISABLED";
    return `${label} @ [${active.start}..${active.end})`;
  }
  const outcome = enabled ? `= +${active.product}` : '(skipped)';
  return `mul(${active.x},${active.y}) ${outcome} @ [${active.start}..${active.end})`;
}

function TapeCellGrid({ raw, winStart, instructions, states, active }: Omit<TapeProps, 'enabled' | 'totalInstructions'> & { readonly winStart: number }) {
  const winEnd = Math.min(raw.length, winStart + TAPE_WINDOW);
  return (
    <g>
      {Array.from({ length: winEnd - winStart }, (_, offset) => {
        const idx = winStart + offset;
        const ch = raw[idx]!;
        const label = ch === '\n' ? '↵' : ch === '\r' ? '␍' : ch;
        const x = 16 + (offset % TAPE_COLS) * 16;
        const y = 34 + Math.floor(offset / TAPE_COLS) * 32;
        const color = tapeCellColor(idx, instructions, states, active);
        const isNoise = color === 'var(--border)';
        return (
          <g key={idx}>
            <rect x={x} y={y} width={15} height={24} rx={3} fill={isNoise ? 'var(--bg)' : 'var(--surface)'} stroke={color} strokeWidth={color === 'var(--gold)' ? 1.8 : 1} />
            <text x={x + 7.5} y={y + 16} textAnchor="middle" fontSize={11} fontWeight={700} fontFamily="ui-monospace, monospace" fill={isNoise ? 'var(--muted)' : color}>{label}</text>
          </g>
        );
      })}
    </g>
  );
}

export function ConditionalTapeSvg({ raw, instructions, states, active, enabled, totalInstructions }: TapeProps) {
  const winStart = computeTapeStart(raw.length, active);
  const winEnd = Math.min(raw.length, winStart + TAPE_WINDOW);
  return (
    <svg viewBox="0 0 320 216" width={320} height={216} role="img" aria-label="Conditional memory tape window" style={{ maxWidth: '100%', display: 'block' }}>
      <rect x={12} y={24} width={296} height={168} rx={6} fill="var(--bg)" stroke="var(--border)" />
      <text x={16} y={15} fontSize={11} fontWeight={700} fill="var(--muted)">Memory Tape Window</text>
      <text x={304} y={15} textAnchor="end" fontSize={11} fontWeight={600} fill="var(--accent)">[{winStart}..{winEnd}) / {raw.length}</text>
      {raw.length > 0 ? <TapeCellGrid raw={raw} winStart={winStart} instructions={instructions} states={states} active={active} /> : <text x={160} y={76} textAnchor="middle" fontSize={11} fill="var(--muted)">Empty input stream</text>}
      <rect x={20} y={118} width={280} height={58} rx={5} fill="var(--surface)" stroke={active ? 'var(--gold)' : 'var(--border)'} />
      <text x={160} y={144} textAnchor="middle" fontSize={11} fontWeight={700} fill={active ? 'var(--text)' : 'var(--muted)'}>{describeActive(active, enabled, totalInstructions)}</text>
      <text x={160} y={164} textAnchor="middle" fontSize={10} fontWeight={700} fill={enabled ? 'var(--ok)' : 'var(--muted)'}>Gate: {enabled ? 'ENABLED' : 'DISABLED'}</text>
      <text x={160} y={208} textAnchor="middle" fontSize={10} fill="var(--muted)">gold = active · green = on · gray = off · blue = do/don't · ↵ = newline</text>
    </svg>
  );
}
