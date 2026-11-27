import { describe, expect, it } from 'vitest';
import { BeaconScannerPolicy } from './policy';
import { BeaconScannerSolver } from './solver';

const MINI_INPUT = [
  '--- scanner 0 ---',
  '0,0,0',
  '1,3,7',
  '4,11,2',
  '--- scanner 1 ---',
  '10,0,0',
  '11,3,7',
  '14,11,2',
  '20,5,1',
].join('\n');

describe('BeaconScannerSolver', () => {
  it('implements parse, solve, trace, and formatAnswer for a given policy', () => {
    const beaconSolver = new BeaconScannerSolver(
      new BeaconScannerPolicy('beacon-count', 'Unique Beacons', 3),
    );
    expect(Object.isFrozen(beaconSolver)).toBe(true);

    const parsed = beaconSolver.parse(MINI_INPUT);
    expect(parsed).toHaveLength(2);
    expect(beaconSolver.solve(parsed)).toBe(4);
    expect(beaconSolver.formatAnswer(4)).toBe('4');

    const frames = beaconSolver.trace(parsed, { maxSteps: 5 });
    expect(frames).toHaveLength(2);
    expect(frames[1]!.metricValue).toBe(4);
    expect(frames[1]!.isComplete).toBe(true);

    const manhattanSolver = new BeaconScannerSolver(
      new BeaconScannerPolicy('max-manhattan', 'Max Scanner Manhattan', 3),
    );
    expect(manhattanSolver.solve(parsed)).toBe(10);
    expect(manhattanSolver.trace(parsed)).toHaveLength(2);
  });
});
