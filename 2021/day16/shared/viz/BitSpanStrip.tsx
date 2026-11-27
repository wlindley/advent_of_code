import type { PacketTraceFrame } from '../index';

const MAX_RENDERED_BITS = 64;

export interface BitSpanStripProps {
  readonly frame: PacketTraceFrame;
}

function computeBitWindow(totalBits: number, focusBit: number): readonly [number, number] {
  if (totalBits <= MAX_RENDERED_BITS) return [0, totalBits];
  const half = MAX_RENDERED_BITS >> 1;
  const start = Math.max(0, Math.min(totalBits - MAX_RENDERED_BITS, focusBit - half));
  return [start, start + MAX_RENDERED_BITS];
}

function getBitCellColors(bitIndex: number, frame: PacketTraceFrame) {
  const node = frame.activeNode;
  const { span } = node.packet;
  if (bitIndex >= span.startBit && bitIndex < node.headerEndBit) {
    return { border: 'var(--accent)', bg: 'rgba(9, 105, 218, 0.14)', color: 'var(--accent)' };
  }
  if (bitIndex >= node.headerEndBit && bitIndex < span.endBit) {
    return { border: 'var(--gold)', bg: 'rgba(154, 103, 0, 0.14)', color: 'var(--gold)' };
  }
  if (bitIndex < frame.cursorBit) {
    return { border: 'var(--ok)', bg: 'rgba(26, 127, 55, 0.08)', color: 'var(--text)' };
  }
  return { border: 'var(--border)', bg: 'var(--bg)', color: 'var(--muted)' };
}

function BitCell({ bitIndex, bitChar, frame }: { readonly bitIndex: number; readonly bitChar: string; readonly frame: PacketTraceFrame }) {
  const style = getBitCellColors(bitIndex, frame);
  return (
    <span
      title={`Bit ${bitIndex}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '1.35rem',
        height: '1.55rem',
        fontSize: '0.78rem',
        fontWeight: 600,
        borderRadius: '4px',
        border: `1px solid ${style.border}`,
        background: style.bg,
        color: style.color,
      }}
    >
      {bitChar}
    </span>
  );
}

/** Bounded 64-bit sliding window over the raw transmission bitstream. */
export function BitSpanStrip({ frame }: BitSpanStripProps) {
  const { stream } = frame.snapshot.transmission;
  const node = frame.activeNode;
  const focusBit = frame.phase === 'decode' ? node.packet.span.startBit : 0;
  const [startBit, endBit] = computeBitWindow(stream.bitLength, focusBit);
  const bits = Array.from(stream.sliceBits(startBit, endBit));

  return (
    <div className="card" style={{ marginBottom: 0 }}>
      <div className="meta-row" style={{ margin: '0 0 0.5rem', justifyContent: 'space-between' }}>
        <strong style={{ fontSize: '0.88rem', color: 'var(--text)' }}>
          Bitstream Window [{startBit}..{endBit}) of {stream.bitLength} bits
        </strong>
        <span className="muted" style={{ fontSize: '0.8rem' }}>
          Active #{node.id} · V{node.packet.version} T{node.packet.typeId} · span [{node.packet.span.startBit}, {node.packet.span.endBit})
        </span>
      </div>
      <div role="region" aria-label="Bitstream bit window" style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', fontFamily: 'ui-monospace, Menlo, monospace' }}>
        {bits.map((bitChar, offset) => (
          <BitCell key={startBit + offset} bitIndex={startBit + offset} bitChar={bitChar} frame={frame} />
        ))}
      </div>
    </div>
  );
}
