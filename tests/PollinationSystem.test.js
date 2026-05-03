import { describe, it, expect, beforeEach, vi } from 'vitest';
import PollinationSystem from '../src/systems/PollinationSystem.js';

describe('PollinationSystem', () => {
  let ps, spawnCb;

  beforeEach(() => {
    spawnCb = vi.fn();
    ps = new PollinationSystem({ spawnDelay: 6000, radius: 150, onSpawn: spawnCb });
  });

  it('does not spawn before spawnDelay', () => {
    ps.pollinate({ x: 100, y: 100 }, 0);
    ps.update(5999);
    expect(spawnCb).not.toHaveBeenCalled();
  });

  it('fires onSpawn after spawnDelay', () => {
    ps.pollinate({ x: 100, y: 100 }, 0);
    ps.update(6000);
    expect(spawnCb).toHaveBeenCalledOnce();
  });

  it('spawn position is within radius of source', () => {
    ps.pollinate({ x: 500, y: 500 }, 0);
    ps.update(6000);
    const { x, y } = spawnCb.mock.calls[0][0];
    expect(Math.hypot(x - 500, y - 500)).toBeLessThanOrEqual(150);
  });

  it('handles multiple pollinations independently', () => {
    ps.pollinate({ x: 100, y: 100 }, 0);
    ps.pollinate({ x: 200, y: 200 }, 1000);
    ps.update(6000);
    expect(spawnCb).toHaveBeenCalledOnce();
    ps.update(7001);
    expect(spawnCb).toHaveBeenCalledTimes(2);
  });

  it('does not fire twice for the same pollination', () => {
    ps.pollinate({ x: 100, y: 100 }, 0);
    ps.update(6000);
    ps.update(12000);
    expect(spawnCb).toHaveBeenCalledOnce();
  });
});
