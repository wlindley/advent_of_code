export type DashboardTab = 'overview' | 'metrics';
export type MetricsScope = 'overall' | number;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface PersistedViewState {
  readonly selectedYear: number | null;
  readonly dashboardTab: DashboardTab;
  readonly metricsScope: MetricsScope;
  readonly scrollByRoute: Readonly<Record<string, number>>;
}

export interface SelectionPatch {
  readonly selectedYear?: number;
  readonly dashboardTab?: DashboardTab;
  readonly metricsScope?: MetricsScope;
}

const STORAGE_KEY = 'aoc.dashboard.viewState.v1';
const MAX_SAVED_ROUTES = 30;

const DEFAULT_STATE: PersistedViewState = Object.freeze({
  selectedYear: null,
  dashboardTab: 'overview',
  metricsScope: 'overall',
  scrollByRoute: Object.freeze({}),
});

export function normalizeRouteKey(hash: string): string {
  const cleaned = hash.replace(/^#\/?/, '').replace(/\/+$/, '');
  return cleaned ? `/${cleaned}` : '/';
}

export function resolveSelectedYear(
  savedYear: number | null,
  availableYears: readonly number[],
): number {
  if (savedYear !== null && availableYears.includes(savedYear)) return savedYear;
  return availableYears[0] ?? 2025;
}

export function resolveMetricsScope(
  savedScope: MetricsScope,
  availableYears: readonly number[],
): MetricsScope {
  if (savedScope === 'overall') return 'overall';
  return availableYears.includes(savedScope) ? savedScope : 'overall';
}

function parseDashboardTab(raw: unknown): DashboardTab {
  return raw === 'metrics' ? 'metrics' : 'overview';
}

function parseYearNumber(raw: unknown): number | null {
  return typeof raw === 'number' && Number.isInteger(raw) && raw >= 2015 && raw <= 2100 ? raw : null;
}

function parseMetricsScope(raw: unknown): MetricsScope {
  if (raw === 'overall') return 'overall';
  const year = parseYearNumber(raw);
  return year ?? 'overall';
}

function parseScrollMap(raw: unknown): Readonly<Record<string, number>> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return Object.freeze({});
  const result: Record<string, number> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
      result[key] = Math.round(value);
    }
  }
  return Object.freeze(result);
}

function parseRawState(raw: string | null): PersistedViewState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    return Object.freeze({
      selectedYear: parseYearNumber(parsed.selectedYear),
      dashboardTab: parseDashboardTab(parsed.dashboardTab),
      metricsScope: parseMetricsScope(parsed.metricsScope),
      scrollByRoute: parseScrollMap(parsed.scrollByRoute),
    });
  } catch {
    return null;
  }
}

function safeGet(storage: StorageLike | null, key: string): string | null {
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(storage: StorageLike | null, key: string, value: string): void {
  if (!storage) return;
  try {
    storage.setItem(key, value);
  } catch {
    // Ignore private-browsing or quota errors.
  }
}

function capScrollMap(entries: Record<string, number>): Readonly<Record<string, number>> {
  const keys = Object.keys(entries);
  if (keys.length <= MAX_SAVED_ROUTES) return Object.freeze(entries);
  const trimmed: Record<string, number> = {};
  for (const key of keys.slice(keys.length - MAX_SAVED_ROUTES)) {
    trimmed[key] = entries[key]!;
  }
  return Object.freeze(trimmed);
}

export class ViewStateStore {
  constructor(
    private readonly sessionStorage: StorageLike | null,
    private readonly persistentStorage: StorageLike | null,
  ) {}

  load(): PersistedViewState {
    const fromSession = parseRawState(safeGet(this.sessionStorage, STORAGE_KEY));
    if (fromSession) return fromSession;
    const fromPersistent = parseRawState(safeGet(this.persistentStorage, STORAGE_KEY));
    if (!fromPersistent) return DEFAULT_STATE;
    return Object.freeze({
      selectedYear: fromPersistent.selectedYear,
      dashboardTab: fromPersistent.dashboardTab,
      metricsScope: fromPersistent.metricsScope,
      scrollByRoute: Object.freeze({}),
    });
  }

  saveSelection(patch: SelectionPatch): PersistedViewState {
    const current = this.load();
    const next: PersistedViewState = Object.freeze({
      selectedYear: patch.selectedYear ?? current.selectedYear,
      dashboardTab: patch.dashboardTab ?? current.dashboardTab,
      metricsScope: patch.metricsScope ?? current.metricsScope,
      scrollByRoute: current.scrollByRoute,
    });
    const serialized = JSON.stringify(next);
    safeSet(this.sessionStorage, STORAGE_KEY, serialized);
    safeSet(
      this.persistentStorage,
      STORAGE_KEY,
      JSON.stringify({
        selectedYear: next.selectedYear,
        dashboardTab: next.dashboardTab,
        metricsScope: next.metricsScope,
      }),
    );
    return next;
  }

  saveScroll(routeKey: string, scrollY: number): void {
    const current = this.load();
    const clamped = Number.isFinite(scrollY) && scrollY > 0 ? Math.round(scrollY) : 0;
    const updated: Record<string, number> = { ...current.scrollByRoute };
    delete updated[routeKey];
    updated[routeKey] = clamped;
    const next: PersistedViewState = Object.freeze({
      ...current,
      scrollByRoute: capScrollMap(updated),
    });
    safeSet(this.sessionStorage, STORAGE_KEY, JSON.stringify(next));
  }

  readScroll(routeKey: string): number {
    return this.load().scrollByRoute[routeKey] ?? 0;
  }
}
