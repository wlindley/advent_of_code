import { computeGaugeRatio, computeModuleWindow, computeStageSegments, type FuelTraceFrame, type ModuleManifest } from '../index';

interface FuelCascadeSvgProps {
  readonly manifest: ModuleManifest;
  readonly frame: FuelTraceFrame;
  readonly totalFuel: number;
  readonly policyLabel: string;
}

const STAGE_COLORS = ['var(--accent)', 'var(--gold)', 'var(--ok)'] as const;

function stageColor(stageIndex: number): string {
  if (stageIndex === 0) return STAGE_COLORS[0];
  return stageIndex % 2 === 1 ? STAGE_COLORS[1] : STAGE_COLORS[2];
}

function FuelGaugeHeader({ frame, totalFuel, policyLabel }: Omit<FuelCascadeSvgProps, 'manifest'>) {
  const ratio = computeGaugeRatio(frame.cumulativeFuel, totalFuel);
  return (
    <g>
      <text x={16} y={24} fontSize={12} fontWeight={700} fill="var(--text)">
        {policyLabel} Telemetry
      </text>
      <text x={664} y={24} fontSize={12} fontWeight={600} textAnchor="end" fill="var(--text)">
        Cumulative: {frame.cumulativeFuel.toLocaleString()} / {totalFuel.toLocaleString()}
      </text>
      <rect x={16} y={32} width={648} height={14} rx={7} fill="var(--bg)" stroke="var(--border)" />
      <rect x={16} y={32} width={648 * ratio} height={14} rx={7} fill="var(--ok)" />
    </g>
  );
}

function ModuleWindowPanel({ manifest, frame }: Pick<FuelCascadeSvgProps, 'manifest' | 'frame'>) {
  const win = computeModuleWindow(manifest.count, frame.moduleIndex, 8);
  const indices = Array.from({ length: win.end - win.start }, (_, offset) => win.start + offset);
  return (
    <g>
      <rect x={16} y={62} width={304} height={232} rx={8} fill="var(--bg)" stroke="var(--border)" />
      <text x={28} y={84} fontSize={12} fontWeight={700} fill="var(--text)">
        Modules ({win.start + 1}–{win.end} of {manifest.count})
      </text>
      {indices.map((idx, row) => {
        const mass = manifest.masses[idx]!;
        const y = 96 + row * 24;
        const isActive = idx === frame.moduleIndex;
        const fill = isActive ? 'var(--accent)' : idx < frame.moduleIndex ? 'var(--ok)' : 'var(--border)';
        const barW = Math.max(2, 130 * computeGaugeRatio(mass, manifest.maxMass));
        return (
          <g key={idx}>
            {isActive && <rect x={22} y={y} width={292} height={20} rx={4} fill="var(--surface)" stroke="var(--accent)" />}
            <text x={28} y={y + 14} fontSize={11} fontWeight={isActive ? 700 : 500} fill="var(--muted)">#{idx + 1}</text>
            <rect x={68} y={y + 5} width={130} height={10} rx={5} fill="var(--surface)" stroke="var(--border)" />
            <rect x={68} y={y + 5} width={barW} height={10} rx={5} fill={fill} />
            <text x={306} y={y + 14} fontSize={11} fontWeight={isActive ? 700 : 500} textAnchor="end" fill="var(--text)">
              {mass.toLocaleString()}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function StageBreakdownRows({ frame }: Pick<FuelCascadeSvgProps, 'frame'>) {
  const visible = frame.stages.slice(0, 6);
  const hiddenCount = frame.stages.length - visible.length;
  if (visible.length === 0) {
    return (
      <text x={500} y={182} fontSize={12} textAnchor="middle" fill="var(--muted)">
        Zero fuel required (mass &lt;= 8)
      </text>
    );
  }
  return (
    <g>
      {visible.map((fuel, idx) => (
        <g key={idx}>
          <circle cx={360} cy={146 + idx * 19} r={4} fill={stageColor(idx)} />
          <text x={372} y={150 + idx * 19} fontSize={11} fill="var(--text)">
            Stage {idx + 1}{idx === 0 ? ' (Base)' : ' (Extra)'}
          </text>
          <text x={648} y={150 + idx * 19} fontSize={11} fontWeight={600} textAnchor="end" fill="var(--text)">
            {fuel.toLocaleString()}
          </text>
        </g>
      ))}
      {hiddenCount > 0 && (
        <text x={352} y={266} fontSize={11} fill="var(--muted)">+{hiddenCount} more recursive stages</text>
      )}
    </g>
  );
}

function StageCascadePanel({ frame }: Pick<FuelCascadeSvgProps, 'frame'>) {
  const segments = computeStageSegments(frame.stages, 296);
  return (
    <g>
      <rect x={336} y={62} width={328} height={232} rx={8} fill="var(--bg)" stroke="var(--border)" />
      <text x={352} y={84} fontSize={12} fontWeight={700} fill="var(--text)">
        Module #{frame.moduleIndex + 1} · Mass {frame.mass.toLocaleString()}
      </text>
      <rect x={352} y={98} width={296} height={20} rx={6} fill="var(--surface)" stroke="var(--border)" />
      {segments.map((seg) => (
        <rect key={seg.stageIndex} x={352 + seg.x} y={98} width={seg.width} height={20} fill={stageColor(seg.stageIndex)} />
      ))}
      <StageBreakdownRows frame={frame} />
      <text x={352} y={284} fontSize={11} fontWeight={700} fill="var(--text)">
        Base: {frame.baseFuel.toLocaleString()} · Extra: {frame.extraFuel.toLocaleString()} · Total: {frame.moduleFuel.toLocaleString()}
      </text>
    </g>
  );
}

/** Interactive SVG telemetry chart showing module mass window and fuel stage cascade. */
export function FuelCascadeSvg({ manifest, frame, totalFuel, policyLabel }: FuelCascadeSvgProps) {
  const label = `${policyLabel} telemetry for module ${frame.moduleIndex + 1} of ${manifest.count}`;
  return (
    <svg viewBox="0 0 680 308" role="img" aria-label={label} className="chart-svg">
      <FuelGaugeHeader frame={frame} totalFuel={totalFuel} policyLabel={policyLabel} />
      <ModuleWindowPanel manifest={manifest} frame={frame} />
      <StageCascadePanel frame={frame} />
    </svg>
  );
}
