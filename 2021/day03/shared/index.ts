export { BitTally, DiagnosticReport, parseDiagnosticReport, type Bit } from './report';
export { LEAST_COMMON_CRITERION, MOST_COMMON_CRITERION, type BitCriterion } from './criteria';
export {
  DEFAULT_MAX_TRACE_STEPS,
  PowerRates,
  analyzePowerConsumption,
  tallyAllColumns,
  tracePowerConsumption,
  type PowerTraceFrame,
} from './powerAnalysis';
export {
  CHART_VIEWBOX,
  MAX_VISIBLE_COLUMNS,
  buildColumnChartGeometry,
  formatBitPreview,
  type ColumnBarGeometry,
  type ColumnChartGeometry,
} from './chartGeometry';
