import { describe, expect, it } from 'vitest';
import {
  normalizeRouteKey,
  resolveMetricsScope,
  resolveSelectedYear,
  type StorageLike,
  ViewStateStore,
} from './viewState';

class FakeStorage implements StorageLike {
  private readonly map = new Map<string, string>();
  constructor(private readonly failReads = false, private readonly failWrites = false) {}
  getItem(key: string): string | null {
    if (this.failReads) throw new Error('blocked');
    return this.map.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    if (this.failWrites) throw new Error('quota');
    this.map.set(key, value);
  }
}

describe('viewState helpers and ViewStateStore', () => {
  it('normalizes hash route keys and resolves available years/scopes', () => {
    expect(normalizeRouteKey('')).toBe('/');
    expect(normalizeRouteKey('#/')).toBe('/');
    expect(normalizeRouteKey('#/2024/day24/part1/')).toBe('/2024/day24/part1');

    expect(resolveSelectedYear(2023, [2025, 2024, 2023])).toBe(2023);
    expect(resolveSelectedYear(2019, [2025, 2024])).toBe(2025);
    expect(resolveSelectedYear(null, [])).toBe(2025);

    expect(resolveMetricsScope('overall', [2025, 2024])).toBe('overall');
    expect(resolveMetricsScope(2024, [2025, 2024])).toBe(2024);
    expect(resolveMetricsScope(2020, [2025, 2024])).toBe('overall');
  });

  it('persists selected year, dashboard tab, metrics scope, and per-route scroll across reloads', () => {
    const session = new FakeStorage();
    const persistent = new FakeStorage();
    const store = new ViewStateStore(session, persistent);

    expect(store.load()).toEqual({
      selectedYear: null,
      dashboardTab: 'overview',
      metricsScope: 'overall',
      scrollByRoute: {},
    });

    store.saveSelection({ selectedYear: 2023, dashboardTab: 'metrics', metricsScope: 2023 });
    store.saveScroll('/', 642.4);
    store.saveScroll('/2023/day24/part1', -12);

    const reloaded = new ViewStateStore(session, persistent);
    expect(reloaded.load()).toEqual({
      selectedYear: 2023,
      dashboardTab: 'metrics',
      metricsScope: 2023,
      scrollByRoute: { '/': 642, '/2023/day24/part1': 0 },
    });
    expect(reloaded.readScroll('/')).toBe(642);
    expect(reloaded.readScroll('/missing')).toBe(0);

    // New browser tab (empty sessionStorage) inherits selection from persistentStorage without old scroll.
    const freshTab = new ViewStateStore(new FakeStorage(), persistent);
    expect(freshTab.load()).toEqual({
      selectedYear: 2023,
      dashboardTab: 'metrics',
      metricsScope: 2023,
      scrollByRoute: {},
    });
  });

  it('caps saved route scroll entries and tolerates corrupted or unavailable storage', () => {
    const session = new FakeStorage();
    const store = new ViewStateStore(session, null);
    for (let i = 0; i < 35; i += 1) {
      store.saveScroll(`/route-${i}`, i * 10);
    }
    expect(Object.keys(store.load().scrollByRoute)).toHaveLength(30);
    expect(store.readScroll('/route-0')).toBe(0);
    expect(store.readScroll('/route-34')).toBe(340);

    session.setItem('aoc.dashboard.viewState.v1', '{broken-json');
    expect(store.load().dashboardTab).toBe('overview');

    session.setItem('aoc.dashboard.viewState.v1', '[]');
    expect(store.load().selectedYear).toBeNull();

    session.setItem(
      'aoc.dashboard.viewState.v1',
      JSON.stringify({ selectedYear: 'bad', dashboardTab: 'other', metricsScope: 1999, scrollByRoute: { a: -5, b: 12.6 } }),
    );
    expect(store.load()).toEqual({
      selectedYear: null,
      dashboardTab: 'overview',
      metricsScope: 'overall',
      scrollByRoute: { b: 13 },
    });

    session.setItem('aoc.dashboard.viewState.v1', JSON.stringify({ scrollByRoute: [] }));
    expect(store.load().scrollByRoute).toEqual({});

    const broken = new ViewStateStore(new FakeStorage(true, true), new FakeStorage(true, true));
    expect(broken.load().selectedYear).toBeNull();
    expect(() => broken.saveSelection({ selectedYear: 2024 })).not.toThrow();
    expect(() => broken.saveScroll('/', Number.NaN)).not.toThrow();

    const nullStore = new ViewStateStore(null, null);
    expect(nullStore.saveSelection({ dashboardTab: 'metrics' }).selectedYear).toBeNull();
  });
});
