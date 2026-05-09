import Phaser from 'phaser';
import { WASP_HIVE } from '../constants.js';

export default class WaspHive extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'wasp-hive');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setImmovable(true);
    this.hp = WASP_HIVE.HP;
    this.maxHp = WASP_HIVE.HP;
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    this.setTint(0xff4444);
    this.scene.time.delayedCall(150, () => { if (this.active) this.clearTint(); });
    return this.hp <= 0;
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }
}
