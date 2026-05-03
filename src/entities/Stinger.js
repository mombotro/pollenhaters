import Phaser from 'phaser';
import { BEE } from '../constants.js';

export default class Stinger extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, targetX, targetY) {
    super(scene, x, y, 'stinger');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    const angleDeg = Phaser.Math.Angle.Between(x, y, targetX, targetY) * (180 / Math.PI);
    this.setRotation(Phaser.Math.DegToRad(angleDeg));
    scene.physics.velocityFromAngle(angleDeg, BEE.STINGER_SPEED, this.body.velocity);

    this.damage = BEE.STINGER_DAMAGE;

    // Auto-destroy after 1.5s if no collision
    scene.time.delayedCall(1500, () => { if (this.active) this.destroy(); });
  }
}
