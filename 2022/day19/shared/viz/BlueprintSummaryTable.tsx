import type { BlueprintResult, FactoryMode } from '../index';

export interface BlueprintSummaryTableProps {
  readonly results: readonly BlueprintResult[];
  readonly activeIndex: number;
  readonly mode: FactoryMode;
  readonly onSelectBlueprint: (index: number) => void;
}

/** Interactive summary table of evaluated blueprints, highlighting the active timeline. */
export function BlueprintSummaryTable({
  results,
  activeIndex,
  mode,
  onSelectBlueprint,
}: BlueprintSummaryTableProps) {
  return (
    <div className="table-scroll" style={{ maxHeight: 240, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)' }}>
      <table className="quality-table">
        <thead>
          <tr>
            <th>BP</th>
            <th>Costs (Ore / Clay / Obs / Geode)</th>
            <th>Max Geodes</th>
            <th>{mode === 'quality-sum' ? 'Quality' : 'Mode'}</th>
            <th>DFS Nodes</th>
          </tr>
        </thead>
        <tbody>
          {results.map((res, idx) => {
            const bp = res.blueprint;
            const isActive = idx === activeIndex;
            return (
              <tr
                key={bp.id}
                onClick={() => onSelectBlueprint(idx)}
                style={{
                  cursor: 'pointer',
                  background: isActive ? 'var(--bg)' : 'transparent',
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                <td><code>#{bp.id}</code></td>
                <td>
                  <code>
                    {bp.oreRobotOreCost}o · {bp.clayRobotOreCost}o · {bp.obsidianRobotOreCost}o+{bp.obsidianRobotClayCost}c · {bp.geodeRobotOreCost}o+{bp.geodeRobotObsidianCost}ob
                  </code>
                </td>
                <td><strong className="gold"><code>{res.maxGeodes}</code></strong></td>
                <td><code>{mode === 'quality-sum' ? res.qualityLevel : `×${res.maxGeodes}`}</code></td>
                <td><code>{res.nodesVisited.toLocaleString()}</code></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
