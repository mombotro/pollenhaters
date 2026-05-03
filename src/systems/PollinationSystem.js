export default class PollinationSystem {
  constructor({ spawnDelay, radius, onSpawn }) {
    this._spawnDelay = spawnDelay;
    this._radius = radius;
    this._onSpawn = onSpawn;
    this._pending = []; // { x, y, fireAt }
  }

  pollinate(source, now) {
    this._pending.push({ x: source.x, y: source.y, fireAt: now + this._spawnDelay });
  }

  update(now) {
    const ready = this._pending.filter(p => now >= p.fireAt);
    this._pending = this._pending.filter(p => now < p.fireAt);
    for (const p of ready) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * this._radius;
      this._onSpawn({ x: p.x + Math.cos(angle) * dist, y: p.y + Math.sin(angle) * dist });
    }
  }
}
