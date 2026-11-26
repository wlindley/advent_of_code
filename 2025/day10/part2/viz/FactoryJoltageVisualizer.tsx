import { useEffect, useMemo, useState } from 'react';
import { PlaybackControls, type VisualizerProps } from '../../../../shared/viz';
import { DEFAULT_MAX_TRACE_STEPS, solver, totalPresses, type MachineJoltageTraceFrame } from '../domain';

export function FactoryJoltageVisualizer({ rawInput }: VisualizerProps) {
  const [frameIndex, setFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMs, setSpeedMs] = useState(380);

  const state = useMemo(() => {
    try {
      const machines = solver.parse(rawInput);
      return { ok: true as const, frames: solver.trace!(machines, { maxSteps: DEFAULT_MAX_TRACE_STEPS }) };
    } catch (error) {
      return { ok: false as const, message: error instanceof Error ? error.message : String(error) };
    }
  }, [rawInput]);

  useEffect(() => { setFrameIndex(0); setIsPlaying(false); }, [rawInput]);

  const frames: readonly MachineJoltageTraceFrame[] = state.ok ? state.frames : [];
  useEffect(() => {
    if (!isPlaying || frames.length <= 1) return;
    const id = window.setInterval(() => {
      setFrameIndex((prev) => {
        if (prev + 1 >= frames.length - 1) { setIsPlaying(false); return frames.length - 1; }
        return prev + 1;
      });
    }, speedMs);
    return () => window.clearInterval(id);
  }, [isPlaying, speedMs, frames.length]);

  if (!state.ok || frames.length === 0) {
    return <p className="error-text">Unable to visualize input: {state.ok ? 'No trace frames' : state.message}</p>;
  }

  const clamped = Math.min(frameIndex, frames.length - 1);
  const frame = frames[clamped]!;
  const { machine, system, presses } = frame;
  const [L, B, machineTotal] = [machine.lightCount, machine.buttonCount, totalPresses(presses)];
  const pivotSet = new Set(system.pivotColumns);
  const pivotRowByCol = new Map(system.pivotColumns.map((col, row) => [col, row]));
  const achieved = new Array<number>(L).fill(0);
  presses.forEach((p, b) => { for (const l of machine.buttons[b]!) achieved[l] = achieved[l]! + p; });
  const maxTarget = Math.max(1, ...machine.joltageRequirements);

  const [ctrStep, barW, barTop, barMaxH] = [48, 24, 38, 52];
  const [btnW, btnStep, cellW, cellH] = [64, 72, 38, 26];
  const W = Math.max(720, L * ctrStep + 60, B * btnStep + 60, (B + 2) * cellW + 80);
  const matrixY = 224;
  const H = matrixY + L * cellH + 22;
  const ctrX0 = (W - ((L - 1) * ctrStep + barW)) / 2;
  const btnX0 = (W - (B * btnStep - 8)) / 2;
  const matX0 = (W - ((B + 1) * cellW + 10)) / 2;

  return (
    <div>
      <div className="meta-row">
        <span className="badge">Machine: <code>{frame.machineIndex + 1} / {frame.totalMachines}</code></span>
        <span className="badge">Rank: <code>{system.rank}</code></span>
        <span className="badge">Nullity: <code>{system.nullity}</code></span>
        <span className="badge">Presses: <code>{machineTotal}</code></span>
        <span className="badge status-solved">
          Cumulative: <strong className="gold"><code>{frame.cumulativePresses}</code></strong>
        </span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Machine ${frame.machineIndex + 1} of ${frame.totalMachines}: ${machineTotal} presses, cumulative ${frame.cumulativePresses}`}
        style={{
          width: '100%', height: 'auto', display: 'block', margin: '0.6rem 0',
          border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)',
        }}
      >
        <text x={20} y={22} fontSize={12} fontWeight={600} fill="var(--muted)">
          JOLTAGE COUNTERS (proportional target gauges)
        </text>
        {machine.joltageRequirements.map((target, l) => {
          const x = ctrX0 + l * ctrStep;
          const fillH = (achieved[l]! / maxTarget) * barMaxH;
          const targetY = barTop + barMaxH - (target / maxTarget) * barMaxH;
          return (
            <g key={l}>
              <rect x={x} y={barTop} width={barW} height={barMaxH} rx={4} fill="var(--bg)" stroke="var(--border)" strokeWidth={1} />
              <rect x={x} y={barTop + barMaxH - fillH} width={barW} height={fillH} rx={3} fill="var(--ok)" fillOpacity={0.78} />
              <line x1={x - 3} y1={targetY} x2={x + barW + 3} y2={targetY} stroke="var(--gold)" strokeWidth={2} />
              <text x={x + barW / 2} y={barTop - 4} fontSize={10} fontWeight={700} textAnchor="middle" fill="var(--text)">{target}</text>
              <text x={x + barW / 2} y={barTop + barMaxH + 14} fontSize={11} textAnchor="middle" fill="var(--text)">C{l}</text>
            </g>
          );
        })}

        <text x={20} y={134} fontSize={12} fontWeight={600} fill="var(--muted)">
          BUTTONS (P = pivot, F = free, ×k = integer presses)
        </text>
        {machine.buttons.map((btn, b) => {
          const x = btnX0 + b * btnStep;
          const count = presses[b] ?? 0;
          const isPivot = pivotSet.has(b);
          const stroke = count > 0 ? 'var(--ok)' : isPivot ? 'var(--accent)' : 'var(--gold)';
          const wiring = btn.length <= 3 ? btn.join(',') : `${btn.length}C`;
          return (
            <g key={b}>
              <rect x={x} y={144} width={btnW} height={44} rx={6} fill={count > 0 ? 'var(--ok)' : 'var(--bg)'} fillOpacity={count > 0 ? 0.14 : 1} stroke={stroke} strokeWidth={count > 0 ? 2 : 1.3} />
              <text x={x + btnW / 2} y={160} fontSize={11} fontWeight={700} textAnchor="middle" fill="var(--text)">B{b} · {isPivot ? 'P' : 'F'} ×{count}</text>
              <text x={x + btnW / 2} y={177} fontSize={10} textAnchor="middle" fill="var(--muted)">({wiring})</text>
            </g>
          );
        })}

        <text x={20} y={212} fontSize={12} fontWeight={600} fill="var(--muted)">
          Q-RREF AUGMENTED MATRIX ({L} × {B + 1})
        </text>
        {system.rrefRows.map((row, r) => {
          const y = matrixY + r * cellH;
          const rx = matX0 + B * cellW + 10;
          return (
            <g key={r}>
              {Array.from({ length: B }, (_, c) => {
                const x = matX0 + c * cellW;
                const isPivotCell = pivotRowByCol.get(c) === r;
                const isFreeCol = !pivotSet.has(c);
                const fill = isPivotCell ? 'var(--accent)' : isFreeCol ? 'var(--gold)' : 'var(--bg)';
                return (
                  <g key={c}>
                    <rect x={x} y={y} width={cellW - 2} height={cellH - 2} rx={4} fill={fill} fillOpacity={isPivotCell ? 0.18 : isFreeCol ? 0.1 : 1} stroke="var(--border)" strokeWidth={1} />
                    <text x={x + (cellW - 2) / 2} y={y + cellH / 2 + 3} fontSize={10} fontWeight={isPivotCell ? 700 : 500} textAnchor="middle" fill="var(--text)">{row[c]!.toString()}</text>
                  </g>
                );
              })}
              <line x1={matX0 + B * cellW + 4} y1={y} x2={matX0 + B * cellW + 4} y2={y + cellH - 2} stroke="var(--text)" strokeWidth={1.5} />
              <rect x={rx} y={y} width={cellW - 2} height={cellH - 2} rx={4} fill="var(--surface)" stroke="var(--border)" strokeWidth={1} />
              <text x={rx + (cellW - 2) / 2} y={y + cellH / 2 + 3} fontSize={10} fontWeight={700} textAnchor="middle" fill="var(--accent)">{row[B]!.toString()}</text>
            </g>
          );
        })}
      </svg>

      <PlaybackControls
        step={clamped}
        totalSteps={frames.length}
        isPlaying={isPlaying}
        speedMs={speedMs}
        onTogglePlay={() => {
          if (!isPlaying && clamped >= frames.length - 1) setFrameIndex(0);
          setIsPlaying((p) => !p);
        }}
        onStepChange={(next) => { setIsPlaying(false); setFrameIndex(next); }}
        onSpeedChange={setSpeedMs}
      />
    </div>
  );
}
