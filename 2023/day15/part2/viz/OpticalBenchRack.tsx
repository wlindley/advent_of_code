import type { CSSProperties } from 'react';
import type { LensBoxSnapshot, LensEntry, LensMutationOutcome } from '../domain';

export interface OpticalBenchRackProps {
  readonly occupiedBoxes: readonly LensBoxSnapshot[];
  readonly activeBoxIndex: number;
  readonly activeLabel: string;
  readonly outcome: LensMutationOutcome;
}

const WRAPPER_STYLE: CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  padding: '0.75rem 0.85rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.6rem',
};

const GRID_STYLE: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
  gap: '0.55rem',
};

function LensChip({
  boxIndex,
  slotIndex,
  lens,
  isAffected,
}: {
  readonly boxIndex: number;
  readonly slotIndex: number;
  readonly lens: LensEntry;
  readonly isAffected: boolean;
}) {
  const power = (boxIndex + 1) * (slotIndex + 1) * lens.focalLength;
  return (
    <span
      title={`(${boxIndex + 1})×${slotIndex + 1}×${lens.focalLength} = ${power}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.28rem',
        padding: '0.2rem 0.45rem',
        borderRadius: '5px',
        border: `1px solid ${isAffected ? 'var(--accent)' : 'var(--border)'}`,
        background: isAffected ? 'var(--surface)' : 'var(--bg)',
        color: 'var(--text)',
        fontSize: '0.78rem',
        fontVariantNumeric: 'tabular-nums',
        fontWeight: isAffected ? 700 : 500,
      }}
    >
      <code>{lens.label}</code>
      <span style={{ color: isAffected ? 'var(--accent)' : 'var(--ok)', fontWeight: 700 }}>
        {lens.focalLength}
      </span>
    </span>
  );
}

function BoxCard({
  box,
  isActiveBox,
  activeLabel,
}: {
  readonly box: LensBoxSnapshot;
  readonly isActiveBox: boolean;
  readonly activeLabel: string;
}) {
  return (
    <div
      style={{
        border: `${isActiveBox ? '2px' : '1px'} solid ${isActiveBox ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: '7px',
        padding: '0.5rem 0.6rem',
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.4rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.4rem' }}>
        <strong style={{ fontSize: '0.82rem', color: isActiveBox ? 'var(--accent)' : 'var(--text)' }}>
          Box {box.boxIndex}
        </strong>
        <span className="muted" style={{ fontSize: '0.75rem', fontVariantNumeric: 'tabular-nums' }}>
          Power {box.focusingPower}
        </span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
        {box.lenses.map((lens, slotIndex) => (
          <LensChip
            key={lens.label}
            boxIndex={box.boxIndex}
            slotIndex={slotIndex}
            lens={lens}
            isAffected={isActiveBox && lens.label === activeLabel}
          />
        ))}
      </div>
    </div>
  );
}

/** Ordered lens slot rack displaying all currently occupied HASHMAP boxes. */
export function OpticalBenchRack({
  occupiedBoxes,
  activeBoxIndex,
  activeLabel,
  outcome,
}: OpticalBenchRackProps) {
  const activeBoxPresent = occupiedBoxes.some((box) => box.boxIndex === activeBoxIndex);

  return (
    <div style={WRAPPER_STYLE} aria-label="Occupied optical lens boxes">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.45rem' }}>
        <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text)' }}>
          Occupied Boxes ({occupiedBoxes.length})
        </span>
        {!activeBoxPresent ? (
          <span className="badge" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
            Box {activeBoxIndex} is empty ({outcome.kind === 'removed' ? `removed ${activeLabel}` : 'no lenses'})
          </span>
        ) : null}
      </div>
      {occupiedBoxes.length === 0 ? (
        <p className="muted" style={{ margin: 0, fontSize: '0.82rem' }}>
          All 256 boxes are currently empty.
        </p>
      ) : (
        <div style={GRID_STYLE}>
          {occupiedBoxes.map((box) => (
            <BoxCard
              key={box.boxIndex}
              box={box}
              isActiveBox={box.boxIndex === activeBoxIndex}
              activeLabel={activeLabel}
            />
          ))}
        </div>
      )}
    </div>
  );
}
