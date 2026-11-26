import { useMemo } from 'react';
import {
  PlaybackControls,
  usePlayback,
  type PlaybackState,
  type VisualizerProps,
} from '../../../../shared/viz';
import {
  DEFAULT_MAX_TRACE_STEPS,
  sumCalories,
  type CalorieTraceFrame,
  type ElfInventory,
} from '../../shared';
import { solver } from '../domain';

const PODIUM_SLOTS = [
  { label: '#1 Gold', color: 'var(--gold)' },
  { label: '#2 Silver', color: '#6e7781' },
  { label: '#3 Bronze', color: '#9a4e1c' },
] as const;

const ROW_GRID = '8.5rem 1fr 5.5rem';

type TraceState =
  | { readonly ok: true; readonly frames: readonly CalorieTraceFrame[] }
  | { readonly ok: false; readonly message: string };

function buildTraceState(rawInput: string): TraceState {
  try {
    const inventories = solver.parse(rawInput);
    const frames = solver.trace!(inventories, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    return { ok: true, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function formatItems(elf: ElfInventory): string {
  const head = elf.items.slice(0, 4).join(' + ');
  const suffix = elf.items.length > 4 ? ` + … (+${elf.items.length - 4})` : '';
  return `${head}${suffix} = ${elf.totalCalories}`;
}

function handleTogglePlay(playback: PlaybackState, lastStep: number): void {
  if (!playback.isPlaying && playback.step >= lastStep) playback.setStep(0);
  playback.togglePlay();
}

function handleStepChange(playback: PlaybackState, nextStep: number): void {
  if (playback.isPlaying) playback.togglePlay();
  playback.setStep(nextStep);
}

function MeterRow({ label, elf, scaleMax, fill, cutoffPct, isHighlighted }: {
  readonly label: string;
  readonly elf?: ElfInventory;
  readonly scaleMax: number;
  readonly fill: string;
  readonly cutoffPct: number | null;
  readonly isHighlighted?: boolean;
}) {
  const widthPct = elf ? Math.max(4, Math.round((elf.totalCalories / scaleMax) * 100)) : 0;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: ROW_GRID, alignItems: 'center', gap: '0.5rem', fontSize: '0.84rem' }}>
      <span style={{ fontWeight: isHighlighted ? 700 : 600, color: 'var(--text)', whiteSpace: 'nowrap' }}>
        {label}{elf ? ` · #${elf.elfNumber}` : ''}
      </span>
      <div style={{ position: 'relative', height: 20, background: 'var(--bg)', border: `1px solid ${isHighlighted ? fill : 'var(--border)'}`, borderRadius: 4, overflow: 'hidden' }}>
        {elf ? (
          <div style={{ width: `${widthPct}%`, height: '100%', background: fill, opacity: 0.9, transition: 'width 140ms ease' }} />
        ) : (
          <span className="muted" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '0.76rem' }}>
            Slot open
          </span>
        )}
        {cutoffPct !== null && (
          <div aria-hidden="true" style={{ position: 'absolute', left: `${cutoffPct}%`, transform: 'translateX(-2px)', top: 0, bottom: 0, borderLeft: '2px dashed var(--warn)', pointerEvents: 'none' }} />
        )}
      </div>
      <code style={{ textAlign: 'right', color: 'var(--text)', fontWeight: isHighlighted ? 700 : 500 }}>
        {elf ? elf.totalCalories : '—'}
      </code>
    </div>
  );
}

function TelemetryHeader({ frame }: { readonly frame: CalorieTraceFrame }) {
  const topSum = sumCalories(frame.leaders);
  const cutoff = frame.leaders[2]?.totalCalories;
  return (
    <div className="meta-row">
      <span className="badge">Elf: <code>{frame.currentElf.elfNumber} / {frame.totalElves}</code></span>
      <span className="badge">Top-3 Sum: <strong className="gold">{topSum}</strong></span>
      <span className="badge">3rd Cutoff: <code>{cutoff ?? 'Open'}</code></span>
      <span className={`badge ${frame.enteredLeaderboard ? 'status-solved' : ''}`}>
        {frame.enteredLeaderboard ? 'Entered Top 3' : 'Below Cutoff'}
      </span>
      {frame.totalElves > frame.totalSteps && (
        <span className="muted">Sampled {frame.totalSteps} of {frame.totalElves} Elves</span>
      )}
    </div>
  );
}

function PodiumPanel({ frame }: { readonly frame: CalorieTraceFrame }) {
  const topLeader = frame.leaders[0]?.totalCalories ?? 0;
  const scaleMax = Math.max(topLeader, frame.currentElf.totalCalories, 1);
  const thirdCalories = frame.leaders[2]?.totalCalories;
  const cutoffPct = thirdCalories !== undefined ? Math.max(4, Math.round((thirdCalories / scaleMax) * 100)) : null;
  const challengerFill = frame.enteredLeaderboard ? 'var(--ok)' : 'var(--accent)';
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', padding: '0.75rem', margin: '0.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
      {PODIUM_SLOTS.map((slot, index) => (
        <MeterRow
          key={slot.label} label={slot.label} elf={frame.leaders[index]}
          scaleMax={scaleMax} fill={slot.color} cutoffPct={cutoffPct}
          isHighlighted={frame.leaders[index]?.elfNumber === frame.currentElf.elfNumber}
        />
      ))}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.45rem', marginTop: '0.1rem' }}>
        <MeterRow
          label="Challenger" elf={frame.currentElf} scaleMax={scaleMax}
          fill={challengerFill} cutoffPct={cutoffPct} isHighlighted
        />
      </div>
      <div className="muted" style={{ fontSize: '0.8rem', paddingTop: '0.35rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <span>Elf #{frame.currentElf.elfNumber} items: <code>{formatItems(frame.currentElf)}</code></span>
        {cutoffPct !== null && <span style={{ color: 'var(--warn)', fontWeight: 600 }}>¦ 3rd-place cutoff ({thirdCalories})</span>}
      </div>
    </div>
  );
}

export function TopThreePodiumVisualizer({ rawInput }: VisualizerProps) {
  const state = useMemo(() => buildTraceState(rawInput), [rawInput]);
  const frames = state.ok ? state.frames : [];
  const playback = usePlayback(frames.length, rawInput, 260);
  const frame = frames[playback.step];

  if (!state.ok || !frame) {
    return <p className="error-text">Unable to visualize input: {state.ok ? 'No trace frames' : state.message}</p>;
  }
  return (
    <div>
      <TelemetryHeader frame={frame} />
      <PodiumPanel frame={frame} />
      <PlaybackControls
        step={playback.step} totalSteps={frames.length} isPlaying={playback.isPlaying} speedMs={playback.speedMs}
        onTogglePlay={() => handleTogglePlay(playback, frames.length - 1)}
        onStepChange={(next) => handleStepChange(playback, next)}
        onSpeedChange={playback.setSpeedMs}
      />
    </div>
  );
}
