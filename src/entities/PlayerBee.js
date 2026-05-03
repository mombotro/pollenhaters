import Phaser from 'phaser';
import { BEE } from '../constants.js';

export default class PlayerBee extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, onFire) {
    super(scene, x, y, 'player-bee');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);
    this.hp = BEE.HP;
    this.maxHp = BEE.HP;
    this.alive = true;
    this._onFire = onFire ?? null;
    this._lastFired = 0;
    this._cursors = scene.input.keyboard.createCursorKeys();
    this._wasd = scene.input.keyboard.addKeys('W,A,S,D');
  }

  update(time, delta) {
    if (!this.alive) return;
    this._move();
    this._autoFire(time);
  }

  _move() {
    const left  = this._cursors.left.isDown  || this._wasd.A.isDown;
    const right = this._cursors.right.isDown || this._wasd.D.isDown;
    const up    = this._cursors.up.isDown    || this._wasd.W.isDown;
    const down  = this._cursors.down.isDown  || this._wasd.S.isDown;

    let vx = (right ? 1 : 0) - (left ? 1 : 0);
    let vy = (down  ? 1 : 0) - (up   ? 1 : 0);

    if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }

    this.setVelocity(vx * BEE.SPEED, vy * BEE.SPEED);
  }

  _autoFire(time) {
    if (!this._onFire || time - this._lastFired < BEE.STINGER_RATE) return;
    const fired = this._onFire(this.x, this.y, BEE.STINGER_RANGE);
    if (fired) this._lastFired = time;
  }

  // Returns true if bee died
  takeDamage(amount) {
    if (!this.alive) return false;
    this.hp = Math.max(0, this.hp - amount);
    this.setTint(0xff4444);
    this.scene.time.delayedCall(150, () => { if (this.active) this.clearTint(); });
    if (this.hp <= 0) {
      this.alive = false;
      this.setVisible(false).setActive(false);
      this.body.enable = false;
    }
    return this.hp <= 0;
  }

  respawn(x, y) {
    this.hp = this.maxHp;
    this.alive = true;
    this.setPosition(x, y).setVisible(true).setActive(true);
    this.body.enable = true;
    this.clearTint();
  }
}
