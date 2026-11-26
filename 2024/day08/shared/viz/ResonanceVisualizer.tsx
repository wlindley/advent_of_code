import { useMemo, useState } from 'react';
import { PlaybackControls, usePlayback, type PlaybackState } from '../../../../shared/viz';
import {
  collectAntinodes,
  DEFAULT_MAX_TRACE_STEPS,
  parseAntennaMap,
  traceAntinodes,
  type AntennaMap,
  type AntinodeProjectionRule,
  type ResonanceTraceFrame,
} from '../index';
import { frequencyColor } from './palette';
import { ResonanceGridSvg } from './ResonanceGridSvg';

export interface ResonanceVisualizerProps {
  readonly rawInput: string;
  readonly rule: AntinodeProjectionRule;
}

type VizState =
  | {
      readonly ok: true;
      readonly map: AntennaMap;
      readonly frames: readonly ResonanceTraceFrame[];
      readonly totalUnique: number;
    }
  | { readonly ok: false; readonly message: string };

function buildVizState(rawInput: string, rule: AntinodeProjectionRule): VizState {
  try {
    const map = parseAntennaMap(rawInput);
    const frames = traceAntinodes(map, rule, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    const totalUnique = frames.length > 0 ? frames[frames.length - 1]!.uniqueCount : collectAntinodes(map, rule).length;
    return { ok: true, map, frames, totalUnique };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function FrequencyFilterBar({
  map,
  selected,
  onSelect,
}: {
  readonly map: AntennaMap;
  readonly selected: string | null;
  readonly onSelect: (freq: string | null) => void;
}) {
  const groups = Array.from(map.frequencyGroups.entries());
  return (
    <div className="meta-row" role="group" aria-label="Frequency filter">
      <button type="button" className={selected === null ? 'primary' : ''} onClick={() => onSelect(null)}>
        All ({groups.length})
      </button>
      {groups.map(([freq, pts]) => {
        const active = selected === freq;
        const color = frequencyColor(freq);
        return (
          <button
            key={freq}
            type="button"
            onClick={() => onSelect(active ? null : freq)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
              borderColor: active ? color : 'var(--border)', borderWidth: active ? 2 : 1,
              background: active ? color : 'var(--surface)', color: active ? '#ffffff' : 'var(--text)', fontWeight: 600,
            }}
          >
            <span aria-hidden="true" style={{ width: 9, height: 9, borderRadius: '50%', background: active ? '#ffffff' : color }} />
            <code>{freq}</code> ({pts.length})
          </button>
        );
      })}
    </div>
  );
}

function KpiHeader({
  map,
  frame,
  totalUnique,
  rule,
}: {
  readonly map: AntennaMap;
  readonly frame: ResonanceTraceFrame | null;
  readonly totalUnique: number;
  readonly rule: AntinodeProjectionRule;
}) {
  return (
    <div className="meta-row">
      <span className="badge">Map: <code>{map.rows}×{map.cols}</code></span>
      <span className="badge">Rule: <code>{rule.id}</code></span>
      <span className="badge status-solved">
        Unique Antinodes: <strong className="gold"><code>{frame ? frame.uniqueCount : totalUnique}</code></strong>
      </span>
      {frame ? (
        <>
          <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
            Pair <code>#{frame.stepIndex + 1} / {frame.totalPairs}</code> ({frame.frequency}: ({frame.anchorA.row},{frame.anchorA.col})↔({frame.anchorB.row},{frame.anchorB.col}))
          </span>
          <span className="badge" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }}>+{frame.added.length} new</span>
          <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>{frame.duplicates.length} dup · {frame.outOfBounds.length} OOB</span>
        </>
      ) : (
        <span className="badge muted">No pairs to animate</span>
      )}
    </div>
  );
}

function VizFooter({ totalSteps, playback }: { readonly totalSteps: number; readonly playback: PlaybackState }) {
  return (
    <>
      <div className="meta-row" style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
        <span><strong style={{ color: 'var(--ok)' }}>Emerald + gold ripple</strong>: added antinode</span>
        <span>·</span>
        <span><strong style={{ color: 'var(--gold)' }}>Dashed amber ring</strong>: duplicate</span>
        <span>·</span>
        <span><strong style={{ color: 'var(--text)' }}>Double ring</strong>: overlaps antenna</span>
        <span>·</span>
        <span><strong style={{ color: 'var(--accent)' }}>× in margin</strong>: out-of-bounds</span>
      </div>
      <PlaybackControls
        step={playback.step}
        totalSteps={totalSteps}
        isPlaying={playback.isPlaying}
        speedMs={playback.speedMs}
        onTogglePlay={() => {
          if (!playback.isPlaying && playback.step >= totalSteps - 1) playback.setStep(0);
          playback.togglePlay();
        }}
        onStepChange={(next) => {
          if (playback.isPlaying) playback.togglePlay();
          playback.setStep(next);
        }}
        onSpeedChange={playback.setSpeedMs}
      />
    </>
  );
}

/** Interactive antenna resonance visualizer with frequency filtering and bounded playback. */
export function ResonanceVisualizer({ rawInput, rule }: ResonanceVisualizerProps) {
  const [selectedFreq, setSelectedFreq] = useState<string | null>(null);
  const state = useMemo(() => buildVizState(rawInput, rule), [rawInput, rule]);
  const effectiveFreq = state.ok && selectedFreq !== null && state.map.frequencyGroups.has(selectedFreq) ? selectedFreq : null;
  const visibleFrames = useMemo(
    () => (state.ok ? (effectiveFreq === null ? state.frames : state.frames.filter((f) => f.frequency === effectiveFreq)) : []),
    [state, effectiveFreq],
  );
  const playback = usePlayback(visibleFrames.length, `${rawInput}::${effectiveFreq ?? '*'}`, 220);
  const frame = visibleFrames[playback.step] ?? null;

  if (!state.ok) {
    return <p className="error-text">Unable to visualize input: {state.message}</p>;
  }
  return (
    <div>
      <KpiHeader map={state.map} frame={frame} totalUnique={state.totalUnique} rule={rule} />
      <FrequencyFilterBar map={state.map} selected={effectiveFreq} onSelect={setSelectedFreq} />
      <div style={{ margin: '0.6rem 0' }}>
        <ResonanceGridSvg map={state.map} frame={frame} selectedFrequency={effectiveFreq} />
      </div>
      <VizFooter totalSteps={visibleFrames.length} playback={playback} />
    </div>
  );
}
