import {
  AXES,
  computeAxisPhaseProgress,
  computeEnergyBarRatio,
  formatMoonLabel,
  type AxisCycleTraceFrame,
  type NBodyTraceFrame,
  type OrbitStepTraceFrame,
} from '../index';

export interface OrbitTelemetryPanelProps {
  readonly frame: NBodyTraceFrame;
  readonly maxMoonEnergy: number;
}

function sumFrameEnergy(frame: OrbitStepTraceFrame): number {
  let total = 0;
  for (let i = 0; i < frame.moons.length; i += 1) {
    total += frame.moons[i]!.totalEnergy;
  }
  return total;
}

function OrbitStepTelemetry({ frame, maxMoonEnergy }: {
  readonly frame: OrbitStepTraceFrame;
  readonly maxMoonEnergy: number;
}) {
  const frameTotal = sumFrameEnergy(frame);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84rem' }}>
        <span className="eyebrow" style={{ margin: 0 }}>Moon Energy & Kinematics</span>
        <strong style={{ color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
          Frame Total Energy: {frameTotal}
        </strong>
      </div>
      <div className="metrics-grid">
        {frame.moons.map((moon, idx) => {
          const ratio = computeEnergyBarRatio(moon.totalEnergy, maxMoonEnergy);
          return (
            <div key={formatMoonLabel(idx)} className="metric-tile">
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700 }}>
                <span>{formatMoonLabel(idx)}</span>
                <span style={{ color: 'var(--accent)', fontVariantNumeric: 'tabular-nums' }}>{moon.totalEnergy}</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--muted)', fontFamily: 'monospace' }}>
                pos ({moon.position.x}, {moon.position.y}, {moon.position.z})
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--muted)', fontFamily: 'monospace' }}>
                vel ({moon.velocity.x}, {moon.velocity.y}, {moon.velocity.z}) · PE {moon.potentialEnergy} × KE {moon.kineticEnergy}
              </div>
              <div style={{ height: '5px', background: 'var(--border)', borderRadius: '999px', overflow: 'hidden', marginTop: '0.2rem' }}>
                <div style={{ width: `${Math.round(ratio * 100)}%`, height: '100%', background: 'var(--accent)' }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AxisCycleTelemetry({ frame }: { readonly frame: AxisCycleTraceFrame }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84rem' }}>
        <span className="eyebrow" style={{ margin: 0 }}>Per-Axis Period Decomposition</span>
        <strong style={{ color: 'var(--ok)', fontVariantNumeric: 'tabular-nums' }}>
          LCM Period: {String(frame.analysis.globalPeriod)}
        </strong>
      </div>
      <div className="metrics-grid">
        {AXES.map((axis) => {
          const period = frame.analysis[axis].period;
          const locked = frame.lockedAxes.includes(axis);
          const progress = locked ? 1 : computeAxisPhaseProgress(frame.step, period);
          return (
            <div key={axis} className="metric-tile" style={{ borderColor: locked ? 'var(--ok)' : 'var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700 }}>
                <span>Axis {axis.toUpperCase()}</span>
                <span style={{ color: locked ? 'var(--ok)' : 'var(--gold)', fontVariantNumeric: 'tabular-nums' }}>
                  {String(period)} {locked ? '· Locked' : ''}
                </span>
              </div>
              <div style={{ height: '6px', background: 'var(--border)', borderRadius: '999px', overflow: 'hidden', marginTop: '0.25rem' }}>
                <div
                  style={{
                    width: `${Math.round(progress * 100)}%`,
                    height: '100%',
                    background: locked ? 'var(--ok)' : 'var(--gold)',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** High-contrast telemetry panel adapting to orbit-step or axis-cycle frames. */
export function OrbitTelemetryPanel({ frame, maxMoonEnergy }: OrbitTelemetryPanelProps) {
  return (
    <div
      style={{
        padding: '0.75rem',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
      }}
    >
      {frame.kind === 'orbit-step' ? (
        <OrbitStepTelemetry frame={frame} maxMoonEnergy={maxMoonEnergy} />
      ) : (
        <AxisCycleTelemetry frame={frame} />
      )}
    </div>
  );
}
