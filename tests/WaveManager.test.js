import { describe, it, expect, beforeEach } from 'vitest';
import WaveManager from '../src/systems/WaveManager.js';

const config = {
  firstWaveDelay: 15000,
  waveInterval: 30000,
  baseCount: 3,
  countIncrement: 2,
};

describe('WaveManager', () => {
  let wm;
  beforeEach(() => { wm = new WaveManager(config); });

  it('returns null before first wave delay', () => {
    expect(wm.update(14999)).toBeNull();
  });

  it('spawns wave 1 at firstWaveDelay', () => {
    const wave = wm.update(15000);
    expect(wave).not.toBeNull();
    expect(wave.number).toBe(1);
    expect(wave.hunterCount).toBe(3);
    expect(wave.raiderCount).toBe(0);
  });

  it('does not spawn again until waveInterval passes', () => {
    wm.update(15000);
    expect(wm.update(30000)).toBeNull();
  });

  it('spawns wave 2 after waveInterval', () => {
    wm.update(15000);
    const wave = wm.update(45001);
    expect(wave).not.toBeNull();
    expect(wave.number).toBe(2);
    expect(wave.hunterCount).toBe(5);
  });

  it('introduces raiders from wave 3', () => {
    wm.update(15000);
    wm.update(45001);
    const wave = wm.update(75002);
    expect(wave.raiderCount).toBeGreaterThan(0);
  });

  it('getWaveNumber tracks current wave', () => {
    wm.update(15000);
    wm.update(45001);
    expect(wm.getWaveNumber()).toBe(2);
  });
});
