import { describe, expect, it } from 'vitest';
import { AsteroidMap } from './asteroidMap';
import {
  BEST_MONITOR_POLICY,
  createVaporizationTargetPolicy,
  VAPORIZATION_200TH_POLICY,
} from './policies';
import { MonitoringStationSolver } from './solver';

const EX1 = ['.#..#', '.....', '#####', '....#', '...##'].join('\n');
const EX5 = [
  '.#..##.###...#######', '##.############..##.', '.#.######.########.#', '.###.#######.####.#.',
  '#####.##.#.##.###.##', '..#####..#.#########', '####################', '#.####....###.#.#.##',
  '##.#################', '#####.##.###..####..', '..######..##.#######', '####.##.####...##..#',
  '.#####..#.######.###', '##...#.##########...', '#.##########.#######', '.####.#.###.###.#.##',
  '....##.##.###..#####', '.#.#.###########.###', '#.#.#.#####.####.###', '###.##.####.##.#..##',
].join('\n');

describe('MonitoringStation policies and solver', () => {
  it('evaluates, formats, and traces BEST_MONITOR_POLICY via MonitoringStationSolver', () => {
    const solver = new MonitoringStationSolver(BEST_MONITOR_POLICY);
    expect(Object.isFrozen(solver)).toBe(true);
    expect(Object.isFrozen(BEST_MONITOR_POLICY)).toBe(true);
    expect(solver.policy.id).toBe('best-monitor');
    expect(solver.policy.label).toBe('Best Monitor Station');

    const map = solver.parse(EX1);
    const answer = solver.solve(map);
    expect(answer).toBe(8);
    expect(solver.policy.formatAnswer(answer)).toBe('8');

    const fullTrace = solver.trace(map);
    expect(fullTrace).toHaveLength(map.asteroidCount);
    expect(fullTrace[0]!.kind).toBe('monitor-scan');

    const cappedTrace = solver.trace(map, { maxSteps: 3 });
    expect(cappedTrace).toHaveLength(3);
  });

  it('evaluates, formats, and traces vaporization target policies', () => {
    const firstPolicy = createVaporizationTargetPolicy(1);
    expect(firstPolicy.id).toBe('vaporize-1');
    expect(firstPolicy.label).toBe('Vaporization #1');
    const ex1 = AsteroidMap.parse(EX1);
    expect(firstPolicy.evaluate(ex1)).toBe(302);
    expect(firstPolicy.formatAnswer(302)).toBe('302');
    expect(firstPolicy.trace(ex1, { maxSteps: 4 })).toHaveLength(4);

    const solver200 = new MonitoringStationSolver(VAPORIZATION_200TH_POLICY);
    const ex5 = solver200.parse(EX5);
    expect(solver200.solve(ex5)).toBe(802);
    expect(solver200.trace(ex5)).toHaveLength(100);
  });

  it('rejects invalid targetOrder and maps with too few target asteroids', () => {
    expect(() => createVaporizationTargetPolicy(0)).toThrow(RangeError);
    expect(() => createVaporizationTargetPolicy(1.5)).toThrow(RangeError);
    const ex1 = AsteroidMap.parse(EX1);
    expect(() => VAPORIZATION_200TH_POLICY.evaluate(ex1)).toThrow(RangeError);
  });
});
