import Phaser from 'phaser';
import { WASP } from '../constants.js';

export default class RaiderWasp extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, hive) {
    super(scene, x, y, 'raider-wasp');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.hp = WASP.HP;
    this._hive = hive;
    this.lastHit = 0;
  }

  update() {
    if (!this._hive || !this._hive.active) return;
    this.scene.physics.moveToObject(this, this._hive, WASP.RAIDER_SPEED);
  }

  takeDamage(amount) {
    this.hp -= amount;
    this.setTint(0xffffff);
    this.scene.time.delayedCall(80, () => { if (this.active) this.clearTint(); });
    if (this.hp <= 0) { this.destroy(); return true; }
    return false;
  }
}
