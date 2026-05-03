import Phaser from 'phaser';
import { WASP } from '../constants.js';

export default class HunterWasp extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'hunter-wasp');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.hp = WASP.HP;
    this._target = null;
    this.lastHit = 0;
  }

  setTarget(target) { this._target = target; }

  update() {
    if (!this._target || !this._target.active || !this._target.alive) return;
    this.scene.physics.moveToObject(this, this._target, WASP.HUNTER_SPEED);
  }

  // Returns true if destroyed
  takeDamage(amount) {
    this.hp -= amount;
    this.setTint(0xffffff);
    this.scene.time.delayedCall(80, () => { if (this.active) this.clearTint(); });
    if (this.hp <= 0) { this.destroy(); return true; }
    return false;
  }
}
