import { useState } from 'react';
import {
  averageCyclomatic,
  computeQualityGrade,
  coveragePercent,
  githubBlobUrl,
  minCoveragePercent,
  testToCodeRatio,
  type FileQualityRow,
  type ScopeQuality,
} from '../data/quality';
import { QualityDrilldownModal, type DrilldownSortKey } from './QualityDrilldownModal';

export interface QualityPanelProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly scope: ScopeQuality;
  readonly files?: readonly FileQualityRow[];
}

export function QualityPanel({ title, subtitle, scope, files }: QualityPanelProps) {
  const [drilldown, setDrilldown] = useState<DrilldownSortKey | null>(null);
  const grade = computeQualityGrade(scope);
  const { coverage, complexity } = scope;
  const minCov = minCoveragePercent(coverage);
  const stmts = coveragePercent(coverage.statements);
  const branches = coveragePercent(coverage.branches);
  const funcs = coveragePercent(coverage.functions);
  const lines = coveragePercent(coverage.lines);
  const ccHotspot = complexity.maxCyclomaticHotspot;
  const fnHotspot = complexity.longestFunctionHotspot ?? complexity.maxNestingHotspot;
  const canDrill = Boolean(files && files.length > 0);

  return (
    <div className="quality-panel">
      <div className="quality-header">
        <div>
          <strong>{title}</strong>
          {subtitle && <span className="muted"> · {subtitle}</span>}
        </div>
        <span className={`badge grade-${grade}`}>Grade {grade}</span>
      </div>
      <div className="metrics-grid">
        <button
          type="button"
          className="metric-tile metric-interactive"
          disabled={!canDrill}
          onClick={() => setDrilldown('coverage')}
        >
          <span className="eyebrow">Coverage {canDrill ? '↗' : ''}</span>
          <strong className="nowrap">{minCov}%</strong>
          <div className="metric-sub">
            <span className="nowrap">Lines {lines}%</span>
            <span className="nowrap">Branches {branches}%</span>
            <span className="nowrap">Funcs {funcs}%</span>
            <span className="nowrap">Stmts {stmts}%</span>
          </div>
        </button>

        <button
          type="button"
          className="metric-tile metric-interactive"
          disabled={!canDrill}
          onClick={() => setDrilldown('maintainability')}
        >
          <span className="eyebrow">Maintainability {canDrill ? '↗' : ''}</span>
          <strong className="nowrap">{complexity.maintainabilityIndex} / 100</strong>
          <div className="metric-sub">
            <span className="nowrap">{complexity.fileCount} files</span>
            <span className="nowrap">{complexity.sloc} SLOC</span>
            <span className="nowrap">{testToCodeRatio(complexity)}x tests</span>
          </div>
        </button>

        {ccHotspot ? (
          <a
            className="metric-tile metric-interactive"
            href={githubBlobUrl(ccHotspot.filePath, ccHotspot.startLine, ccHotspot.endLine)}
            target="_blank"
            rel="noreferrer"
            title={`Inspect max CC (${ccHotspot.value}) in ${ccHotspot.name} (${ccHotspot.filePath}:${ccHotspot.startLine})`}
          >
            <span className="eyebrow">Cyclomatic · GitHub ↗</span>
            <strong className="nowrap">avg {averageCyclomatic(complexity)}</strong>
            <div className="metric-sub">
              <span className="nowrap">max {complexity.maxCyclomatic} ({ccHotspot.name})</span>
              <span className="nowrap">{complexity.functionCount} functions</span>
            </div>
          </a>
        ) : (
          <div className="metric-tile">
            <span className="eyebrow">Cyclomatic</span>
            <strong className="nowrap">avg {averageCyclomatic(complexity)}</strong>
            <div className="metric-sub">
              <span className="nowrap">max {complexity.maxCyclomatic}</span>
              <span className="nowrap">{complexity.functionCount} functions</span>
            </div>
          </div>
        )}

        {fnHotspot ? (
          <a
            className="metric-tile metric-interactive"
            href={githubBlobUrl(fnHotspot.filePath, fnHotspot.startLine, fnHotspot.endLine)}
            target="_blank"
            rel="noreferrer"
            title={`Inspect ${fnHotspot.name} (${fnHotspot.filePath}:${fnHotspot.startLine}-${fnHotspot.endLine})`}
          >
            <span className="eyebrow">Nesting &amp; Length · GitHub ↗</span>
            <strong className="nowrap">depth {complexity.maxNestingDepth}</strong>
            <div className="metric-sub">
              <span className="nowrap">max {complexity.maxFunctionSloc} LoC</span>
              <span className="nowrap">{complexity.nestedFunctionCount} nested fns</span>
            </div>
          </a>
        ) : (
          <div className="metric-tile">
            <span className="eyebrow">Nesting &amp; Length</span>
            <strong className="nowrap">depth {complexity.maxNestingDepth}</strong>
            <div className="metric-sub">
              <span className="nowrap">max {complexity.maxFunctionSloc} LoC</span>
              <span className="nowrap">{complexity.nestedFunctionCount} nested fns</span>
            </div>
          </div>
        )}
      </div>

      {drilldown && files && (
        <QualityDrilldownModal
          title={`${title} Breakdown`}
          files={files}
          initialSort={drilldown}
          onClose={() => setDrilldown(null)}
        />
      )}
    </div>
  );
}
